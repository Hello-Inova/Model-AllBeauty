// ---------------------------------------------------------------------------
// Core domain types shared by every module of the platform.
// This file is the single source of truth for the shape of the data. Every
// business (tenant) owns its own rows of every entity below, scoped through
// the `businessId` field so data from different companies is never mixed.
// ---------------------------------------------------------------------------

export type ID = string

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday ... 6 = Saturday

export interface TimeRange {
  start: string // "08:00"
  end: string // "18:00"
}

export interface DaySchedule {
  weekday: Weekday
  active: boolean
  periods: TimeRange[] // supports multiple periods per day, e.g. 08-12 and 14-18
}

export type ImageSourceType = 'url' | 'upload'

/** A managed image: either a remote URL or a locally stored (base64/IndexedDB) upload. */
export interface ImageAsset {
  id: ID
  type: ImageSourceType
  url: string // for 'url': the remote URL. for 'upload': an object URL / data URL resolved at render time
  storageKey?: string // for 'upload': the key inside ImageStorage (IndexedDB)
  alt?: string
  createdAt: string
}

export type BookingDepositPolicy = 'none' | 'deposit' | 'full_payment' | 'pay_on_site'

export interface BookingPolicies {
  minAdvanceMinutes: number // minimum notice required before a booking
  maxAdvanceDays: number // how many days in the future clients can book
  cancellationWindowHours: number
  allowReschedule: boolean
  bufferBetweenAppointmentsMinutes: number
  lateToleranceMinutes: number
  requireEmail: boolean
  requireNotes: boolean
  paymentPolicy: BookingDepositPolicy
}

export type PlanId = 'basico' | 'profissional' | 'premium'

export interface Business {
  id: ID
  slug: string // used in the public URL, e.g. /empresa/beauty-demo
  name: string
  displayName: string
  description: string
  segment: string // e.g. "Salão de beleza", "Barbearia", "Clínica de estética"
  logo?: ImageAsset
  favicon?: ImageAsset
  coverImage?: ImageAsset
  heroImage?: ImageAsset
  phone: string
  whatsapp: string
  email: string
  instagram?: string
  facebook?: string
  tiktok?: string
  youtube?: string
  website?: string
  address: string
  city: string
  state: string
  country: string
  zipCode: string
  currency: string // "BRL"
  timezone: string // "America/Sao_Paulo"
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  foregroundColor: string
  theme: 'light' | 'dark'
  active: boolean
  demo: boolean
  plan: PlanId
  workingHours: DaySchedule[]
  bookingPolicies: BookingPolicies
  // ---- Assinatura / cobrança recorrente (gateway Asaas) --------------------
  // Não confundir com `plan` acima (nível de recursos) — isto é o ciclo de
  // cobrança da mensalidade da plataforma em si.
  billingType: BillingType
  billingPlan: BillingPlanId
  subscriptionStatus: SubscriptionStatus
  planExpiresAt?: string
  asaasCustomerId?: string
  asaasSubscriptionId?: string
  cardLast4?: string
  cardBrand?: string
  createdAt: string
  updatedAt: string
}

/** 'padrao' é cobrada normalmente pelo billingPlan; 'isento' nunca é cobrada. */
export type BillingType = 'padrao' | 'isento'

export type BillingPlanId = 'mensal' | 'semestral' | 'anual'

export type SubscriptionStatus = 'sem_assinatura' | 'ativa' | 'atrasada' | 'cancelada'

/** Catálogo de planos de assinatura da plataforma (editável pelo Super Admin). */
export interface BillingPlanDef {
  id: BillingPlanId
  name: string
  cycle: 'MONTHLY' | 'SEMIANNUALLY' | 'YEARLY'
  months: number
  priceCents: number
  discountCents: number
  active: boolean
}

export type BillingTransactionStatus = 'pending' | 'confirmed' | 'received' | 'overdue' | 'refused' | 'refunded'

export interface BillingTransaction {
  id: ID
  businessId: ID
  valueCents: number
  status: BillingTransactionStatus
  dueDate?: string
  paidAt?: string
  createdAt: string
}

/** Configurações globais da plataforma Hello Inova (dado não-sensível). */
export interface PlatformSettings {
  pixKey: string
  pixKeyOwnerName: string
}

export interface Category {
  id: ID
  businessId: ID
  name: string
  slug: string
  description?: string
  icon?: string
  order: number
  active: boolean
}

export interface Service {
  id: ID
  businessId: ID
  categoryId: ID
  name: string
  slug: string
  shortDescription: string
  description: string
  duration: number // minutes
  price: number
  promotionalPrice?: number
  image?: ImageAsset
  active: boolean
  featured: boolean
  order: number
  professionalIds: ID[] // which professionals can perform this service (empty = any)
}

export interface Professional {
  id: ID
  businessId: ID
  name: string
  photo?: ImageAsset
  description: string
  specialties: string[]
  phone?: string
  email?: string
  serviceIds: ID[]
  workingHours: DaySchedule[] // can override business hours
  useBusinessHours: boolean
  active: boolean
  order: number
}

export interface BlockedDate {
  id: ID
  businessId: ID
  professionalId?: ID // undefined = blocks the whole business
  date: string // "2026-08-28"
  allDay: boolean
  startTime?: string
  endTime?: string
  reason?: string
}

export interface Customer {
  id: ID
  businessId: ID
  name: string
  phone: string
  whatsapp: string
  email?: string
  notes?: string
  createdAt: string
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface Appointment {
  id: ID
  businessId: ID
  code: string // human friendly booking number, e.g. "AG-0001"
  serviceId: ID
  professionalId: ID | null // null = "qualquer profissional"
  customerId: ID
  date: string // "2026-08-28"
  startTime: string // "09:00"
  endTime: string // "10:00"
  duration: number
  price: number
  status: AppointmentStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface GalleryImage {
  id: ID
  businessId: ID
  image: ImageAsset
  title?: string
  description?: string
  order: number
  active: boolean
}

export interface Testimonial {
  id: ID
  businessId: ID
  name: string
  photo?: ImageAsset
  text: string
  rating: number // 1-5
  active: boolean
  demo: boolean
  order: number
}

export interface Banner {
  id: ID
  businessId: ID
  image: ImageAsset
  title?: string
  subtitle?: string
  link?: string
  active: boolean
  order: number
}

export type AdminRole = 'super_admin' | 'owner' | 'manager' | 'staff'

export interface AdminUser {
  id: ID
  businessId: ID | null // null for super_admin
  name: string
  email: string
  role: AdminRole
  active: boolean
}

// Aggregated "everything about one business" bundle, convenient for
// export/import (backup) and for seeding demo data in one shot.
export interface BusinessBackup {
  business: Business
  categories: Category[]
  services: Service[]
  professionals: Professional[]
  customers: Customer[]
  appointments: Appointment[]
  gallery: GalleryImage[]
  testimonials: Testimonial[]
  banners: Banner[]
  blockedDates: BlockedDate[]
  exportedAt: string
  version: number
}
