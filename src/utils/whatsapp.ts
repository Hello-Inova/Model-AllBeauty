import type { Appointment, Business, Customer, Professional, Service } from '../types'
import { formatCurrency, formatDateShort } from './format'

export function whatsappLink(whatsapp: string, message: string): string {
  const digits = whatsapp.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function genericContactMessage(): string {
  return 'Olá! Gostaria de agendar um atendimento.'
}

export function appointmentConfirmationMessage(params: {
  service: Service
  professional: Professional | null
  appointment: Appointment
  customer: Customer
}): string {
  const { service, professional, appointment, customer } = params
  return [
    'Olá! Acabei de realizar um agendamento.',
    '',
    `Serviço: ${service.name}`,
    `Profissional: ${professional ? professional.name : 'Qualquer profissional disponível'}`,
    `Data: ${formatDateShort(appointment.date)}`,
    `Horário: ${appointment.startTime}`,
    `Nome: ${customer.name}`,
    `Código: ${appointment.code}`,
  ].join('\n')
}

export function businessWhatsappLink(business: Business, message?: string): string {
  return whatsappLink(business.whatsapp, message ?? genericContactMessage())
}

export function formatPriceForMessage(value: number): string {
  return formatCurrency(value)
}
