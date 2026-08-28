import { Star, UserRound } from 'lucide-react'
import type { Testimonial } from '../../types'
import { SmartImage } from '../SmartImage'

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {testimonials.map((t) => (
        <figure key={t.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 flex flex-col gap-3">
          <div className="flex gap-0.5 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} fill={i < t.rating ? 'currentColor' : 'none'} className={i < t.rating ? '' : 'text-[var(--color-border)]'} />
            ))}
          </div>
          <blockquote className="text-sm text-[var(--color-foreground)] flex-1">“{t.text}”</blockquote>
          <figcaption className="flex items-center gap-2.5">
            <SmartImage asset={t.photo} alt={t.name} className="h-9 w-9 rounded-full object-cover" fallbackClassName="h-9 w-9 rounded-full" icon={UserRound} iconSize={18} />
            <div className="leading-tight">
              <div className="text-sm font-medium">{t.name}</div>
              {t.demo && <div className="text-[10px] text-[var(--color-muted-foreground)]">Depoimento demonstrativo</div>}
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
