import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_lib/db.js'

// ---------------------------------------------------------------------------
// Dynamic Web App Manifest for the business admin panel (/admin/<slug>) and
// for the Super Admin panel (/super-admin).
//
// The static file at public/manifest.webmanifest covers the public site with
// generic "Organyze" branding. The admin panels instead want
// their own scope/start_url (and, for a business, its own name and logo) when
// added to a phone's home screen — a single static manifest can't do that, so
// InstallAppPrompt.tsx swaps <link rel="manifest"> to point here as soon as
// the panel is known: ?slug=<slug> for a business, ?panel=super-admin for the
// Super Admin panel. See src/utils/pwa.ts.
//
// No auth required: for a business this only exposes what the public
// storefront already shows for that slug (name + logo + brand color); the
// Super Admin variant is static generic branding with no data lookup at all.
// Browsers also fetch a manifest without sending credentials/cookies by
// default, so none of this depends on the caller being signed in.
// ---------------------------------------------------------------------------

function strParam(req: VercelRequest, key: string): string | undefined {
  const v = req.query[key]
  if (v === undefined) return undefined
  return String(Array.isArray(v) ? v[0] : v)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido.' })
    return
  }

  const slug = strParam(req, 'slug')
  const isSuperAdmin = strParam(req, 'panel') === 'super-admin'
  let displayName = isSuperAdmin ? 'Super Admin' : 'Painel administrativo'
  let logoUrl: string | undefined
  let themeColor = '#b3873e'
  let backgroundColor = '#ffffff'

  // Super Admin has no per-business branding to look up — it's the Hello
  // Inova team's own panel, so it always gets the generic platform icons.
  if (slug && !isSuperAdmin) {
    try {
      const { rows } = await sql`
        SELECT display_name, logo, primary_color, background_color
        FROM businesses WHERE lower(slug) = lower(${slug}) LIMIT 1
      `
      const row = rows[0]
      if (row) {
        displayName = row.display_name || displayName
        logoUrl = row.logo?.url || undefined
        themeColor = row.primary_color || themeColor
        backgroundColor = row.background_color || backgroundColor
      }
    } catch (e) {
      // A manifest fetch failure must never break the admin panel itself —
      // fall back to generic branding instead of a 500/404 the browser
      // can't recover from.
      console.error(e)
    }
  }

  // Manifest icons must be plain, publicly fetchable image URLs (the browser
  // fetches them itself, outside of this app's session) — business logos are
  // always either a "url" asset or a Vercel Blob "upload" URL (see
  // ApiImageStorage), never a local blob:/data: URL, so this is always safe.
  //
  // Each icon is listed twice, once per `purpose`. Without an explicit
  // "maskable" entry, Android doesn't trust the icon to safely fill its
  // adaptive-icon mask and silently shrinks it, padding the rest with a
  // plain white circle — the washed-out ring reported around business logos
  // after "Adicionar à Tela de Início". Declaring it maskable tells Android
  // to apply its own mask shape directly to the logo instead of padding it.
  // ("any" is kept too, for contexts — the browser tab, iOS — that must show
  // the untouched image.) This assumes the business logo already reads
  // reasonably full-bleed/roughly circular; a logo with a lot of built-in
  // transparent margin may still want a dedicated maskable asset.
  const icons = logoUrl
    ? [
        { src: logoUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: logoUrl, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: logoUrl, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: logoUrl, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ]
    : [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ]

  // scope and start_url are kept as the exact same string (no trailing
  // slash): the Web App Manifest spec matches scope as a plain string
  // prefix of start_url, so a mismatched trailing slash (e.g. scope
  // "/admin/x/" vs start_url "/admin/x") can make start_url fall outside
  // its own scope in a strict validator.
  const scope = isSuperAdmin ? '/super-admin' : slug ? `/admin/${slug}` : '/'
  const manifest = {
    name: isSuperAdmin ? 'Super Admin — Hello Inova' : `${displayName} — Painel`,
    short_name: displayName.length > 12 ? `${displayName.slice(0, 11)}…` : displayName,
    description: isSuperAdmin ? 'Painel de administração da plataforma Hello Inova.' : `Painel administrativo de ${displayName}.`,
    start_url: scope,
    scope,
    display: 'standalone',
    background_color: backgroundColor,
    theme_color: themeColor,
    icons,
  }

  // A few minutes of cache is enough to avoid hammering the database on every
  // "Add to Home Screen" prompt without serving stale branding for long after
  // a business updates its logo or colors.
  res.setHeader('Content-Type', 'application/manifest+json')
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
  res.status(200).json(manifest)
}
