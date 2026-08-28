import { useMemo, useState } from 'react'
import { Search, Users, Eye } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useAppointments, useCustomers, useServices } from '../../hooks/useEntities'
import { ScrollableTable, Td, Th } from '../../components/ScrollableTable'
import { Badge, EmptyState, Input } from '../../components/Form'
import { Modal } from '../../components/Modal'
import { AppointmentStatusBadge } from '../../components/admin/AppointmentStatusBadge'
import { formatCurrency, formatDateShort } from '../../utils/format'
import type { Customer } from '../../types'

export function CustomersAdminPage() {
  const business = useCurrentBusiness()!
  const { data: customers } = useCustomers(business.id)
  const { data: appointments } = useAppointments(business.id)
  const { data: services } = useServices(business.id)
  const [query, setQuery] = useState('')
  const [viewing, setViewing] = useState<Customer | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.whatsapp.includes(q) || (c.email ?? '').toLowerCase().includes(q))
  }, [customers, query])

  function statsFor(customerId: string) {
    const list = appointments.filter((a) => a.customerId === customerId)
    const completed = list.filter((a) => a.status === 'completed')
    const cancelled = list.filter((a) => a.status === 'cancelled' || a.status === 'no_show')
    const last = [...list].sort((a, b) => (a.date < b.date ? 1 : -1))[0]
    return { total: list.length, completed: completed.length, cancelled: cancelled.length, last }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Histórico e contato dos seus clientes.</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <Input placeholder="Buscar por nome, WhatsApp ou e-mail" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title="Nenhum cliente encontrado" />
      ) : (
        <ScrollableTable>
          <table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>WhatsApp</Th>
                <Th>E-mail</Th>
                <Th>Atendimentos</Th>
                <Th>Último atendimento</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const stats = statsFor(c.id)
                return (
                  <tr key={c.id}>
                    <Td className="font-medium">{c.name}</Td>
                    <Td>{c.whatsapp}</Td>
                    <Td>{c.email || '—'}</Td>
                    <Td>{stats.total}</Td>
                    <Td>{stats.last ? formatDateShort(stats.last.date) : '—'}</Td>
                    <Td>
                      <button onClick={() => setViewing(c)} aria-label="Ver histórico" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]">
                        <Eye size={15} />
                      </button>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </ScrollableTable>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `Histórico de ${viewing.name}` : ''} size="lg">
        {viewing && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {(() => {
                const s = statsFor(viewing.id)
                return (
                  <>
                    <div className="rounded-lg bg-[var(--color-muted)] p-3">
                      <p className="text-lg font-semibold">{s.total}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">Total</p>
                    </div>
                    <div className="rounded-lg bg-[var(--color-muted)] p-3">
                      <p className="text-lg font-semibold">{s.completed}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">Concluídos</p>
                    </div>
                    <div className="rounded-lg bg-[var(--color-muted)] p-3">
                      <p className="text-lg font-semibold">{s.cancelled}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">Cancelados/Ausências</p>
                    </div>
                  </>
                )
              })()}
            </div>
            <ScrollableTable maxHeight="320px">
              <table>
                <thead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Serviço</Th>
                    <Th>Status</Th>
                    <Th>Valor</Th>
                  </tr>
                </thead>
                <tbody>
                  {appointments
                    .filter((a) => a.customerId === viewing.id)
                    .sort((a, b) => (a.date < b.date ? 1 : -1))
                    .map((a) => (
                      <tr key={a.id}>
                        <Td>{formatDateShort(a.date)} {a.startTime}</Td>
                        <Td>{services.find((s) => s.id === a.serviceId)?.name ?? '—'}</Td>
                        <Td><AppointmentStatusBadge status={a.status} /></Td>
                        <Td>{formatCurrency(a.price)}</Td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </ScrollableTable>
            {viewing.notes && (
              <div>
                <span className="text-sm font-medium">Observações</span>
                <p className="text-sm text-[var(--color-muted-foreground)]">{viewing.notes}</p>
              </div>
            )}
            <Badge>{viewing.whatsapp}</Badge>
          </div>
        )}
      </Modal>
    </div>
  )
}
