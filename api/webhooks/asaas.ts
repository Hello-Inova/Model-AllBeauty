import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_lib/db.js'
import { verifyAsaasWebhookToken } from '../_lib/asaas.js'

// Receives payment lifecycle events from Asaas (configure this URL as the
// webhook endpoint in the Asaas dashboard, with the SAME shared secret as
// ASAAS_WEBHOOK_TOKEN — see README). Asaas retries on non-2xx responses, so
// this always answers fast and never throws past the top level.
//
// Events we act on (see docs.asaas.com/docs/payment-events):
//   PAYMENT_CONFIRMED / PAYMENT_RECEIVED  → extends the business's plan_expires_at
//   PAYMENT_OVERDUE                        → marks the subscription "atrasada"
//   PAYMENT_CREDIT_CARD_CAPTURE_REFUSED    → marks the subscription "atrasada"
//   PAYMENT_REFUNDED / *_CHARGEBACK_*      → marks the subscription "atrasada" (flag for review)
// Every other event is stored in billing_transactions (if the business can
// be matched) purely as history, with no side effect on plan_expires_at.

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

function statusFor(event: string): string {
  if (event === 'PAYMENT_CONFIRMED') return 'confirmed'
  if (event === 'PAYMENT_RECEIVED') return 'received'
  if (event === 'PAYMENT_OVERDUE') return 'overdue'
  if (event === 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED') return 'refused'
  if (event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_PARTIALLY_REFUNDED') return 'refunded'
  return 'pending'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' })
    return
  }

  const headerToken = (req.headers['asaas-access-token'] as string | undefined) ?? undefined
  if (!verifyAsaasWebhookToken(headerToken)) {
    res.status(401).json({ error: 'Webhook não autorizado (verifique ASAAS_WEBHOOK_TOKEN).' })
    return
  }

  try {
    const body = readBody(req)
    const event: string = body?.event ?? ''
    const payment = body?.payment ?? {}
    const paymentId: string | undefined = payment?.id
    const subscriptionId: string | undefined = payment?.subscription
    const customerId: string | undefined = payment?.customer
    const valueCents = Math.round(Number(payment?.value ?? 0) * 100)
    const dueDate: string | undefined = payment?.dueDate

    if (!paymentId) {
      res.status(200).json({ received: true, note: 'sem payment.id, ignorado' })
      return
    }

    let bizRows = subscriptionId
      ? await sql`SELECT id, billing_plan FROM businesses WHERE asaas_subscription_id = ${subscriptionId} LIMIT 1`
      : { rows: [] as any[] }
    if (bizRows.rows.length === 0 && customerId) {
      bizRows = await sql`SELECT id, billing_plan FROM businesses WHERE asaas_customer_id = ${customerId} LIMIT 1`
    }
    const biz = bizRows.rows[0]

    if (!biz) {
      // No matching business — nothing to update, but ack so Asaas stops retrying.
      res.status(200).json({ received: true, note: 'empresa não encontrada para este pagamento' })
      return
    }

    const status = statusFor(event)

    await sql`
      INSERT INTO billing_transactions (id, business_id, value_cents, status, due_date, paid_at, raw_event)
      VALUES (
        ${paymentId}, ${biz.id}, ${valueCents}, ${status},
        ${dueDate ?? null}::date,
        ${status === 'confirmed' || status === 'received' ? new Date().toISOString() : null}::timestamptz,
        ${JSON.stringify(body)}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status, paid_at = EXCLUDED.paid_at, raw_event = EXCLUDED.raw_event, updated_at = now()
    `

    if ((status === 'confirmed' || status === 'received') && dueDate) {
      const planRows = await sql`SELECT months FROM plans WHERE id = ${biz.billing_plan} LIMIT 1`
      const months = planRows.rows[0]?.months ?? 1
      await sql`
        UPDATE businesses SET
          subscription_status = 'ativa',
          plan_expires_at = GREATEST(
            COALESCE(plan_expires_at, now()),
            (${dueDate}::date + (${months} * interval '1 month'))
          ),
          updated_at = now()
        WHERE id = ${biz.id}
      `
    } else if (status === 'overdue' || status === 'refused') {
      await sql`UPDATE businesses SET subscription_status = 'atrasada', updated_at = now() WHERE id = ${biz.id}`
    } else if (status === 'refunded' || event.startsWith('PAYMENT_CHARGEBACK')) {
      await sql`UPDATE businesses SET subscription_status = 'atrasada', updated_at = now() WHERE id = ${biz.id}`
    }

    res.status(200).json({ received: true })
  } catch (e) {
    // Never let Asaas retry forever over a transient error on our side without
    // visibility — log it, but still ack with 200 once the event is at least
    // recorded conceptually. If you'd rather Asaas retries automatically on
    // our failures, change this to a 500.
    console.error('asaas webhook error', e)
    res.status(200).json({ received: true, error: 'processed with errors, see server logs' })
  }
}
