import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ApiError, notFound } from '../_lib/db.js'
import { getSession, requireSession, requireSuperAdmin, requireBusinessAccess, hashPassword } from '../_lib/auth.js'
import {
  rowToBusiness, businessToRow,
  rowToCategory, rowToService, rowToProfessional, rowToCustomer,
  rowToAppointment, rowToBlockedDate, rowToGalleryImage, rowToTestimonial, rowToBanner, rowToBusinessVideo,
  rowToPlan, rowToPlatformSettings, rowToBillingTransaction,
} from '../_lib/mappers.js'
import { makeId, makeAppointmentCode } from '../../src/utils/id.js'
import { MAX_VIDEOS_PER_BUSINESS } from '../../src/config/index.js'

// ---------------------------------------------------------------------------
// One catch-all function backs the entire data API (every entity the admin
// panel and the public storefront read or write), so the deployment only
// ever needs a handful of Vercel Functions regardless of plan limits.
//
// Routing note: only the FIRST path segment below /api/data/ (the resource
// name, e.g. "businesses") is used for dispatch — this deployment's Vercel
// Node.js runtime does not reliably route requests with a second or third
// path segment through this catch-all function (confirmed empirically:
// /api/data/businesses reaches this file, /api/data/businesses/xyz does
// not, even though both should match a [...path].ts catch-all). To sidestep
// that, every record id, slug, or sub-action is passed as a query string
// parameter (?id=, ?slug=, ?action=) instead of an extra path segment —
// query strings are parsed independently of that routing layer and work
// reliably. See src/repositories/providers/ApiProvider.ts for the matching
// client-side URL construction.
// ---------------------------------------------------------------------------

function readBody(req: VercelRequest): any {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

function resourceOf(req: VercelRequest): string | undefined {
  // req.query.path (the [...path] catch-all param) is not reliably populated
  // by the Vercel Node.js runtime in every deployment configuration, so parse
  // it directly from the request URL instead.
  const fromQuery = ([] as string[]).concat((req.query.path as string | string[]) ?? [])
  if (fromQuery.length > 0) return fromQuery[0]
  const pathname = (req.url ?? '').split('?')[0]
  const parts = pathname.split('/').filter(Boolean)
  const idx = parts.indexOf('data')
  if (idx === -1 || idx + 1 >= parts.length) return undefined
  return decodeURIComponent(parts[idx + 1])
}

function strParam(req: VercelRequest, key: string): string | undefined {
  const v = req.query[key]
  if (v === undefined) return undefined
  return String(Array.isArray(v) ? v[0] : v)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const resource = resourceOf(req)

    if (resource === 'businesses') return await businesses(req, res)
    if (resource === 'categories') return await categories(req, res)
    if (resource === 'services') return await services(req, res)
    if (resource === 'professionals') return await professionals(req, res)
    if (resource === 'customers') return await customers(req, res)
    if (resource === 'appointments') return await appointments(req, res)
    if (resource === 'blocked-dates') return await blockedDates(req, res)
    if (resource === 'gallery') return await gallery(req, res)
    if (resource === 'testimonials') return await testimonials(req, res)
    if (resource === 'banners') return await banners(req, res)
    if (resource === 'videos') return await videos(req, res)
    if (resource === 'plans') return await plans(req, res)
    if (resource === 'platform-settings') return await platformSettings(req, res)
    if (resource === 'finance') return await finance(req, res)

    res.status(404).json({ error: 'Recurso não encontrado.' })
  } catch (e) {
    if (e instanceof ApiError) return res.status(e.status).json({ error: e.message })
    console.error(e)
    res.status(500).json({ error: 'Erro interno.' })
  }
}

// ---- Businesses -------------------------------------------------------------
async function businesses(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const id = strParam(req, 'id')
  const slug = strParam(req, 'slug')
  const action = strParam(req, 'action')

  if (slug !== undefined) {
    const { rows } = await sql`SELECT * FROM businesses WHERE lower(slug) = lower(${slug}) LIMIT 1`
    if (rows.length === 0) return res.status(200).json(null)
    return res.status(200).json(rowToBusiness(rows[0]))
  }

  if (action === 'import-backup' && method === 'POST') {
    const backup = readBody(req)
    if (!backup?.business?.id) throw new ApiError(400, 'Arquivo de backup inválido.')
    const session = await requireSession(req)
    requireBusinessAccess(session, backup.business.id)

    const row = businessToRow(backup.business)
    await sql`
      INSERT INTO businesses (
        id, slug, name, display_name, description, segment, logo, favicon, cover_image, hero_image,
        phone, whatsapp, email, instagram, facebook, tiktok, youtube, website,
        address, city, state, country, zip_code, currency, timezone,
        primary_color, secondary_color, accent_color, background_color, foreground_color, theme,
        active, demo, plan, working_hours, booking_policies
      ) VALUES (
        ${backup.business.id}, ${row.slug}, ${row.name}, ${row.display_name}, ${row.description}, ${row.segment},
        ${JSON.stringify(row.logo)}, ${JSON.stringify(row.favicon)}, ${JSON.stringify(row.cover_image)}, ${JSON.stringify(row.hero_image)},
        ${row.phone}, ${row.whatsapp}, ${row.email}, ${row.instagram}, ${row.facebook}, ${row.tiktok}, ${row.youtube}, ${row.website},
        ${row.address}, ${row.city}, ${row.state}, ${row.country}, ${row.zip_code}, ${row.currency}, ${row.timezone},
        ${row.primary_color}, ${row.secondary_color}, ${row.accent_color}, ${row.background_color}, ${row.foreground_color}, ${row.theme},
        ${row.active}, ${row.demo}, ${row.plan}, ${row.working_hours}, ${row.booking_policies}
      )
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug, name = EXCLUDED.name, display_name = EXCLUDED.display_name, description = EXCLUDED.description, segment = EXCLUDED.segment,
        logo = EXCLUDED.logo, favicon = EXCLUDED.favicon, cover_image = EXCLUDED.cover_image, hero_image = EXCLUDED.hero_image,
        phone = EXCLUDED.phone, whatsapp = EXCLUDED.whatsapp, email = EXCLUDED.email, instagram = EXCLUDED.instagram, facebook = EXCLUDED.facebook, tiktok = EXCLUDED.tiktok, youtube = EXCLUDED.youtube, website = EXCLUDED.website,
        address = EXCLUDED.address, city = EXCLUDED.city, state = EXCLUDED.state, country = EXCLUDED.country, zip_code = EXCLUDED.zip_code, currency = EXCLUDED.currency, timezone = EXCLUDED.timezone,
        primary_color = EXCLUDED.primary_color, secondary_color = EXCLUDED.secondary_color, accent_color = EXCLUDED.accent_color, background_color = EXCLUDED.background_color, foreground_color = EXCLUDED.foreground_color, theme = EXCLUDED.theme,
        active = EXCLUDED.active, demo = EXCLUDED.demo, plan = EXCLUDED.plan, working_hours = EXCLUDED.working_hours, booking_policies = EXCLUDED.booking_policies, updated_at = now()
    `

    const replace = async (table: string, rows: any[], insertOne: (r: any) => Promise<void>) => {
      await sql.query(`DELETE FROM ${table} WHERE business_id = $1`, [backup.business.id])
      for (const r of rows) await insertOne(r)
    }

    await replace('categories', backup.categories ?? [], (c) => sql`
      INSERT INTO categories (id, business_id, name, slug, description, icon, "order", active)
      VALUES (${c.id}, ${backup.business.id}, ${c.name}, ${c.slug}, ${c.description ?? null}, ${c.icon ?? null}, ${c.order ?? 0}, ${c.active ?? true})
    ` as unknown as Promise<void>)

    await replace('services', backup.services ?? [], (s) => sql`
      INSERT INTO services (id, business_id, category_id, name, slug, short_description, description, duration, price, promotional_price, image, active, featured, "order", professional_ids)
      VALUES (${s.id}, ${backup.business.id}, ${s.categoryId}, ${s.name}, ${s.slug}, ${s.shortDescription ?? ''}, ${s.description ?? ''}, ${s.duration ?? 30}, ${s.price ?? 0}, ${s.promotionalPrice ?? null}, ${JSON.stringify(s.image ?? null)}, ${s.active ?? true}, ${s.featured ?? false}, ${s.order ?? 0}, ${JSON.stringify(s.professionalIds ?? [])})
    ` as unknown as Promise<void>)

    await replace('professionals', backup.professionals ?? [], (p) => sql`
      INSERT INTO professionals (id, business_id, name, photo, description, specialties, phone, email, service_ids, working_hours, use_business_hours, active, "order")
      VALUES (${p.id}, ${backup.business.id}, ${p.name}, ${JSON.stringify(p.photo ?? null)}, ${p.description ?? ''}, ${JSON.stringify(p.specialties ?? [])}, ${p.phone ?? null}, ${p.email ?? null}, ${JSON.stringify(p.serviceIds ?? [])}, ${JSON.stringify(p.workingHours ?? [])}, ${p.useBusinessHours ?? true}, ${p.active ?? true}, ${p.order ?? 0})
    ` as unknown as Promise<void>)

    await replace('customers', backup.customers ?? [], (c) => sql`
      INSERT INTO customers (id, business_id, name, phone, whatsapp, email, notes)
      VALUES (${c.id}, ${backup.business.id}, ${c.name}, ${c.phone ?? ''}, ${c.whatsapp ?? ''}, ${c.email ?? null}, ${c.notes ?? null})
    ` as unknown as Promise<void>)

    await replace('appointments', backup.appointments ?? [], (a) => sql`
      INSERT INTO appointments (id, business_id, code, service_id, professional_id, customer_id, date, start_time, end_time, duration, price, status, notes)
      VALUES (${a.id}, ${backup.business.id}, ${a.code}, ${a.serviceId}, ${a.professionalId ?? null}, ${a.customerId}, ${a.date}, ${a.startTime}, ${a.endTime}, ${a.duration ?? 0}, ${a.price ?? 0}, ${a.status ?? 'pending'}, ${a.notes ?? null})
    ` as unknown as Promise<void>)

    await replace('gallery_images', backup.gallery ?? [], (g) => sql`
      INSERT INTO gallery_images (id, business_id, image, title, description, "order", active)
      VALUES (${g.id}, ${backup.business.id}, ${JSON.stringify(g.image)}, ${g.title ?? null}, ${g.description ?? null}, ${g.order ?? 0}, ${g.active ?? true})
    ` as unknown as Promise<void>)

    await replace('testimonials', backup.testimonials ?? [], (t) => sql`
      INSERT INTO testimonials (id, business_id, name, photo, text, rating, active, demo, "order")
      VALUES (${t.id}, ${backup.business.id}, ${t.name}, ${JSON.stringify(t.photo ?? null)}, ${t.text}, ${t.rating ?? 5}, ${t.active ?? true}, ${t.demo ?? false}, ${t.order ?? 0})
    ` as unknown as Promise<void>)

    await replace('banners', backup.banners ?? [], (b) => sql`
      INSERT INTO banners (id, business_id, image, title, subtitle, link, active, "order")
      VALUES (${b.id}, ${backup.business.id}, ${JSON.stringify(b.image)}, ${b.title ?? null}, ${b.subtitle ?? null}, ${b.link ?? null}, ${b.active ?? true}, ${b.order ?? 0})
    ` as unknown as Promise<void>)

    await replace('business_videos', backup.videos ?? [], (v) => sql`
      INSERT INTO business_videos (id, business_id, video, title, "order", active)
      VALUES (${v.id}, ${backup.business.id}, ${JSON.stringify(v.video)}, ${v.title ?? null}, ${v.order ?? 0}, ${v.active ?? true})
    ` as unknown as Promise<void>)

    await replace('blocked_dates', backup.blockedDates ?? [], (d) => sql`
      INSERT INTO blocked_dates (id, business_id, professional_id, date, all_day, start_time, end_time, reason)
      VALUES (${d.id}, ${backup.business.id}, ${d.professionalId ?? null}, ${d.date}, ${d.allDay ?? true}, ${d.startTime ?? null}, ${d.endTime ?? null}, ${d.reason ?? null})
    ` as unknown as Promise<void>)

    const updated = await sql`SELECT * FROM businesses WHERE id = ${backup.business.id}`
    return res.status(200).json(rowToBusiness(updated.rows[0]))
  }

  if (id === undefined) {
    if (method === 'GET') {
      const session = await requireSession(req)
      requireSuperAdmin(session)
      const { rows } = await sql`SELECT * FROM businesses ORDER BY created_at DESC`
      return res.status(200).json(rows.map(rowToBusiness))
    }
    if (method === 'POST') {
      const session = await requireSession(req)
      requireSuperAdmin(session)
      const body = readBody(req)
      const { adminEmail, adminPassword } = body
      if (!adminEmail || !adminPassword || String(adminPassword).length < 6) {
        throw new ApiError(400, 'Informe um e-mail e uma senha (mínimo 6 caracteres) para o login da nova empresa.')
      }
      const newId = makeId('biz')
      const row = businessToRow(body.business ?? body)
      await sql`
        INSERT INTO businesses (
          id, slug, name, display_name, description, segment, logo, favicon, cover_image, hero_image,
          phone, whatsapp, email, instagram, facebook, tiktok, youtube, website,
          address, city, state, country, zip_code, currency, timezone,
          primary_color, secondary_color, accent_color, background_color, foreground_color, theme,
          active, demo, plan, working_hours, booking_policies
        ) VALUES (
          ${newId}, ${row.slug}, ${row.name}, ${row.display_name}, ${row.description}, ${row.segment},
          ${JSON.stringify(row.logo)}, ${JSON.stringify(row.favicon)}, ${JSON.stringify(row.cover_image)}, ${JSON.stringify(row.hero_image)},
          ${row.phone}, ${row.whatsapp}, ${row.email}, ${row.instagram}, ${row.facebook}, ${row.tiktok}, ${row.youtube}, ${row.website},
          ${row.address}, ${row.city}, ${row.state}, ${row.country}, ${row.zip_code}, ${row.currency}, ${row.timezone},
          ${row.primary_color}, ${row.secondary_color}, ${row.accent_color}, ${row.background_color}, ${row.foreground_color}, ${row.theme},
          ${row.active}, ${row.demo}, ${row.plan}, ${row.working_hours}, ${row.booking_policies}
        )
      `
      const passwordHash = await hashPassword(adminPassword)
      await sql`
        INSERT INTO admin_users (id, business_id, name, email, password_hash, role, active)
        VALUES (${makeId('adm')}, ${newId}, ${row.name}, ${adminEmail}, ${passwordHash}, 'owner', true)
      `
      const created = await sql`SELECT * FROM businesses WHERE id = ${newId}`
      return res.status(201).json(rowToBusiness(created.rows[0]))
    }
    return res.status(404).json({ error: 'Rota de empresas não encontrada.' })
  }

  if (action === 'backup' && method === 'GET') {
    const session = await requireSession(req)
    requireBusinessAccess(session, id)
    const biz = await sql`SELECT * FROM businesses WHERE id = ${id}`
    if (biz.rows.length === 0) notFound('Empresa')
    const [cat, srv, pro, cus, apt, gal, tst, ban, vid, blk] = await Promise.all([
      sql`SELECT * FROM categories WHERE business_id = ${id} ORDER BY "order"`,
      sql`SELECT * FROM services WHERE business_id = ${id} ORDER BY "order"`,
      sql`SELECT * FROM professionals WHERE business_id = ${id} ORDER BY "order"`,
      sql`SELECT * FROM customers WHERE business_id = ${id}`,
      sql`SELECT * FROM appointments WHERE business_id = ${id}`,
      sql`SELECT * FROM gallery_images WHERE business_id = ${id} ORDER BY "order"`,
      sql`SELECT * FROM testimonials WHERE business_id = ${id} ORDER BY "order"`,
      sql`SELECT * FROM banners WHERE business_id = ${id} ORDER BY "order"`,
      sql`SELECT * FROM business_videos WHERE business_id = ${id} ORDER BY "order"`,
      sql`SELECT * FROM blocked_dates WHERE business_id = ${id}`,
    ])
    return res.status(200).json({
      business: rowToBusiness(biz.rows[0]),
      categories: cat.rows.map(rowToCategory),
      services: srv.rows.map(rowToService),
      professionals: pro.rows.map(rowToProfessional),
      customers: cus.rows.map(rowToCustomer),
      appointments: apt.rows.map(rowToAppointment),
      gallery: gal.rows.map(rowToGalleryImage),
      testimonials: tst.rows.map(rowToTestimonial),
      banners: ban.rows.map(rowToBanner),
      videos: vid.rows.map(rowToBusinessVideo),
      blockedDates: blk.rows.map(rowToBlockedDate),
      exportedAt: new Date().toISOString(),
      version: 1,
    })
  }

  const session = await requireSession(req)
  requireBusinessAccess(session, id)
  if (method === 'GET') {
    const { rows } = await sql`SELECT * FROM businesses WHERE id = ${id}`
    if (rows.length === 0) notFound('Empresa')
    return res.status(200).json(rowToBusiness(rows[0]))
  }
  if (method === 'PATCH') {
    const existing = await sql`SELECT * FROM businesses WHERE id = ${id}`
    if (existing.rows.length === 0) notFound('Empresa')
    const existingBusiness = rowToBusiness(existing.rows[0])
    const merged = { ...existingBusiness, ...readBody(req) }
    // billing_type/billing_plan só podem ser alterados pelo super admin (ver
    // requisito de "isento" x "padrão" e o plano de cada empresa). Qualquer
    // outro campo de assinatura (subscription_status, plan_expires_at,
    // asaas_*, card_*) nem entra no objeto retornado por businessToRow — só
    // api/billing/[...action].ts e api/webhooks/asaas.ts escrevem neles.
    if (session.role !== 'super_admin') {
      merged.billingType = existingBusiness.billingType
      merged.billingPlan = existingBusiness.billingPlan
    }
    const row = businessToRow(merged)
    await sql`
      UPDATE businesses SET
        slug = ${row.slug}, name = ${row.name}, display_name = ${row.display_name}, description = ${row.description}, segment = ${row.segment},
        logo = ${JSON.stringify(row.logo)}, favicon = ${JSON.stringify(row.favicon)}, cover_image = ${JSON.stringify(row.cover_image)}, hero_image = ${JSON.stringify(row.hero_image)},
        phone = ${row.phone}, whatsapp = ${row.whatsapp}, email = ${row.email}, instagram = ${row.instagram}, facebook = ${row.facebook}, tiktok = ${row.tiktok}, youtube = ${row.youtube}, website = ${row.website},
        address = ${row.address}, city = ${row.city}, state = ${row.state}, country = ${row.country}, zip_code = ${row.zip_code}, currency = ${row.currency}, timezone = ${row.timezone},
        primary_color = ${row.primary_color}, secondary_color = ${row.secondary_color}, accent_color = ${row.accent_color}, background_color = ${row.background_color}, foreground_color = ${row.foreground_color}, theme = ${row.theme},
        active = ${row.active}, demo = ${row.demo}, plan = ${row.plan}, working_hours = ${row.working_hours}, booking_policies = ${row.booking_policies},
        billing_type = ${row.billing_type}, billing_plan = ${row.billing_plan},
        updated_at = now()
      WHERE id = ${id}
    `
    const updated = await sql`SELECT * FROM businesses WHERE id = ${id}`
    return res.status(200).json(rowToBusiness(updated.rows[0]))
  }
  if (method === 'DELETE') {
    requireSuperAdmin(session)
    await sql`DELETE FROM businesses WHERE id = ${id}`
    return res.status(204).end()
  }

  res.status(404).json({ error: 'Rota de empresas não encontrada.' })
}

// ---- Generic helpers for the simple, business-scoped collections ----------

async function businessIdOf(table: string, id: string): Promise<string> {
  const { rows } = await sql.query(`SELECT business_id FROM ${table} WHERE id = $1`, [id])
  if (rows.length === 0) notFound('Registro')
  return rows[0].business_id
}

// ---- Categories --------------------------------------------------------
async function categories(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const id = strParam(req, 'id')

  if (id === undefined) {
    const businessId = strParam(req, 'businessId') ?? ''
    if (method === 'GET') {
      if (!businessId) throw new ApiError(400, 'businessId é obrigatório.')
      const { rows } = await sql`SELECT * FROM categories WHERE business_id = ${businessId} ORDER BY "order"`
      return res.status(200).json(rows.map(rowToCategory))
    }
    if (method === 'POST') {
      const body = readBody(req)
      const session = await requireSession(req)
      requireBusinessAccess(session, body.businessId)
      const newId = makeId('cat')
      await sql`
        INSERT INTO categories (id, business_id, name, slug, description, icon, "order", active)
        VALUES (${newId}, ${body.businessId}, ${body.name}, ${body.slug}, ${body.description ?? null}, ${body.icon ?? null}, ${body.order ?? 0}, ${body.active ?? true})
      `
      const created = await sql`SELECT * FROM categories WHERE id = ${newId}`
      return res.status(201).json(rowToCategory(created.rows[0]))
    }
  } else {
    const bizId = await businessIdOf('categories', id)
    const session = await requireSession(req)
    requireBusinessAccess(session, bizId)
    if (method === 'PATCH') {
      const existing = await sql`SELECT * FROM categories WHERE id = ${id}`
      const merged = { ...rowToCategory(existing.rows[0]), ...readBody(req) }
      await sql`
        UPDATE categories SET name = ${merged.name}, slug = ${merged.slug}, description = ${merged.description ?? null}, icon = ${merged.icon ?? null}, "order" = ${merged.order}, active = ${merged.active}
        WHERE id = ${id}
      `
      const updated = await sql`SELECT * FROM categories WHERE id = ${id}`
      return res.status(200).json(rowToCategory(updated.rows[0]))
    }
    if (method === 'DELETE') {
      await sql`DELETE FROM categories WHERE id = ${id}`
      return res.status(204).end()
    }
  }
  res.status(404).json({ error: 'Rota de categorias não encontrada.' })
}

// ---- Services -------------------------------------------------------------
async function services(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const id = strParam(req, 'id')

  if (id === undefined) {
    const businessId = strParam(req, 'businessId') ?? ''
    if (method === 'GET') {
      if (!businessId) throw new ApiError(400, 'businessId é obrigatório.')
      const { rows } = await sql`SELECT * FROM services WHERE business_id = ${businessId} ORDER BY "order"`
      return res.status(200).json(rows.map(rowToService))
    }
    if (method === 'POST') {
      const body = readBody(req)
      const session = await requireSession(req)
      requireBusinessAccess(session, body.businessId)
      const newId = makeId('srv')
      await sql`
        INSERT INTO services (id, business_id, category_id, name, slug, short_description, description, duration, price, promotional_price, image, active, featured, "order", professional_ids)
        VALUES (${newId}, ${body.businessId}, ${body.categoryId}, ${body.name}, ${body.slug}, ${body.shortDescription ?? ''}, ${body.description ?? ''}, ${body.duration ?? 30}, ${body.price ?? 0}, ${body.promotionalPrice ?? null}, ${JSON.stringify(body.image ?? null)}, ${body.active ?? true}, ${body.featured ?? false}, ${body.order ?? 0}, ${JSON.stringify(body.professionalIds ?? [])})
      `
      const created = await sql`SELECT * FROM services WHERE id = ${newId}`
      return res.status(201).json(rowToService(created.rows[0]))
    }
  } else {
    if (method === 'GET') {
      const { rows } = await sql`SELECT * FROM services WHERE id = ${id}`
      if (rows.length === 0) notFound('Serviço')
      return res.status(200).json(rowToService(rows[0]))
    }
    const bizId = await businessIdOf('services', id)
    const session = await requireSession(req)
    requireBusinessAccess(session, bizId)
    if (method === 'PATCH') {
      const existing = await sql`SELECT * FROM services WHERE id = ${id}`
      const merged = { ...rowToService(existing.rows[0]), ...readBody(req) }
      await sql`
        UPDATE services SET category_id = ${merged.categoryId}, name = ${merged.name}, slug = ${merged.slug}, short_description = ${merged.shortDescription}, description = ${merged.description},
          duration = ${merged.duration}, price = ${merged.price}, promotional_price = ${merged.promotionalPrice ?? null}, image = ${JSON.stringify(merged.image ?? null)},
          active = ${merged.active}, featured = ${merged.featured}, "order" = ${merged.order}, professional_ids = ${JSON.stringify(merged.professionalIds ?? [])}
        WHERE id = ${id}
      `
      const updated = await sql`SELECT * FROM services WHERE id = ${id}`
      return res.status(200).json(rowToService(updated.rows[0]))
    }
    if (method === 'DELETE') {
      await sql`DELETE FROM services WHERE id = ${id}`
      return res.status(204).end()
    }
  }
  res.status(404).json({ error: 'Rota de serviços não encontrada.' })
}

// ---- Professionals ----------------------------------------------------
async function professionals(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const id = strParam(req, 'id')

  if (id === undefined) {
    const businessId = strParam(req, 'businessId') ?? ''
    if (method === 'GET') {
      if (!businessId) throw new ApiError(400, 'businessId é obrigatório.')
      const { rows } = await sql`SELECT * FROM professionals WHERE business_id = ${businessId} ORDER BY "order"`
      return res.status(200).json(rows.map(rowToProfessional))
    }
    if (method === 'POST') {
      const body = readBody(req)
      const session = await requireSession(req)
      requireBusinessAccess(session, body.businessId)
      const newId = makeId('pro')
      await sql`
        INSERT INTO professionals (id, business_id, name, photo, description, specialties, phone, email, service_ids, working_hours, use_business_hours, active, "order")
        VALUES (${newId}, ${body.businessId}, ${body.name}, ${JSON.stringify(body.photo ?? null)}, ${body.description ?? ''}, ${JSON.stringify(body.specialties ?? [])}, ${body.phone ?? null}, ${body.email ?? null}, ${JSON.stringify(body.serviceIds ?? [])}, ${JSON.stringify(body.workingHours ?? [])}, ${body.useBusinessHours ?? true}, ${body.active ?? true}, ${body.order ?? 0})
      `
      const created = await sql`SELECT * FROM professionals WHERE id = ${newId}`
      return res.status(201).json(rowToProfessional(created.rows[0]))
    }
  } else {
    if (method === 'GET') {
      const { rows } = await sql`SELECT * FROM professionals WHERE id = ${id}`
      if (rows.length === 0) notFound('Profissional')
      return res.status(200).json(rowToProfessional(rows[0]))
    }
    const bizId = await businessIdOf('professionals', id)
    const session = await requireSession(req)
    requireBusinessAccess(session, bizId)
    if (method === 'PATCH') {
      const existing = await sql`SELECT * FROM professionals WHERE id = ${id}`
      const merged = { ...rowToProfessional(existing.rows[0]), ...readBody(req) }
      await sql`
        UPDATE professionals SET name = ${merged.name}, photo = ${JSON.stringify(merged.photo ?? null)}, description = ${merged.description}, specialties = ${JSON.stringify(merged.specialties ?? [])},
          phone = ${merged.phone ?? null}, email = ${merged.email ?? null}, service_ids = ${JSON.stringify(merged.serviceIds ?? [])}, working_hours = ${JSON.stringify(merged.workingHours ?? [])},
          use_business_hours = ${merged.useBusinessHours}, active = ${merged.active}, "order" = ${merged.order}
        WHERE id = ${id}
      `
      const updated = await sql`SELECT * FROM professionals WHERE id = ${id}`
      return res.status(200).json(rowToProfessional(updated.rows[0]))
    }
    if (method === 'DELETE') {
      await sql`DELETE FROM professionals WHERE id = ${id}`
      return res.status(204).end()
    }
  }
  res.status(404).json({ error: 'Rota de profissionais não encontrada.' })
}

// ---- Customers (PII — always admin-gated, except find-or-create during booking) ----
async function customers(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const id = strParam(req, 'id')
  const action = strParam(req, 'action')

  if (action === 'find-or-create' && method === 'POST') {
    const body = readBody(req)
    if (!body.businessId || !body.name || !body.whatsapp) throw new ApiError(400, 'Dados de cliente incompletos.')
    const normalized = String(body.whatsapp).replace(/\D/g, '')
    const { rows } = await sql`SELECT * FROM customers WHERE business_id = ${body.businessId}`
    const existing = rows.find((r) => String(r.whatsapp).replace(/\D/g, '') === normalized)
    if (existing) {
      await sql`UPDATE customers SET name = ${body.name}, email = ${body.email ?? existing.email ?? null} WHERE id = ${existing.id}`
      const updated = await sql`SELECT * FROM customers WHERE id = ${existing.id}`
      return res.status(200).json(rowToCustomer(updated.rows[0]))
    }
    const newId = makeId('cus')
    await sql`
      INSERT INTO customers (id, business_id, name, phone, whatsapp, email)
      VALUES (${newId}, ${body.businessId}, ${body.name}, ${body.phone || body.whatsapp}, ${body.whatsapp}, ${body.email ?? null})
    `
    const created = await sql`SELECT * FROM customers WHERE id = ${newId}`
    return res.status(201).json(rowToCustomer(created.rows[0]))
  }

  if (id === undefined) {
    const businessId = strParam(req, 'businessId') ?? ''
    const session = await requireSession(req)
    if (method === 'GET') {
      requireBusinessAccess(session, businessId)
      const { rows } = await sql`SELECT * FROM customers WHERE business_id = ${businessId}`
      return res.status(200).json(rows.map(rowToCustomer))
    }
    if (method === 'POST') {
      const body = readBody(req)
      requireBusinessAccess(session, body.businessId)
      const newId = makeId('cus')
      await sql`
        INSERT INTO customers (id, business_id, name, phone, whatsapp, email, notes)
        VALUES (${newId}, ${body.businessId}, ${body.name}, ${body.phone ?? ''}, ${body.whatsapp ?? ''}, ${body.email ?? null}, ${body.notes ?? null})
      `
      const created = await sql`SELECT * FROM customers WHERE id = ${newId}`
      return res.status(201).json(rowToCustomer(created.rows[0]))
    }
  } else {
    const bizId = await businessIdOf('customers', id)
    const session = await requireSession(req)
    requireBusinessAccess(session, bizId)
    if (method === 'PATCH') {
      const existing = await sql`SELECT * FROM customers WHERE id = ${id}`
      const merged = { ...rowToCustomer(existing.rows[0]), ...readBody(req) }
      await sql`UPDATE customers SET name = ${merged.name}, phone = ${merged.phone}, whatsapp = ${merged.whatsapp}, email = ${merged.email ?? null}, notes = ${merged.notes ?? null} WHERE id = ${id}`
      const updated = await sql`SELECT * FROM customers WHERE id = ${id}`
      return res.status(200).json(rowToCustomer(updated.rows[0]))
    }
    if (method === 'DELETE') {
      await sql`DELETE FROM customers WHERE id = ${id}`
      return res.status(204).end()
    }
  }

  res.status(404).json({ error: 'Rota de clientes não encontrada.' })
}

// ---- Appointments (public read is redacted; public create allowed for booking) ----
function redactAppointment(a: ReturnType<typeof rowToAppointment>) {
  return { ...a, customerId: '', code: '', notes: undefined }
}

async function appointments(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const id = strParam(req, 'id')
  const action = strParam(req, 'action')

  if (id === undefined) {
    const businessId = strParam(req, 'businessId') ?? ''
    if (method === 'GET') {
      if (!businessId) throw new ApiError(400, 'businessId é obrigatório.')
      const session = await getSession(req)
      const canSeeFull = !!session && (session.role === 'super_admin' || session.businessId === businessId)
      const { rows } = await sql`SELECT * FROM appointments WHERE business_id = ${businessId}`
      const mapped = rows.map(rowToAppointment)
      return res.status(200).json(canSeeFull ? mapped : mapped.map(redactAppointment))
    }
    if (method === 'POST') {
      const body = readBody(req)
      if (!body.businessId || !body.serviceId || !body.customerId || !body.date || !body.startTime) {
        throw new ApiError(400, 'Dados de agendamento incompletos.')
      }
      const newId = makeId('apt')
      const seq = await sql`SELECT nextval('appointment_seq') AS n`
      const code = makeAppointmentCode(Number(seq.rows[0].n))
      await sql`
        INSERT INTO appointments (id, business_id, code, service_id, professional_id, customer_id, date, start_time, end_time, duration, price, status, notes)
        VALUES (${newId}, ${body.businessId}, ${code}, ${body.serviceId}, ${body.professionalId ?? null}, ${body.customerId}, ${body.date}, ${body.startTime}, ${body.endTime ?? ''}, ${body.duration ?? 0}, ${body.price ?? 0}, ${body.status ?? 'pending'}, ${body.notes ?? null})
      `
      const created = await sql`SELECT * FROM appointments WHERE id = ${newId}`
      return res.status(201).json(rowToAppointment(created.rows[0]))
    }
  } else {
    const bizId = await businessIdOf('appointments', id)
    const session = await requireSession(req)
    requireBusinessAccess(session, bizId)

    if (action === 'cancel' && method === 'POST') {
      const { reason } = readBody(req)
      await sql`UPDATE appointments SET status = 'cancelled', notes = ${reason ?? null}, updated_at = now() WHERE id = ${id}`
      const updated = await sql`SELECT * FROM appointments WHERE id = ${id}`
      return res.status(200).json(rowToAppointment(updated.rows[0]))
    }

    if (!action && method === 'PATCH') {
      const existing = await sql`SELECT * FROM appointments WHERE id = ${id}`
      const merged = { ...rowToAppointment(existing.rows[0]), ...readBody(req) }
      await sql`
        UPDATE appointments SET service_id = ${merged.serviceId}, professional_id = ${merged.professionalId ?? null}, customer_id = ${merged.customerId},
          date = ${merged.date}, start_time = ${merged.startTime}, end_time = ${merged.endTime}, duration = ${merged.duration}, price = ${merged.price},
          status = ${merged.status}, notes = ${merged.notes ?? null}, updated_at = now()
        WHERE id = ${id}
      `
      const updated = await sql`SELECT * FROM appointments WHERE id = ${id}`
      return res.status(200).json(rowToAppointment(updated.rows[0]))
    }
  }

  res.status(404).json({ error: 'Rota de agendamentos não encontrada.' })
}

// ---- Blocked dates (public read, reason stripped; admin write) ------------
async function blockedDates(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const id = strParam(req, 'id')

  if (id === undefined) {
    const businessId = strParam(req, 'businessId') ?? ''
    if (method === 'GET') {
      if (!businessId) throw new ApiError(400, 'businessId é obrigatório.')
      const session = await getSession(req)
      const canSeeFull = !!session && (session.role === 'super_admin' || session.businessId === businessId)
      const { rows } = await sql`SELECT * FROM blocked_dates WHERE business_id = ${businessId}`
      const mapped = rows.map(rowToBlockedDate)
      return res.status(200).json(canSeeFull ? mapped : mapped.map((b) => ({ ...b, reason: undefined })))
    }
    if (method === 'POST') {
      const body = readBody(req)
      const session = await requireSession(req)
      requireBusinessAccess(session, body.businessId)
      const newId = makeId('blk')
      await sql`
        INSERT INTO blocked_dates (id, business_id, professional_id, date, all_day, start_time, end_time, reason)
        VALUES (${newId}, ${body.businessId}, ${body.professionalId ?? null}, ${body.date}, ${body.allDay ?? true}, ${body.startTime ?? null}, ${body.endTime ?? null}, ${body.reason ?? null})
      `
      const created = await sql`SELECT * FROM blocked_dates WHERE id = ${newId}`
      return res.status(201).json(rowToBlockedDate(created.rows[0]))
    }
  } else if (method === 'DELETE') {
    const bizId = await businessIdOf('blocked_dates', id)
    const session = await requireSession(req)
    requireBusinessAccess(session, bizId)
    await sql`DELETE FROM blocked_dates WHERE id = ${id}`
    return res.status(204).end()
  }
  res.status(404).json({ error: 'Rota de bloqueios não encontrada.' })
}

// ---- Gallery ------------------------------------------------------------
async function gallery(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const id = strParam(req, 'id')
  const action = strParam(req, 'action')

  if (action === 'reorder' && method === 'PATCH') {
    const { businessId, orderedIds } = readBody(req)
    const session = await requireSession(req)
    requireBusinessAccess(session, businessId)
    for (let i = 0; i < (orderedIds ?? []).length; i++) {
      await sql`UPDATE gallery_images SET "order" = ${i} WHERE id = ${orderedIds[i]} AND business_id = ${businessId}`
    }
    return res.status(200).json({ ok: true })
  }

  if (id === undefined) {
    const businessId = strParam(req, 'businessId') ?? ''
    if (method === 'GET') {
      if (!businessId) throw new ApiError(400, 'businessId é obrigatório.')
      const { rows } = await sql`SELECT * FROM gallery_images WHERE business_id = ${businessId} ORDER BY "order"`
      return res.status(200).json(rows.map(rowToGalleryImage))
    }
    if (method === 'POST') {
      const body = readBody(req)
      const session = await requireSession(req)
      requireBusinessAccess(session, body.businessId)
      const newId = makeId('gal')
      await sql`
        INSERT INTO gallery_images (id, business_id, image, title, description, "order", active)
        VALUES (${newId}, ${body.businessId}, ${JSON.stringify(body.image)}, ${body.title ?? null}, ${body.description ?? null}, ${body.order ?? 0}, ${body.active ?? true})
      `
      const created = await sql`SELECT * FROM gallery_images WHERE id = ${newId}`
      return res.status(201).json(rowToGalleryImage(created.rows[0]))
    }
  } else {
    const bizId = await businessIdOf('gallery_images', id)
    const session = await requireSession(req)
    requireBusinessAccess(session, bizId)
    if (method === 'PATCH') {
      const existing = await sql`SELECT * FROM gallery_images WHERE id = ${id}`
      const merged = { ...rowToGalleryImage(existing.rows[0]), ...readBody(req) }
      await sql`UPDATE gallery_images SET image = ${JSON.stringify(merged.image)}, title = ${merged.title ?? null}, description = ${merged.description ?? null}, "order" = ${merged.order}, active = ${merged.active} WHERE id = ${id}`
      const updated = await sql`SELECT * FROM gallery_images WHERE id = ${id}`
      return res.status(200).json(rowToGalleryImage(updated.rows[0]))
    }
    if (method === 'DELETE') {
      await sql`DELETE FROM gallery_images WHERE id = ${id}`
      return res.status(204).end()
    }
  }
  res.status(404).json({ error: 'Rota de galeria não encontrada.' })
}

// ---- Testimonials -----------------------------------------------------------
async function testimonials(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const id = strParam(req, 'id')

  if (id === undefined) {
    const businessId = strParam(req, 'businessId') ?? ''
    if (method === 'GET') {
      if (!businessId) throw new ApiError(400, 'businessId é obrigatório.')
      const { rows } = await sql`SELECT * FROM testimonials WHERE business_id = ${businessId} ORDER BY "order"`
      return res.status(200).json(rows.map(rowToTestimonial))
    }
    if (method === 'POST') {
      const body = readBody(req)
      const session = await requireSession(req)
      requireBusinessAccess(session, body.businessId)
      const newId = makeId('tst')
      await sql`
        INSERT INTO testimonials (id, business_id, name, photo, text, rating, active, demo, "order")
        VALUES (${newId}, ${body.businessId}, ${body.name}, ${JSON.stringify(body.photo ?? null)}, ${body.text}, ${body.rating ?? 5}, ${body.active ?? true}, ${body.demo ?? false}, ${body.order ?? 0})
      `
      const created = await sql`SELECT * FROM testimonials WHERE id = ${newId}`
      return res.status(201).json(rowToTestimonial(created.rows[0]))
    }
  } else {
    const bizId = await businessIdOf('testimonials', id)
    const session = await requireSession(req)
    requireBusinessAccess(session, bizId)
    if (method === 'PATCH') {
      const existing = await sql`SELECT * FROM testimonials WHERE id = ${id}`
      const merged = { ...rowToTestimonial(existing.rows[0]), ...readBody(req) }
      await sql`UPDATE testimonials SET name = ${merged.name}, photo = ${JSON.stringify(merged.photo ?? null)}, text = ${merged.text}, rating = ${merged.rating}, active = ${merged.active}, demo = ${merged.demo}, "order" = ${merged.order} WHERE id = ${id}`
      const updated = await sql`SELECT * FROM testimonials WHERE id = ${id}`
      return res.status(200).json(rowToTestimonial(updated.rows[0]))
    }
    if (method === 'DELETE') {
      await sql`DELETE FROM testimonials WHERE id = ${id}`
      return res.status(204).end()
    }
  }
  res.status(404).json({ error: 'Rota de depoimentos não encontrada.' })
}

// ---- Banners -----------------------------------------------------------
async function banners(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const id = strParam(req, 'id')

  if (id === undefined) {
    const businessId = strParam(req, 'businessId') ?? ''
    if (method === 'GET') {
      if (!businessId) throw new ApiError(400, 'businessId é obrigatório.')
      const { rows } = await sql`SELECT * FROM banners WHERE business_id = ${businessId} ORDER BY "order"`
      return res.status(200).json(rows.map(rowToBanner))
    }
    if (method === 'POST') {
      const body = readBody(req)
      const session = await requireSession(req)
      requireBusinessAccess(session, body.businessId)
      const newId = makeId('ban')
      await sql`
        INSERT INTO banners (id, business_id, image, title, subtitle, link, active, "order")
        VALUES (${newId}, ${body.businessId}, ${JSON.stringify(body.image)}, ${body.title ?? null}, ${body.subtitle ?? null}, ${body.link ?? null}, ${body.active ?? true}, ${body.order ?? 0})
      `
      const created = await sql`SELECT * FROM banners WHERE id = ${newId}`
      return res.status(201).json(rowToBanner(created.rows[0]))
    }
  } else {
    const bizId = await businessIdOf('banners', id)
    const session = await requireSession(req)
    requireBusinessAccess(session, bizId)
    if (method === 'PATCH') {
      const existing = await sql`SELECT * FROM banners WHERE id = ${id}`
      const merged = { ...rowToBanner(existing.rows[0]), ...readBody(req) }
      await sql`UPDATE banners SET image = ${JSON.stringify(merged.image)}, title = ${merged.title ?? null}, subtitle = ${merged.subtitle ?? null}, link = ${merged.link ?? null}, active = ${merged.active}, "order" = ${merged.order} WHERE id = ${id}`
      const updated = await sql`SELECT * FROM banners WHERE id = ${id}`
      return res.status(200).json(rowToBanner(updated.rows[0]))
    }
    if (method === 'DELETE') {
      await sql`DELETE FROM banners WHERE id = ${id}`
      return res.status(204).end()
    }
  }
  res.status(404).json({ error: 'Rota de banners não encontrada.' })
}

// ---- Vídeos institucionais (até 3 por empresa, até 40s cada) ---------------
async function videos(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const id = strParam(req, 'id')
  const action = strParam(req, 'action')

  if (action === 'reorder' && method === 'PATCH') {
    const { businessId, orderedIds } = readBody(req)
    const session = await requireSession(req)
    requireBusinessAccess(session, businessId)
    for (let i = 0; i < (orderedIds ?? []).length; i++) {
      await sql`UPDATE business_videos SET "order" = ${i} WHERE id = ${orderedIds[i]} AND business_id = ${businessId}`
    }
    return res.status(200).json({ ok: true })
  }

  if (id === undefined) {
    const businessId = strParam(req, 'businessId') ?? ''
    if (method === 'GET') {
      if (!businessId) throw new ApiError(400, 'businessId é obrigatório.')
      const { rows } = await sql`SELECT * FROM business_videos WHERE business_id = ${businessId} ORDER BY "order"`
      return res.status(200).json(rows.map(rowToBusinessVideo))
    }
    if (method === 'POST') {
      const body = readBody(req)
      const session = await requireSession(req)
      requireBusinessAccess(session, body.businessId)
      // Aplicado no servidor também (não só na UI) — defesa contra
      // chamadas diretas à API além do limite de 3 vídeos por empresa.
      const existing = await sql`SELECT COUNT(*)::int AS n FROM business_videos WHERE business_id = ${body.businessId}`
      if ((existing.rows[0]?.n ?? 0) >= MAX_VIDEOS_PER_BUSINESS) {
        throw new ApiError(400, `Limite de ${MAX_VIDEOS_PER_BUSINESS} vídeos atingido. Remova um vídeo para adicionar outro.`)
      }
      const newId = makeId('vid')
      await sql`
        INSERT INTO business_videos (id, business_id, video, title, "order", active)
        VALUES (${newId}, ${body.businessId}, ${JSON.stringify(body.video)}, ${body.title ?? null}, ${body.order ?? 0}, ${body.active ?? true})
      `
      const created = await sql`SELECT * FROM business_videos WHERE id = ${newId}`
      return res.status(201).json(rowToBusinessVideo(created.rows[0]))
    }
  } else {
    const bizId = await businessIdOf('business_videos', id)
    const session = await requireSession(req)
    requireBusinessAccess(session, bizId)
    if (method === 'PATCH') {
      const existing = await sql`SELECT * FROM business_videos WHERE id = ${id}`
      const merged = { ...rowToBusinessVideo(existing.rows[0]), ...readBody(req) }
      await sql`UPDATE business_videos SET video = ${JSON.stringify(merged.video)}, title = ${merged.title ?? null}, "order" = ${merged.order}, active = ${merged.active} WHERE id = ${id}`
      const updated = await sql`SELECT * FROM business_videos WHERE id = ${id}`
      return res.status(200).json(rowToBusinessVideo(updated.rows[0]))
    }
    if (method === 'DELETE') {
      await sql`DELETE FROM business_videos WHERE id = ${id}`
      return res.status(204).end()
    }
  }
  res.status(404).json({ error: 'Rota de vídeos não encontrada.' })
}

// ---- Planos de assinatura (catálogo global) --------------------------------
// GET é público (a página de Assinatura da empresa e, futuramente, uma
// página de preços, precisam mostrar valores sem exigir sessão). Qualquer
// escrita exige super admin.
async function plans(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const id = strParam(req, 'id')

  if (method === 'GET') {
    const { rows } = await sql`SELECT * FROM plans ORDER BY months ASC`
    return res.status(200).json(rows.map(rowToPlan))
  }
  if (method === 'PATCH' && id) {
    const session = await requireSession(req)
    requireSuperAdmin(session)
    const existing = await sql`SELECT * FROM plans WHERE id = ${id}`
    if (existing.rows.length === 0) notFound('Plano')
    const merged = { ...rowToPlan(existing.rows[0]), ...readBody(req) }
    await sql`
      UPDATE plans SET name = ${merged.name}, price_cents = ${merged.priceCents}, discount_cents = ${merged.discountCents}, active = ${merged.active}, updated_at = now()
      WHERE id = ${id}
    `
    const updated = await sql`SELECT * FROM plans WHERE id = ${id}`
    return res.status(200).json(rowToPlan(updated.rows[0]))
  }
  res.status(404).json({ error: 'Rota de planos não encontrada.' })
}

// ---- Configurações da plataforma (Hello Inova) -----------------------------
// Só o super admin lê ou escreve — usado para montar a mensagem de cobrança
// via WhatsApp no grid de empresas (chave Pix de pagamento alternativo).
async function platformSettings(req: VercelRequest, res: VercelResponse) {
  const method = req.method
  const session = await requireSession(req)
  requireSuperAdmin(session)

  if (method === 'GET') {
    const { rows } = await sql`SELECT * FROM platform_settings WHERE id = 'default' LIMIT 1`
    return res.status(200).json(rowToPlatformSettings(rows[0] ?? {}))
  }
  if (method === 'PATCH') {
    const body = readBody(req)
    await sql`
      UPDATE platform_settings SET
        pix_key = ${body.pixKey ?? ''}, pix_key_owner_name = ${body.pixKeyOwnerName ?? ''}, updated_at = now()
      WHERE id = 'default'
    `
    const { rows } = await sql`SELECT * FROM platform_settings WHERE id = 'default' LIMIT 1`
    return res.status(200).json(rowToPlatformSettings(rows[0] ?? {}))
  }
  res.status(404).json({ error: 'Rota de configurações não encontrada.' })
}

// ---- Gestão financeira (Super Admin) ---------------------------------------
// Somente leitura — nada aqui escreve em billing_transactions/businesses,
// que continuam sendo alterados apenas por api/billing e pelo webhook do
// Asaas. Junta o histórico de cobranças de TODAS as empresas com um resumo
// (MRR estimado, recebido no mês, em aberto/atrasado) para a tela de
// Gestão Financeira do Super Admin.
async function finance(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(404).json({ error: 'Rota financeira não encontrada.' })
  const session = await requireSession(req)
  requireSuperAdmin(session)

  const statusFilter = strParam(req, 'status')
  const businessIdFilter = strParam(req, 'businessId')

  const [mrrRows, countRows, confirmedMonthRows, confirmedAllTimeRows, openRows, monthlyRows] = await Promise.all([
    sql`
      SELECT COALESCE(ROUND(SUM((p.price_cents - p.discount_cents)::numeric / p.months)), 0) AS mrr_cents
      FROM businesses b JOIN plans p ON p.id = b.billing_plan
      WHERE b.billing_type = 'padrao' AND b.subscription_status = 'ativa'
    `,
    sql`SELECT billing_type, subscription_status, COUNT(*)::int AS n FROM businesses GROUP BY billing_type, subscription_status`,
    sql`
      SELECT COALESCE(SUM(value_cents), 0) AS total FROM billing_transactions
      WHERE status IN ('confirmed', 'received')
        AND (paid_at AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')
    `,
    sql`SELECT COALESCE(SUM(value_cents), 0) AS total FROM billing_transactions WHERE status IN ('confirmed', 'received')`,
    sql`SELECT status, COALESCE(SUM(value_cents), 0) AS total FROM billing_transactions WHERE status IN ('pending', 'overdue') GROUP BY status`,
    sql`
      SELECT to_char((paid_at AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM') AS month, SUM(value_cents)::int AS total
      FROM billing_transactions
      WHERE status IN ('confirmed', 'received') AND paid_at >= (now() - interval '12 months')
      GROUP BY month ORDER BY month ASC
    `,
  ])

  let businessesActive = 0
  let businessesOverdue = 0
  let businessesNoSubscription = 0
  let businessesExempt = 0
  for (const r of countRows.rows) {
    if (r.billing_type === 'isento') businessesExempt += r.n
    else if (r.subscription_status === 'ativa') businessesActive += r.n
    else if (r.subscription_status === 'atrasada') businessesOverdue += r.n
    else businessesNoSubscription += r.n
  }
  const pendingCents = Number(openRows.rows.find((r) => r.status === 'pending')?.total ?? 0)
  const overdueCents = Number(openRows.rows.find((r) => r.status === 'overdue')?.total ?? 0)

  const transactionsResult = statusFilter
    ? businessIdFilter
      ? await sql`
          SELECT bt.*, b.display_name, b.slug FROM billing_transactions bt JOIN businesses b ON b.id = bt.business_id
          WHERE bt.status = ${statusFilter} AND bt.business_id = ${businessIdFilter} ORDER BY bt.created_at DESC LIMIT 200
        `
      : await sql`
          SELECT bt.*, b.display_name, b.slug FROM billing_transactions bt JOIN businesses b ON b.id = bt.business_id
          WHERE bt.status = ${statusFilter} ORDER BY bt.created_at DESC LIMIT 200
        `
    : businessIdFilter
      ? await sql`
          SELECT bt.*, b.display_name, b.slug FROM billing_transactions bt JOIN businesses b ON b.id = bt.business_id
          WHERE bt.business_id = ${businessIdFilter} ORDER BY bt.created_at DESC LIMIT 200
        `
      : await sql`
          SELECT bt.*, b.display_name, b.slug FROM billing_transactions bt JOIN businesses b ON b.id = bt.business_id
          ORDER BY bt.created_at DESC LIMIT 200
        `

  res.status(200).json({
    summary: {
      mrrCents: Number(mrrRows.rows[0]?.mrr_cents ?? 0),
      confirmedThisMonthCents: Number(confirmedMonthRows.rows[0]?.total ?? 0),
      confirmedAllTimeCents: Number(confirmedAllTimeRows.rows[0]?.total ?? 0),
      pendingCents,
      overdueCents,
      businessesActive,
      businessesOverdue,
      businessesNoSubscription,
      businessesExempt,
    },
    monthly: monthlyRows.rows.map((r) => ({ month: r.month, totalCents: Number(r.total ?? 0) })),
    transactions: transactionsResult.rows.map((r) => ({ ...rowToBillingTransaction(r), businessName: r.display_name, businessSlug: r.slug })),
  })
}
