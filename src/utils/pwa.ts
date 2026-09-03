// ---------------------------------------------------------------------------
// Small helpers behind the "Adicionar à tela de início" prompt shown in the
// business admin panel and the Super Admin panel
// (src/components/admin/InstallAppPrompt.tsx). Kept framework-free so they
// have no React dependency of their own.
// ---------------------------------------------------------------------------

import type { Business } from '../types'

/** True once the app is already running as an installed PWA (any platform). */
export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // iOS Safari never adopted the standard `display-mode` media query — it
  // exposes `navigator.standalone` instead (not in TS's lib.dom types).
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  return window.matchMedia?.('(display-mode: standalone)').matches === true || iosStandalone === true
}

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return true
  // iPadOS 13+ identifies as "Macintosh" in the UA string but, unlike a real
  // Mac, exposes multiple touch points — the standard way to tell them apart.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
}

/** Touch-first mobile browser (the only context this prompt should ever show in). */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return isIOSDevice() || /Mobi|Android/i.test(navigator.userAgent)
}

/**
 * Points <link rel="manifest"> and the Apple "add to home screen" meta tags
 * at THIS business's own branding, so installing the admin panel from a
 * phone picks up the salon's name/logo/color instead of the generic
 * platform ones baked into index.html. Call restoreDefaultManifest() (e.g.
 * on unmount) to put the generic platform branding back, since this is a
 * single set of <head> tags shared by the whole SPA, not scoped per route.
 */
export function applyBusinessManifest(business: Business): void {
  if (typeof document === 'undefined') return

  let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (!manifestLink) {
    manifestLink = document.createElement('link')
    manifestLink.rel = 'manifest'
    document.head.appendChild(manifestLink)
  }
  manifestLink.href = `/api/manifest?slug=${encodeURIComponent(business.slug)}`

  setMetaContent('theme-color', business.primaryColor || '#b3873e')
  setMetaContent('apple-mobile-web-app-title', business.displayName)
  setMetaContent('apple-mobile-web-app-capable', 'yes')

  const logoUrl = business.logo?.url
  if (logoUrl) {
    let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
    if (!appleIcon) {
      appleIcon = document.createElement('link')
      appleIcon.rel = 'apple-touch-icon'
      document.head.appendChild(appleIcon)
    }
    appleIcon.href = logoUrl
  }
}

/**
 * Same idea as applyBusinessManifest(), for the Super Admin panel: it isn't
 * tied to any one business, so it just points the manifest at the
 * Super-Admin-scoped manifest (/super-admin start_url/scope) with the
 * generic platform name/icon rather than swapping in a logo.
 */
export function applySuperAdminManifest(): void {
  if (typeof document === 'undefined') return

  let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (!manifestLink) {
    manifestLink = document.createElement('link')
    manifestLink.rel = 'manifest'
    document.head.appendChild(manifestLink)
  }
  manifestLink.href = '/api/manifest?panel=super-admin'

  setMetaContent('theme-color', '#b3873e')
  setMetaContent('apple-mobile-web-app-title', 'Super Admin')
  setMetaContent('apple-mobile-web-app-capable', 'yes')
}

/** Undoes applyBusinessManifest()/applySuperAdminManifest(), restoring the generic platform tags baked into index.html. */
export function restoreDefaultManifest(): void {
  if (typeof document === 'undefined') return
  const base = import.meta.env.BASE_URL

  const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (manifestLink) manifestLink.href = `${base}manifest.webmanifest`

  const appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
  if (appleIcon) appleIcon.href = `${base}icons/apple-touch-icon.png`

  setMetaContent('theme-color', '#b3873e')
  // apple-mobile-web-app-title/-capable don't exist by default in index.html
  // — remove them entirely rather than guessing a generic value.
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.remove()
  document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.remove()
}

function setMetaContent(name: string, content: string): void {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.name = name
    document.head.appendChild(tag)
  }
  tag.content = content
}

/**
 * The browser's own install-prompt event (Chrome/Edge/Android). Not part of
 * TypeScript's lib.dom.d.ts, so it's declared here.
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY_PREFIX = 'installPromptDismissedAt:'
const DISMISS_SNOOZE_DAYS = 14

/** Was the install prompt dismissed for this business recently enough that it should stay hidden? */
export function isInstallPromptSnoozed(businessId: string): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY_PREFIX + businessId)
    if (!raw) return false
    const dismissedAt = new Date(raw).getTime()
    if (Number.isNaN(dismissedAt)) return false
    return Date.now() - dismissedAt < DISMISS_SNOOZE_DAYS * 86_400_000
  } catch {
    // localStorage unavailable (private mode, disabled storage) — treat as
    // "never dismissed" rather than throwing; the prompt just may reappear
    // more often for that visitor, which is harmless.
    return false
  }
}

export function snoozeInstallPrompt(businessId: string): void {
  try {
    localStorage.setItem(DISMISS_KEY_PREFIX + businessId, new Date().toISOString())
  } catch {
    /* best effort — see isInstallPromptSnoozed */
  }
}
