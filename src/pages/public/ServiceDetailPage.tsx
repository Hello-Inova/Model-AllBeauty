import { Link, Navigate, useParams } from 'react-router-dom'
import { Clock, Tag, ArrowLeft, CalendarPlus } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useCategories, useProfessionals, useServices } from '../../hooks/useEntities'
import { SmartImage } from '../../components/SmartImage'
import { Button } from '../../components/Form'
import { formatCurrency, formatDuration } from '../../utils/format'
import { getCategoryIcon } from '../../utils/categoryIcons'
import { publicRoutes } from '../../utils/routes'
import { ProfessionalCard } from '../../components/public/ProfessionalCard'
import { SEO } from '../../components/SEO'
import { FullPageLoader } from '../../components/StateScreens'

export function ServiceDetailPage() {
  const business = useCurrentBusiness()!
  const { serviceSlug } = useParams()
  const { data: services, loading } = useServices(business.id)
  const { data: categories } = useCategories(business.id)
  const { data: professionals } = useProfessionals(business.id)

  if (loading) return <FullPageLoader />

  const service = services.find((s) => s.slug === serviceSlug && s.active)
  if (!service) return <Navigate to={publicRoutes.services(business.slug)} replace />

  const category = categories.find((c) => c.id === service.categoryId)
  const eligible = professionals.filter((p) => p.active && (service.professionalIds.length === 0 || service.professionalIds.includes(p.id)))
  const hasPromo = service.promotionalPrice != null && service.promotionalPrice < service.price

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <SEO business={business} title={service.name} description={service.shortDescription} />
      <Link to={publicRoutes.services(business.slug)} className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] mb-6">
        <ArrowLeft size={14} /> Voltar aos serviços
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-xl overflow-hidden aspect-[4/3]">
          <SmartImage asset={service.image} alt={service.name} className="w-full h-full object-cover" icon={getCategoryIcon(category?.slug)} iconSize={48} />
        </div>

        <div className="flex flex-col">
          {category && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] mb-2">
              <Tag size={12} /> {category.name}
            </span>
          )}
          <h1 className="font-heading text-3xl font-semibold mb-3">{service.name}</h1>
          <p className="text-[var(--color-muted-foreground)] leading-relaxed mb-5">{service.description}</p>

          <div className="flex items-center gap-6 mb-6">
            <span className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
              <Clock size={16} /> {formatDuration(service.duration)}
            </span>
            <div className="flex items-baseline gap-2">
              {hasPromo && <span className="text-sm line-through text-[var(--color-muted-foreground)]">{formatCurrency(service.price)}</span>}
              <span className="text-2xl font-semibold text-[var(--color-primary)]">{formatCurrency(service.promotionalPrice ?? service.price)}</span>
            </div>
          </div>

          <Link to={`${publicRoutes.booking(business.slug)}?servico=${service.id}`}>
            <Button size="lg" icon={<CalendarPlus size={18} />}>Agendar este serviço</Button>
          </Link>
        </div>
      </div>

      {eligible.length > 0 && (
        <div className="mt-14">
          <h2 className="font-heading text-xl font-semibold mb-5">Profissionais disponíveis para este serviço</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {eligible.map((p) => (
              <ProfessionalCard key={p.id} professional={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
