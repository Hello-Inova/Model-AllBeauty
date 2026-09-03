import { useEffect, useState } from 'react'
import { Download, Share2, X } from 'lucide-react'
import type { Business } from '../../types'
import {
  applyBusinessManifest,
  applySuperAdminManifest,
  isIOSDevice,
  isInstallPromptSnoozed,
  isMobileBrowser,
  isRunningStandalone,
  restoreDefaultManifest,
  snoozeInstallPrompt,
  type BeforeInstallPromptEvent,
} from '../../utils/pwa'

// Fixed snooze/branding key for the Super Admin panel, which isn't scoped to
// any one business — see the `business` prop below.
const SUPER_ADMIN_ID = 'super-admin'

/**
 * Suggests adding an admin panel to the phone's home screen. Used two ways:
 *  - `<InstallAppPrompt business={business} />` in the business admin panel,
 *    branded with that business's own name/logo (see src/utils/pwa.ts for
 *    the manifest swap).
 *  - `<InstallAppPrompt />` (no `business`) in the Super Admin panel, which
 *    isn't tied to any one business and gets the generic platform branding.
 * Two different install mechanisms, because mobile browsers don't agree on
 * how "install" works:
 *  - Chrome/Edge/Android fire a `beforeinstallprompt` event this component
 *    captures, then re-triggers from its own "Instalar" button.
 *  - iOS Safari has no such event (Apple never shipped one) — there's no way
 *    to trigger the install programmatically, so this shows the manual
 *    steps instead ("Compartilhar" → "Adicionar à Tela de Início").
 * Renders nothing on desktop, once already installed, or if dismissed in
 * the last 14 days (per business/panel, so it doesn't nag on every login).
 */
export function InstallAppPrompt({ business }: { business?: Business }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const snoozeId = business?.id ?? SUPER_ADMIN_ID
  const panelLabel = business ? `da ${business.displayName}` : 'Super Admin'

  // Runs on every business change (e.g. switching between businesses in the
  // same browser session) so the manifest/icon shown always match who's logged in.
  useEffect(() => {
    if (business) applyBusinessManifest(business)
    else applySuperAdminManifest()
    // Put the generic platform branding back once no admin panel is on
    // screen anymore (logout, or navigating away entirely) — these are
    // global <head> tags, not scoped to this route.
    return () => restoreDefaultManifest()
  }, [business?.id, business?.slug, business?.displayName, business?.primaryColor, business?.logo?.url])

  useEffect(() => {
    setDismissed(false)
    setDeferredPrompt(null)
    setShowIOSInstructions(false)
    if (isRunningStandalone() || !isMobileBrowser() || isInstallPromptSnoozed(snoozeId)) return

    if (isIOSDevice()) {
      setShowIOSInstructions(true)
      return
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [snoozeId])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    snoozeInstallPrompt(snoozeId)
    setDismissed(true)
  }

  if (dismissed || (!deferredPrompt && !showIOSInstructions)) return null

  // Note on markup: the icon and the message sit in their own flex row, but
  // the message itself is a plain (non-flex) <span> so its text — including
  // the <strong> bits — wraps as ordinary prose. Making that span a flex
  // container too (an earlier version of this component did) turns every
  // text node between the <strong> tags into its own flex item instead of
  // one paragraph, which on a narrow phone screen wraps each fragment into
  // its own cramped column of one word per line.
  return (
    <div
      className="flex flex-col gap-2 px-4 sm:px-6 py-2.5 text-[var(--color-foreground)] text-sm border-b border-[var(--color-border)]"
      style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
    >
      {deferredPrompt ? (
        <>
          <div className="flex items-start gap-2">
            <Download size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
            <span className="min-w-0">Instale o painel {panelLabel} no seu celular para acessar mais rápido.</span>
            <button onClick={handleDismiss} aria-label="Dispensar" className="ml-auto shrink-0 p-1.5 rounded-md hover:bg-black/5">
              <X size={15} />
            </button>
          </div>
          <button
            onClick={handleInstall}
            className="self-start inline-flex items-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition"
          >
            Instalar
          </button>
        </>
      ) : (
        <div className="flex items-start gap-2">
          <Share2 size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
          <span className="min-w-0">
            Para instalar este painel no seu iPhone: toque em <strong>Compartilhar</strong> e depois em <strong>"Adicionar à Tela de Início"</strong>.
          </span>
          <button onClick={handleDismiss} aria-label="Dispensar" className="ml-auto shrink-0 p-1.5 rounded-md hover:bg-black/5">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
