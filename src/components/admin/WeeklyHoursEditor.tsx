import type { DaySchedule, Weekday } from '../../types'
import { Toggle, Input, Button } from '../Form'
import { Plus, Trash2 } from 'lucide-react'

const WEEKDAY_LABELS: Record<Weekday, string> = { 0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado' }
const ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0]

export function WeeklyHoursEditor({ value, onChange }: { value: DaySchedule[]; onChange: (v: DaySchedule[]) => void }) {
  function updateDay(weekday: Weekday, patch: Partial<DaySchedule>) {
    onChange(value.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)))
  }
  function updatePeriod(weekday: Weekday, index: number, field: 'start' | 'end', val: string) {
    const day = value.find((d) => d.weekday === weekday)
    if (!day) return
    const periods = day.periods.map((p, i) => (i === index ? { ...p, [field]: val } : p))
    updateDay(weekday, { periods })
  }
  function addPeriod(weekday: Weekday) {
    const day = value.find((d) => d.weekday === weekday)
    if (!day) return
    updateDay(weekday, { periods: [...day.periods, { start: '09:00', end: '18:00' }] })
  }
  function removePeriod(weekday: Weekday, index: number) {
    const day = value.find((d) => d.weekday === weekday)
    if (!day) return
    updateDay(weekday, { periods: day.periods.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex flex-col divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-lg overflow-hidden">
      {ORDER.map((wd) => {
        const day = value.find((d) => d.weekday === wd) ?? { weekday: wd, active: false, periods: [] }
        return (
          <div key={wd} className="p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 w-40 shrink-0">
              <Toggle checked={day.active} onChange={(v) => updateDay(wd, { active: v, periods: v && day.periods.length === 0 ? [{ start: '09:00', end: '18:00' }] : day.periods })} />
              <span className="text-sm font-medium">{WEEKDAY_LABELS[wd]}</span>
            </div>
            {day.active ? (
              <div className="flex flex-col gap-2 flex-1">
                {day.periods.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input type="time" value={p.start} onChange={(e) => updatePeriod(wd, i, 'start', e.target.value)} className="!w-32" />
                    <span className="text-xs text-[var(--color-muted-foreground)]">até</span>
                    <Input type="time" value={p.end} onChange={(e) => updatePeriod(wd, i, 'end', e.target.value)} className="!w-32" />
                    <button onClick={() => removePeriod(wd, i)} aria-label="Remover período" className="p-1.5 rounded-md hover:bg-red-50 text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" icon={<Plus size={13} />} className="w-fit" onClick={() => addPeriod(wd)}>
                  Adicionar intervalo
                </Button>
              </div>
            ) : (
              <span className="text-sm text-[var(--color-muted-foreground)]">Fechado</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
