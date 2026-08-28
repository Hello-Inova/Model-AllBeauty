import type { Appointment, BlockedDate, Business, DaySchedule, Professional, Service, Weekday } from '../types'
import { timeToMinutes, todayIso } from './format'

const SLOT_INTERVAL_MINUTES = 15

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function weekdayOf(isoDate: string): Weekday {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).getDay() as Weekday
}

function scheduleForDate(schedules: DaySchedule[], isoDate: string): DaySchedule | undefined {
  return schedules.find((s) => s.weekday === weekdayOf(isoDate))
}

type Interval = [number, number] // minutes since 00:00

function subtractInterval(base: Interval[], remove: Interval): Interval[] {
  const result: Interval[] = []
  for (const [s, e] of base) {
    if (remove[1] <= s || remove[0] >= e) {
      result.push([s, e])
      continue
    }
    if (remove[0] > s) result.push([s, remove[0]])
    if (remove[1] < e) result.push([remove[1], e])
  }
  return result
}

/**
 * Computes the free minute-intervals of a single resource (a professional, or
 * the business itself for services with no specific professional) on a given
 * date, after removing blocked ranges and existing appointments (with the
 * configured buffer applied around each).
 */
function freeIntervalsForResource(params: {
  workingHours: DaySchedule[]
  date: string
  blockedRanges: Interval[] // already resolved for this resource+date
  busyAppointments: Appointment[] // this resource's appointments on this date (not cancelled)
  bufferMinutes: number
}): Interval[] {
  const day = scheduleForDate(params.workingHours, params.date)
  if (!day || !day.active || day.periods.length === 0) return []

  let free: Interval[] = day.periods.map((p) => [timeToMinutes(p.start), timeToMinutes(p.end)] as Interval)

  for (const range of params.blockedRanges) {
    free = free.flatMap((f) => subtractInterval([f], range))
  }

  for (const apt of params.busyAppointments) {
    const start = timeToMinutes(apt.startTime) - params.bufferMinutes
    const end = timeToMinutes(apt.endTime) + params.bufferMinutes
    free = free.flatMap((f) => subtractInterval([f], [start, end]))
  }

  return free
}

function blockedRangesFor(blockedDates: BlockedDate[], date: string, professionalId: string | null | undefined): Interval[] {
  return blockedDates
    .filter((b) => b.date === date && (b.professionalId === undefined || b.professionalId === professionalId))
    .map((b): Interval => {
      if (b.allDay || !b.startTime || !b.endTime) return [0, 24 * 60]
      return [timeToMinutes(b.startTime), timeToMinutes(b.endTime)]
    })
}

export interface AvailabilityInput {
  business: Business
  service: Service
  /** null = "qualquer profissional disponível" */
  professionalId: string | null
  /** All professionals eligible to perform this service (already filtered & active). Required when professionalId is null. */
  eligibleProfessionals: Professional[]
  date: string
  appointments: Appointment[] // ALL of the business's appointments (any date) — filtered internally
  blockedDates: BlockedDate[]
  now?: Date
}

export interface AvailableSlot {
  time: string
  /** Which professional this slot would be booked with, when professionalId was null. */
  assignedProfessionalId: string | null
}

export function getAvailableSlots(input: AvailabilityInput): AvailableSlot[] {
  const { business, service, date, appointments, blockedDates } = input
  const now = input.now ?? new Date()
  const policies = business.bookingPolicies

  // Respect max advance days / past dates.
  const isToday = date === todayIso()
  const minAdvanceAbsoluteMinutes = isToday ? now.getHours() * 60 + now.getMinutes() + policies.minAdvanceMinutes : 0

  const dayAppointments = appointments.filter((a) => a.date === date && a.status !== 'cancelled' && a.status !== 'no_show')

  const buffer = policies.bufferBetweenAppointmentsMinutes

  function slotsForProfessional(professional: Professional | null): Interval[] {
    const workingHours = professional && !professional.useBusinessHours ? professional.workingHours : business.workingHours
    const resourceId = professional ? professional.id : null
    const busy = dayAppointments.filter((a) => (professional ? a.professionalId === professional.id : a.professionalId === null))
    const blocked = [...blockedRangesFor(blockedDates, date, resourceId), ...blockedRangesFor(blockedDates, date, undefined)]
    return freeIntervalsForResource({ workingHours, date, blockedRanges: blocked, busyAppointments: busy, bufferMinutes: buffer })
  }

  const results: AvailableSlot[] = []
  const seen = new Set<string>()

  function pushSlots(intervals: Interval[], assignedProfessionalId: string | null) {
    for (const [start, end] of intervals) {
      for (let t = start; t + service.duration <= end; t += SLOT_INTERVAL_MINUTES) {
        if (t < minAdvanceAbsoluteMinutes) continue
        const time = minutesToTime(t)
        if (seen.has(time)) continue
        seen.add(time)
        results.push({ time, assignedProfessionalId })
      }
    }
  }

  if (input.professionalId) {
    const professional = input.eligibleProfessionals.find((p) => p.id === input.professionalId) ?? null
    pushSlots(slotsForProfessional(professional), input.professionalId)
  } else {
    // "Qualquer profissional": a time is offered if at least one eligible professional is free;
    // we remember which one so booking can auto-assign.
    const candidates = input.eligibleProfessionals.length > 0 ? input.eligibleProfessionals : [null]
    for (const professional of candidates) {
      pushSlots(slotsForProfessional(professional), professional ? professional.id : null)
    }
  }

  return results.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0))
}

export function isDateSelectable(business: Business, date: string): boolean {
  const today = todayIso()
  if (date < today) return false
  const day = scheduleForDate(business.workingHours, date)
  if (!day || !day.active || day.periods.length === 0) return false
  const diffDays = Math.round((new Date(date).getTime() - new Date(today).getTime()) / 86400000)
  if (diffDays > business.bookingPolicies.maxAdvanceDays) return false
  return true
}
