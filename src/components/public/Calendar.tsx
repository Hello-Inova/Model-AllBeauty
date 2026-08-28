import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Business } from '../../types'
import { isDateSelectable } from '../../utils/availability'
import { toIsoDate } from '../../utils/format'

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function Calendar({ business, value, onSelect }: { business: Business; value: string | null; onSelect: (date: string) => void }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))]

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          aria-label="Mês anterior"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-heading font-semibold text-sm">{MONTH_LABELS[month]} {year}</span>
        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={i} className="text-xs text-[var(--color-muted-foreground)] font-medium py-1">{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const iso = toIsoDate(date)
          const selectable = isDateSelectable(business, iso)
          const selected = value === iso
          return (
            <button
              key={i}
              type="button"
              disabled={!selectable}
              onClick={() => onSelect(iso)}
              className={`aspect-square rounded-lg text-sm transition ${
                selected
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold'
                  : selectable
                    ? 'hover:bg-[var(--color-muted)]'
                    : 'text-[var(--color-muted-foreground)]/40 cursor-not-allowed'
              }`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
