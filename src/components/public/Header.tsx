import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, CalendarPlus, Building2 } from 'lucide-react'
import type { Business } from '../../types'
import { publicRoutes } from '../../utils/routes'
import { SmartImage } from '../SmartImage'
import { Button } from '../Form'

export function Header({ business }: { business: Business }) {
  const [open, setOpen] = useState(false)
  const links = [
    { to: publicRoutes.home(business.slug), label: 'Início', end: true },
    { to: publicRoutes.services(business.slug), label: 'Serviços' },
    { to: publicRoutes.professionals(business.slug), label: 'Profissionais' },
    { to: publicRoutes.gallery(business.slug), label: 'Galeria' },
    { to: publicRoutes.about(business.slug), label: 'Sobre' },
    { to: publicRoutes.contact(business.slug), label: 'Contato' },
  ]

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-background)]/95 backdrop-blur border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to={publicRoutes.home(business.slug)} className="flex items-center gap-2.5 shrink-0">
          <SmartImage asset={business.logo} alt={business.name} className="h-10 w-10 rounded-full object-cover" fallbackClassName="h-10 w-10 rounded-full" icon={Building2} iconSize={18} />
          <span className="font-heading font-semibold text-lg leading-tight">{business.displayName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `text-sm font-medium transition hover:text-[var(--color-primary)] ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-foreground)]'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link to={publicRoutes.booking(business.slug)}>
            <Button icon={<CalendarPlus size={16} />}>Agendar agora</Button>
          </Link>
        </div>

        <button className="md:hidden p-2" aria-label="Abrir menu" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-[var(--color-border)] px-4 py-3 flex flex-col gap-1 bg-[var(--color-background)]">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `py-2.5 text-sm font-medium ${isActive ? 'text-[var(--color-primary)]' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
          <Link to={publicRoutes.booking(business.slug)} onClick={() => setOpen(false)} className="mt-2">
            <Button className="w-full" icon={<CalendarPlus size={16} />}>Agendar agora</Button>
          </Link>
        </nav>
      )}
    </header>
  )
}
