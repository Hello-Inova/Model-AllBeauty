import { useEffect, useState } from 'react'
import { Download, Share2, X } from 'lucide-react'
import type { Business } from '../../types'
import {
  applyBusinessManifest,
  isIOSDevice,
  isInstallPromptSnoozed,
  isMobileBrowser,
  isRunningStandalone,
  restoreDefaultManifest,
  snoozeInstallPrompt,
  type BeforeInstallPromptEvent,
} from '../../utils/pwa'

/**
 * Suggests adding the admin panel to the phone's home screen, branded with
 * this business's own name/logo (see src/utils/pwa.ts for the manifest
 * swap). Two different mechanisms, because mobile browsers don't agree on
 * how "install" works:
 *  - Chrome/Edge/Android fire a `beforeinstallprompt` event this component
 *    captures, then re-triggers from its own "Instalar" button.
 *  - iOS Safari has no such event (Apple never shipped one) — there's no way
 *    to trigger the install programmatically, so this shows the manual
 *    steps instead ("Compartilhar" → "Adicionar à Tela de Início").
 * Renders nothing on desktop, once already installed, or if dismissed in
 * the last 14 days (per business, so it doesn't nag on every login).
 */
export function InstallAppPrompt({ business }: { business: Business }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Runs on every business change (e.g. switching between businesses in the
  // same browser session) so the manifest/icon shown always match who's logged in.
  useEffect(() => {
    applyBusinessManifest(business)
    // Put the generic platform branding back once no admin panel is on
    // screen anymore (logout, or navigating away entirely) — these are
    // global <head> tags, not scoped to this route.
    return () => restoreDefaultManifest()
  }, [business.id, business.slug, business.displayName, business.primaryColor, business.logo?.url])

  useEffect(() => {
    setDismissed(false)
    setDeferredPrompt(null)
    setShowIOSInstructions(false)
    if (isRunningStandalone() || !isMobileBrowser() || isInstallPromptSnoozed(business.id)) return

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
  }, [business.id])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    snoozeInstallPrompt(business.id)
    setDismissed(true)
  }

  if (dismissed || (!deferredPrompt && !showIOSInstructions)) return null

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 text-[var(--color-foreground)] text-sm border-b border-[var(--color-border)]"
      style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
    >
      {deferredPrompt ? (
        <>
          <span className="flex items-center gap-2">
            <Download size={16} className="text-[var(--color-primary)] shrink-0" />
            Instale o painel da {business.displayName} no seu celular para acessar mais rápido.
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="inline-flex items-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition"
            >
              Instalar
            </button>
            <button onClick={handleDismiss} aria-label="Dispensar" className="p-1.5 rounded-md hover:bg-black/5">
              <X size={15} />
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="flex items-center gap-2">
            <Share2 size={16} className="text-[var(--color-primary)] shrink-0" />
            Para instalar este painel no seu iPhone: toque em <strong>Compartilhar</strong> e depois em <strong>"Adicionar à Tela de Início"</strong>.
          </span>
          <button onClick={handleDismiss} aria-label="Dispensar" className="p-1.5 rounded-md hover:bg-black/5 shrink-0">
            <X size={15} />
          </button>
        </>
      )}
    </div>
  )
}
