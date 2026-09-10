import { Link } from 'react-router-dom'
import { ArrowRight, CalendarPlus } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useCategories, useGallery, useProfessionals, useServices, useTestimonials, useVideos } from '../../hooks/useEntities'
import { Hero } from '../../components/public/Hero'
import { ServiceCard } from '../../components/public/ServiceCard'
import { ProfessionalCard } from '../../components/public/ProfessionalCard'
import { Gallery } from '../../components/public/Gallery'
import { Testimonials } from '../../components/public/Testimonials'
import { Carousel } from '../../components/public/Carousel'
import { ContactSection } from '../../components/public/ContactSection'
import { Button } from '../../components/Form'
import { publicRoutes } from '../../utils/routes'
import { SEO } from '../../components/SEO'
import { SmartImage } from '../../components/SmartImage'

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: { to: string; label: string } }) {
  return (
    <div className="flex items-end justify-between mb-8 gap-4">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{eyebrow}</span>
        <h2 className="font-heading text-2xl sm:text-3xl font-semibold mt-1">{title}</h2>
      </div>
      {action && (
        <Link to={action.to} className="hidden sm:flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] shrink-0">
          {action.label} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}

export function HomePage() {
  const business = useCurrentBusiness()!
  const { data: services } = useServices(business.id)
  const { data: categories } = useCategories(business.id)
  const { data: professionals } = useProfessionals(business.id)
  const { data: gallery } = useGallery(business.id)
  const { data: testimonials } = useTestimonials(business.id)
  const { data: videos } = useVideos(business.id)

  const featured = services.filter((s) => s.active && s.featured).slice(0, 6)
  const shownServices = featured.length > 0 ? featured : services.filter((s) => s.active).slice(0, 6)
  const activeProfessionals = professionals.filter((p) => p.active)
  const activeTestimonials = testimonials.filter((t) => t.active)
  const activeGallery = gallery.filter((g) => g.active).slice(0, 8)
  const activeVideos = [...videos].filter((v) => v.active).sort((a, b) => a.order - b.order)

  return (
    <div>
      <SEO business={business} title={business.displayName} description={business.description} />
      <Hero business={business} />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeading eyebrow="Catálogo" title="Serviços em destaque" action={{ to: publicRoutes.services(business.slug), label: 'Ver todos os serviços' }} />
        {shownServices.length > 0 ? (
          <Carousel itemClassName="w-[280px] sm:w-[320px]">
            {shownServices.map((s) => (
              <ServiceCard key={s.id} business={business} service={s} category={categories.find((c) => c.id === s.categoryId)} />
            ))}
          </Carousel>
        ) : (
          <p className="text-sm text-[var(--color-muted-foreground)]">Nenhum serviço publicado ainda.</p>
        )}
      </section>

      <section className="bg-[var(--color-muted)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Sobre nós</span>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold mt-1 mb-4">{business.displayName}</h2>
            <p className="text-[var(--color-muted-foreground)] leading-relaxed">{business.description}</p>
            <Link to={publicRoutes.about(business.slug)} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] mt-4">
              Saiba mais <ArrowRight size={14} />
            </Link>
          </div>
          <div className="rounded-xl overflow-hidden aspect-video">
            <SmartImage asset={business.coverImage} alt={business.name} className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {activeProfessionals.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <SectionHeading eyebrow="Equipe" title="Nossos profissionais" action={{ to: publicRoutes.professionals(business.slug), label: 'Ver equipe completa' }} />
          <Carousel itemClassName="w-[200px] sm:w-[220px]">
            {activeProfessionals.map((p) => (
              <ProfessionalCard key={p.id} professional={p} />
            ))}
          </Carousel>
        </section>
      )}

      {activeGallery.length > 0 && (
        <section className="bg-[var(--color-muted)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <SectionHeading eyebrow="Ambiente" title="Galeria" action={{ to: publicRoutes.gallery(business.slug), label: 'Ver galeria completa' }} />
            <Gallery images={activeGallery} />
          </div>
        </section>
      )}

      {activeVideos.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <SectionHeading eyebrow="Vídeos" title="Conheça nosso trabalho" />
          {activeVideos.length > 1 ? (
            <Carousel itemClassName="w-[300px] sm:w-[380px]">
              {activeVideos.map((v) => (
                <div key={v.id} className="rounded-xl overflow-hidden bg-black aspect-video">
                  <video src={v.video.url} controls playsInline muted className="w-full h-full object-cover" />
                </div>
              ))}
            </Carousel>
          ) : (
            <div className="max-w-xl mx-auto rounded-xl overflow-hidden bg-black aspect-video">
              <video src={activeVideos[0].video.url} controls playsInline muted className="w-full h-full object-cover" />
            </div>
          )}
        </section>
      )}

      {activeTestimonials.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <SectionHeading eyebrow="Depoimentos" title="O que dizem sobre nós" />
          <Testimonials testimonials={activeTestimonials} />
        </section>
      )}

      <section className="bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center text-center gap-4">
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold">Agende seu horário</h2>
          <p className="opacity-80 max-w-md">Reserve seu atendimento em poucos cliques, sem precisar ligar.</p>
          <Link to={publicRoutes.booking(business.slug)}>
            <Button size="lg" icon={<CalendarPlus size={18} />}>Agendar agora</Button>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeading eyebrow="Fale conosco" title="Contato" />
        <ContactSection business={business} />
      </section>
    </div>
  )
}
