import type { Business, BillingPlanDef, PlatformSettings } from '../types'
import { formatCurrency } from './format'

export const BILLING_PLAN_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  semestral: 'Semestral',
  anual: 'Anual',
}

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  sem_assinatura: 'Sem assinatura',
  ativa: 'Em dia',
  atrasada: 'Atrasada',
  cancelada: 'Cancelada',
}

export function formatCents(cents: number): string {
  return formatCurrency(cents / 100)
}

export function planFinalPriceCents(plan: BillingPlanDef): number {
  return plan.priceCents - plan.discountCents
}

export function planDiscountPercent(plan: BillingPlanDef): number {
  if (plan.priceCents <= 0) return 0
  return Math.round((plan.discountCents / plan.priceCents) * 100)
}

/** Dias restantes até o vencimento (negativo = já venceu). null = sem data definida. */
export function daysUntil(isoDateTime: string | undefined | null): number | null {
  if (!isoDateTime) return null
  const target = new Date(isoDateTime).getTime()
  if (Number.isNaN(target)) return null
  return Math.ceil((target - Date.now()) / 86_400_000)
}

/** A partir de quantos dias restantes o alerta de vencimento vira um aviso ativo com botão de pagamento. */
export const EXPIRATION_WARNING_DAYS = 5

export function billingCollectionMessage(
  business: Pick<Business, 'displayName'>,
  plan: BillingPlanDef | undefined,
  settings: PlatformSettings,
  daysRemaining: number | null,
): string {
  const planLabel = plan ? BILLING_PLAN_LABELS[plan.id] ?? plan.name : 'atual'
  const priceLabel = plan ? formatCents(planFinalPriceCents(plan)) : ''
  const dueLabel =
    daysRemaining === null
      ? 'está pendente'
      : daysRemaining < 0
        ? `venceu há ${Math.abs(daysRemaining)} dia(s)`
        : daysRemaining === 0
          ? 'vence hoje'
          : `vence em ${daysRemaining} dia(s)`

  const lines = [
    `Olá, ${business.displayName}!`,
    '',
    `Passando para lembrar que a mensalidade do seu plano (${planLabel}${priceLabel ? ` — ${priceLabel}` : ''}) ${dueLabel}.`,
    '',
    'Para manter seu site e painel administrativo ativos, você pode:',
    '1) Acessar "Assinatura" no seu painel administrativo e pagar/atualizar com cartão de crédito; ou',
  ]

  if (settings.pixKey) {
    lines.push('2) Realizar o pagamento via Pix para a chave abaixo e nos enviar o comprovante:', '', `Chave Pix: ${settings.pixKey}`)
    if (settings.pixKeyOwnerName) lines.push(`Titular: ${settings.pixKeyOwnerName}`)
  }

  lines.push('', 'Qualquer dúvida, estamos à disposição!', '— Hello Inova')

  return lines.join('\n')
}
