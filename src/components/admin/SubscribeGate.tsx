import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Rocket, LogOut } from 'lucide-react'
import { Button } from '../Form'
import { useAuth } from '../../contexts/AuthContext'
import { adminRoutes } from '../../utils/routes'
import { hasBillingAccess } from '../../utils/billing'
import type { Business } from '../../types'

/**
 * Blocks the admin panel (mesmo padrão de tela cheia do TermsGate) quando o
 * teste grátis configurado da empresa venceu sem uma assinatura ativa (ver
 * hasBillingAccess() em src/utils/billing.ts). Super admin nunca é
 * bloqueado (acesso de suporte/impersonation). A própria tela de
 * "Assinatura" também nunca é bloqueada — senão o dono da empresa jamais
 * conseguiria chegar lá pra pagar e sair desse estado.
 *
 * Renderiza OU o bloqueio OU os children — nunca os dois — mesmo princípio
 * do TermsGate: nenhum dado do painel fica montado no DOM enquanto o
 * bloqueio está ativo.
 */
export function SubscribeGate({ business, children }: { business: Business; children: ReactNode }) {
  const { session, logout } = useAuth()
  const location = useLocation()

  const exempt =
    session?.role === 'super_admin' ||
    hasBillingAccess(business) ||
    location.pathname === adminRoutes.subscription(business.slug)

  if (exempt) return <>{children}</>

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="w-full max-w-lg rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 sm:p-7 flex flex-col items-center text-center gap-4">
        <div className="h-12 w-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          <Rocket size={22} />
        </div>
        <h2 className="font-heading text-lg font-semibold">Seu período de teste grátis acabou</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          O teste grátis de {business.displayName} chegou ao fim e o site ficou temporariamente fora do ar para os seus clientes. Assine
          um plano para reativar o site e voltar a usar o painel normalmente.
        </p>
        <Link to={adminRoutes.subscription(business.slug)} className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto">Assinar agora</Button>
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition"
        >
          <LogOut size={13} /> Sair da conta
        </button>
      </div>
    </div>
  )
}
