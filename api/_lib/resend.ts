// Thin client for the Resend email API (https://resend.com/docs/api-reference/emails/send-email)
// — used to deliver transactional e-mail (currently: password-reset links).
// Same "no SDK, plain fetch" style as api/_lib/asaas.ts, for the same
// reason: one fewer dependency to keep updated, and the API surface used
// here is tiny.
//
// Credentials live ONLY in environment variables (never in the database,
// never returned to the frontend):
//   RESEND_API_KEY    — API key from the Resend dashboard (Settings → API Keys).
//   RESEND_FROM_EMAIL  — the "From" address, e.g. "Organyze <naoresponda@organyze.com.br>".
//                         Must be on a domain verified in Resend (Settings → Domains) to
//                         send to arbitrary recipients. Defaults to Resend's own
//                         onboarding@resend.dev sender, which works without any domain
//                         setup but Resend restricts it to sending only to the e-mail
//                         address that owns the Resend account — fine for testing,
//                         not for real users. See README.md.
import { ApiError } from './db.js'

function apiKey(): string {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new ApiError(500, 'RESEND_API_KEY não configurada no projeto Vercel.')
  return key
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || 'Organyze <onboarding@resend.dev>'
}

/**
 * Sends a single transactional e-mail. Throws ApiError(502) on failure —
 * callers that must not block the user-facing response on a flaky e-mail
 * provider (e.g. forgot-password, which always replies generically to avoid
 * leaking which e-mails are registered) should catch and log instead of
 * letting this propagate as a hard error.
 */
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(502, `Falha ao enviar e-mail via Resend (${res.status}): ${text.slice(0, 300)}`)
  }
}
