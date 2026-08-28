import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { ContactSection } from '../../components/public/ContactSection'
import { SEO } from '../../components/SEO'

export function ContactPage() {
  const business = useCurrentBusiness()!
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <SEO business={business} title="Contato" description={`Fale com ${business.displayName}.`} />
      <h1 className="font-heading text-3xl font-semibold mb-2">Fale conosco</h1>
      <p className="text-[var(--color-muted-foreground)] mb-8">Estamos à disposição para te atender.</p>
      <ContactSection business={business} />
    </div>
  )
}
