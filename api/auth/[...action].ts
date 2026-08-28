import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ApiError } from '../_lib/db.js'
import { getSession, hashPassword, verifyPassword, signSession, sessionCookieHeader, clearSessionCookieHeader } from '../_lib/auth.js'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = ([] as string[]).concat((req.query.action as string | string[]) ?? [])[0]
  try {
    if (action === 'login-admin' && req.method === 'POST') return await loginAdmin(req, res)
    if (action === 'login-super' && req.method === 'POST') return await loginSuper(req, res)
    if (action === 'logout' && req.method === 'POST') return logout(res)
    if (action === 'me' && req.method === 'GET') return await me(req, res)
    if (action === 'change-password' && req.method === 'POST') return await changePassword(req, res)
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
  const biz = await sql`SELECT id, slug FROM businesses WHERE slug = ${businessSlug} LIMIT 1`
  if (biz.rows.length === 0) return res.status(401).json({ error: 'E-mail ou senha inválidos.' })
  const business = biz.rows[0]

  const admins = await sql`
    SELECT id, email, password_hash, role, active FROM admin_users
    WHERE business_id = ${business.id} AND lower(email) = lower(${email}) LIMIT 1
  `
  const admin = admins.rows[0]
  if (!admin || !admin.active) return res.status(401).json({ error: 'E-mail ou senha inválidos.' })
  const ok = await verifyPassword(password, admin.password_hash)
  if (!ok) return res.status(401).json({ error: 'E-mail ou senha inválidos.' })

  const token = await signSession({ sub: admin.id, businessId: business.id, role: admin.role, email: admin.email })
  res.setHeader('Set-Cookie', sessionCookieHeader(token))
  res.status(200).json({ session: { businessSlug: business.slug, email: admin.email, role: admin.role } })
}

async function loginSuper(req: VercelRequest, res: VercelResponse) {
  const { email, password } = readBody(req)
  if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha.' })

  const admins = await sql`
    SELECT id, email, password_hash, active FROM admin_users
    WHERE business_id IS NULL AND role = 'super_admin' AND lower(email) = lower(${email}) LIMIT 1
  `
  const admin = admins.rows[0]
  if (!admin || !admin.active) return res.status(401).json({ error: 'Credenciais inválidas.' })
  const ok = await verifyPassword(password, admin.password_hash)
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' })

  const token = await signSession({ sub: admin.id, businessId: null, role: 'super_admin', email: admin.email })
  res.setHeader('Set-Cookie', sessionCookieHeader(token))
  res.status(200).json({ session: { businessSlug: '*', email: admin.email, role: 'super_admin' } })
}

function logout(res: VercelResponse) {
  res.setHeader('Set-Cookie', clearSessionCookieHeader())
  res.status(200).json({ ok: true })
}

async function me(req: VercelRequest, res: VercelResponse) {
  const session = await getSession(req)
  if (!session) return res.status(200).json({ session: null })
  if (session.role === 'super_admin') {
    return res.status(200).json({ session: { businessSlug: '*', email: session.email, role: 'super_admin' } })
  }
  const biz = await sql`SELECT slug FROM businesses WHERE id = ${session.businessId} LIMIT 1`
  if (biz.rows.length === 0) return res.status(200).json({ session: null })
  res.status(200).json({ session: { businessSlug: biz.rows[0].slug, email: session.email, role: session.role } })
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
