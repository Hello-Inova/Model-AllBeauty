import { useEffect, useMemo, useState } from 'react'
import type { Appointment, Business, Customer, Professional, Service } from '../../types'
import { Modal } from '../Modal'
import { Button, Field, Input, Select } from '../Form'
import { Calendar } from '../public/Calendar'
import { TimeSlotGrid } from '../public/TimeSlot'
import { getAvailableSlots } from '../../utils/availability'
import { dataRepository } from '../../repositories'
import { useToast } from '../../contexts/ToastContext'

interface Props {
  open: boolean
  onClose: () => void
  business: Business
  services: Service[]
  professionals: Professional[]
  customers: Customer[]
  appointments: Appointment[]
  blockedDates: import('../../types').BlockedDate[]
  editing?: Appointment | null
  onSaved: () => void
}

export function AppointmentFormModal({ open, onClose, business, services, professionals, customers, appointments, blockedDates, editing, onSaved }: Props) {
  const toast = useToast()
  const [serviceId, setServiceId] = useState('')
  const [professionalId, setProfessionalId] = useState<string>('any')
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing')
  const [customerId, setCustomerId] = useState('')
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setServiceId(editing.serviceId)
      setProfessionalId(editing.professionalId ?? 'any')
      setDate(editing.date)
      setTime(editing.startTime)
      setCustomerMode('existing')
      setCustomerId(editing.customerId)
    } else {
      setServiceId(services[0]?.id ?? '')
      setProfessionalId('any')
      setDate(null)
      setTime(null)
      setCustomerMode(customers.length > 0 ? 'existing' : 'new')
      setCustomerId(customers[0]?.id ?? '')
      setName('')
      setWhatsapp('')
    }
  }, [open, editing]) // eslint-disable-line react-hooks/exhaustive-deps

  const service = services.find((s) => s.id === serviceId) ?? null
  const eligibleProfessionals = useMemo(() => {
    if (!service) return []
    return professionals.filter((p) => p.active && (service.professionalIds.length === 0 || service.professionalIds.includes(p.id)))
  }, [service, professionals])

  const slots = useMemo(() => {
    if (!service || !date) return []
    const others = editing ? appointments.filter((a) => a.id !== editing.id) : appointments
    return getAvailableSlots({
      business,
      service,
      professionalId: professionalId === 'any' ? null : professionalId,
      eligibleProfessionals,
      date,
      appointments: others,
      blockedDates,
    })
  }, [service, date, professionalId, eligibleProfessionals, business, appointments, blockedDates, editing])

  const slotTimes = useMemo(() => {
    const set = new Set(slots.map((s) => s.time))
    if (editing && date === editing.date) set.add(editing.startTime)
    return Array.from(set).sort()
  }, [slots, editing, date])

  async function handleSave() {
    if (!service || !date || !time) {
      toast.error('Preencha serviço, data e horário.')
      return
    }
    if (customerMode === 'new' && (!name.trim() || !whatsapp.trim())) {
      toast.error('Preencha nome e WhatsApp do cliente.')
      return
    }
    if (customerMode === 'existing' && !customerId) {
      toast.error('Selecione um cliente.')
      return
    }
    setSaving(true)
    try {
      const customer = customerMode === 'new' ? await dataRepository.findOrCreateCustomer(business.id, { name, whatsapp }) : customers.find((c) => c.id === customerId)!

      const match = slots.find((s) => s.time === time)
      const assignedProfessionalId = professionalId === 'any' ? (match ? match.assignedProfessionalId : null) : professionalId

      const [h, m] = time.split(':').map(Number)
      const endMinutes = h * 60 + m + service.duration
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

      if (editing) {
        await dataRepository.updateAppointment(editing.id, {
          serviceId: service.id,
          professionalId: assignedProfessionalId,
          customerId: customer.id,
          date,
          startTime: time,
          endTime,
          duration: service.duration,
          price: service.promotionalPrice ?? service.price,
        })
        toast.success('Agendamento atualizado.')
      } else {
        await dataRepository.createAppointment({
          businessId: business.id,
          serviceId: service.id,
          professionalId: assignedProfessionalId,
          customerId: customer.id,
          date,
          startTime: time,
          endTime,
          duration: service.duration,
          price: service.promotionalPrice ?? service.price,
          status: 'confirmed',
        })
        toast.success('Agendamento criado.')
      }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar / reagendar' : 'Novo agendamento'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button loading={saving} onClick={handleSave}>Salvar</Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-4">
          <Field label="Serviço" required>
            <Select value={serviceId} onChange={(e) => { setServiceId(e.target.value); setProfessionalId('any'); setTime(null) }}>
              {services.filter((s) => s.active).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Profissional">
            <Select value={professionalId} onChange={(e) => { setProfessionalId(e.target.value); setTime(null) }}>
              <option value="any">Qualquer profissional</option>
              {eligibleProfessionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Cliente" required>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setCustomerMode('existing')} className={`text-xs px-3 py-1.5 rounded-full border ${customerMode === 'existing' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>Cliente existente</button>
              <button type="button" onClick={() => setCustomerMode('new')} className={`text-xs px-3 py-1.5 rounded-full border ${customerMode === 'new' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>Novo cliente</button>
            </div>
            {customerMode === 'existing' ? (
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Selecione...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.whatsapp}</option>
                ))}
              </Select>
            ) : (
              <div className="flex flex-col gap-2">
                <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>
            )}
          </Field>
        </div>

        <div className="flex flex-col gap-4">
          <Calendar business={business} value={date} onSelect={(d) => { setDate(d); setTime(null) }} />
          {date && <TimeSlotGrid slots={slotTimes} selected={time} onSelect={setTime} />}
        </div>
      </div>
    </Modal>
  )
}
