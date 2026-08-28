import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useProfessionals } from '../../hooks/useEntities'
import { ProfessionalCard } from '../../components/public/ProfessionalCard'
import { EmptyState } from '../../components/Form'
import { SEO } from '../../components/SEO'
import { Users } from 'lucide-react'

export function ProfessionalsPage() {
  const business = useCurrentBusiness()!
  const { data: professionals, loading } = useProfessionals(business.id)
  const active = professionals.filter((p) => p.active)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <SEO business={business} title="Profissionais" description={`Conheça a equipe de ${business.displayName}.`} />
      <h1 className="font-heading text-3xl font-semibold mb-2">Nossa equipe</h1>
      <p className="text-[var(--color-muted-foreground)] mb-8">Profissionais qualificados prontos para te atender.</p>

      {!loading && active.length === 0 && <EmptyState icon={<Users size={32} />} title="Nenhum profissional cadastrado" />}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {active.map((p) => (
          <ProfessionalCard key={p.id} professional={p} />
        ))}
      </div>
    </div>
  )
}
