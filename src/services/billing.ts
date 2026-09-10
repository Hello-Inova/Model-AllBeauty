import type { BillingPlanId, BillingTransaction, BillingType, SubscriptionStatus } from '../types'

// Dedicated client for the billing ACTIONS (not plain CRUD, so it lives
// outside DataRepository — same rationale as AuthContext's own `api()`
// helper hitting /api/auth directly). Card data passed to `subscribe` goes
// straight to this endpoint over HTTPS and is never stored client-side.

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/billing/${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? `Erro ao comunicar com o servidor (${res.status}).`)
  return data as T
}

export interface BillingStatus {
  billingType: BillingType
  billingPlan: BillingPlanId
  subscriptionStatus: SubscriptionStatus
  planExpiresAt?: string
  cardLast4?: string
  cardBrand?: string
}

export interface BillingStatusWithHistory extends BillingStatus {
  transactions: BillingTransaction[]
}

export interface SubscribePayload {
  businessId: string
  billingPlan?: BillingPlanId
  cardNumber: string
  cardHolderName: string
  cardExpiryMonth: string
  cardExpiryYear: string
  cardCcv: string
  holderCpfCnpj: string
  holderEmail?: string
  holderPostalCode: string
  holderAddressNumber: string
  holderPhone?: string
}

export function getBillingStatus(businessId: string): Promise<BillingStatusWithHistory> {
  return request(`status?businessId=${encodeURIComponent(businessId)}`, { method: 'GET' })
}

export function subscribeBilling(payload: SubscribePayload): Promise<BillingStatus> {
  return request('subscribe', { method: 'POST', body: JSON.stringify(payload) })
}
