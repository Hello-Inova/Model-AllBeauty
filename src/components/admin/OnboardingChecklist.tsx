import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, CreditCard, ExternalLink, Palette, Scissors } from 'lucide-react'
import type { Business } from '../../types'
import { adminRoutes, publicRoutes } from '../../utils/routes'

interface ChecklistItem {
  key: string
  label: string
  hint: string
  done: boolean
  to: string
  external?: boolean
}

/**
 * Dynamic "getting started" checklist shown on the dashboard right after a
 * new business signs up (see SignupPage / api/auth/[...action].ts
 * `register`). Every item's "done" state is derived from real data — never
 * a separately-tracked flag — so it can't drift out of sync with what the
 * owner has actually done, and it fully hides itself once there's nothing
 * left to do, instead of needing a dismiss button + stored dismissal state.
 */
export function OnboardingChecklist({ business, servicesCount }: { business: Business; servicesCount: number }) {
  const planPaid = business.billingType === 'isento' || business.subscriptionStatus === 'ativa'
  const hasIdentity = !!business.logo
  const hasServices = servicesCount > 0
  const readyToPublish = planPaid && hasIdentity && hasServices

  const items: ChecklistItem[] = [
    {
      key: 'plan',
      label: 'Assine seu plano',
      hint: 'Cadastre um cartão para manter seu site sempre no ar.',
      done: planPaid,
      to: adminRoutes.subscription(business.slug),
    },
    {
      key: 'identity',
      label: 'Dê a cara do seu negócio ao site',
      hint: 'Adicione logo e escolha as cores da sua marca.',
      done: hasIdentity,
      to: adminRoutes.settings(business.slug),
    },
    {
      key: 'services',
      label: 'Cadastre seus serviços',
      hint: 'Nome, preço e duração de cada serviço que você oferece.',
      done: hasServices,
      to: adminRoutes.services(business.slug),
    },
    {
      key: 'publish',
      label: 'Veja e compartilhe seu site',
      hint: readyToPublish ? 'Tudo pronto — confira como ficou.' : 'Disponível assim que os passos acima estiverem concluídos.',
      done: readyToPublish,
      to: publicRoutes.home(business.slug),
      external: true,
    },
  ]

  const doneCount = items.filter((i) => i.done).length
  if (doneCount === items.length) return null

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-heading font-semibold">Primeiros passos</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">Termine de configurar seu site — leva poucos minutos.</p>
        </div>
        <span className="text-sm font-medium text-[var(--color-primary)] shrink-0">{doneCount} de {items.length} concluídos</span>
      </div>

      <div className="h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
        <div className="h-full bg-[var(--color-primary)] transition-all" style={{ width: `${(doneCount / items.length) * 100}%` }} />
      </div>

      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              to={item.to}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 -mx-2.5 hover:bg-[var(--color-muted)] transition"
            >
              {item.done ? (
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              ) : (
                <Circle size={20} className="text-[var(--color-muted-foreground)] shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${item.done ? 'text-[var(--color-muted-foreground)] line-through' : ''}`}>{item.label}</span>
                <span className="block text-xs text-[var(--color-muted-foreground)]">{item.hint}</span>
              </span>
              {item.key === 'plan' && !item.done && <CreditCard size={16} className="text-[var(--color-muted-foreground)] shrink-0" />}
              {item.key === 'identity' && !item.done && <Palette size={16} className="text-[var(--color-muted-foreground)] shrink-0" />}
              {item.key === 'services' && !item.done && <Scissors size={16} className="text-[var(--color-muted-foreground)] shrink-0" />}
              {item.key === 'publish' && <ExternalLink size={16} className="text-[var(--color-muted-foreground)] shrink-0" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
