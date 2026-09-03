// Minimal PWA service worker: caches same-origin GET requests so the
// platform keeps working offline for content already visited. It
// intentionally does NOT cache cross-origin requests (e.g. WhatsApp links,
// Unsplash demo images, Google Maps embed) — those legitimately require
// network access.
//
// Two different strategies depending on what's being fetched:
//  - Navigation requests (index.html — every route in this SPA, public site
//    and both admin panels alike, is served from it via vercel.json's
//    catch-all rewrite) are NETWORK-FIRST. index.html references this
//    build's content-hashed JS/CSS filenames (e.g. index-abcd123.js), which
//    change on every deploy; Vite's build output only ever contains the
//    CURRENT build's files, so a stale cached index.html points at files
//    that no longer exist on the server. Serving that stale copy first (the
//    previous "stale-while-revalidate for everything" strategy did) is a
//    blank white screen — the browser fails to load the old hashed bundle,
//    React never mounts, and nothing here catches that because the script
//    itself never ran. It self-heals on a second visit purely by luck (the
//    background revalidation from the first, failed load has usually
//    finished refreshing the cache by then) — which is exactly the "reload
//    fixes it" symptom. Falling back to the cache only on network failure
//    keeps offline support without ever preferring a stale shell.
//  - Everything else (hashed JS/CSS bundles, images, fonts) is safe to serve
//    cache-first / stale-while-revalidate: Vite gives each build's assets a
//    content hash, so a given filename's bytes never change — a cache hit
//    is always correct, and the background refetch keeps the cache warm.
const CACHE_NAME = 'wl-booking-cache-v3'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['./manifest.webmanifest'])))
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

  const isNavigation = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
          return response
        })
        .catch(() =>
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.match(request))
            .then((cached) => cached ?? Response.error()),
        ),
    )
    return
  }

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
