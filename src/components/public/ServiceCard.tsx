import { Link } from 'react-router-dom'
import { Clock, ArrowRight, Star } from 'lucide-react'
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
      className="group flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden hover:shadow-lg transition"
    >
      <div className="relative aspect-[4/3]">
        <SmartImage
          asset={service.image}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          icon={getCategoryIcon(category?.slug)}
          iconSize={36}
        />
        {service.featured && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-[var(--color-accent)] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            <Star size={11} fill="currentColor" /> Destaque
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        {category && <span className="text-xs uppercase tracking-wide text-[var(--color-primary)] font-semibold">{category.name}</span>}
        <h3 className="font-heading font-semibold text-base leading-snug">{service.name}</h3>
        <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-2 flex-1">{service.shortDescription}</p>
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] mt-1">
          <span className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
            <Clock size={13} /> {formatDuration(service.duration)}
          </span>
          <div className="flex items-baseline gap-1.5">
            {hasPromo && <span className="text-xs line-through text-[var(--color-muted-foreground)]">{formatCurrency(service.price)}</span>}
            <span className="font-semibold text-[var(--color-primary)]">{formatCurrency(service.promotionalPrice ?? service.price)}</span>
          </div>
        </div>
        <span className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] mt-1">
          Agendar <ArrowRight size={14} className="group-hover:translate-x-0.5 transition" />
        </span>
      </div>
    </Link>
  )
}
