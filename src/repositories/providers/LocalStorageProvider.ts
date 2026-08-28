import type { DataRepository } from '../DataRepository'
import type {
  Appointment,
  Banner,
  BlockedDate,
  Business,
  BusinessBackup,
  Category,
  Customer,
  GalleryImage,
  Professional,
  Service,
  Testimonial,
} from '../../types'
import { STORAGE_PREFIX, STORAGE_VERSION } from '../../config'
import { makeId, makeAppointmentCode } from '../../utils/id'
import { buildDemoBackup } from '../../data/demoData'

// ---------------------------------------------------------------------------
// Generic, type-safe collection helpers over window.localStorage.
// Every entity is stored as a single JSON array under its own key, e.g.
// "wl-booking:services". Nothing in the rest of the app touches these keys
// directly — only this file does.
// ---------------------------------------------------------------------------

type CollectionName =
  | 'businesses'
  | 'categories'
  | 'services'
  | 'professionals'
  | 'customers'
  | 'appointments'
  | 'blockedDates'
  | 'gallery'
  | 'testimonials'
  | 'banners'

function key(name: CollectionName): string {
  return `${STORAGE_PREFIX}:${name}`
}

function readAll<T>(name: CollectionName): T[] {
  try {
    const raw = localStorage.getItem(key(name))
    if (!raw) return []
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}

function writeAll<T>(name: CollectionName, items: T[]): void {
  localStorage.setItem(key(name), JSON.stringify(items))
}

function nowIso(): string {
  return new Date().toISOString()
}

let appointmentSequence: number | null = null
function nextAppointmentSequence(): number {
  if (appointmentSequence === null) {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:appointmentSeq`)
    appointmentSequence = raw ? Number(raw) : 0
  }
  appointmentSequence += 1
  localStorage.setItem(`${STORAGE_PREFIX}:appointmentSeq`, String(appointmentSequence))
  return appointmentSequence
}

class LocalStorageProvider implements DataRepository {
  // ---- Businesses ---------------------------------------------------------
  async getBusinesses(): Promise<Business[]> {
    return readAll<Business>('businesses')
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    return readAll<Business>('businesses').find((b) => b.id === id)
  }

  async getBusinessBySlug(slug: string): Promise<Business | undefined> {
    return readAll<Business>('businesses').find((b) => b.slug === slug)
  }

  async createBusiness(data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<Business> {
    const businesses = readAll<Business>('businesses')
    const business: Business = {
      ...data,
      id: makeId('biz'),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    businesses.push(business)
    writeAll('businesses', businesses)
    return business
  }

  async updateBusiness(id: string, data: Partial<Business>): Promise<Business> {
    const businesses = readAll<Business>('businesses')
    const idx = businesses.findIndex((b) => b.id === id)
    if (idx === -1) throw new Error('Empresa não encontrada')
    businesses[idx] = { ...businesses[idx], ...data, id, updatedAt: nowIso() }
    writeAll('businesses', businesses)
    return businesses[idx]
  }

  async deleteBusiness(id: string): Promise<void> {
    writeAll('businesses', readAll<Business>('businesses').filter((b) => b.id !== id))
    // cascade delete related data
    for (const col of ['categories', 'services', 'professionals', 'customers', 'appointments', 'blockedDates', 'gallery', 'testimonials', 'banners'] as CollectionName[]) {
      writeAll(col, readAll<{ businessId: string }>(col).filter((r) => r.businessId !== id))
    }
  }

  // ---- Categories -----------------------------------------------------------
  async getCategories(businessId: string): Promise<Category[]> {
    return readAll<Category>('categories')
      .filter((c) => c.businessId === businessId)
      .sort((a, b) => a.order - b.order)
  }

  async createCategory(data: Omit<Category, 'id'>): Promise<Category> {
    const items = readAll<Category>('categories')
    const item: Category = { ...data, id: makeId('cat') }
    items.push(item)
    writeAll('categories', items)
    return item
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const items = readAll<Category>('categories')
    const idx = items.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Categoria não encontrada')
    items[idx] = { ...items[idx], ...data, id }
    writeAll('categories', items)
    return items[idx]
  }

  async deleteCategory(id: string): Promise<void> {
    writeAll('categories', readAll<Category>('categories').filter((c) => c.id !== id))
  }

  // ---- Services -------------------------------------------------------------
  async getServices(businessId: string): Promise<Service[]> {
    return readAll<Service>('services')
      .filter((s) => s.businessId === businessId)
      .sort((a, b) => a.order - b.order)
  }

  async getService(id: string): Promise<Service | undefined> {
    return readAll<Service>('services').find((s) => s.id === id)
  }

  async createService(data: Omit<Service, 'id'>): Promise<Service> {
    const items = readAll<Service>('services')
    const item: Service = { ...data, id: makeId('srv') }
    items.push(item)
    writeAll('services', items)
    return item
  }

  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    const items = readAll<Service>('services')
    const idx = items.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error('Serviço não encontrado')
    items[idx] = { ...items[idx], ...data, id }
    writeAll('services', items)
    return items[idx]
  }

  async deleteService(id: string): Promise<void> {
    writeAll('services', readAll<Service>('services').filter((s) => s.id !== id))
  }

  // ---- Professionals ----------------------------------------------------
  async getProfessionals(businessId: string): Promise<Professional[]> {
    return readAll<Professional>('professionals')
      .filter((p) => p.businessId === businessId)
      .sort((a, b) => a.order - b.order)
  }

  async getProfessional(id: string): Promise<Professional | undefined> {
    return readAll<Professional>('professionals').find((p) => p.id === id)
  }

  async createProfessional(data: Omit<Professional, 'id'>): Promise<Professional> {
    const items = readAll<Professional>('professionals')
    const item: Professional = { ...data, id: makeId('pro') }
    items.push(item)
    writeAll('professionals', items)
    return item
  }

  async updateProfessional(id: string, data: Partial<Professional>): Promise<Professional> {
    const items = readAll<Professional>('professionals')
    const idx = items.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('Profissional não encontrado')
    items[idx] = { ...items[idx], ...data, id }
    writeAll('professionals', items)
    return items[idx]
  }

  async deleteProfessional(id: string): Promise<void> {
    writeAll('professionals', readAll<Professional>('professionals').filter((p) => p.id !== id))
  }

  // ---- Customers ------------------------------------------------------------
  async getCustomers(businessId: string): Promise<Customer[]> {
    return readAll<Customer>('customers').filter((c) => c.businessId === businessId)
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return readAll<Customer>('customers').find((c) => c.id === id)
  }

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const items = readAll<Customer>('customers')
    const item: Customer = { ...data, id: makeId('cus'), createdAt: nowIso() }
    items.push(item)
    writeAll('customers', items)
    return item
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const items = readAll<Customer>('customers')
    const idx = items.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Cliente não encontrado')
    items[idx] = { ...items[idx], ...data, id }
    writeAll('customers', items)
    return items[idx]
  }

  async deleteCustomer(id: string): Promise<void> {
    writeAll('customers', readAll<Customer>('customers').filter((c) => c.id !== id))
  }

  async findOrCreateCustomer(
    businessId: string,
    data: { name: string; whatsapp: string; phone?: string; email?: string },
  ): Promise<Customer> {
    const items = readAll<Customer>('customers')
    const normalizedPhone = data.whatsapp.replace(/\D/g, '')
    const existing = items.find(
      (c) => c.businessId === businessId && c.whatsapp.replace(/\D/g, '') === normalizedPhone,
    )
    if (existing) {
      const idx = items.findIndex((c) => c.id === existing.id)
      items[idx] = { ...existing, name: data.name, email: data.email ?? existing.email }
      writeAll('customers', items)
      return items[idx]
    }
    return this.createCustomer({
      businessId,
      name: data.name,
      whatsapp: data.whatsapp,
      phone: data.phone || data.whatsapp,
      email: data.email,
    })
  }

  // ---- Appointments ---------------------------------------------------------
  async getAppointments(businessId: string): Promise<Appointment[]> {
    return readAll<Appointment>('appointments').filter((a) => a.businessId === businessId)
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return readAll<Appointment>('appointments').find((a) => a.id === id)
  }

  async createAppointment(
    data: Omit<Appointment, 'id' | 'code' | 'createdAt' | 'updatedAt'>,
  ): Promise<Appointment> {
    const items = readAll<Appointment>('appointments')
    const item: Appointment = {
      ...data,
      id: makeId('apt'),
      code: makeAppointmentCode(nextAppointmentSequence()),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    items.push(item)
    writeAll('appointments', items)
    return item
  }

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const items = readAll<Appointment>('appointments')
    const idx = items.findIndex((a) => a.id === id)
    if (idx === -1) throw new Error('Agendamento não encontrado')
    items[idx] = { ...items[idx], ...data, id, updatedAt: nowIso() }
    writeAll('appointments', items)
    return items[idx]
  }

  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    return this.updateAppointment(id, {
      status: 'cancelled',
      notes: reason ? `${reason}` : undefined,
    })
  }

  // ---- Blocked dates ------------------------------------------------------
  async getBlockedDates(businessId: string): Promise<BlockedDate[]> {
    return readAll<BlockedDate>('blockedDates').filter((b) => b.businessId === businessId)
  }

  async createBlockedDate(data: Omit<BlockedDate, 'id'>): Promise<BlockedDate> {
    const items = readAll<BlockedDate>('blockedDates')
    const item: BlockedDate = { ...data, id: makeId('blk') }
    items.push(item)
    writeAll('blockedDates', items)
    return item
  }

  async deleteBlockedDate(id: string): Promise<void> {
    writeAll('blockedDates', readAll<BlockedDate>('blockedDates').filter((b) => b.id !== id))
  }

  // ---- Gallery ------------------------------------------------------------
  async getGallery(businessId: string): Promise<GalleryImage[]> {
    return readAll<GalleryImage>('gallery')
      .filter((g) => g.businessId === businessId)
      .sort((a, b) => a.order - b.order)
  }

  async createGalleryImage(data: Omit<GalleryImage, 'id'>): Promise<GalleryImage> {
    const items = readAll<GalleryImage>('gallery')
    const item: GalleryImage = { ...data, id: makeId('gal') }
    items.push(item)
    writeAll('gallery', items)
    return item
  }

  async updateGalleryImage(id: string, data: Partial<GalleryImage>): Promise<GalleryImage> {
    const items = readAll<GalleryImage>('gallery')
    const idx = items.findIndex((g) => g.id === id)
    if (idx === -1) throw new Error('Imagem não encontrada')
    items[idx] = { ...items[idx], ...data, id }
    writeAll('gallery', items)
    return items[idx]
  }

  async deleteGalleryImage(id: string): Promise<void> {
    writeAll('gallery', readAll<GalleryImage>('gallery').filter((g) => g.id !== id))
  }

  async reorderGallery(businessId: string, orderedIds: string[]): Promise<void> {
    const items = readAll<GalleryImage>('gallery')
    orderedIds.forEach((id, index) => {
      const idx = items.findIndex((g) => g.id === id && g.businessId === businessId)
      if (idx !== -1) items[idx] = { ...items[idx], order: index }
    })
    writeAll('gallery', items)
  }

  // ---- Testimonials ---------------------------------------------------------
  async getTestimonials(businessId: string): Promise<Testimonial[]> {
    return readAll<Testimonial>('testimonials')
      .filter((t) => t.businessId === businessId)
      .sort((a, b) => a.order - b.order)
  }

  async createTestimonial(data: Omit<Testimonial, 'id'>): Promise<Testimonial> {
    const items = readAll<Testimonial>('testimonials')
    const item: Testimonial = { ...data, id: makeId('tst') }
    items.push(item)
    writeAll('testimonials', items)
    return item
  }

  async updateTestimonial(id: string, data: Partial<Testimonial>): Promise<Testimonial> {
    const items = readAll<Testimonial>('testimonials')
    const idx = items.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error('Depoimento não encontrado')
    items[idx] = { ...items[idx], ...data, id }
    writeAll('testimonials', items)
    return items[idx]
  }

  async deleteTestimonial(id: string): Promise<void> {
    writeAll('testimonials', readAll<Testimonial>('testimonials').filter((t) => t.id !== id))
  }

  // ---- Banners --------------------------------------------------------------
  async getBanners(businessId: string): Promise<Banner[]> {
    return readAll<Banner>('banners')
      .filter((b) => b.businessId === businessId)
      .sort((a, b) => a.order - b.order)
  }

  async createBanner(data: Omit<Banner, 'id'>): Promise<Banner> {
    const items = readAll<Banner>('banners')
    const item: Banner = { ...data, id: makeId('ban') }
    items.push(item)
    writeAll('banners', items)
    return item
  }

  async updateBanner(id: string, data: Partial<Banner>): Promise<Banner> {
    const items = readAll<Banner>('banners')
    const idx = items.findIndex((b) => b.id === id)
    if (idx === -1) throw new Error('Banner não encontrado')
    items[idx] = { ...items[idx], ...data, id }
    writeAll('banners', items)
    return items[idx]
  }

  async deleteBanner(id: string): Promise<void> {
    writeAll('banners', readAll<Banner>('banners').filter((b) => b.id !== id))
  }

  // ---- Backup / restore -----------------------------------------------------
  async exportBusinessBackup(businessId: string): Promise<BusinessBackup> {
    const business = await this.getBusiness(businessId)
    if (!business) throw new Error('Empresa não encontrada')
    return {
      business,
      categories: await this.getCategories(businessId),
      services: await this.getServices(businessId),
      professionals: await this.getProfessionals(businessId),
      customers: await this.getCustomers(businessId),
      appointments: await this.getAppointments(businessId),
      gallery: await this.getGallery(businessId),
      testimonials: await this.getTestimonials(businessId),
      banners: await this.getBanners(businessId),
      blockedDates: await this.getBlockedDates(businessId),
      exportedAt: nowIso(),
      version: STORAGE_VERSION,
    }
  }

  async importBusinessBackup(backup: BusinessBackup): Promise<Business> {
    const businesses = readAll<Business>('businesses').filter((b) => b.id !== backup.business.id)
    businesses.push(backup.business)
    writeAll('businesses', businesses)

    const replace = <T extends { businessId: string }>(name: CollectionName, incoming: T[]) => {
      const items = readAll<T>(name).filter((r) => r.businessId !== backup.business.id)
      writeAll(name, [...items, ...incoming])
    }
    replace('categories', backup.categories)
    replace('services', backup.services)
    replace('professionals', backup.professionals)
    replace('customers', backup.customers)
    replace('appointments', backup.appointments)
    replace('gallery', backup.gallery)
    replace('testimonials', backup.testimonials)
    replace('banners', backup.banners)
    replace('blockedDates', backup.blockedDates)
    return backup.business
  }

  // ---- Housekeeping -----------------------------------------------------
  async resetDemoData(): Promise<void> {
    const demo = buildDemoBackup()
    await this.deleteBusiness(demo.business.id)
    await this.importBusinessBackup(demo)
  }
}

export const localStorageProvider = new LocalStorageProvider()

/** Seeds the demo business the very first time the app runs in this browser. */
export function ensureSeedData(): void {
  const seededFlag = `${STORAGE_PREFIX}:seeded`
  if (localStorage.getItem(seededFlag)) return
  const demo = buildDemoBackup()
  const businesses = readAll<Business>('businesses')
  if (!businesses.find((b) => b.slug === demo.business.slug)) {
    writeAll('businesses', [...businesses, demo.business])
    writeAll('categories', [...readAll<Category>('categories'), ...demo.categories])
    writeAll('services', [...readAll<Service>('services'), ...demo.services])
    writeAll('professionals', [...readAll<Professional>('professionals'), ...demo.professionals])
    writeAll('customers', [...readAll<Customer>('customers'), ...demo.customers])
    writeAll('appointments', [...readAll<Appointment>('appointments'), ...demo.appointments])
    writeAll('gallery', [...readAll<GalleryImage>('gallery'), ...demo.gallery])
    writeAll('testimonials', [...readAll<Testimonial>('testimonials'), ...demo.testimonials])
    writeAll('banners', [...readAll<Banner>('banners'), ...demo.banners])
    writeAll('blockedDates', [...readAll<BlockedDate>('blockedDates'), ...demo.blockedDates])
  }
  localStorage.setItem(seededFlag, '1')
}
