// Row (snake_case, as returned by @vercel/postgres) <-> domain object
// (camelCase, matching src/types/index.ts) converters. JSONB columns come
// back already parsed as JS values, so most fields are a direct rename.
//
// Kept intentionally free of any Vercel/Node-specific imports so it stays
// trivially testable and reusable from any route.

/* eslint-disable @typescript-eslint/no-explicit-any */

export function rowToBusiness(r: any) {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    displayName: r.display_name,
    description: r.description,
    segment: r.segment,
    logo: r.logo ?? undefined,
    favicon: r.favicon ?? undefined,
    coverImage: r.cover_image ?? undefined,
    heroImage: r.hero_image ?? undefined,
    phone: r.phone,
    whatsapp: r.whatsapp,
    email: r.email,
    instagram: r.instagram ?? undefined,
    facebook: r.facebook ?? undefined,
    tiktok: r.tiktok ?? undefined,
    youtube: r.youtube ?? undefined,
    website: r.website ?? undefined,
    address: r.address,
    city: r.city,
    state: r.state,
    country: r.country,
    zipCode: r.zip_code,
    currency: r.currency,
    timezone: r.timezone,
    primaryColor: r.primary_color,
    secondaryColor: r.secondary_color,
    accentColor: r.accent_color,
    backgroundColor: r.background_color,
    foregroundColor: r.foreground_color,
    theme: r.theme,
    active: r.active,
    demo: r.demo,
    plan: r.plan,
    workingHours: r.working_hours ?? [],
    bookingPolicies: r.booking_policies ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function businessToRow(b: any) {
  return {
    slug: b.slug,
    name: b.name,
    display_name: b.displayName,
    description: b.description,
    segment: b.segment,
    logo: b.logo ?? null,
    favicon: b.favicon ?? null,
    cover_image: b.coverImage ?? null,
    hero_image: b.heroImage ?? null,
    phone: b.phone,
    whatsapp: b.whatsapp,
    email: b.email,
    instagram: b.instagram ?? null,
    facebook: b.facebook ?? null,
    tiktok: b.tiktok ?? null,
    youtube: b.youtube ?? null,
    website: b.website ?? null,
    address: b.address,
    city: b.city,
    state: b.state,
    country: b.country,
    zip_code: b.zipCode,
    currency: b.currency,
    timezone: b.timezone,
    primary_color: b.primaryColor,
    secondary_color: b.secondaryColor,
    accent_color: b.accentColor,
    background_color: b.backgroundColor,
    foreground_color: b.foregroundColor,
    theme: b.theme,
    active: b.active,
    demo: b.demo,
    plan: b.plan,
    working_hours: JSON.stringify(b.workingHours ?? []),
    booking_policies: JSON.stringify(b.bookingPolicies ?? {}),
  }
}

export function rowToCategory(r: any) {
  return {
    id: r.id,
    businessId: r.business_id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? undefined,
    icon: r.icon ?? undefined,
    order: r.order,
    active: r.active,
  }
}

export function rowToService(r: any) {
  return {
    id: r.id,
    businessId: r.business_id,
    categoryId: r.category_id,
    name: r.name,
    slug: r.slug,
    shortDescription: r.short_description,
    description: r.description,
    duration: r.duration,
    price: Number(r.price),
    promotionalPrice: r.promotional_price != null ? Number(r.promotional_price) : undefined,
    image: r.image ?? undefined,
    active: r.active,
    featured: r.featured,
    order: r.order,
    professionalIds: r.professional_ids ?? [],
  }
}

export function rowToProfessional(r: any) {
  return {
    id: r.id,
    businessId: r.business_id,
    name: r.name,
    photo: r.photo ?? undefined,
    description: r.description,
    specialties: r.specialties ?? [],
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    serviceIds: r.service_ids ?? [],
    workingHours: r.working_hours ?? [],
    useBusinessHours: r.use_business_hours,
    active: r.active,
    order: r.order,
  }
}

export function rowToCustomer(r: any) {
  return {
    id: r.id,
    businessId: r.business_id,
    name: r.name,
    phone: r.phone,
    whatsapp: r.whatsapp,
    email: r.email ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
  }
}

export function rowToAppointment(r: any) {
  return {
    id: r.id,
    businessId: r.business_id,
    code: r.code,
    serviceId: r.service_id,
    professionalId: r.professional_id,
    customerId: r.customer_id,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    duration: r.duration,
    price: Number(r.price),
    status: r.status,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function rowToBlockedDate(r: any) {
  return {
    id: r.id,
    businessId: r.business_id,
    professionalId: r.professional_id ?? undefined,
    date: r.date,
    allDay: r.all_day,
    startTime: r.start_time ?? undefined,
    endTime: r.end_time ?? undefined,
    reason: r.reason ?? undefined,
  }
}

export function rowToGalleryImage(r: any) {
  return {
    id: r.id,
    businessId: r.business_id,
    image: r.image,
    title: r.title ?? undefined,
    description: r.description ?? undefined,
    order: r.order,
    active: r.active,
  }
}

export function rowToTestimonial(r: any) {
  return {
    id: r.id,
    businessId: r.business_id,
    name: r.name,
    photo: r.photo ?? undefined,
    text: r.text,
    rating: r.rating,
    active: r.active,
    demo: r.demo,
    order: r.order,
  }
}

export function rowToBanner(r: any) {
  return {
    id: r.id,
    businessId: r.business_id,
    image: r.image,
    title: r.title ?? undefined,
    subtitle: r.subtitle ?? undefined,
    link: r.link ?? undefined,
    active: r.active,
    order: r.order,
  }
}
