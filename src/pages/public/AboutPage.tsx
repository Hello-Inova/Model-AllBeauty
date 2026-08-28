import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { SmartImage } from '../../components/SmartImage'
import { SEO } from '../../components/SEO'
import { MapPin, Clock } from 'lucide-react'
import { formatWeekday } from '../../utils/format'

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function AboutPage() {
  const business = useCurrentBusiness()!

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <SEO business={business} title="Sobre" description={business.description} />
      <div className="grid md:grid-cols-2 gap-10 items-center mb-14">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Sobre nós</span>
          <h1 className="font-heading text-3xl font-semibold mt-1 mb-4">{business.displayName}</h1>
          <p className="text-[var(--color-muted-foreground)] leading-relaxed whitespace-pre-line">{business.description}</p>
          <div className="flex items-center gap-2 text-sm mt-5">
            <MapPin size={16} className="text-[var(--color-primary)]" />
            {business.address}, {business.city} - {business.state}
          </div>
        </div>
        <div className="rounded-xl overflow-hidden aspect-video">
          <SmartImage asset={business.coverImage} alt={business.name} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] p-6">
        <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock size={18} className="text-[var(--color-primary)]" /> Horário de funcionamento
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
          {WEEKDAY_ORDER.map((wd) => {
            const day = business.workingHours.find((d) => d.weekday === wd)
            const label = formatWeekday(nextDateForWeekday(wd))
            return (
              <div key={wd} className="flex items-center justify-between text-sm py-1.5 border-b border-[var(--color-border)] last:border-0">
                <span className="capitalize">{label}</span>
                <span className="text-[var(--color-muted-foreground)]">
                  {day && day.active && day.periods.length > 0 ? day.periods.map((p) => `${p.start}–${p.end}`).join(' / ') : 'Fechado'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function nextDateForWeekday(weekday: number): string {
  const d = new Date()
  const diff = (weekday - d.getDay() + 7) % 7
  d.setDate(d.getDate() + diff)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
