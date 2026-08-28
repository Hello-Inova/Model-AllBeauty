// Generates db/seed.sql from the exact same demo dataset the old
// localStorage-only build shipped with (src/data/demoData.ts), so the real
// Postgres database launches with the same fully-populated "Beauty Demo"
// business instead of an empty shell — plus real, randomly generated admin
// credentials (never "demo123" again).
//
// Run with: npx tsx scripts/generate-seed.mts
import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import bcrypt from 'bcryptjs'
import { buildDemoBackup } from '../src/data/demoData'
import { makeId } from '../src/utils/id'

function sqlVal(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`
}

function genPassword(): string {
  return randomBytes(9).toString('base64url') // ~12 chars, url-safe, no ambiguous punctuation
}

async function main() {
  const backup = buildDemoBackup()
  const lines: string[] = []
  lines.push('-- Gerado automaticamente por scripts/generate-seed.mts — não edite à mão.')
  lines.push('-- Rode DEPOIS de db/schema.sql, no mesmo editor de Query do Postgres na Vercel.')
  lines.push('BEGIN;')

  const b = backup.business
  lines.push(`INSERT INTO businesses (
    id, slug, name, display_name, description, segment, logo, favicon, cover_image, hero_image,
    phone, whatsapp, email, instagram, facebook, tiktok, youtube, website,
    address, city, state, country, zip_code, currency, timezone,
    primary_color, secondary_color, accent_color, background_color, foreground_color, theme,
    active, demo, plan, working_hours, booking_policies, created_at, updated_at
  ) VALUES (
    ${sqlVal(b.id)}, ${sqlVal(b.slug)}, ${sqlVal(b.name)}, ${sqlVal(b.displayName)}, ${sqlVal(b.description)}, ${sqlVal(b.segment)},
    ${sqlVal(b.logo ?? null)}, ${sqlVal(b.favicon ?? null)}, ${sqlVal(b.coverImage ?? null)}, ${sqlVal(b.heroImage ?? null)},
    ${sqlVal(b.phone)}, ${sqlVal(b.whatsapp)}, ${sqlVal(b.email)}, ${sqlVal(b.instagram ?? null)}, ${sqlVal(b.facebook ?? null)}, ${sqlVal(b.tiktok ?? null)}, ${sqlVal(b.youtube ?? null)}, ${sqlVal(b.website ?? null)},
    ${sqlVal(b.address)}, ${sqlVal(b.city)}, ${sqlVal(b.state)}, ${sqlVal(b.country)}, ${sqlVal(b.zipCode)}, ${sqlVal(b.currency)}, ${sqlVal(b.timezone)},
    ${sqlVal(b.primaryColor)}, ${sqlVal(b.secondaryColor)}, ${sqlVal(b.accentColor)}, ${sqlVal(b.backgroundColor)}, ${sqlVal(b.foregroundColor)}, ${sqlVal(b.theme)},
    ${sqlVal(b.active)}, ${sqlVal(b.demo)}, ${sqlVal(b.plan)}, ${sqlVal(b.workingHours)}, ${sqlVal(b.bookingPolicies)}, ${sqlVal(b.createdAt)}, ${sqlVal(b.updatedAt)}
  ) ON CONFLICT (id) DO NOTHING;`)

  for (const c of backup.categories) {
    lines.push(`INSERT INTO categories (id, business_id, name, slug, description, icon, "order", active) VALUES (${sqlVal(c.id)}, ${sqlVal(c.businessId)}, ${sqlVal(c.name)}, ${sqlVal(c.slug)}, ${sqlVal(c.description ?? null)}, ${sqlVal(c.icon ?? null)}, ${sqlVal(c.order)}, ${sqlVal(c.active)}) ON CONFLICT (id) DO NOTHING;`)
  }
  for (const s of backup.services) {
    lines.push(`INSERT INTO services (id, business_id, category_id, name, slug, short_description, description, duration, price, promotional_price, image, active, featured, "order", professional_ids) VALUES (${sqlVal(s.id)}, ${sqlVal(s.businessId)}, ${sqlVal(s.categoryId)}, ${sqlVal(s.name)}, ${sqlVal(s.slug)}, ${sqlVal(s.shortDescription)}, ${sqlVal(s.description)}, ${sqlVal(s.duration)}, ${sqlVal(s.price)}, ${sqlVal(s.promotionalPrice ?? null)}, ${sqlVal(s.image ?? null)}, ${sqlVal(s.active)}, ${sqlVal(s.featured)}, ${sqlVal(s.order)}, ${sqlVal(s.professionalIds ?? [])}) ON CONFLICT (id) DO NOTHING;`)
  }
  for (const p of backup.professionals) {
    lines.push(`INSERT INTO professionals (id, business_id, name, photo, description, specialties, phone, email, service_ids, working_hours, use_business_hours, active, "order") VALUES (${sqlVal(p.id)}, ${sqlVal(p.businessId)}, ${sqlVal(p.name)}, ${sqlVal(p.photo ?? null)}, ${sqlVal(p.description)}, ${sqlVal(p.specialties ?? [])}, ${sqlVal(p.phone ?? null)}, ${sqlVal(p.email ?? null)}, ${sqlVal(p.serviceIds ?? [])}, ${sqlVal(p.workingHours ?? [])}, ${sqlVal(p.useBusinessHours)}, ${sqlVal(p.active)}, ${sqlVal(p.order)}) ON CONFLICT (id) DO NOTHING;`)
  }
  for (const c of backup.customers) {
    lines.push(`INSERT INTO customers (id, business_id, name, phone, whatsapp, email, notes, created_at) VALUES (${sqlVal(c.id)}, ${sqlVal(c.businessId)}, ${sqlVal(c.name)}, ${sqlVal(c.phone)}, ${sqlVal(c.whatsapp)}, ${sqlVal(c.email ?? null)}, ${sqlVal(c.notes ?? null)}, ${sqlVal(c.createdAt)}) ON CONFLICT (id) DO NOTHING;`)
  }
  for (const a of backup.appointments) {
    lines.push(`INSERT INTO appointments (id, business_id, code, service_id, professional_id, customer_id, date, start_time, end_time, duration, price, status, notes, created_at, updated_at) VALUES (${sqlVal(a.id)}, ${sqlVal(a.businessId)}, ${sqlVal(a.code)}, ${sqlVal(a.serviceId)}, ${sqlVal(a.professionalId ?? null)}, ${sqlVal(a.customerId)}, ${sqlVal(a.date)}, ${sqlVal(a.startTime)}, ${sqlVal(a.endTime)}, ${sqlVal(a.duration)}, ${sqlVal(a.price)}, ${sqlVal(a.status)}, ${sqlVal(a.notes ?? null)}, ${sqlVal(a.createdAt)}, ${sqlVal(a.updatedAt)}) ON CONFLICT (id) DO NOTHING;`)
  }
  for (const g of backup.gallery) {
    lines.push(`INSERT INTO gallery_images (id, business_id, image, title, description, "order", active) VALUES (${sqlVal(g.id)}, ${sqlVal(g.businessId)}, ${sqlVal(g.image)}, ${sqlVal(g.title ?? null)}, ${sqlVal(g.description ?? null)}, ${sqlVal(g.order)}, ${sqlVal(g.active)}) ON CONFLICT (id) DO NOTHING;`)
  }
  for (const t of backup.testimonials) {
    lines.push(`INSERT INTO testimonials (id, business_id, name, photo, text, rating, active, demo, "order") VALUES (${sqlVal(t.id)}, ${sqlVal(t.businessId)}, ${sqlVal(t.name)}, ${sqlVal(t.photo ?? null)}, ${sqlVal(t.text)}, ${sqlVal(t.rating)}, ${sqlVal(t.active)}, ${sqlVal(t.demo)}, ${sqlVal(t.order)}) ON CONFLICT (id) DO NOTHING;`)
  }
  for (const ban of backup.banners) {
    lines.push(`INSERT INTO banners (id, business_id, image, title, subtitle, link, active, "order") VALUES (${sqlVal(ban.id)}, ${sqlVal(ban.businessId)}, ${sqlVal(ban.image)}, ${sqlVal(ban.title ?? null)}, ${sqlVal(ban.subtitle ?? null)}, ${sqlVal(ban.link ?? null)}, ${sqlVal(ban.active)}, ${sqlVal(ban.order)}) ON CONFLICT (id) DO NOTHING;`)
  }
  for (const d of backup.blockedDates) {
    lines.push(`INSERT INTO blocked_dates (id, business_id, professional_id, date, all_day, start_time, end_time, reason) VALUES (${sqlVal(d.id)}, ${sqlVal(d.businessId)}, ${sqlVal(d.professionalId ?? null)}, ${sqlVal(d.date)}, ${sqlVal(d.allDay)}, ${sqlVal(d.startTime ?? null)}, ${sqlVal(d.endTime ?? null)}, ${sqlVal(d.reason ?? null)}) ON CONFLICT (id) DO NOTHING;`)
  }

  // ---- Real login credentials ----------------------------------------
  const demoAdminPassword = genPassword()
  const superAdminPassword = genPassword()
  const demoAdminHash = await bcrypt.hash(demoAdminPassword, 10)
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10)

  lines.push(`INSERT INTO admin_users (id, business_id, name, email, password_hash, role, active) VALUES (${sqlVal(makeId('adm'))}, ${sqlVal(b.id)}, ${sqlVal(b.displayName)}, ${sqlVal(b.email)}, ${sqlVal(demoAdminHash)}, 'owner', TRUE) ON CONFLICT (business_id, email) DO NOTHING;`)
  lines.push(`INSERT INTO admin_users (id, business_id, name, email, password_hash, role, active) VALUES (${sqlVal(makeId('adm'))}, NULL, 'Super Admin', ${sqlVal('super@plataforma.com')}, ${sqlVal(superAdminHash)}, 'super_admin', TRUE) ON CONFLICT (business_id, email) DO NOTHING;`)

  lines.push('COMMIT;')

  writeFileSync(new URL('../db/seed.sql', import.meta.url), lines.join('\n\n') + '\n')

  console.log('db/seed.sql gerado com sucesso.\n')
  console.log('=== GUARDE ESTAS CREDENCIAIS (só aparecem agora) ===')
  console.log(`Empresa "Beauty Demo" (login em /admin/beauty-demo/login):`)
  console.log(`  e-mail:  ${b.email}`)
  console.log(`  senha:   ${demoAdminPassword}`)
  console.log(`Super admin (login em /super-admin/login):`)
  console.log(`  e-mail:  super@plataforma.com`)
  console.log(`  senha:   ${superAdminPassword}`)
  console.log('=====================================================')
}

main()
