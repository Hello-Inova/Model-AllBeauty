import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useGallery } from '../../hooks/useEntities'
import { Gallery } from '../../components/public/Gallery'
import { EmptyState } from '../../components/Form'
import { SEO } from '../../components/SEO'
import { Images } from 'lucide-react'

export function GalleryPage() {
  const business = useCurrentBusiness()!
  const { data: gallery, loading } = useGallery(business.id)
  const active = gallery.filter((g) => g.active)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <SEO business={business} title="Galeria" description={`Veja fotos do ambiente e resultados de ${business.displayName}.`} />
      <h1 className="font-heading text-3xl font-semibold mb-2">Galeria</h1>
      <p className="text-[var(--color-muted-foreground)] mb-8">Confira um pouco do nosso trabalho e ambiente.</p>
      {!loading && active.length === 0 && <EmptyState icon={<Images size={32} />} title="Nenhuma imagem cadastrada" />}
      <Gallery images={active} />
    </div>
  )
}
