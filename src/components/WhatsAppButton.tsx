import type { Business } from '../types'
import { businessWhatsappLink } from '../utils/whatsapp'
import { WhatsAppIcon } from './BrandIcons'

/**
 * Floating WhatsApp button shown on every public page — number/message come
 * from the business config. A perfect circle (the universal shape for this
 * kind of chat FAB, instantly recognizable) with a soft pulsing ring to draw
 * the eye, a hover label on desktop (where there's room for it), and a
 * bigger tap target on mobile since it's a thumb target over a chat icon.
 */
export function WhatsAppButton({ business, message }: { business: Business; message?: string }) {
  if (!business.whatsapp) return null
  return (
    <a
      href={businessWhatsappLink(business, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25 transition hover:scale-105 hover:brightness-105 active:scale-95"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-75 animate-ping-slow motion-reduce:hidden" aria-hidden="true" />
      <WhatsAppIcon size={28} className="relative" />
      <span className="pointer-events-none absolute right-full mr-3 hidden sm:block whitespace-nowrap rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-md transition group-hover:opacity-100">
        Fale conosco
      </span>
    </a>
  )
}
