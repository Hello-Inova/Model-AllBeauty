import type { ReactNode } from 'react'
import type { Business } from '../types'
import { Header } from '../components/public/Header'
import { Footer } from '../components/public/Footer'
import { WhatsAppButton } from '../components/WhatsAppButton'

export function PublicLayout({ business, children }: { business: Business; children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header business={business} />
      <main className="flex-1">{children}</main>
      <Footer business={business} />
      <WhatsAppButton business={business} />
    </div>
  )
}
