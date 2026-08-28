import { Link } from 'react-router-dom'
import { CheckCircle2, CalendarPlus, Home } from 'lucide-react'
import type { Appointment, Business, Professional, Service } from '../../types'
import { formatCurrency, formatDateLong, timeToMinutes } from '../../utils/format'
import { publicRoutes } from '../../utils/routes'
import { appointmentConfirmationMessage, whatsappLink } from '../../utils/whatsapp'
import { Button } from '../Form'
import { WhatsAppIcon } from '../BrandIcons'

function icsDate(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const minutes = timeToMinutes(time)
  const dt = new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60)
  return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function buildIcsUrl(business: Business, service: Service, appointment: Appointment): string {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@${business.slug}`,
    `DTSTART:${icsDate(appointment.date, appointment.startTime)}`,
    `DTEND:${icsDate(appointment.date, appointment.endTime)}`,
    `SUMMARY:${service.name} - ${business.displayName}`,
    `DESCRIPTION:Agendamento ${appointment.code} em ${business.displayName}`,
    `LOCATION:${business.address}, ${business.city} - ${business.state}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}

export function BookingConfirmation({
  business,
  appointment,
  service,
  professional,
  customerName,
}: {
  business: Business
  appointment: Appointment
  service: Service
  professional: Professional | null
  customerName: string
}) {
  const message = appointmentConfirmationMessage({
    service,
    professional,
    appointment,
    customer: { id: '', businessId: business.id, name: customerName, phone: '', whatsapp: '', createdAt: '' },
  })

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center flex flex-col items-center gap-4">
      <CheckCircle2 size={52} className="text-emerald-500" />
      <h1 className="font-heading text-2xl font-semibold">Agendamento realizado com sucesso!</h1>
      <p className="text-[var(--color-muted-foreground)]">Anote o código do seu agendamento: <strong className="text-[var(--color-foreground)]">{appointment.code}</strong></p>

      <dl className="w-full text-left grid grid-cols-2 gap-y-2 text-sm rounded-xl border border-[var(--color-border)] p-5 mt-2">
        <dt className="text-[var(--color-muted-foreground)]">Serviço</dt>
        <dd className="text-right font-medium">{service.name}</dd>
        <dt className="text-[var(--color-muted-foreground)]">Profissional</dt>
        <dd className="text-right font-medium">{professional ? professional.name : 'A definir'}</dd>
        <dt className="text-[var(--color-muted-foreground)]">Data</dt>
        <dd className="text-right font-medium">{formatDateLong(appointment.date)}</dd>
        <dt className="text-[var(--color-muted-foreground)]">Horário</dt>
        <dd className="text-right font-medium">{appointment.startTime}</dd>
        <dt className="text-[var(--color-muted-foreground)]">Valor</dt>
        <dd className="text-right font-medium text-[var(--color-primary)]">{formatCurrency(appointment.price)}</dd>
        <dt className="text-[var(--color-muted-foreground)]">Cliente</dt>
        <dd className="text-right font-medium">{customerName}</dd>
      </dl>

      <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-3">
        <a href={buildIcsUrl(business, service, appointment)} download={`${appointment.code}.ics`} className="flex-1">
          <Button variant="outline" className="w-full" icon={<CalendarPlus size={16} />}>Adicionar ao calendário</Button>
        </a>
        <a href={whatsappLink(business.whatsapp, message)} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button className="w-full !bg-[#25D366] !text-white" icon={<WhatsAppIcon size={16} />}>Falar pelo WhatsApp</Button>
        </a>
      </div>
      <Link to={publicRoutes.home(business.slug)} className="mt-1">
        <Button variant="ghost" icon={<Home size={16} />}>Voltar ao início</Button>
      </Link>
    </div>
  )
}
