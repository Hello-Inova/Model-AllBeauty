// Thin client for the Resend email API (https://resend.com/docs/api-reference/emails/send-email)
// — used to deliver transactional e-mail (currently: password-reset links).
// Same "no SDK, plain fetch" style as api/_lib/asaas.ts, for the same
// reason: one fewer dependency to keep updated, and the API surface used
// here is tiny.
//
// Credentials live ONLY in environment variables (never in the database,
// never returned to the frontend):
//   RESEND_API_KEY    — API key from the Resend dashboard (Settings → API Keys).
//   RESEND_FROM_EMAIL  — the "From" address, ideally already in "Nome <email>" format
//                         (e.g. "Organyze <naoresponda@organyze.com.br>"). A custom e-mail
//                         address here must be on a domain verified in Resend
//                         (Settings → Domains) to send to arbitrary recipients — until then,
//                         leave this unset and fromAddress() below defaults to Resend's own
//                         onboarding@resend.dev sender, which works without any domain setup
//                         but Resend restricts it to sending only to the e-mail address that
//                         owns the Resend account — fine for testing, not for real users. See
//                         README.md. Either way, fromAddress() always makes sure the "Organyze"
//                         display name shows up — even if this variable is set to a bare
//                         address with no display name.
import { ApiError } from './db.js'

function apiKey(): string {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new ApiError(500, 'RESEND_API_KEY não configurada no projeto Vercel.')
  return key
}

const DEFAULT_FROM_NAME = 'Organyze'
const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev'

function fromAddress(): string {
  const raw = (process.env.RESEND_FROM_EMAIL || '').trim()
  if (!raw) return `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`
  // Se RESEND_FROM_EMAIL já vier no formato "Nome <email>", respeita
  // exatamente como configurado na Vercel. Mas se vier só o endereço puro
  // (ex: alguém preencheu a variável com apenas "onboarding@resend.dev",
  // sem nome de exibição — foi exatamente isso que fez o destinatário ver
  // só o e-mail cru como remetente, em vez de "Organyze"), garante o nome
  // de exibição "Organyze" mesmo assim.
  if (raw.includes('<') && raw.includes('>')) return raw
  return `${DEFAULT_FROM_NAME} <${raw}>`
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
