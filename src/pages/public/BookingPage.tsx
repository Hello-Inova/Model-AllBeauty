import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, ChevronLeft, Users2 } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useAppointments, useBlockedDates, useCategories, useProfessionals, useServices } from '../../hooks/useEntities'
import type { Appointment, Professional, Service } from '../../types'
import { dataRepository } from '../../repositories'
import { getAvailableSlots } from '../../utils/availability'
import { formatCurrency, formatDateLong, formatDuration, todayIso } from '../../utils/format'
import { messages, isValidEmail } from '../../utils/validators'
import { SmartImage } from '../../components/SmartImage'
import { Calendar } from '../../components/public/Calendar'
import { TimeSlotGrid } from '../../components/public/TimeSlot'
import { Button, Field, Input, TextArea } from '../../components/Form'
import { SEO } from '../../components/SEO'
import { BookingConfirmation } from '../../components/public/BookingConfirmation'
import { useToast } from '../../contexts/ToastContext'

type Step = 'service' | 'professional' | 'datetime' | 'details' | 'review'

const STEP_LABELS: Record<Step, string> = {
  service: 'Serviço',
  professional: 'Profissional',
  datetime: 'Data e horário',
  details: 'Seus dados',
  review: 'Revisão',
}
const STEP_ORDER: Step[] = ['service', 'professional', 'datetime', 'details', 'review']

export function BookingPage() {
  const business = useCurrentBusiness()!
  const toast = useToast()
  const [params] = useSearchParams()
  const { data: services } = useServices(business.id)
  const { data: categories } = useCategories(business.id)
  const { data: professionals } = useProfessionals(business.id)
  const { data: appointments, refresh: refreshAppointments } = useAppointments(business.id)
  const { data: blockedDates } = useBlockedDates(business.id)

  const [step, setStep] = useState<Step>('service')
  const [serviceId, setServiceId] = useState<string | null>(params.get('servico'))
  const [professionalId, setProfessionalId] = useState<string | null | 'any'>('any')
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState<{ appointment: Appointment; service: Service; professional: Professional | null } | null>(null)

  const service = services.find((s) => s.id === serviceId) ?? null

  useEffect(() => {
    if (serviceId && service) setStep('professional')
  }, [serviceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const eligibleProfessionals = useMemo(() => {
    if (!service) return []
    return professionals.filter((p) => p.active && (service.professionalIds.length === 0 || service.professionalIds.includes(p.id)))
  }, [service, professionals])

  const selectedProfessional =
    professionalId === 'any' || !professionalId ? null : eligibleProfessionals.find((p) => p.id === professionalId) ?? null

  const slots = useMemo(() => {
    if (!service || !date) return []
    return getAvailableSlots({
      business,
      service,
      professionalId: professionalId === 'any' ? null : professionalId,
      eligibleProfessionals,
      date,
      appointments,
      blockedDates,
    })
  }, [service, date, professionalId, eligibleProfessionals, business, appointments, blockedDates])

  const slotTimes = useMemo(() => Array.from(new Set(slots.map((s) => s.time))).sort(), [slots])

  function canProceedFrom(current: Step): boolean {
    if (current === 'service') return !!service
    if (current === 'professional') return true
    if (current === 'datetime') return !!date && !!time
    return true
  }

  function next() {
    const idx = STEP_ORDER.indexOf(step)
    if (!canProceedFrom(step)) return
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1])
  }
  function back() {
    const idx = STEP_ORDER.indexOf(step)
    if (idx > 0) setStep(STEP_ORDER[idx - 1])
  }

  function validateDetails(): boolean {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = messages.required('seu nome')
    if (!whatsapp.trim()) next.whatsapp = messages.invalidPhone
    if (business.bookingPolicies.requireEmail && !isValidEmail(email)) next.email = messages.invalidEmail
    if (email && !isValidEmail(email)) next.email = messages.invalidEmail
    if (business.bookingPolicies.requireNotes && !notes.trim()) next.notes = messages.required('uma observação')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleConfirm() {
    if (!service || !date || !time) return
    setSubmitting(true)
    try {
      // Re-check availability right before writing, to avoid double-booking races.
      const freshSlots = getAvailableSlots({
        business,
        service,
        professionalId: professionalId === 'any' ? null : professionalId,
        eligibleProfessionals,
        date,
        appointments: await dataRepository.getAppointments(business.id),
        blockedDates,
      })
      const match = freshSlots.find((s) => s.time === time)
      if (!match) {
        toast.error(messages.slotTaken)
        await refreshAppointments()
        setStep('datetime')
        setSubmitting(false)
        return
      }

      const customer = await dataRepository.findOrCreateCustomer(business.id, { name, whatsapp, email: email || undefined })
      const [h, m] = time.split(':').map(Number)
      const endMinutes = h * 60 + m + service.duration
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

      const appointment = await dataRepository.createAppointment({
        businessId: business.id,
        serviceId: service.id,
        professionalId: match.assignedProfessionalId,
        customerId: customer.id,
        date,
        startTime: time,
        endTime,
        duration: service.duration,
        price: service.promotionalPrice ?? service.price,
        status: 'pending',
        notes: notes || undefined,
      })

      const finalProfessional = professionals.find((p) => p.id === match.assignedProfessionalId) ?? null
      setConfirmed({ appointment, service, professional: finalProfessional })
      await refreshAppointments()
    } catch {
      toast.error('Não foi possível concluir o agendamento. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmed) {
    return (
      <BookingConfirmation
        business={business}
        appointment={confirmed.appointment}
        service={confirmed.service}
        professional={confirmed.professional}
        customerName={name}
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <SEO business={business} title="Agendamento" description={`Agende seu horário em ${business.displayName}.`} />
      <h1 className="font-heading text-3xl font-semibold mb-6">Agende seu horário</h1>

      <ol className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEP_ORDER.map((s, i) => {
          const currentIdx = STEP_ORDER.indexOf(step)
          const state = i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'pending'
          return (
            <li key={s} className="flex items-center gap-2 shrink-0">
              <span
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  state === 'done'
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : state === 'active'
                      ? 'border-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                }`}
              >
                {state === 'done' ? <Check size={13} /> : i + 1}
              </span>
              <span className={`text-xs font-medium hidden sm:inline ${state === 'pending' ? 'text-[var(--color-muted-foreground)]' : ''}`}>{STEP_LABELS[s]}</span>
              {i < STEP_ORDER.length - 1 && <span className="w-4 sm:w-8 h-px bg-[var(--color-border)]" />}
            </li>
          )
        })}
      </ol>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6">
        {step === 'service' && (
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold mb-1">Escolha o serviço</h2>
            {services.filter((s) => s.active).length === 0 && <p className="text-sm text-[var(--color-muted-foreground)]">Nenhum serviço disponível no momento.</p>}
            {services
              .filter((s) => s.active)
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setServiceId(s.id)
                    setProfessionalId('any')
                    setDate(null)
                    setTime(null)
                    setStep('professional')
                  }}
                  className={`flex items-center gap-4 rounded-lg border p-3 text-left transition ${
                    serviceId === s.id ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                  }`}
                >
                  <SmartImage asset={s.image} alt={s.name} className="h-16 w-16 rounded-md object-cover shrink-0" fallbackClassName="h-16 w-16 rounded-md shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] truncate">{categories.find((c) => c.id === s.categoryId)?.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{formatDuration(s.duration)}</p>
                  </div>
                  <span className="font-semibold text-[var(--color-primary)] text-sm shrink-0">{formatCurrency(s.promotionalPrice ?? s.price)}</span>
                </button>
              ))}
          </div>
        )}

        {step === 'professional' && service && (
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold mb-1">Escolha o profissional</h2>
            <button
              onClick={() => setProfessionalId('any')}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                professionalId === 'any' ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
              }`}
            >
              <span className="h-12 w-12 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-primary)]">
                <Users2 size={20} />
              </span>
              <div>
                <p className="font-medium text-sm">Qualquer profissional disponível</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">Recomendado para o horário mais rápido</p>
              </div>
            </button>
            {eligibleProfessionals.map((p) => (
              <button
                key={p.id}
                onClick={() => setProfessionalId(p.id)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                  professionalId === p.id ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                <SmartImage asset={p.photo} alt={p.name} className="h-12 w-12 rounded-full object-cover shrink-0" fallbackClassName="h-12 w-12 rounded-full shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate">{p.specialties.join(', ')}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'datetime' && service && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h2 className="font-heading text-lg font-semibold mb-3">Escolha a data</h2>
              <Calendar
                business={business}
                value={date}
                onSelect={(d) => {
                  setDate(d)
                  setTime(null)
                }}
              />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold mb-3">Horários disponíveis</h2>
              {date ? (
                <TimeSlotGrid slots={slotTimes} selected={time} onSelect={setTime} />
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)] py-6 text-center">Selecione uma data para ver os horários.</p>
              )}
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="flex flex-col gap-4 max-w-md">
            <h2 className="font-heading text-lg font-semibold mb-1">Seus dados</h2>
            <Field label="Nome completo" required error={errors.name}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </Field>
            <Field label="WhatsApp" required error={errors.whatsapp} hint="Usaremos para confirmar seu agendamento.">
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
            </Field>
            <Field label="E-mail" required={business.bookingPolicies.requireEmail} error={errors.email}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            </Field>
            <Field label="Observações" required={business.bookingPolicies.requireNotes} error={errors.notes}>
              <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alguma informação adicional?" />
            </Field>
          </div>
        )}

        {step === 'review' && service && date && time && (
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-lg font-semibold mb-1">Revise e confirme</h2>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-[var(--color-muted-foreground)]">Serviço</dt>
              <dd className="font-medium text-right">{service.name}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Profissional</dt>
              <dd className="font-medium text-right">{selectedProfessional ? selectedProfessional.name : 'Qualquer profissional disponível'}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Data</dt>
              <dd className="font-medium text-right">{formatDateLong(date)}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Horário</dt>
              <dd className="font-medium text-right">{time}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Duração</dt>
              <dd className="font-medium text-right">{formatDuration(service.duration)}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Valor</dt>
              <dd className="font-medium text-right text-[var(--color-primary)]">{formatCurrency(service.promotionalPrice ?? service.price)}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Cliente</dt>
              <dd className="font-medium text-right">{name}</dd>
              <dt className="text-[var(--color-muted-foreground)]">WhatsApp</dt>
              <dd className="font-medium text-right">{whatsapp}</dd>
            </dl>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--color-border)]">
          <Button variant="ghost" icon={<ChevronLeft size={16} />} onClick={back} disabled={step === 'service'}>
            Voltar
          </Button>
          {step === 'review' ? (
            <Button loading={submitting} onClick={handleConfirm}>
              Confirmar agendamento
            </Button>
          ) : (
            <Button
              disabled={!canProceedFrom(step)}
              onClick={() => {
                if (step === 'details') {
                  if (validateDetails()) next()
                } else {
                  next()
                }
              }}
            >
              Continuar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
