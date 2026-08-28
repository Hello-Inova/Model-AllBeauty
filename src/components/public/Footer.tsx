import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'
import { InstagramIcon, FacebookIcon, TikTokIcon } from '../BrandIcons'
import type { Business } from '../../types'
import { publicRoutes } from '../../utils/routes'
import { REPO_URL } from '../../config'

export function Footer({ business }: { business: Business }) {
  return (
    <footer className="mt-auto bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-heading text-lg font-semibold mb-2">{business.displayName}</h3>
          <p className="text-sm opacity-80">{business.description}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 opacity-90">Navegação</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to={publicRoutes.services(business.slug)} className="hover:opacity-100">Serviços</Link></li>
            <li><Link to={publicRoutes.professionals(business.slug)} className="hover:opacity-100">Profissionais</Link></li>
            <li><Link to={publicRoutes.gallery(business.slug)} className="hover:opacity-100">Galeria</Link></li>
            <li><Link to={publicRoutes.booking(business.slug)} className="hover:opacity-100">Agendar horário</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 opacity-90">Contato</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li className="flex items-center gap-2"><Phone size={14} /> {business.phone}</li>
            <li className="flex items-center gap-2"><Mail size={14} /> {business.email}</li>
            <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5" /> {business.address}, {business.city} - {business.state}</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 opacity-90">Redes sociais</h4>
          <div className="flex gap-3">
            {business.instagram && (
              <a href={business.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                <InstagramIcon size={16} />
              </a>
            )}
            {business.facebook && (
              <a href={business.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                <FacebookIcon size={16} />
              </a>
            )}
            {business.tiktok && (
              <a href={business.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                <TikTokIcon size={16} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-70">
          <span>© {new Date().getFullYear()} {business.displayName}. {business.demo && 'Dados demonstrativos.'}</span>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:opacity-100">
            Plataforma white-label de agendamento
          </a>
        </div>
      </div>
    </footer>
  )
}
