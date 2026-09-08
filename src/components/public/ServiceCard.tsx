import { Link } from 'react-router-dom'
import { Clock, Star } from 'lucide-react'
import type { Business, Category, Service } from '../../types'
import { SmartImage } from '../SmartImage'
import { formatCurrency, formatDuration } from '../../utils/format'
import { publicRoutes } from '../../utils/routes'
import { getCategoryIcon } from '../../utils/categoryIcons'

export function ServiceCard({ business, service, category }: { business: Business; service: Service; category?: Category }) {
  const hasPromo = service.promotionalPrice != null && service.promotionalPrice < service.price
  return (
    <Link
      to={publicRoutes.service(business.slug, service.slug)}
      className="group flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden hover:shadow-lg transition"
    >
      <div className="relative aspect-[16/10]">
        {/*
          `absolute inset-0` instead of `w-full h-full`: this box is a
          flex-column item (the Link above is `flex flex-col`), and in that
          layout Chromium resolves a percentage-height child (h-full) before
          the parent's own aspect-ratio-derived height is settled, so it
          falls back to the image's natural size — a portrait photo then
          blows the card out to its own height instead of being cropped to
          16:10. Absolute positioning fills the box after it's already
          sized, sidestepping that resolution order entirely.
        */}
        <SmartImage
          asset={service.image}
          alt={service.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
          icon={getCategoryIcon(category?.slug)}
          iconSize={32}
        />
        {service.featured && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-[var(--color-accent)] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            <Star size={11} fill="currentColor" /> Destaque
          </span>
        )}
      </div>
      {/*
        Every card in a row/carousel needs the same height *without* one
        short card stretching to match a tall sibling and leaving a dead
        gap of empty space (the previous flex-1 + h-full approach did
        exactly that). Instead, each variable-height field reserves a
        fixed slot — category always occupies its line, the title always
        reserves two lines via min-height — so cards land at the same
        height because their content is the same size, not because
        something is stretched to fill leftover space.
      */}
      <div className="p-3.5 flex flex-col gap-1.5">
        <span className="block min-h-[1rem] text-[11px] uppercase tracking-wide text-[var(--color-primary)] font-semibold">{category?.name}</span>
        <h3 className="font-heading font-semibold text-base leading-snug line-clamp-2 min-h-[2.5rem]">{service.name}</h3>
        <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-1">{service.shortDescription}</p>
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] mt-0.5">
          <span className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
            <Clock size={13} /> {formatDuration(service.duration)}
          </span>
          <div className="flex items-baseline gap-1.5">
            {hasPromo && <span className="text-xs line-through text-[var(--color-muted-foreground)]">{formatCurrency(service.price)}</span>}
            <span className="font-semibold text-[var(--color-primary)]">{formatCurrency(service.promotionalPrice ?? service.price)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
