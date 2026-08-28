import { useMemo, useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, Check, CheckCheck, X, UserX, Pencil, CalendarX2 } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useAppointments, useBlockedDates, useCustomers, useProfessionals, useServices } from '../../hooks/useEntities'
import { dataRepository } from '../../repositories'
import type { Appointment, AppointmentStatus } from '../../types'
import { ScrollableTable, Td, Th } from '../../components/ScrollableTable'
import { Button, EmptyState, Select } from '../../components/Form'
import { AppointmentStatusBadge } from '../../components/admin/AppointmentStatusBadge'
import { AppointmentFormModal } from '../../components/admin/AppointmentFormModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../contexts/ToastContext'
import { addDays, formatCurrency, formatDateLong, formatDateShort, todayIso } from '../../utils/format'

type View = 'day' | 'week' | 'month' | 'list'

export function AgendaPage() {
  const business = useCurrentBusiness()!
  const { data: appointments, refresh } = useAppointments(business.id)
  const { data: services } = useServices(business.id)
  const { data: professionals } = useProfessionals(business.id)
  const { data: customers } = useCustomers(business.id)
  const { data: blockedDates } = useBlockedDates(business.id)
  const toast = useToast()

  const [view, setView] = useState<View>('day')
  const [cursorDate, setCursorDate] = useState(todayIso())
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [cancelling, setCancelling] = useState<Appointment | null>(null)

  function serviceName(id: string) {
    return services.find((s) => s.id === id)?.name ?? '—'
  }
  function professionalName(id: string | null) {
    return id ? (professionals.find((p) => p.id === id)?.name ?? '—') : 'Qualquer profissional'
  }
  function customerName(id: string) {
    return customers.find((c) => c.id === id)?.name ?? '—'
  }

  async function setStatus(a: Appointment, status: AppointmentStatus) {
    await dataRepository.updateAppointment(a.id, { status })
    toast.success('Status atualizado.')
    refresh()
  }

  async function handleCancel() {
    if (!cancelling) return
    await dataRepository.cancelAppointment(cancelling.id)
    toast.success('Agendamento cancelado.')
    setCancelling(null)
    refresh()
  }

  const dayAppointments = useMemo(
    () => appointments.filter((a) => a.date === cursorDate).sort((a, b) => (a.startTime < b.startTime ? -1 : 1)),
    [appointments, cursorDate],
  )

  const filteredList = useMemo(() => {
    return appointments
      .filter((a) => statusFilter === 'all' || a.status === statusFilter)
      .sort((a, b) => (a.date + a.startTime < b.date + b.startTime ? 1 : -1))
  }, [appointments, statusFilter])

  function ActionButtons({ a }: { a: Appointment }) {
    return (
      <div className="flex gap-1 flex-wrap">
        {a.status === 'pending' && (
          <button onClick={() => setStatus(a, 'confirmed')} title="Confirmar" className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"><Check size={14} /></button>
        )}
        {(a.status === 'pending' || a.status === 'confirmed') && (
          <button onClick={() => setStatus(a, 'completed')} title="Concluir" className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600"><CheckCheck size={14} /></button>
        )}
        {(a.status === 'pending' || a.status === 'confirmed') && (
          <button onClick={() => setStatus(a, 'no_show')} title="Marcar ausência" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><UserX size={14} /></button>
        )}
        {(a.status === 'pending' || a.status === 'confirmed') && (
          <>
            <button onClick={() => { setEditing(a); setFormOpen(true) }} title="Editar / reagendar" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><Pencil size={14} /></button>
            <button onClick={() => setCancelling(a)} title="Cancelar" className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><X size={14} /></button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Agenda</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Gerencie os agendamentos de {business.displayName}.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { setEditing(null); setFormOpen(true) }}>Novo agendamento</Button>
      </div>

      <div className="flex items-center gap-2 border-b border-[var(--color-border)]">
        {(['day', 'week', 'month', 'list'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${view === v ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted-foreground)]'}`}
          >
            {{ day: 'Dia', week: 'Semana', month: 'Mês', list: 'Lista' }[v]}
          </button>
        ))}
      </div>

      {view !== 'list' && (
        <div className="flex items-center gap-3">
          <button onClick={() => setCursorDate(addDays(cursorDate, view === 'day' ? -1 : view === 'week' ? -7 : -30))} className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><ChevronLeft size={18} /></button>
          <span className="font-medium text-sm">{view === 'day' ? formatDateLong(cursorDate) : `A partir de ${formatDateShort(cursorDate)}`}</span>
          <button onClick={() => setCursorDate(addDays(cursorDate, view === 'day' ? 1 : view === 'week' ? 7 : 30))} className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><ChevronRight size={18} /></button>
          <button onClick={() => setCursorDate(todayIso())} className="text-xs text-[var(--color-primary)] font-medium ml-1">Hoje</button>
        </div>
      )}

      {view === 'day' && (
        dayAppointments.length === 0 ? (
          <EmptyState icon={<CalendarX2 size={28} />} title="Nenhum agendamento neste dia" />
        ) : (
          <div className="flex flex-col gap-2">
            {dayAppointments.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3.5">
                <span className="font-semibold text-sm w-16 shrink-0">{a.startTime}</span>
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm font-medium">{serviceName(a.serviceId)}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{customerName(a.customerId)} · {professionalName(a.professionalId)}</p>
                </div>
                <span className="text-sm font-medium shrink-0">{formatCurrency(a.price)}</span>
                <AppointmentStatusBadge status={a.status} />
                <ActionButtons a={a} />
              </div>
            ))}
          </div>
        )
      )}

      {view === 'week' && (
        <WeekView cursorDate={cursorDate} appointments={appointments} serviceName={serviceName} onDayClick={(d) => { setCursorDate(d); setView('day') }} />
      )}

      {view === 'month' && (
        <MonthView cursorDate={cursorDate} appointments={appointments} onDayClick={(d) => { setCursorDate(d); setView('day') }} />
      )}

      {view === 'list' && (
        <div className="flex flex-col gap-4">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'all')} className="max-w-xs">
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="confirmed">Confirmado</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
            <option value="no_show">Ausência</option>
          </Select>
          {filteredList.length === 0 ? (
            <EmptyState icon={<CalendarX2 size={28} />} title="Nenhum agendamento encontrado" />
          ) : (
            <ScrollableTable>
              <table>
                <thead>
                  <tr>
                    <Th>Código</Th>
                    <Th>Data</Th>
                    <Th>Serviço</Th>
                    <Th>Cliente</Th>
                    <Th>Profissional</Th>
                    <Th>Valor</Th>
                    <Th>Status</Th>
                    <Th>Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((a) => (
                    <tr key={a.id}>
                      <Td className="font-mono text-xs">{a.code}</Td>
                      <Td>{formatDateShort(a.date)} {a.startTime}</Td>
                      <Td>{serviceName(a.serviceId)}</Td>
                      <Td>{customerName(a.customerId)}</Td>
                      <Td>{professionalName(a.professionalId)}</Td>
                      <Td>{formatCurrency(a.price)}</Td>
                      <Td><AppointmentStatusBadge status={a.status} /></Td>
                      <Td><ActionButtons a={a} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollableTable>
          )}
        </div>
      )}

      <AppointmentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        business={business}
        services={services}
        professionals={professionals}
        customers={customers}
        appointments={appointments}
        blockedDates={blockedDates}
        editing={editing}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={!!cancelling}
        title="Cancelar agendamento"
        message={`Tem certeza que deseja cancelar o agendamento ${cancelling?.code}?`}
        confirmLabel="Cancelar agendamento"
        danger
        onConfirm={handleCancel}
        onCancel={() => setCancelling(null)}
      />
    </div>
  )
}

function WeekView({ cursorDate, appointments, serviceName, onDayClick }: { cursorDate: string; appointments: Appointment[]; serviceName: (id: string) => string; onDayClick: (d: string) => void }) {
  const start = weekStart(cursorDate)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
      {days.map((d) => {
        const list = appointments.filter((a) => a.date === d && a.status !== 'cancelled').sort((a, b) => (a.startTime < b.startTime ? -1 : 1))
        return (
          <button key={d} onClick={() => onDayClick(d)} className="text-left rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 hover:border-[var(--color-primary)] transition min-h-32">
            <p className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-2">{formatDateShort(d)}</p>
            <div className="flex flex-col gap-1">
              {list.slice(0, 3).map((a) => (
                <p key={a.id} className="text-xs truncate">{a.startTime} {serviceName(a.serviceId)}</p>
              ))}
              {list.length > 3 && <p className="text-xs text-[var(--color-muted-foreground)]">+{list.length - 3} mais</p>}
              {list.length === 0 && <p className="text-xs text-[var(--color-muted-foreground)]">—</p>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function MonthView({ cursorDate, appointments, onDayClick }: { cursorDate: string; appointments: Appointment[]; onDayClick: (d: string) => void }) {
  const [y, m] = cursorDate.split('-').map(Number)
  const firstWeekday = new Date(y, m - 1, 1).getDay()
  const daysInMonth = new Date(y, m, 0).getDate()
  const cells: (string | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)]
  const counts = new Map<string, number>()
  for (const a of appointments) {
    if (a.status === 'cancelled') continue
    counts.set(a.date, (counts.get(a.date) ?? 0) + 1)
  }
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((w, i) => (
        <span key={i} className="text-xs text-center font-medium text-[var(--color-muted-foreground)] py-1">{w}</span>
      ))}
      {cells.map((d, i) => {
        if (!d) return <div key={i} />
        const count = counts.get(d) ?? 0
        return (
          <button key={i} onClick={() => onDayClick(d)} className="aspect-square rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)] flex flex-col items-center justify-center gap-1 transition">
            <span className="text-sm">{Number(d.split('-')[2])}</span>
            {count > 0 && <span className="text-[10px] rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-1.5">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

function weekStart(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const day = dt.getDay()
  dt.setDate(dt.getDate() - day)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
