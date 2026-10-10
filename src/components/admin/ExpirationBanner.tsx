import { Link } from 'react-router-dom'
import { AlertTriangle, Info } from 'lucide-react'
import type { Business } from '../../types'
import { adminRoutes } from '../../utils/routes'
import { daysUntil, trialDaysRemaining, EXPIRATION_WARNING_DAYS } from '../../utils/billing'

/**
 * Fixed banner shown on every admin page (see AdminLayout) with the days
 * remaining until the business's subscription — or, before the first
 * payment, its configured free trial — expires. Escalates to a warning +
 * "Assinar agora"/"Pagar agora" CTA once it's urgent or already
 * overdue/vencido. Renders nothing for 'isento' businesses.
 */
export function ExpirationBanner({ business }: { business: Business }) {
  if (business.billingType === 'isento') return null

  if (business.subscriptionStatus === 'sem_assinatura' && !business.planExpiresAt) {
    const trialDays = trialDaysRemaining(business)

    // Trial ainda não venceu: mostra a contagem regressiva em vez do aviso
    // genérico de "sem assinatura" — é o estado normal e esperado durante o
    // teste grátis, não algo alarmante. Quando venceu de fato, o
    // SubscribeGate (src/components/admin/SubscribeGate.tsx) já bloqueia o
    // resto do painel — este banner só continua visível pro super_admin
    // (isento desse bloqueio) e na própria tela de Assinatura.
    if (trialDays !== null && trialDays >= 0) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-blue-50 text-blue-900 text-sm border-b border-blue-100">
          <span className="flex items-center gap-2">
            <Info size={16} />
            {trialDays === 0
              ? 'Seu teste grátis termina hoje.'
              : `Faltam ${trialDays} dia${trialDays === 1 ? '' : 's'} do seu teste grátis.`}
          </span>
          <Link
            to={adminRoutes.subscription(business.slug)}
            className="inline-flex items-center rounded-lg bg-blue-700 text-white text-xs font-medium px-3 py-1.5 hover:bg-blue-800 transition shrink-0"
          >
            Assinar agora
          </Link>
        </div>
      )
    }

    if (trialDays !== null && trialDays < 0) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-amber-50 text-amber-900 text-sm border-b border-amber-200">
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} /> Seu teste grátis acabou e o site saiu do ar para os clientes.
          </span>
          <Link
            to={adminRoutes.subscription(business.slug)}
            className="inline-flex items-center rounded-lg bg-amber-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-amber-700 transition shrink-0"
          >
            Assinar agora
          </Link>
        </div>
      )
    }

    // trialDays === null: empresa sem trial definido (cadastrada antes
    // desse recurso existir) — mantém o aviso genérico de sempre.
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-blue-50 text-blue-900 text-sm border-b border-blue-100">
        <span className="flex items-center gap-2">
          <Info size={16} /> Você ainda não tem uma assinatura ativa nesta plataforma.
        </span>
        <Link
          to={adminRoutes.subscription(business.slug)}
          className="inline-flex items-center rounded-lg bg-blue-700 text-white text-xs font-medium px-3 py-1.5 hover:bg-blue-800 transition shrink-0"
        >
          Assinar agora
        </Link>
      </div>
    )
  }

  const days = daysUntil(business.planExpiresAt)
  const overdue = business.subscriptionStatus === 'atrasada' || (days !== null && days < 0)
  const warning = overdue || (days !== null && days <= EXPIRATION_WARNING_DAYS)

  if (!warning) {
    if (days === null) return null
    return (
      <div className="px-4 sm:px-6 py-2 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] text-xs border-b border-[var(--color-border)]">
        Seu plano vence em {days} dia{days === 1 ? '' : 's'}.
      </div>
    )
  }

  const label =
    days !== null && days < 0
      ? `Seu plano venceu há ${Math.abs(days)} dia${Math.abs(days) === 1 ? '' : 's'}.`
      : days === 0
        ? 'Seu plano vence hoje.'
        : days !== null
          ? `Faltam ${days} dia${days === 1 ? '' : 's'} para o vencimento do seu plano.`
          : 'Seu plano está com pagamento pendente.'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-amber-50 text-amber-900 text-sm border-b border-amber-200">
      <span className="flex items-center gap-2">
        <AlertTriangle size={16} /> {label}
      </span>
      <Link
        to={adminRoutes.subscription(business.slug)}
        className="inline-flex items-center rounded-lg bg-amber-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-amber-700 transition shrink-0"
      >
        Pagar agora
      </Link>
    </div>
  )
}
