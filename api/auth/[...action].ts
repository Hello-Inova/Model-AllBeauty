import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ApiError } from '../_lib/db.js'
import {
  getSession,
  hashPassword,
  verifyPassword,
  signSession,
  sessionCookieHeader,
  clearSessionCookieHeader,
  isLoginLocked,
  registerFailedLoginAttempt,
  clearLoginAttempts,
  invalidCredentialsMessage,
  LOGIN_LOCKOUT_MESSAGE,
} from '../_lib/auth.js'

// Consolidated auth endpoint — every action Vercel would otherwise need a
// separate function file for lives here, keeping the deployment's function
// count low: POST /api/auth/login-admin, /login-super, /logout, and
// GET /api/auth/me.

function readBody(req: VercelRequest): any {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

function getAction(req: VercelRequest): string | undefined {
  // Same rationale as api/data/[...path].ts: don't rely solely on
  // req.query.action being populated by the platform for catch-all routes —
  // parse it from the URL as a guaranteed-correct fallback.
  const fromQuery = ([] as string[]).concat((req.query.action as string | string[]) ?? [])
  if (fromQuery.length > 0) return fromQuery[0]
  const pathname = (req.url ?? '').split('?')[0]
  const parts = pathname.split('/').filter(Boolean)
  const idx = parts.indexOf('auth')
  if (idx === -1) return undefined
  return decodeURIComponent(parts[idx + 1] ?? '')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = getAction(req)
  try {
    if (action === 'login-admin' && req.method === 'POST') return await loginAdmin(req, res)
    if (action === 'login-super' && req.method === 'POST') return await loginSuper(req, res)
    if (action === 'logout' && req.method === 'POST') return logout(res)
    if (action === 'me' && req.method === 'GET') return await me(req, res)
    if (action === 'change-password' && req.method === 'POST') return await changePassword(req, res)
    if (action === 'update-email' && req.method === 'POST') return await updateEmail(req, res)
    if (action === 'accept-terms' && req.method === 'POST') return await acceptTerms(req, res)
    res.status(404).json({ error: 'Rota de autenticação não encontrada.' })
  } catch (e) {
    if (e instanceof ApiError) return res.status(e.status).json({ error: e.message })
    console.error(e)
    res.status(500).json({ error: 'Erro interno ao autenticar.' })
  }
}

async function loginAdmin(req: VercelRequest, res: VercelResponse) {
  const { businessSlug, email, password } = readBody(req)
  if (!businessSlug || !email || !password) {
    return res.status(400).json({ error: 'Informe empresa, e-mail e senha.' })
  }

  // Escopo construído a partir do que foi digitado, ANTES de qualquer
  // consulta — assim uma empresa/e-mail inexistente também é limitada,
  // em vez de dar tentativas ilimitadas para "descobrir" contas válidas.
  const scope = `admin:${String(businessSlug).toLowerCase()}:${String(email).toLowerCase()}`
  if (await isLoginLocked(scope)) return res.status(429).json({ error: LOGIN_LOCKOUT_MESSAGE })

  const biz = await sql`SELECT id, slug FROM businesses WHERE lower(slug) = lower(${businessSlug}) LIMIT 1`
  if (biz.rows.length === 0) {
    const count = await registerFailedLoginAttempt(scope)
    return res.status(401).json({ error: invalidCredentialsMessage(count) })
  }
  const business = biz.rows[0]

  const admins = await sql`
    SELECT id, email, password_hash, role, active, terms_accepted_at FROM admin_users
    WHERE business_id = ${business.id} AND lower(email) = lower(${email}) LIMIT 1
  `
  const admin = admins.rows[0]
  if (!admin || !admin.active) {
    const count = await registerFailedLoginAttempt(scope)
    return res.status(401).json({ error: invalidCredentialsMessage(count) })
  }
  const ok = await verifyPassword(password, admin.password_hash)
  if (!ok) {
    const count = await registerFailedLoginAttempt(scope)
    return res.status(401).json({ error: invalidCredentialsMessage(count) })
  }
  await clearLoginAttempts(scope)

  const token = await signSession({ sub: admin.id, businessId: business.id, role: admin.role, email: admin.email })
  res.setHeader('Set-Cookie', sessionCookieHeader(token))
  res.status(200).json({
    session: { businessSlug: business.slug, email: admin.email, role: admin.role, termsAcceptedAt: admin.terms_accepted_at ?? null },
  })
}

async function loginSuper(req: VercelRequest, res: VercelResponse) {
  const { email, password } = readBody(req)
  if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha.' })

  const scope = `super:${String(email).toLowerCase()}`
  if (await isLoginLocked(scope)) return res.status(429).json({ error: LOGIN_LOCKOUT_MESSAGE })

  const admins = await sql`
    SELECT id, email, password_hash, active FROM admin_users
    WHERE business_id IS NULL AND role = 'super_admin' AND lower(email) = lower(${email}) LIMIT 1
  `
  const admin = admins.rows[0]
  if (!admin || !admin.active) {
    const count = await registerFailedLoginAttempt(scope)
    return res.status(401).json({ error: invalidCredentialsMessage(count) })
  }
  const ok = await verifyPassword(password, admin.password_hash)
  if (!ok) {
    const count = await registerFailedLoginAttempt(scope)
    return res.status(401).json({ error: invalidCredentialsMessage(count) })
  }
  await clearLoginAttempts(scope)

  const token = await signSession({ sub: admin.id, businessId: null, role: 'super_admin', email: admin.email })
  res.setHeader('Set-Cookie', sessionCookieHeader(token))
  res.status(200).json({ session: { businessSlug: '*', email: admin.email, role: 'super_admin', termsAcceptedAt: null } })
}

function logout(res: VercelResponse) {
  res.setHeader('Set-Cookie', clearSessionCookieHeader())
  res.status(200).json({ ok: true })
}

async function me(req: VercelRequest, res: VercelResponse) {
  const session = await getSession(req)
  if (!session) return res.status(200).json({ session: null })
  if (session.role === 'super_admin') {
    return res.status(200).json({ session: { businessSlug: '*', email: session.email, role: 'super_admin', termsAcceptedAt: null } })
  }
  const biz = await sql`SELECT slug FROM businesses WHERE id = ${session.businessId} LIMIT 1`
  if (biz.rows.length === 0) return res.status(200).json({ session: null })
  const admin = await sql`SELECT terms_accepted_at FROM admin_users WHERE id = ${session.sub} LIMIT 1`
  res.status(200).json({
    session: {
      businessSlug: biz.rows[0].slug,
      email: session.email,
      role: session.role,
      termsAcceptedAt: admin.rows[0]?.terms_accepted_at ?? null,
    },
  })
}

async function acceptTerms(req: VercelRequest, res: VercelResponse) {
  const session = await getSession(req)
  if (!session) throw new ApiError(401, 'Sessão inválida ou expirada.')
  const updated = await sql`
    UPDATE admin_users SET terms_accepted_at = now() WHERE id = ${session.sub} RETURNING terms_accepted_at
  `
  res.status(200).json({ termsAcceptedAt: updated.rows[0]?.terms_accepted_at ?? new Date().toISOString() })
}

async function updateEmail(req: VercelRequest, res: VercelResponse) {
  const session = await getSession(req)
  if (!session) throw new ApiError(401, 'Sessão inválida ou expirada.')
  const { currentPassword, newEmail } = readBody(req)
  const email = String(newEmail ?? '').trim().toLowerCase()
  if (!currentPassword || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Informe a senha atual e um e-mail válido.' })
  }
  const rows = await sql`SELECT id, password_hash, business_id, role FROM admin_users WHERE id = ${session.sub} LIMIT 1`
  const admin = rows.rows[0]
  if (!admin) return res.status(401).json({ error: 'Sessão inválida.' })
  const ok = await verifyPassword(currentPassword, admin.password_hash)
  if (!ok) return res.status(400).json({ error: 'Senha atual incorreta.' })

  // Uniqueness scoped like the login lookups: within the same business for a
  // business admin, or among the super admins (business_id IS NULL) — the DB's
  // unique index on (business_id, email) doesn't protect the super-admin case
  // since Postgres treats every NULL business_id as distinct.
  const dup = admin.business_id
    ? await sql`SELECT id FROM admin_users WHERE business_id = ${admin.business_id} AND lower(email) = ${email} AND id != ${admin.id} LIMIT 1`
    : await sql`SELECT id FROM admin_users WHERE business_id IS NULL AND lower(email) = ${email} AND id != ${admin.id} LIMIT 1`
  if (dup.rows.length > 0) return res.status(400).json({ error: 'Já existe um usuário com este e-mail.' })

  await sql`UPDATE admin_users SET email = ${email} WHERE id = ${admin.id}`

  // The session JWT caches the e-mail (see signSession/getSession) so it has
  // to be re-issued here — otherwise the change wouldn't take effect until
  // the next login.
  const token = await signSession({ sub: admin.id, businessId: session.businessId, role: session.role, email })
  res.setHeader('Set-Cookie', sessionCookieHeader(token))

  if (session.role === 'super_admin') {
    return res.status(200).json({ session: { businessSlug: '*', email, role: 'super_admin', termsAcceptedAt: null } })
  }
  const biz = await sql`SELECT slug FROM businesses WHERE id = ${session.businessId} LIMIT 1`
  const termsRow = await sql`SELECT terms_accepted_at FROM admin_users WHERE id = ${admin.id} LIMIT 1`
  res.status(200).json({
    session: { businessSlug: biz.rows[0]?.slug ?? '', email, role: session.role, termsAcceptedAt: termsRow.rows[0]?.terms_accepted_at ?? null },
  })
}

async function changePassword(req: VercelRequest, res: VercelResponse) {
  const session = await getSession(req)
  if (!session) throw new ApiError(401, 'Sessão inválida ou expirada.')
  const { currentPassword, newPassword } = readBody(req)
  if (!currentPassword || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Informe a senha atual e uma nova senha com pelo menos 6 caracteres.' })
  }
  const rows = await sql`SELECT id, password_hash FROM admin_users WHERE id = ${session.sub} LIMIT 1`
  const admin = rows.rows[0]
  if (!admin) return res.status(401).json({ error: 'Sessão inválida.' })
  const ok = await verifyPassword(currentPassword, admin.password_hash)
  if (!ok) return res.status(400).json({ error: 'Senha atual incorreta.' })
  const hash = await hashPassword(newPassword)
  await sql`UPDATE admin_users SET password_hash = ${hash} WHERE id = ${session.sub}`
  res.status(200).json({ ok: true })
}
