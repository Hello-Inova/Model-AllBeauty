import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import type { VercelRequest } from '@vercel/node'
import { ApiError, sql } from './db.js'

// Minimal, dependency-free cookie helpers (avoids pinning to a specific
// version of the `cookie` package's API, which has changed shape across
// major versions).
function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (!key) continue
    try {
      out[key] = decodeURIComponent(value)
    } catch {
      out[key] = value
    }
  }
  return out
}

function serializeCookie(
  name: string,
  value: string,
  opts: { httpOnly?: boolean; secure?: boolean; sameSite?: 'lax' | 'strict' | 'none'; path?: string; maxAge?: number },
): string {
  const segments = [`${name}=${encodeURIComponent(value)}`]
  if (opts.maxAge !== undefined) segments.push(`Max-Age=${Math.floor(opts.maxAge)}`)
  if (opts.path) segments.push(`Path=${opts.path}`)
  if (opts.sameSite) segments.push(`SameSite=${opts.sameSite[0].toUpperCase()}${opts.sameSite.slice(1)}`)
  if (opts.httpOnly) segments.push('HttpOnly')
  if (opts.secure) segments.push('Secure')
  return segments.join('; ')
}

export type AdminRole = 'super_admin' | 'owner' | 'manager' | 'staff'

export interface SessionPayload {
  sub: string // admin_users.id
  businessId: string | null // null for super_admin
  role: AdminRole
  email: string
}

const COOKIE_NAME = 'wl_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 dias

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new ApiError(500, 'JWT_SECRET não configurado no projeto Vercel.')
  }
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ businessId: payload.businessId, role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey())
}

export function sessionCookieHeader(token: string): string {
  return serializeCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookieHeader(): string {
  return serializeCookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function getSession(req: VercelRequest): Promise<SessionPayload | null> {
  const raw = req.headers.cookie
  if (!raw) return null
  const cookies = parseCookies(raw)
  const token = cookies[COOKIE_NAME]
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey())
    return {
      sub: String(payload.sub),
      businessId: (payload.businessId as string | null) ?? null,
      role: payload.role as AdminRole,
      email: String(payload.email ?? ''),
    }
  } catch {
    return null
  }
}

export async function requireSession(req: VercelRequest): Promise<SessionPayload> {
  const session = await getSession(req)
  if (!session) throw new ApiError(401, 'Sessão inválida ou expirada. Faça login novamente.')
  return session
}

export function requireSuperAdmin(session: SessionPayload): void {
  if (session.role !== 'super_admin') throw new ApiError(403, 'Acesso restrito ao super admin.')
}

/** Allows the super admin OR an admin whose session.businessId matches the target business. */
export function requireBusinessAccess(session: SessionPayload, businessId: string): void {
  if (session.role === 'super_admin') return
  if (session.businessId === businessId) return
  throw new ApiError(403, 'Você não tem acesso a esta empresa.')
}

// ---------------------------------------------------------------------------
// Limite de tentativas de login — 3 por dia (fuso de Brasília), tanto para o
// login de empresas quanto para o Super Admin. `scope` é construído pelo
// chamador a partir dos dados BRUTOS do formulário (slug/e-mail digitados),
// antes de qualquer consulta a businesses/admin_users — assim uma tentativa
// contra um e-mail ou empresa inexistente também é contabilizada, em vez de
// dar de graça um número ilimitado de tentativas de "descoberta".
// ---------------------------------------------------------------------------

export const LOGIN_ATTEMPT_LIMIT = 3
export const LOGIN_LOCKOUT_MESSAGE = 'Você atingiu o limite de 3 tentativas de login hoje. Tente novamente amanhã.'

/** true se este scope já esgotou as tentativas do dia (fuso de Brasília). */
export async function isLoginLocked(scope: string): Promise<boolean> {
  const rows = await sql`
    SELECT count FROM login_attempts
    WHERE scope = ${scope} AND attempt_date = (now() AT TIME ZONE 'America/Sao_Paulo')::date
    LIMIT 1
  `
  const count = rows.rows[0]?.count ?? 0
  return count >= LOGIN_ATTEMPT_LIMIT
}

/** Registra uma tentativa falha e retorna quantas tentativas já foram usadas hoje. */
export async function registerFailedLoginAttempt(scope: string): Promise<number> {
  const rows = await sql`
    INSERT INTO login_attempts (scope, attempt_date, count)
    VALUES (${scope}, (now() AT TIME ZONE 'America/Sao_Paulo')::date, 1)
    ON CONFLICT (scope) DO UPDATE SET
      count = CASE
        WHEN login_attempts.attempt_date = (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN login_attempts.count + 1
        ELSE 1
      END,
      attempt_date = (now() AT TIME ZONE 'America/Sao_Paulo')::date,
      updated_at = now()
    RETURNING count
  `
  return rows.rows[0]?.count ?? LOGIN_ATTEMPT_LIMIT
}

/** Limpa o contador após um login bem-sucedido. */
export async function clearLoginAttempts(scope: string): Promise<void> {
  await sql`DELETE FROM login_attempts WHERE scope = ${scope}`
}

/** Mensagem de credenciais inválidas, com aviso de tentativas restantes quando fizer sentido. */
export function invalidCredentialsMessage(attemptsUsedToday: number): string {
  const remaining = LOGIN_ATTEMPT_LIMIT - attemptsUsedToday
  if (remaining <= 0) return LOGIN_LOCKOUT_MESSAGE
  return `E-mail ou senha inválidos. Você tem mais ${remaining} tentativa${remaining === 1 ? '' : 's'} hoje.`
}
