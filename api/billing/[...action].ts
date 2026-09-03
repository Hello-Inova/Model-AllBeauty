import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ApiError } from '../_lib/db.js'
import { requireSession, requireBusinessAccess } from '../_lib/auth.js'
import { rowToBillingTransaction } from '../_lib/mappers.js'
import {
  createAsaasCustomer,
  createAsaasSubscription,
  updateAsaasSubscriptionCard,
  type AsaasCreditCard,
  type AsaasCreditCardHolderInfo,
} from '../_lib/asaas.js'

// Consolidated billing endpoint (same rationale as api/auth and api/data —
// keeps the Vercel Functions count low): POST /api/billing/subscribe and
// GET /api/billing/status. Card data received here is forwarded to Asaas
// immediately and NEVER logged or persisted — only brand + last 4 digits
// (derived locally, never sent back by us in error logs) are stored.

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
  const fromQuery = ([] as string[]).concat((req.query.action as string | string[]) ?? [])
  if (fromQuery.length > 0) return fromQuery[0]
  const pathname = (req.url ?? '').split('?')[0]
  const parts = pathname.split('/').filter(Boolean)
  const idx = parts.indexOf('billing')
  if (idx === -1) return undefined
  return decodeURIComponent(parts[idx + 1] ?? '')
}

function remoteIpOf(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for']
  const first = Array.isArray(fwd) ? fwd[0] : fwd
  if (first) return first.split(',')[0].trim()
  return req.socket?.remoteAddress ?? '127.0.0.1'
}

const BRAND_PATTERNS: [RegExp, string][] = [
  [/^4/, 'Visa'],
  [/^(5[1-5]|2[2-7])/, 'Mastercard'],
  [/^3[47]/, 'American Express'],
  [/^6(011|5)/, 'Discover'],
  [/^(38|60)/, 'Hipercard'],
  [/^(606282|3841)/, 'Hipercard'],
  [/^636368|^438935|^504175|^451416|^509/, 'Elo'],
]
function detectCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '')
  for (const [re, name] of BRAND_PATTERNS) if (re.test(digits)) return name
  return 'Cartão'
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = getAction(req)
  try {
    if (action === 'subscribe' && req.method === 'POST') return await subscribe(req, res)
    if (action === 'status' && req.method === 'GET') return await status(req, res)
    res.status(404).json({ error: 'Rota de cobrança não encontrada.' })
  } catch (e) {
    if (e instanceof ApiError) return res.status(e.status).json({ error: e.message })
    console.error(e)
    res.status(500).json({ error: 'Erro interno ao processar a cobrança.' })
  }
}

async function subscribe(req: VercelRequest, res: VercelResponse) {
  const body = readBody(req)
  const { businessId, cardNumber, cardHolderName, cardExpiryMonth, cardExpiryYear, cardCcv, holderCpfCnpj, holderEmail, holderPostalCode, holderAddressNumber, holderPhone } = body

  if (!businessId) throw new ApiError(400, 'businessId é obrigatório.')
  const session = await requireSession(req)
  requireBusinessAccess(session, businessId)

  if (!cardNumber || !cardHolderName || !cardExpiryMonth || !cardExpiryYear || !cardCcv || !holderCpfCnpj || !holderPostalCode || !holderAddressNumber) {
    throw new ApiError(400, 'Preencha todos os dados do cartão e do titular para continuar.')
  }

  const bizRows = await sql`
    SELECT id, name, email, phone, billing_type, billing_plan, asaas_customer_id, asaas_subscription_id
    FROM businesses WHERE id = ${businessId} LIMIT 1
  `
  const biz = bizRows.rows[0]
  if (!biz) throw new ApiError(404, 'Empresa não encontrada.')
  if (biz.billing_type === 'isento') throw new ApiError(400, 'Esta empresa está marcada como isenta — não há cobrança a configurar.')

  const planRows = await sql`SELECT * FROM plans WHERE id = ${biz.billing_plan} AND active = true LIMIT 1`
  const plan = planRows.rows[0]
  if (!plan) throw new ApiError(400, 'Plano de assinatura inválido ou inativo. Fale com o suporte.')

  const value = (plan.price_cents - plan.discount_cents) / 100
  const remoteIp = remoteIpOf(req)

  const creditCard: AsaasCreditCard = {
    holderName: String(cardHolderName),
    number: String(cardNumber).replace(/\s/g, ''),
    expiryMonth: String(cardExpiryMonth).padStart(2, '0'),
    expiryYear: String(cardExpiryYear).length === 2 ? `20${cardExpiryYear}` : String(cardExpiryYear),
    ccv: String(cardCcv),
  }
  const creditCardHolderInfo: AsaasCreditCardHolderInfo = {
    name: String(cardHolderName),
    email: String(holderEmail || biz.email || ''),
    cpfCnpj: String(holderCpfCnpj).replace(/\D/g, ''),
    postalCode: String(holderPostalCode).replace(/\D/g, ''),
    addressNumber: String(holderAddressNumber),
    phone: holderPhone ? String(holderPhone).replace(/\D/g, '') : undefined,
  }

  let customerId: string = biz.asaas_customer_id
  if (!customerId) {
    const customer = await createAsaasCustomer({
      name: biz.name,
      cpfCnpj: creditCardHolderInfo.cpfCnpj,
      email: biz.email || creditCardHolderInfo.email,
      phone: biz.phone,
      externalReference: biz.id,
    })
    customerId = customer.id
  }

  let subscriptionId: string = biz.asaas_subscription_id
  let nextDueDate = todayIso()
  if (subscriptionId) {
    const updated = await updateAsaasSubscriptionCard(subscriptionId, { creditCard, creditCardHolderInfo, remoteIp })
    nextDueDate = updated.nextDueDate ?? nextDueDate
  } else {
    const created = await createAsaasSubscription({
      customer: customerId,
      value,
      nextDueDate,
      cycle: plan.cycle,
      description: `Assinatura ${plan.name} — plataforma Model AllBeauty (Hello Inova)`,
      creditCard,
      creditCardHolderInfo,
      remoteIp,
    })
    subscriptionId = created.id
    nextDueDate = created.nextDueDate ?? nextDueDate
  }

  const cardBrand = detectCardBrand(creditCard.number)
  const cardLast4 = creditCard.number.slice(-4)

  await sql`
    UPDATE businesses SET
      asaas_customer_id = ${customerId},
      asaas_subscription_id = ${subscriptionId},
      card_last4 = ${cardLast4},
      card_brand = ${cardBrand},
      subscription_status = 'ativa',
      plan_expires_at = ${nextDueDate}::timestamptz,
      updated_at = now()
    WHERE id = ${businessId}
  `

  res.status(200).json({
    billingType: biz.billing_type,
    billingPlan: biz.billing_plan,
    subscriptionStatus: 'ativa',
    planExpiresAt: nextDueDate,
    cardLast4,
    cardBrand,
  })
}

async function status(req: VercelRequest, res: VercelResponse) {
  const businessId = String(req.query.businessId ?? '')
  if (!businessId) throw new ApiError(400, 'businessId é obrigatório.')
  const session = await requireSession(req)
  requireBusinessAccess(session, businessId)

  const bizRows = await sql`
    SELECT billing_type, billing_plan, subscription_status, plan_expires_at, card_last4, card_brand
    FROM businesses WHERE id = ${businessId} LIMIT 1
  `
  const biz = bizRows.rows[0]
  if (!biz) throw new ApiError(404, 'Empresa não encontrada.')

  const txRows = await sql`
    SELECT * FROM billing_transactions WHERE business_id = ${businessId} ORDER BY created_at DESC LIMIT 10
  `

  res.status(200).json({
    billingType: biz.billing_type,
    billingPlan: biz.billing_plan,
    subscriptionStatus: biz.subscription_status,
    planExpiresAt: biz.plan_expires_at ?? undefined,
    cardLast4: biz.card_last4 ?? undefined,
    cardBrand: biz.card_brand ?? undefined,
    transactions: txRows.rows.map(rowToBillingTransaction),
  })
}
