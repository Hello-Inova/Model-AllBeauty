import { createHash } from 'node:crypto'
import type { VercelRequest } from '@vercel/node'
import { ApiError } from './db.js'

function firstHeader(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? '').split(',')[0].trim()
}

export function requestHost(req: VercelRequest): string {
  return firstHeader(req.headers['x-forwarded-host']) || firstHeader(req.headers.host)
}

/** Reject browser cross-origin writes that could otherwise carry the session cookie. */
export function requireSameOrigin(req: VercelRequest): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return
  const origin = firstHeader(req.headers.origin)
  if (!origin) return // Non-browser clients do not necessarily send Origin.
  let originHost = ''
  try {
    originHost = new URL(origin).host.toLowerCase()
  } catch {
    throw new ApiError(403, 'Origem da requisição inválida.')
  }
  const host = requestHost(req).toLowerCase()
  if (!host || originHost !== host) throw new ApiError(403, 'Origem da requisição não autorizada.')
}

/** Stable, non-reversible IP fingerprint suitable for abuse-rate-limit keys. */
export function clientIpFingerprint(req: VercelRequest): string {
  const forwarded = firstHeader(req.headers['x-forwarded-for'])
  const ip = forwarded || req.socket?.remoteAddress || 'unknown'
  return createHash('sha256').update(ip).digest('hex').slice(0, 24)
}

/**
 * Canonical public origin for security-sensitive links. In production it
 * never trusts a user-controlled Host header when a deployment URL exists.
 * Set PUBLIC_APP_URL to the preferred custom domain.
 */
export function publicAppOrigin(req: VercelRequest): string {
  const configured = (process.env.PUBLIC_APP_URL || '').trim()
  const candidate = configured || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  if (candidate) {
    try {
      const url = new URL(candidate)
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('protocol')
      return url.origin
    } catch {
      throw new ApiError(500, 'PUBLIC_APP_URL inválida.')
    }
  }

  const host = requestHost(req)
  if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
    throw new ApiError(500, 'Configure PUBLIC_APP_URL para gerar links seguros.')
  }
  return `http://${host}`
}
