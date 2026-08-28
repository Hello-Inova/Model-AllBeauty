import type { AppointmentStatus } from '../../types'
import { Badge } from '../Form'

const CONFIG: Record<AppointmentStatus, { label: string; tone: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  pending: { label: 'Pendente', tone: 'warning' },
  confirmed: { label: 'Confirmado', tone: 'info' },
  completed: { label: 'Concluído', tone: 'success' },
  cancelled: { label: 'Cancelado', tone: 'danger' },
  no_show: { label: 'Ausência', tone: 'default' },
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const c = CONFIG[status]
  return <Badge tone={c.tone}>{c.label}</Badge>
}
