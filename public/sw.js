// Minimal PWA service worker: caches the app shell and same-origin GET
// requests with a stale-while-revalidate strategy so the platform keeps
// working offline for content already visited. It intentionally does NOT
// cache cross-origin requests (e.g. WhatsApp links, Unsplash demo images,
// Google Maps embed) — those legitimately require network access.
const CACHE_NAME = 'wl-booking-cache-v2'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['./', './manifest.webmanifest'])))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Never cache API calls: they carry per-session, per-business data (login
  // state, catalog, availability) that must always come from the network,
  // never from a stale-while-revalidate cache shared across sessions/users.
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone())
          return response
        })
        .catch(() => cached ?? Response.error())
      // respondWith() must always resolve to a Response — never to undefined
      // (e.g. both cache and network miss), or the browser throws.
      return cached ?? networkFetch
    }),
  )
})
