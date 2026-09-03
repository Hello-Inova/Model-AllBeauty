import { Link } from 'react-router-dom'
import { AlertTriangle, Info } from 'lucide-react'
import type { Business } from '../../types'
import { adminRoutes } from '../../utils/routes'
import { daysUntil, EXPIRATION_WARNING_DAYS } from '../../utils/billing'

/**
 * Fixed banner shown on every admin page (see AdminLayout) with the days
 * remaining until the business's subscription expires. Escalates to a
 * warning + "Pagar agora" CTA at EXPIRATION_WARNING_DAYS days or less, or
 * when already overdue. Renders nothing for 'isento' businesses.
 */
export function ExpirationBanner({ business }: { business: Business }) {
  if (business.billingType === 'isento') return null

  if (business.subscriptionStatus === 'sem_assinatura' && !business.planExpiresAt) {
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
