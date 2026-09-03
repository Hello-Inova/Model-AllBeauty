import { type ReactNode, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Tags,
  Users,
  UserSquare2,
  Images,
  Quote,
  Settings,
  DatabaseBackup,
  CreditCard,
  UserCircle,
  Menu,
  X,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import type { Business } from '../types'
import { adminRoutes, publicRoutes } from '../utils/routes'
import { useAuth } from '../contexts/AuthContext'
import { SmartImage } from '../components/SmartImage'
import { ExpirationBanner } from '../components/admin/ExpirationBanner'
import { InstallAppPrompt } from '../components/admin/InstallAppPrompt'

export function AdminLayout({ business, children }: { business: Business; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const nav = [
    { to: adminRoutes.dashboard(business.slug), label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: adminRoutes.agenda(business.slug), label: 'Agenda', icon: CalendarDays },
    { to: adminRoutes.services(business.slug), label: 'Serviços', icon: Scissors },
    { to: adminRoutes.categories(business.slug), label: 'Categorias', icon: Tags },
    { to: adminRoutes.professionals(business.slug), label: 'Profissionais', icon: UserSquare2 },
    { to: adminRoutes.customers(business.slug), label: 'Clientes', icon: Users },
    { to: adminRoutes.gallery(business.slug), label: 'Galeria', icon: Images },
    { to: adminRoutes.testimonials(business.slug), label: 'Depoimentos', icon: Quote },
    { to: adminRoutes.settings(business.slug), label: 'Configurações', icon: Settings },
    { to: adminRoutes.backup(business.slug), label: 'Backup', icon: DatabaseBackup },
    // Empresas isentas não pagam mensalidade — não faz sentido mostrar a
    // página de assinatura para elas.
    ...(business.billingType === 'isento' ? [] : [{ to: adminRoutes.subscription(business.slug), label: 'Assinatura', icon: CreditCard }]),
    { to: adminRoutes.profile(business.slug), label: 'Perfil', icon: UserCircle },
  ]

  function handleLogout() {
    logout()
    navigate(adminRoutes.login(business.slug))
  }

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--color-border)]">
        <SmartImage asset={business.logo} alt={business.name} className="h-9 w-9 rounded-full object-cover" fallbackClassName="h-9 w-9 rounded-full" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{business.displayName}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">Painel administrativo</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'hover:bg-[var(--color-muted)]'
              }`
            }
          >
            <item.icon size={17} /> {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-2 border-t border-[var(--color-border)] flex flex-col gap-0.5">
        <Link to={publicRoutes.home(business.slug)} target="_blank" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[var(--color-muted)]">
          <ExternalLink size={17} /> Ver site publicado
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[var(--color-muted)] text-left">
          <LogOut size={17} /> Sair
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex bg-[var(--color-muted)]">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[var(--color-card)] border-r border-[var(--color-border)]">{sidebarContent}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-[var(--color-card)] flex flex-col">{sidebarContent}</aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <ExpirationBanner business={business} />
        <InstallAppPrompt business={business} />
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-[var(--color-card)] border-b border-[var(--color-border)]">
          <span className="font-heading font-semibold text-sm">{business.displayName}</span>
          <button onClick={() => setOpen(true)} aria-label="Abrir menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-full">{children}</main>
      </div>
    </div>
  )
}
