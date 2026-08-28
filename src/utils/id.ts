let counter = 0

export function makeId(prefix = 'id'): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function makeAppointmentCode(sequence: number): string {
  return `AG-${String(sequence).padStart(4, '0')}`
}
