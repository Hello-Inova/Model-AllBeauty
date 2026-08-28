import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, LogOut } from 'lucide-react'
import { superAdminRoutes } from '../utils/routes'
import { useAuth } from '../contexts/AuthContext'

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[var(--color-muted,#f5f1ea)]">
      <header className="bg-[#1c1917] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to={superAdminRoutes.home} className="flex items-center gap-2 font-heading font-semibold">
            <ShieldCheck size={20} /> Super Admin
          </Link>
          <button
            onClick={() => {
              logout()
              navigate(superAdminRoutes.login)
            }}
            className="flex items-center gap-1.5 text-sm opacity-80 hover:opacity-100"
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  )
}
