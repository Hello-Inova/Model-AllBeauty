import { Link } from 'react-router-dom'
import { Loader2, SearchX, Building2 } from 'lucide-react'
import { Button } from './Form'
import { DEFAULT_BUSINESS_SLUG } from '../config'
import { publicRoutes } from '../utils/routes'

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-[var(--color-primary,#b3873e)]" size={32} />
    </div>
  )
}

export function BusinessNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center gap-4 px-6">
      <Building2 size={40} className="text-[var(--color-muted-foreground,#6b625a)]" />
      <h1 className="font-heading text-2xl font-semibold">Empresa não encontrada</h1>
      <p className="text-[var(--color-muted-foreground,#6b625a)] max-w-md">
        Não encontramos nenhuma empresa com esse endereço. Verifique o link ou visite nossa empresa de demonstração.
      </p>
      <Link to={publicRoutes.home(DEFAULT_BUSINESS_SLUG)}>
        <Button>Ver empresa de demonstração</Button>
      </Link>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center gap-4 px-6">
      <SearchX size={40} className="text-[var(--color-muted-foreground,#6b625a)]" />
      <h1 className="font-heading text-2xl font-semibold">Página não encontrada</h1>
      <Link to={publicRoutes.home(DEFAULT_BUSINESS_SLUG)}>
        <Button>Voltar ao início</Button>
      </Link>
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
