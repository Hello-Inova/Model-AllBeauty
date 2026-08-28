import { CURRENCY_LOCALE, DEFAULT_CURRENCY } from '../config'

export function formatCurrency(value: number, currency = DEFAULT_CURRENCY): string {
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE, { style: 'currency', currency }).format(value)
  } catch {
    return `R$ ${value.toFixed(2)}`
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${m}min`
}

/** "2026-08-28" -> "28 de agosto de 2026" */
export function formatDateLong(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat(CURRENCY_LOCALE, { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
}

/** "2026-08-28" -> "28/08/2026" */
export function formatDateShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

export function formatWeekday(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat(CURRENCY_LOCALE, { weekday: 'long' }).format(date)
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(((total % 1440) + 1440) % 1440 / 60)
  const nm = ((total % 60) + 60) % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}
