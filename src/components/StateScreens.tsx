import { Link } from 'react-router-dom'
import { Loader2, SearchX, Building2 } from 'lucide-react'
import { Button } from './Form'
import { DEFAULT_BUSINESS_SLUG } from '../config'
import { publicRoutes } from '../utils/routes'
import { businessOrigin, getHostContext } from '../utils/hostContext'

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-[var(--color-primary,#b3873e)]" size={32} />
    </div>
  )
}

/**
 * Estas duas telas (empresa não encontrada / página não encontrada) podem
 * aparecer em qualquer subdomínio — inclusive no de uma empresa que não
 * existe, ou no do Super Admin — não só no domínio raiz de sempre. Nesses
 * casos, o caminho relativo de publicRoutes.home() (que assume que já
 * estamos no subdomínio da própria demo) não serve: precisa de uma URL
 * completa com protocolo+host pra funcionar de qualquer lugar. No modo
 * plataforma (domínio raiz/www — o único que existe hoje) o caminho
 * relativo de sempre continua sendo usado, preservando a navegação
 * client-side. Ver src/utils/hostContext.ts.
 */
function DemoBusinessLink({ children }: { children: React.ReactNode }) {
  if (getHostContext().mode === 'platform') {
    return <Link to={publicRoutes.home(DEFAULT_BUSINESS_SLUG)}>{children}</Link>
  }
  return <a href={`${businessOrigin(DEFAULT_BUSINESS_SLUG)}/`}>{children}</a>
}

export function BusinessNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center gap-4 px-6">
      <Building2 size={40} className="text-[var(--color-muted-foreground,#6b625a)]" />
      <h1 className="font-heading text-2xl font-semibold">Empresa não encontrada</h1>
      <p className="text-[var(--color-muted-foreground,#6b625a)] max-w-md">
        Não encontramos nenhuma empresa com esse endereço. Verifique o link ou visite nossa empresa de demonstração.
      </p>
      <DemoBusinessLink>
        <Button>Ver empresa de demonstração</Button>
      </DemoBusinessLink>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center gap-4 px-6">
      <SearchX size={40} className="text-[var(--color-muted-foreground,#6b625a)]" />
      <h1 className="font-heading text-2xl font-semibold">Página não encontrada</h1>
      <DemoBusinessLink>
        <Button>Voltar ao início</Button>
      </DemoBusinessLink>
    </div>
  )
}

export function BusinessInactiveScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center gap-4 px-6">
      <Building2 size={40} className="text-[var(--color-muted-foreground,#6b625a)]" />
      <h1 className="font-heading text-2xl font-semibold">{name} está temporariamente indisponível</h1>
      <p className="text-[var(--color-muted-foreground,#6b625a)] max-w-md">Esta página está desativada no momento. Volte em breve.</p>
    </div>
  )
}
