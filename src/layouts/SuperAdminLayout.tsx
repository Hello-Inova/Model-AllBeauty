import { type ReactNode, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShieldCheck, LogOut, Building2, CreditCard, Settings, UserCircle, Menu, X, Plus } from 'lucide-react'
import { superAdminRoutes } from '../utils/routes'
import { useAuth } from '../contexts/AuthContext'

const nav = [
  { to: superAdminRoutes.home, label: 'Empresas', icon: Building2, end: true },
  { to: superAdminRoutes.plans, label: 'Planos de assinatura', icon: CreditCard, end: false },
  { to: superAdminRoutes.settings, label: 'Configurações', icon: Settings, end: false },
  { to: superAdminRoutes.profile, label: 'Perfil', icon: UserCircle, end: false },
]

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate(superAdminRoutes.login)
  }

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--color-border)]">
        <div className="h-9 w-9 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center justify-center shrink-0">
          <ShieldCheck size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">Super Admin</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">Hello Inova</p>
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
        <Link
          to={superAdminRoutes.onboarding}
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[var(--color-muted)]"
        >
          <Plus size={17} /> Nova empresa
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
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-[var(--color-card)] border-b border-[var(--color-border)]">
          <span className="font-heading font-semibold text-sm flex items-center gap-2">
            <ShieldCheck size={18} /> Super Admin
          </span>
          <button onClick={() => setOpen(true)} aria-label="Abrir menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-full">{children}</main>
      </div>
    </div>
  )
}
