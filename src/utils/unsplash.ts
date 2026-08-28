/**
 * Small helper around Unsplash's CDN so demo content doesn't hardcode query
 * strings everywhere. Only used for the seeded "Beauty Demo" business —
 * every image is still stored as a regular ImageAsset (type: 'url'), so an
 * admin can replace any of them from the panel like any other business.
 */
export function uImg(base: string, w = 1200, h?: number): string {
  const params = new URLSearchParams({ auto: 'format', fit: 'crop', q: '80', w: String(w) })
  if (h) params.set('h', String(h))
  return `${base}?${params.toString()}`
}
