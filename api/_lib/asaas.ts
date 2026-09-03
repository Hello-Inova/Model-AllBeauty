// Thin client for the Asaas payment gateway (https://docs.asaas.com) — used
// to charge the platform's own clients (the businesses on this white-label
// SaaS) for their subscription to keep using the admin panel. Nothing here
// ever touches a customer's own end-consumer money — this is Hello Inova
// billing its own salon clients.
//
// Credentials live ONLY in environment variables (never in the database,
// never returned to the frontend):
//   ASAAS_API_KEY       — the account's API key ($aact_prod_... or $aact_hmlg_...)
//   ASAAS_ENV            — 'production' or 'sandbox' (defaults to 'sandbox' if unset,
//                           so a misconfigured deploy fails safe against test money)
//   ASAAS_WEBHOOK_TOKEN  — shared secret configured on the Asaas webhook, checked
//                           against the `asaas-access-token` header on every callback
//
// IMPORTANT / verified against Asaas's official docs (docs.asaas.com) at the
// time this was written, but Asaas can change its API — if something here
// starts failing, check the current docs before assuming the bug is local:
//   - Auth: header `access_token` (not `Authorization: Bearer`) + `User-Agent`.
//   - POST /v3/subscriptions supports billingType=CREDIT_CARD + cycle in
//     {WEEKLY,BIWEEKLY,MONTHLY,BIMONTHLY,QUARTERLY,SEMIANNUALLY,YEARLY} and
//     charges automatically going forward — no polling needed, only webhooks.
//   - PUT /v3/subscriptions/{id} to update an existing subscription's card —
//     this mirrors the POST payload shape per Asaas's general REST
//     conventions, but Asaas's docs do not show a worked example for this
//     specific "update card on an existing subscription" call. Test this in
//     sandbox before relying on it in production; if it errors, cancelling
//     the old subscription and creating a new one is the fallback.
//   - There is no confirmed client-side ("Asaas.js") tokenization SDK in the
//     docs — card data is accepted directly by the server-side endpoints
//     below. This backend receives it over HTTPS and forwards it to Asaas
//     immediately; it is never logged or persisted (only card brand + last 4
//     digits, returned by Asaas itself, are stored for display).
import { ApiError } from './db.js'

function baseUrl(): string {
  const env = (process.env.ASAAS_ENV ?? 'sandbox').toLowerCase()
  return env === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3'
}

function apiKey(): string {
  const key = process.env.ASAAS_API_KEY
  if (!key) throw new ApiError(500, 'ASAAS_API_KEY não configurada no projeto Vercel.')
  return key
}

async function asaasFetch<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: apiKey(),
      'User-Agent': 'ModelAllBeauty-HelloInova',
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  const data = (await res.json().catch(() => null)) as { errors?: { description?: string }[] } | null
  if (!res.ok) {
    const description = data?.errors?.[0]?.description ?? `Falha ao comunicar com o Asaas (HTTP ${res.status}).`
    throw new ApiError(502, description)
  }
  return data as T
}

export interface AsaasCreditCard {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export interface AsaasCreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  addressComplement?: string
  phone?: string
  mobilePhone?: string
}

export interface AsaasCustomer {
  id: string
}

export async function createAsaasCustomer(input: {
  name: string
  cpfCnpj: string
  email?: string
  phone?: string
  externalReference?: string
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>('/customers', { method: 'POST', body: input })
}

export interface AsaasSubscription {
  id: string
  status: string
  nextDueDate: string
}

export async function createAsaasSubscription(input: {
  customer: string
  value: number
  nextDueDate: string
  cycle: 'MONTHLY' | 'SEMIANNUALLY' | 'YEARLY'
  description?: string
  creditCard: AsaasCreditCard
  creditCardHolderInfo: AsaasCreditCardHolderInfo
  remoteIp: string
}): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: { ...input, billingType: 'CREDIT_CARD' },
  })
}

/** Best-effort: updates the card on an existing subscription (see file header note). */
export async function updateAsaasSubscriptionCard(
  subscriptionId: string,
  input: {
    creditCard: AsaasCreditCard
    creditCardHolderInfo: AsaasCreditCardHolderInfo
    remoteIp: string
  },
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`, {
    method: 'PUT',
    body: { billingType: 'CREDIT_CARD', ...input },
  })
}

export function verifyAsaasWebhookToken(headerToken: string | undefined): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN
  // If no token is configured yet (initial setup before the env var is set),
  // don't silently accept everything — but don't hard-fail existing installs
  // either. Callers should treat this as "unverified" and log accordingly.
  if (!expected) return false
  return headerToken === expected
}
