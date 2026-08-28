import { useState } from 'react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useCategories, useServices } from '../../hooks/useEntities'
import { ServiceCard } from '../../components/public/ServiceCard'
import { CategoryPill } from '../../components/public/CategoryPill'
import { EmptyState } from '../../components/Form'
import { SEO } from '../../components/SEO'
import { PackageSearch } from 'lucide-react'

export function ServicesPage() {
  const business = useCurrentBusiness()!
  const { data: services, loading } = useServices(business.id)
  const { data: categories } = useCategories(business.id)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const activeServices = services.filter((s) => s.active)
  const shown = activeCategory ? activeServices.filter((s) => s.categoryId === activeCategory) : activeServices
  const activeCategories = categories.filter((c) => c.active)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <SEO business={business} title="Serviços" description={`Conheça o catálogo completo de serviços de ${business.displayName}.`} />
      <h1 className="font-heading text-3xl font-semibold mb-2">Nossos serviços</h1>
      <p className="text-[var(--color-muted-foreground)] mb-6">Escolha um serviço e agende seu horário em poucos passos.</p>

      {activeCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-1 px-1">
          <CategoryPill category={null} active={activeCategory === null} onClick={() => setActiveCategory(null)} />
          {activeCategories.map((c) => (
            <CategoryPill key={c.id} category={c} active={activeCategory === c.id} onClick={() => setActiveCategory(c.id)} />
          ))}
        </div>
      )}

      {!loading && shown.length === 0 && (
        <EmptyState icon={<PackageSearch size={32} />} title="Nenhum serviço encontrado" description="Ainda não há serviços publicados nesta categoria." />
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {shown.map((s) => (
          <ServiceCard key={s.id} business={business} service={s} category={categories.find((c) => c.id === s.categoryId)} />
        ))}
      </div>
    </div>
  )
}
