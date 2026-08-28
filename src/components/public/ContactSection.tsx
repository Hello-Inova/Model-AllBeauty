import { Mail, MapPin, Phone } from 'lucide-react'
import { InstagramIcon, FacebookIcon, TikTokIcon, WhatsAppIcon } from '../BrandIcons'
import type { Business } from '../../types'
import { businessWhatsappLink } from '../../utils/whatsapp'

export function ContactSection({ business }: { business: Business }) {
  const items = [
    { icon: Phone, label: business.phone, href: `tel:${business.phone.replace(/\D/g, '')}` },
    { icon: Mail, label: business.email, href: `mailto:${business.email}` },
    { icon: MapPin, label: `${business.address}, ${business.city} - ${business.state}`, href: undefined },
  ]
  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-4">
        {items.map((it) => (
          <div key={it.label} className="flex items-start gap-3">
            <span className="rounded-full bg-[var(--color-muted)] p-2.5 text-[var(--color-primary)]">
              <it.icon size={18} />
            </span>
            {it.href ? (
              <a href={it.href} className="text-sm pt-1.5 hover:text-[var(--color-primary)]">{it.label}</a>
            ) : (
              <span className="text-sm pt-1.5">{it.label}</span>
            )}
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <a href={businessWhatsappLink(business)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="rounded-full bg-[#25D366] text-white p-2.5">
            <WhatsAppIcon size={16} />
          </a>
          {business.instagram && (
            <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--color-muted)] p-2.5 text-[var(--color-primary)]">
              <InstagramIcon size={16} />
            </a>
          )}
          {business.facebook && (
            <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--color-muted)] p-2.5 text-[var(--color-primary)]">
              <FacebookIcon size={16} />
            </a>
          )}
          {business.tiktok && (
            <a href={business.tiktok} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--color-muted)] p-2.5 text-[var(--color-primary)]">
              <TikTokIcon size={16} />
            </a>
          )}
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border border-[var(--color-border)] h-64 md:h-full">
        <iframe
          title="Mapa de localização"
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${encodeURIComponent(`${business.address}, ${business.city} - ${business.state}`)}&output=embed`}
        />
      </div>
    </div>
  )
}
