import type { Business } from '../types'
import { businessWhatsappLink } from '../utils/whatsapp'
import { WhatsAppIcon } from './BrandIcons'

/** Floating WhatsApp button shown on every public page — number/message come from the business config. */
export function WhatsAppButton({ business, message }: { business: Business; message?: string }) {
  if (!business.whatsapp) return null
  return (
    <a
      href={businessWhatsappLink(business, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] text-white pl-4 pr-5 py-3 shadow-lg hover:brightness-95 transition"
    >
      <WhatsAppIcon size={22} />
      <span className="text-sm font-medium hidden sm:inline">WhatsApp</span>
    </a>
  )
}
