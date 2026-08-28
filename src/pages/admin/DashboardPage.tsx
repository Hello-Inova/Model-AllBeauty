import { Link } from 'react-router-dom'
import { CalendarCheck2, Users, TrendingUp, XCircle, ArrowRight } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useAppointments, useCustomers, useProfessionals, useServices } from '../../hooks/useEntities'
import { DashboardCard } from '../../components/admin/DashboardCard'
import { AppointmentStatusBadge } from '../../components/admin/AppointmentStatusBadge'
import { ScrollableTable, Td, Th } from '../../components/ScrollableTable'
import { EmptyState } from '../../components/Form'
import { formatCurrency, todayIso } from '../../utils/format'
import { adminRoutes } from '../../utils/routes'
import { CalendarX2 } from 'lucide-react'

export function DashboardPage() {
  const business = useCurrentBusiness()!
  const { data: appointments } = useAppointments(business.id)
  const { data: customers } = useCustomers(business.id)
  const { data: services } = useServices(business.id)
  const { data: professionals } = useProfessionals(business.id)

  const today = todayIso()
  const todayAppointments = appointments.filter((a) => a.date === today && a.status !== 'cancelled').sort((a, b) => (a.startTime < b.startTime ? -1 : 1))
  const upcoming = appointments.filter((a) => a.date > today && (a.status === 'pending' || a.status === 'confirmed')).length
  const cancelled = appointments.filter((a) => a.status === 'cancelled' || a.status === 'no_show').length
  const revenue = appointments.filter((a) => a.status === 'completed').reduce((sum, a) => sum + a.price, 0)

  const serviceCounts = new Map<string, number>()
  for (const a of appointments) {
    if (a.status === 'cancelled') continue
    serviceCounts.set(a.serviceId, (serviceCounts.get(a.serviceId) ?? 0) + 1)
  }
  const topServices = [...serviceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ service: services.find((s) => s.id === id), count }))
    .filter((x) => x.service)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Visão geral de {business.displayName}.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard label="Agendamentos hoje" value={todayAppointments.length} icon={<CalendarCheck2 size={20} />} />
        <DashboardCard label="Próximos agendamentos" value={upcoming} icon={<TrendingUp size={20} />} tone="success" />
        <DashboardCard label="Total de clientes" value={customers.length} icon={<Users size={20} />} />
        <DashboardCard label="Receita concluída" value={formatCurrency(revenue)} icon={<TrendingUp size={20} />} tone="success" hint="Somente agendamentos concluídos" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold">Agenda de hoje</h2>
            <Link to={adminRoutes.agenda(business.slug)} className="text-sm text-[var(--color-primary)] flex items-center gap-1">
              Ver agenda completa <ArrowRight size={13} />
            </Link>
          </div>
          {todayAppointments.length === 0 ? (
            <EmptyState icon={<CalendarX2 size={28} />} title="Nenhum agendamento para hoje" />
          ) : (
            <ScrollableTable>
              <table>
                <thead>
                  <tr>
                    <Th>Horário</Th>
                    <Th>Serviço</Th>
                    <Th>Profissional</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppointments.map((a) => (
                    <tr key={a.id}>
                      <Td className="font-medium">{a.startTime}</Td>
                      <Td>{services.find((s) => s.id === a.serviceId)?.name ?? '—'}</Td>
                      <Td>{professionals.find((p) => p.id === a.professionalId)?.name ?? 'Qualquer profissional'}</Td>
                      <Td><AppointmentStatusBadge status={a.status} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollableTable>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="font-heading font-semibold mb-4">Serviços mais agendados</h2>
          {topServices.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Sem dados suficientes ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {topServices.map(({ service, count }) => (
                <li key={service!.id} className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2">{service!.name}</span>
                  <span className="font-semibold shrink-0">{count}x</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]"><XCircle size={14} /> Cancelamentos/ausências</span>
            <span className="font-semibold">{cancelled}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
