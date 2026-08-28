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

// ---------------------------------------------------------------------------
// Real backend tier: every method below is a thin fetch() call against the
// serverless API in /api (see api/data/[...path].ts). Same-origin requests
// already carry the httpOnly session cookie automatically, no token
// plumbing needed on this side. This is the provider wired up in
// repositories/index.ts for the production build.
// ---------------------------------------------------------------------------

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/data/${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  })
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.error ?? `Erro ao comunicar com o servidor (${res.status}).`)
  }
  return body as T
}

const get = <T>(path: string) => request<T>(path, { method: 'GET' })
const post = <T>(path: string, data: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data) })
const patch = <T>(path: string, data: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(data) })
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' })

class ApiProvider implements DataRepository {
  // ---- Businesses -------------------------------------------------------
  async getBusinesses(): Promise<Business[]> {
    return get('businesses')
  }
  async getBusiness(id: string): Promise<Business | undefined> {
    return get(`businesses/${id}`)
  }
  async getBusinessBySlug(slug: string): Promise<Business | undefined> {
    const result = await get<Business | null>(`businesses/slug/${encodeURIComponent(slug)}`)
    return result ?? undefined
  }
  async createBusiness(data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>, admin: { email: string; password: string }): Promise<Business> {
    return post('businesses', { business: data, adminEmail: admin.email, adminPassword: admin.password })
  }
  async updateBusiness(id: string, data: Partial<Business>): Promise<Business> {
    return patch(`businesses/${id}`, data)
  }
  async deleteBusiness(id: string): Promise<void> {
    await del(`businesses/${id}`)
  }

  // ---- Categories -----------------------------------------------------------
  async getCategories(businessId: string): Promise<Category[]> {
    return get(`categories?businessId=${encodeURIComponent(businessId)}`)
  }
  async createCategory(data: Omit<Category, 'id'>): Promise<Category> {
    return post('categories', data)
  }
  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return patch(`categories/${id}`, data)
  }
  async deleteCategory(id: string): Promise<void> {
    await del(`categories/${id}`)
  }

  // ---- Services -------------------------------------------------------
  async getServices(businessId: string): Promise<Service[]> {
    return get(`services?businessId=${encodeURIComponent(businessId)}`)
  }
  async getService(id: string): Promise<Service | undefined> {
    return get(`services/${id}`)
  }
  async createService(data: Omit<Service, 'id'>): Promise<Service> {
    return post('services', data)
  }
  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    return patch(`services/${id}`, data)
  }
  async deleteService(id: string): Promise<void> {
    await del(`services/${id}`)
  }

  // ---- Professionals ----------------------------------------------------
  async getProfessionals(businessId: string): Promise<Professional[]> {
    return get(`professionals?businessId=${encodeURIComponent(businessId)}`)
  }
  async getProfessional(id: string): Promise<Professional | undefined> {
    return get(`professionals/${id}`)
  }
  async createProfessional(data: Omit<Professional, 'id'>): Promise<Professional> {
    return post('professionals', data)
  }
  async updateProfessional(id: string, data: Partial<Professional>): Promise<Professional> {
    return patch(`professionals/${id}`, data)
  }
  async deleteProfessional(id: string): Promise<void> {
    await del(`professionals/${id}`)
  }

  // ---- Customers ----------------------------------------------------------
  async getCustomers(businessId: string): Promise<Customer[]> {
    return get(`customers?businessId=${encodeURIComponent(businessId)}`)
  }
  async getCustomer(id: string): Promise<Customer | undefined> {
    return get(`customers/${id}`)
  }
  async createCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    return post('customers', data)
  }
  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    return patch(`customers/${id}`, data)
  }
  async deleteCustomer(id: string): Promise<void> {
    await del(`customers/${id}`)
  }
  async findOrCreateCustomer(
    businessId: string,
    data: { name: string; whatsapp: string; phone?: string; email?: string },
  ): Promise<Customer> {
    return post('customers/find-or-create', { businessId, ...data })
  }

  // ---- Appointments -------------------------------------------------------
  async getAppointments(businessId: string): Promise<Appointment[]> {
    return get(`appointments?businessId=${encodeURIComponent(businessId)}`)
  }
  async getAppointment(id: string): Promise<Appointment | undefined> {
    return undefined // not exposed individually — nothing in the app needs it (see BookingPage/AgendaPage, which filter from the list)
  }
  async createAppointment(data: Omit<Appointment, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    return post('appointments', data)
  }
  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
    return patch(`appointments/${id}`, data)
  }
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    return post(`appointments/${id}/cancel`, { reason })
  }

  // ---- Blocked dates --------------------------------------------------
  async getBlockedDates(businessId: string): Promise<BlockedDate[]> {
    return get(`blocked-dates?businessId=${encodeURIComponent(businessId)}`)
  }
  async createBlockedDate(data: Omit<BlockedDate, 'id'>): Promise<BlockedDate> {
    return post('blocked-dates', data)
  }
  async deleteBlockedDate(id: string): Promise<void> {
    await del(`blocked-dates/${id}`)
  }

  // ---- Gallery ------------------------------------------------------------
  async getGallery(businessId: string): Promise<GalleryImage[]> {
    return get(`gallery?businessId=${encodeURIComponent(businessId)}`)
  }
  async createGalleryImage(data: Omit<GalleryImage, 'id'>): Promise<GalleryImage> {
    return post('gallery', data)
  }
  async updateGalleryImage(id: string, data: Partial<GalleryImage>): Promise<GalleryImage> {
    return patch(`gallery/${id}`, data)
  }
  async deleteGalleryImage(id: string): Promise<void> {
    await del(`gallery/${id}`)
  }
  async reorderGallery(businessId: string, orderedIds: string[]): Promise<void> {
    await patch('gallery/reorder', { businessId, orderedIds })
  }

  // ---- Testimonials -------------------------------------------------------
  async getTestimonials(businessId: string): Promise<Testimonial[]> {
    return get(`testimonials?businessId=${encodeURIComponent(businessId)}`)
  }
  async createTestimonial(data: Omit<Testimonial, 'id'>): Promise<Testimonial> {
    return post('testimonials', data)
  }
  async updateTestimonial(id: string, data: Partial<Testimonial>): Promise<Testimonial> {
    return patch(`testimonials/${id}`, data)
  }
  async deleteTestimonial(id: string): Promise<void> {
    await del(`testimonials/${id}`)
  }

  // ---- Banners ------------------------------------------------------------
  async getBanners(businessId: string): Promise<Banner[]> {
    return get(`banners?businessId=${encodeURIComponent(businessId)}`)
  }
  async createBanner(data: Omit<Banner, 'id'>): Promise<Banner> {
    return post('banners', data)
  }
  async updateBanner(id: string, data: Partial<Banner>): Promise<Banner> {
    return patch(`banners/${id}`, data)
  }
  async deleteBanner(id: string): Promise<void> {
    await del(`banners/${id}`)
  }

  // ---- Backup / restore -----------------------------------------------
  async exportBusinessBackup(businessId: string): Promise<BusinessBackup> {
    return get(`businesses/${businessId}/backup`)
  }
  async importBusinessBackup(backup: BusinessBackup): Promise<Business> {
    return post('businesses/import-backup', backup)
  }

  // ---- Housekeeping -------------------------------------------------------
  async resetDemoData(): Promise<void> {
    throw new Error('Não disponível: restaure a empresa de demonstração a partir de um backup, ou pelo script db/seed.sql.')
  }
}

export const apiProvider = new ApiProvider()
