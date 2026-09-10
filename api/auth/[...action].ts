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
  LOGIN_ATTEMPT_LIMIT,
  LOGIN_RECOVERY_MESSAGE,
  generatePasswordResetToken,
  hashPasswordResetToken,
  PASSWORD_RESET_TTL_SECONDS,
} from '../_lib/auth.js'
import { sendEmail } from '../_lib/resend.js'
import { makeId } from '../../src/utils/id.js'
import { slugify } from '../../src/utils/slug.js'

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

function remoteIpOf(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for']
  const first = Array.isArray(fwd) ? fwd[0] : fwd
  if (first) return first.split(',')[0].trim()
  return req.socket?.remoteAddress ?? '127.0.0.1'
}

/** `https://seu-dominio.com` (ou http/localhost em dev) a partir dos headers da própria requisição — usado para montar o link absoluto do e-mail de redefinição de senha sem precisar de mais uma variável de ambiente com a URL do site. */
function requestOrigin(req: VercelRequest): string {
  const fwdHost = req.headers['x-forwarded-host']
  const host = (Array.isArray(fwdHost) ? fwdHost[0] : fwdHost) ?? req.headers.host ?? 'localhost:5173'
  const fwdProto = req.headers['x-forwarded-proto']
  const proto = (Array.isArray(fwdProto) ? fwdProto[0] : fwdProto) ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = getAction(req)
  try {
    if (action === 'register' && req.method === 'POST') return await register(req, res)
    if (action === 'login-admin' && req.method === 'POST') return await loginAdmin(req, res)
    if (action === 'login-super' && req.method === 'POST') return await loginSuper(req, res)
    if (action === 'logout' && req.method === 'POST') return logout(res)
    if (action === 'me' && req.method === 'GET') return await me(req, res)
    if (action === 'change-password' && req.method === 'POST') return await changePassword(req, res)
    if (action === 'update-email' && req.method === 'POST') return await updateEmail(req, res)
    if (action === 'accept-terms' && req.method === 'POST') return await acceptTerms(req, res)
    if (action === 'forgot-password' && req.method === 'POST') return await forgotPassword(req, res)
    if (action === 'reset-password' && req.method === 'POST') return await resetPassword(req, res)
    res.status(404).json({ error: 'Rota de autenticação não encontrada.' })
  } catch (e) {
    if (e instanceof ApiError) return res.status(e.status).json({ error: e.message })
    console.error(e)
    res.status(500).json({ error: 'Erro interno ao autenticar.' })
  }
}

const VALID_BILLING_PLANS = new Set(['mensal', 'semestral', 'anual'])

const DEFAULT_WORKING_HOURS = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  active: weekday !== 0,
  periods: weekday === 0 ? [] : [{ start: '09:00', end: '18:00' }],
}))

const DEFAULT_BOOKING_POLICIES = {
  minAdvanceMinutes: 60,
  maxAdvanceDays: 30,
  cancellationWindowHours: 24,
  allowReschedule: true,
  bufferBetweenAppointmentsMinutes: 10,
  lateToleranceMinutes: 15,
  requireEmail: false,
  requireNotes: false,
  paymentPolicy: 'pay_on_site',
}

/**
 * Public self-service signup: any visitor picks a name for their business +
 * a billing cycle, sets an admin login, and gets a brand-new business +
 * owner account, auto-logged-in — no Hello Inova/superadmin step in between.
 * The business starts with `subscription_status: sem_assinatura` (DB
 * default, deliberately not set here — see the comment on businessToRow in
 * api/_lib/mappers.ts); the owner pays their chosen plan afterwards from
 * the Assinatura screen, same flow as a superadmin-created business. All
 * cosmetic/content fields (logo, colors, services…) start empty/default and
 * are filled in later via the admin panel — the onboarding checklist on the
 * dashboard walks the new owner through exactly that.
 */
async function register(req: VercelRequest, res: VercelResponse) {
  // Anti-abuse: reuses the same daily attempt counter as login lockout,
  // scoped by IP instead of by credential — caps how many businesses a
  // single visitor can spin up per day without needing a new DB table.
  const scope = `register:${remoteIpOf(req)}`
  if (await isLoginLocked(scope)) {
    return res.status(429).json({ error: 'Limite de cadastros atingido por hoje a partir desta conexão. Tente novamente amanhã.' })
  }
  await registerFailedLoginAttempt(scope)

  const body = readBody(req)
  const businessName = String(body.businessName ?? '').trim()
  const segment = String(body.segment ?? '').trim() || 'Salão de beleza'
  const phone = String(body.phone ?? '').trim()
  const whatsapp = String(body.whatsapp ?? '').replace(/\D/g, '')
  const adminEmail = String(body.adminEmail ?? '').trim().toLowerCase()
  const adminPassword = String(body.adminPassword ?? '')
  const billingPlan = VALID_BILLING_PLANS.has(body.billingPlan) ? body.billingPlan : 'mensal'

  if (businessName.length < 2) {
    return res.status(400).json({ error: 'Informe o nome do seu negócio.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    return res.status(400).json({ error: 'Informe um e-mail válido.' })
  }
  if (adminPassword.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' })
  }

  // Slug deduplication: two businesses can easily share a name (two
  // "Espaço Bella" in different cities), and unlike the superadmin wizard —
  // which a human reviews before publishing — this is fully unattended, so
  // a collision has to resolve itself instead of failing the signup.
  const base = slugify(businessName) || 'minha-empresa'
  let slug = base
  for (let suffix = 2; suffix <= 50; suffix++) {
    const existing = await sql`SELECT id FROM businesses WHERE slug = ${slug} LIMIT 1`
    if (existing.rows.length === 0) break
    slug = `${base}-${suffix}`
  }

  const newId = makeId('biz')
  await sql`
    INSERT INTO businesses (
      id, slug, name, display_name, description, segment, logo, favicon, cover_image, hero_image,
      phone, whatsapp, email, instagram, facebook, tiktok, youtube, website,
      address, city, state, country, zip_code, currency, timezone,
      primary_color, secondary_color, accent_color, background_color, foreground_color, theme,
      active, demo, plan, working_hours, booking_policies, billing_type, billing_plan
    ) VALUES (
      ${newId}, ${slug}, ${businessName}, ${businessName}, ${''}, ${segment},
      ${null}, ${null}, ${null}, ${null},
      ${phone}, ${whatsapp}, ${adminEmail}, ${null}, ${null}, ${null}, ${null}, ${null},
      ${''}, ${''}, ${''}, ${'Brasil'}, ${''}, ${'BRL'}, ${'America/Sao_Paulo'},
      ${'#b3873e'}, ${'#2b2320'}, ${'#b3873e'}, ${'#ffffff'}, ${'#1c1917'}, ${'light'},
      ${true}, ${false}, ${'basico'}, ${JSON.stringify(DEFAULT_WORKING_HOURS)}, ${JSON.stringify(DEFAULT_BOOKING_POLICIES)},
      ${'padrao'}, ${billingPlan}
    )
  `
  const passwordHash = await hashPassword(adminPassword)
  const adminId = makeId('adm')
  await sql`
    INSERT INTO admin_users (id, business_id, name, email, password_hash, role, active)
    VALUES (${adminId}, ${newId}, ${businessName}, ${adminEmail}, ${passwordHash}, 'owner', true)
  `

  const token = await signSession({ sub: adminId, businessId: newId, role: 'owner', email: adminEmail })
  res.setHeader('Set-Cookie', sessionCookieHeader(token))
  res.status(201).json({
    session: { businessSlug: slug, email: adminEmail, role: 'owner', termsAcceptedAt: null },
  })
}

/**
 * Registra uma tentativa de login falha para `scope`. Ao atingir o limite
 * diário (3ª senha errada), em vez de só bloquear até amanhã, dispara na
 * hora o mesmo fluxo de "esqueci minha senha" já usado na tela de login
 * (gera token, envia e-mail) — quem errou a senha recebe um link pra
 * redefini-la, em vez de ficar bloqueado até o dia seguinte. Só envia o
 * e-mail nessa 3ª tentativa; tentativas seguintes no mesmo dia (já
 * bloqueadas) repetem a mesma mensagem sem reenviar.
 */
async function failLoginAttempt(
  req: VercelRequest,
  res: VercelResponse,
  scope: string,
  account: { businessSlug?: string; email: string },
) {
  const count = await registerFailedLoginAttempt(scope)
  if (count >= LOGIN_ATTEMPT_LIMIT) {
    await sendPasswordResetEmail(req, { businessSlug: account.businessSlug, email: account.email, reason: 'failed-attempts' })
    return res.status(429).json({ error: LOGIN_RECOVERY_MESSAGE, recoveryTriggered: true })
  }
  return res.status(401).json({ error: invalidCredentialsMessage(count) })
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
  if (await isLoginLocked(scope)) return res.status(429).json({ error: LOGIN_RECOVERY_MESSAGE, recoveryTriggered: true })

  const biz = await sql`SELECT id, slug FROM businesses WHERE lower(slug) = lower(${businessSlug}) LIMIT 1`
  if (biz.rows.length === 0) {
    return await failLoginAttempt(req, res, scope, { businessSlug, email })
  }
  const business = biz.rows[0]

  const admins = await sql`
    SELECT id, email, password_hash, role, active, terms_accepted_at FROM admin_users
    WHERE business_id = ${business.id} AND lower(email) = lower(${email}) LIMIT 1
  `
  const admin = admins.rows[0]
  if (!admin || !admin.active) {
    return await failLoginAttempt(req, res, scope, { businessSlug, email })
  }
  const ok = await verifyPassword(password, admin.password_hash)
  if (!ok) {
    return await failLoginAttempt(req, res, scope, { businessSlug, email })
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
  if (await isLoginLocked(scope)) return res.status(429).json({ error: LOGIN_RECOVERY_MESSAGE, recoveryTriggered: true })

  const admins = await sql`
    SELECT id, email, password_hash, active FROM admin_users
    WHERE business_id IS NULL AND role = 'super_admin' AND lower(email) = lower(${email}) LIMIT 1
  `
  const admin = admins.rows[0]
  if (!admin || !admin.active) {
    return await failLoginAttempt(req, res, scope, { email })
  }
  const ok = await verifyPassword(password, admin.password_hash)
  if (!ok) {
    return await failLoginAttempt(req, res, scope, { email })
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function passwordResetEmailHtml(opts: { resetUrl: string; businessName?: string; reason?: 'requested' | 'failed-attempts' }): string {
  const context = opts.businessName ? `da sua conta em <strong>${escapeHtml(opts.businessName)}</strong>` : 'da sua conta de Super Admin'
  // reason distingue o clique manual em "Esqueci minha senha" do disparo
  // automático depois de 3 senhas erradas seguidas — no segundo caso, é mais
  // honesto avisar que foram tentativas com senha incorreta, não um "pedido"
  // (também serve de alerta: se não foi a própria pessoa tentando, ela fica
  // sabendo que alguém tentou a senha da conta).
  const intro =
    opts.reason === 'failed-attempts'
      ? `Detectamos 3 tentativas seguidas de login com a senha incorreta ${context}. Por segurança, geramos automaticamente um link para você redefinir sua senha:`
      : `Recebemos um pedido de redefinição de senha ${context}. Se foi você, clique no botão abaixo para escolher uma nova senha:`
  const footer =
    opts.reason === 'failed-attempts'
      ? 'O link expira em 1 hora. Se essas tentativas não foram suas, redefina a senha agora por segurança — e considere revisar quem tem acesso a ela.'
      : 'O link expira em 1 hora. Se você não pediu essa redefinição, pode ignorar este e-mail — sua senha continua a mesma.'
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f1ea;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ea;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e7e0d6;">
            <tr>
              <td style="background:#b3873e;padding:20px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;font-family:Georgia,'Times New Roman',serif;">Organyze</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#221b15;">
                <h1 style="font-size:18px;margin:0 0 16px;">Redefinir senha</h1>
                <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">${intro}</p>
                <p style="text-align:center;margin:28px 0;">
                  <a href="${opts.resetUrl}" style="background:#b3873e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">Redefinir minha senha</a>
                </p>
                <p style="font-size:12px;line-height:1.6;color:#6b625a;margin:0 0 8px;">${footer}</p>
                <p style="font-size:12px;line-height:1.6;color:#6b625a;margin:0;">Se o botão não funcionar, copie e cole este link no navegador:<br /><a href="${opts.resetUrl}" style="color:#b3873e;word-break:break-all;">${opts.resetUrl}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/**
 * Núcleo compartilhado do envio do e-mail de redefinição de senha — usado
 * tanto pelo clique manual em "Esqueci minha senha" (forgotPassword) quanto
 * pelo disparo automático após 3 senhas erradas (failLoginAttempt). Mantém a
 * mesma propriedade anti-enumeração do fluxo original: não faz nada (nem dá
 * erro) se a conta não existir, então o chamador nunca revela se um e-mail
 * está cadastrado ou não.
 */
async function sendPasswordResetEmail(
  req: VercelRequest,
  { businessSlug, email, reason }: { businessSlug?: string; email: string; reason: 'requested' | 'failed-attempts' },
): Promise<void> {
  const normalizedEmail = String(email ?? '').trim().toLowerCase()

  let admin: { id: string; email: string } | undefined
  let businessName: string | undefined

  if (businessSlug) {
    const biz = await sql`SELECT id, display_name FROM businesses WHERE lower(slug) = lower(${businessSlug}) LIMIT 1`
    if (biz.rows.length > 0) {
      const admins = await sql`
        SELECT id, email FROM admin_users
        WHERE business_id = ${biz.rows[0].id} AND lower(email) = ${normalizedEmail} AND active = true LIMIT 1
      `
      admin = admins.rows[0]
      businessName = biz.rows[0].display_name
    }
  } else {
    const admins = await sql`
      SELECT id, email FROM admin_users
      WHERE business_id IS NULL AND role = 'super_admin' AND lower(email) = ${normalizedEmail} AND active = true LIMIT 1
    `
    admin = admins.rows[0]
  }

  if (!admin) return

  const rawToken = generatePasswordResetToken()
  const tokenId = makeId('prt')
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000)
  await sql`
    INSERT INTO password_reset_tokens (id, admin_user_id, token_hash, expires_at)
    VALUES (${tokenId}, ${admin.id}, ${hashPasswordResetToken(rawToken)}, ${expiresAt.toISOString()})
  `

  const resetUrl = `${requestOrigin(req)}/redefinir-senha?token=${rawToken}`
  try {
    await sendEmail({
      to: admin.email,
      subject: reason === 'failed-attempts' ? 'Detectamos tentativas de login na sua conta — Organyze' : 'Redefinir sua senha — Organyze',
      html: passwordResetEmailHtml({ resetUrl, businessName, reason }),
    })
  } catch (e) {
    // Não propaga o erro pro cliente — a resposta continua a mesma genérica
    // de sempre, pra não diferenciar "e-mail não existe" de "Resend falhou".
    // Fica registrado no log da função pra investigação.
    console.error('Falha ao enviar e-mail de redefinição de senha:', e)
  }
}

/**
 * "Esqueci minha senha" — tanto para admin de empresa (businessSlug presente)
 * quanto para Super Admin (businessSlug ausente/null). SEMPRE responde com a
 * mesma mensagem genérica de sucesso, exista ou não o e-mail informado, para
 * não permitir descobrir contas cadastradas por tentativa e erro. O limite
 * de tentativas (mesmo mecanismo do login, 3 por dia por escopo) protege
 * contra spam de e-mails de redefinição para uma vítima.
 */
async function forgotPassword(req: VercelRequest, res: VercelResponse) {
  const { businessSlug, email } = readBody(req)
  const normalizedEmail = String(email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Informe um e-mail válido.' })
  }

  const scope = businessSlug ? `forgot:${String(businessSlug).toLowerCase()}:${normalizedEmail}` : `forgot:super:${normalizedEmail}`
  if (await isLoginLocked(scope)) {
    return res.status(429).json({ error: 'Muitas solicitações de redefinição para este e-mail hoje. Tente novamente amanhã.' })
  }
  await registerFailedLoginAttempt(scope)

  const genericMessage = 'Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha. Confira também a caixa de spam.'

  await sendPasswordResetEmail(req, { businessSlug, email: normalizedEmail, reason: 'requested' })

  res.status(200).json({ ok: true, message: genericMessage })
}

/**
 * Confirma a redefinição a partir do token recebido por e-mail. Token é de
 * uso único e expira em 1h (ver PASSWORD_RESET_TTL_SECONDS) — ao ser usado
 * com sucesso, invalida também qualquer outro link de redefinição pendente
 * para o mesmo usuário.
 */
async function resetPassword(req: VercelRequest, res: VercelResponse) {
  const { token, newPassword } = readBody(req)
  const rawToken = String(token ?? '')
  if (!rawToken) return res.status(400).json({ error: 'Link inválido.' })
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' })
  }

  const invalidMessage = 'Link inválido ou expirado. Solicite um novo link de redefinição de senha.'
  const rows = await sql`
    SELECT id, admin_user_id, expires_at, used_at FROM password_reset_tokens
    WHERE token_hash = ${hashPasswordResetToken(rawToken)} LIMIT 1
  `
  const record = rows.rows[0]
  if (!record || record.used_at || new Date(record.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: invalidMessage })
  }

  const admins = await sql`SELECT id, email, business_id, role FROM admin_users WHERE id = ${record.admin_user_id} LIMIT 1`
  const admin = admins.rows[0]
  if (!admin) return res.status(400).json({ error: invalidMessage })

  const hash = await hashPassword(String(newPassword))
  await sql`UPDATE admin_users SET password_hash = ${hash} WHERE id = ${admin.id}`
  await sql`UPDATE password_reset_tokens SET used_at = now() WHERE admin_user_id = ${admin.id} AND used_at IS NULL`

  let businessSlug: string | null = null
  if (admin.business_id) {
    const biz = await sql`SELECT slug FROM businesses WHERE id = ${admin.business_id} LIMIT 1`
    businessSlug = biz.rows[0]?.slug ?? null
  }

  // Quem acabou de provar dono da conta (recebeu e abriu o link no e-mail)
  // não deve continuar bloqueado até amanhã por causa das tentativas de
  // senha erradas que levaram a esse link — libera o login imediatamente
  // com a senha nova, em vez de esperar a virada do dia.
  const normalizedAdminEmail = String(admin.email ?? '').toLowerCase()
  const loginScope = businessSlug ? `admin:${businessSlug.toLowerCase()}:${normalizedAdminEmail}` : `super:${normalizedAdminEmail}`
  await clearLoginAttempts(loginScope)

  res.status(200).json({ ok: true, role: admin.role, businessSlug })
}
