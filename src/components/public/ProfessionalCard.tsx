import type { Professional } from '../../types'
import { SmartImage } from '../SmartImage'

export function ProfessionalCard({ professional }: { professional: Professional }) {
  return (
    <div className="flex flex-col items-center text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 hover:shadow-lg transition">
      <SmartImage
        asset={professional.photo}
        alt={professional.name}
        className="h-28 w-28 rounded-full object-cover mb-3"
        fallbackClassName="h-28 w-28 rounded-full mb-3"
      />
      <h3 className="font-heading font-semibold">{professional.name}</h3>
      <p className="text-sm text-[var(--color-muted-foreground)] mt-1 line-clamp-3">{professional.description}</p>
      {professional.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center mt-3">
          {professional.specialties.map((s) => (
            <span key={s} className="text-xs bg-[var(--color-muted)] text-[var(--color-muted-foreground)] px-2.5 py-1 rounded-full">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
