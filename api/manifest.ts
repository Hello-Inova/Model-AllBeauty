import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_lib/db.js'

// ---------------------------------------------------------------------------
// Dynamic Web App Manifest for the business admin panel (/admin/<slug>).
//
// The static file at public/manifest.webmanifest covers the public site with
// generic "Plataforma de Agendamento" branding. The admin panel instead wants
// each business owner to see THEIR OWN name and logo when they add the panel
// to their phone's home screen — a single static manifest can't do that, so
// InstallAppPrompt.tsx swaps <link rel="manifest"> to point here (passing
// ?slug=) as soon as the business is known. See src/utils/pwa.ts.
//
// No auth required: this only exposes what the public storefront already
// shows for that slug (name + logo + brand color), and browsers fetch a
// manifest without sending credentials/cookies by default anyway.
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
  let displayName = 'Painel administrativo'
  let logoUrl: string | undefined
  let themeColor = '#b3873e'
  let backgroundColor = '#ffffff'

  if (slug) {
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
  const icons = logoUrl
    ? [
        { src: logoUrl, sizes: '192x192', type: 'image/png' },
        { src: logoUrl, sizes: '512x512', type: 'image/png' },
      ]
    : [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ]

  // scope and start_url are kept as the exact same string (no trailing
  // slash): the Web App Manifest spec matches scope as a plain string
  // prefix of start_url, so a mismatched trailing slash (e.g. scope
  // "/admin/x/" vs start_url "/admin/x") can make start_url fall outside
  // its own scope in a strict validator.
  const scope = slug ? `/admin/${slug}` : '/'
  const manifest = {
    name: `${displayName} — Painel`,
    short_name: displayName.length > 12 ? `${displayName.slice(0, 11)}…` : displayName,
    description: `Painel administrativo de ${displayName}.`,
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
