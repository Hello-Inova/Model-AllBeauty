import type {
  Appointment,
  Banner,
  BillingPlanDef,
  BlockedDate,
  Business,
  BusinessBackup,
  Category,
  Customer,
  FinanceReport,
  GalleryImage,
  PlatformSettings,
  Professional,
  Service,
  Testimonial,
} from '../types'

/**
 * The ONE interface every screen in the app talks to. Nothing outside this
 * repositories/ folder should ever touch localStorage/IndexedDB directly.
 *
 * Today `LocalStorageProvider` implements this against the browser's
 * localStorage (see providers/LocalStorageProvider.ts). Tomorrow a
 * `SupabaseProvider` / `ApiProvider` can implement the exact same interface
 * against a real database, and the rest of the app does not change.
 */
export interface DataRepository {
  // ---- Businesses -------------------------------------------------------
  getBusinesses(): Promise<Business[]>
  getBusiness(id: string): Promise<Business | undefined>
  getBusinessBySlug(slug: string): Promise<Business | undefined>
  /**
   * Creates a business AND its first admin login in one step — a real
   * backend needs credentials to exist somewhere, so business creation and
   * admin-account creation are no longer separable the way they were in the
   * localStorage-only tier.
   */
  createBusiness(
    data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>,
    admin: { email: string; password: string },
  ): Promise<Business>
  updateBusiness(id: string, data: Partial<Business>): Promise<Business>
  deleteBusiness(id: string): Promise<void>

  // ---- Categories ---------------------------------------------------------
  getCategories(businessId: string): Promise<Category[]>
  createCategory(data: Omit<Category, 'id'>): Promise<Category>
  updateCategory(id: string, data: Partial<Category>): Promise<Category>
  deleteCategory(id: string): Promise<void>

  // ---- Services -------------------------------------------------------
  getServices(businessId: string): Promise<Service[]>
  getService(id: string): Promise<Service | undefined>
  createService(data: Omit<Service, 'id'>): Promise<Service>
  updateService(id: string, data: Partial<Service>): Promise<Service>
  deleteService(id: string): Promise<void>

  // ---- Professionals ----------------------------------------------------
  getProfessionals(businessId: string): Promise<Professional[]>
  getProfessional(id: string): Promise<Professional | undefined>
  createProfessional(data: Omit<Professional, 'id'>): Promise<Professional>
  updateProfessional(id: string, data: Partial<Professional>): Promise<Professional>
  deleteProfessional(id: string): Promise<void>

  // ---- Customers ----------------------------------------------------------
  getCustomers(businessId: string): Promise<Customer[]>
  getCustomer(id: string): Promise<Customer | undefined>
  createCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>
  updateCustomer(id: string, data: Partial<Customer>): Promise<Customer>
  deleteCustomer(id: string): Promise<void>
  findOrCreateCustomer(
    businessId: string,
    data: { name: string; whatsapp: string; phone?: string; email?: string },
  ): Promise<Customer>

  // ---- Appointments -------------------------------------------------------
  getAppointments(businessId: string): Promise<Appointment[]>
  getAppointment(id: string): Promise<Appointment | undefined>
  createAppointment(
    data: Omit<Appointment, 'id' | 'code' | 'createdAt' | 'updatedAt'>,
  ): Promise<Appointment>
  updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment>
  cancelAppointment(id: string, reason?: string): Promise<Appointment>

  // ---- Blocked dates --------------------------------------------------
  getBlockedDates(businessId: string): Promise<BlockedDate[]>
  createBlockedDate(data: Omit<BlockedDate, 'id'>): Promise<BlockedDate>
  deleteBlockedDate(id: string): Promise<void>

  // ---- Gallery ------------------------------------------------------------
  getGallery(businessId: string): Promise<GalleryImage[]>
  createGalleryImage(data: Omit<GalleryImage, 'id'>): Promise<GalleryImage>
  updateGalleryImage(id: string, data: Partial<GalleryImage>): Promise<GalleryImage>
  deleteGalleryImage(id: string): Promise<void>
  reorderGallery(businessId: string, orderedIds: string[]): Promise<void>

  // ---- Testimonials -------------------------------------------------------
  getTestimonials(businessId: string): Promise<Testimonial[]>
  createTestimonial(data: Omit<Testimonial, 'id'>): Promise<Testimonial>
  updateTestimonial(id: string, data: Partial<Testimonial>): Promise<Testimonial>
  deleteTestimonial(id: string): Promise<void>

  // ---- Banners ------------------------------------------------------------
  getBanners(businessId: string): Promise<Banner[]>
  createBanner(data: Omit<Banner, 'id'>): Promise<Banner>
  updateBanner(id: string, data: Partial<Banner>): Promise<Banner>
  deleteBanner(id: string): Promise<void>

  // ---- Backup / restore -----------------------------------------------
  exportBusinessBackup(businessId: string): Promise<BusinessBackup>
  importBusinessBackup(backup: BusinessBackup): Promise<Business>

  // ---- Assinatura: catálogo de planos e configurações da plataforma -------
  // (as ações de cobrança em si — assinar/status — não passam por esta
  // interface; ver src/api/billing.ts, um cliente dedicado como o de auth.)
  getPlans(): Promise<BillingPlanDef[]>
  updatePlan(id: string, data: Partial<Pick<BillingPlanDef, 'name' | 'priceCents' | 'discountCents' | 'active'>>): Promise<BillingPlanDef>
  getPlatformSettings(): Promise<PlatformSettings>
  updatePlatformSettings(data: Partial<PlatformSettings>): Promise<PlatformSettings>

  // ---- Gestão Financeira (Super Admin) -------------------------------------
  // Relatório somente-leitura: MRR estimado, receita confirmada, em aberto e
  // atrasada, contagem de empresas por status de assinatura, série mensal dos
  // últimos 12 meses e lista de transações (filtrável por status/empresa).
  getFinanceReport(filters?: { status?: string; businessId?: string }): Promise<FinanceReport>

  // ---- Housekeeping -------------------------------------------------------
  resetDemoData(): Promise<void>
}
