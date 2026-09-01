import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, CalendarPlus, Building2 } from 'lucide-react'
import type { Business } from '../../types'
import { publicRoutes } from '../../utils/routes'
import { SmartImage } from '../SmartImage'
import { Button } from '../Form'

export function Header({ business }: { business: Business }) {
  const [open, setOpen] = useState(false)

  // Off-canvas drawer: lock page scroll while it's open, and let Esc close it
  // (mirrors the click-outside/close-button affordances below).
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

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

        <button className="md:hidden p-2" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen((v) => !v)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Backdrop: dims the page and closes the drawer on tap outside it. Sits
          below the sticky header (z-20 < z-30) so the header's own close
          button stays reachable while the drawer is open. */}
      <div
        className={`md:hidden fixed inset-0 z-20 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      {/* Off-canvas drawer: fixed to the right edge, full viewport height,
          70% width. Always mounted (not conditionally rendered) so the
          translate-x transition can animate the open/close slide. */}
      <nav
        className={`md:hidden fixed inset-y-0 right-0 z-20 w-[70%] max-w-sm bg-[var(--color-background)] shadow-2xl overflow-y-auto pt-16 px-4 py-3 flex flex-col gap-1 transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
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
    </header>
  )
}
