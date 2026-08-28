import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { GalleryImage } from '../../types'
import { SmartImage } from '../SmartImage'
import { useResolvedImage } from '../../hooks/useImage'

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const active = openIndex !== null ? images[openIndex] : null

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((g, i) => (
          <button key={g.id} onClick={() => setOpenIndex(i)} className="aspect-square rounded-lg overflow-hidden group">
            <SmartImage asset={g.image} alt={g.title || 'Foto da galeria'} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          </button>
        ))}
      </div>

      {active && (
        <Lightbox
          image={active}
          onClose={() => setOpenIndex(null)}
          onPrev={() => setOpenIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : i))}
          onNext={() => setOpenIndex((i) => (i !== null ? (i + 1) % images.length : i))}
        />
      )}
    </>
  )
}

function Lightbox({ image, onClose, onPrev, onNext }: { image: GalleryImage; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const src = useResolvedImage(image.image)
  return (
    <div className="fixed inset-0 z-[95] bg-black/85 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      <button onClick={onClose} aria-label="Fechar" className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10">
        <X size={24} />
      </button>
      <button onClick={onPrev} aria-label="Anterior" className="absolute left-2 sm:left-6 text-white p-2 rounded-full hover:bg-white/10">
        <ChevronLeft size={28} />
      </button>
      <button onClick={onNext} aria-label="Próxima" className="absolute right-2 sm:right-6 text-white p-2 rounded-full hover:bg-white/10">
        <ChevronRight size={28} />
      </button>
      <figure className="max-w-3xl max-h-[80vh] flex flex-col items-center gap-3">
        {src && <img src={src} alt={image.title || 'Foto da galeria'} className="max-h-[70vh] rounded-lg object-contain" />}
        {image.title && <figcaption className="text-white text-sm opacity-80">{image.title}</figcaption>}
      </figure>
    </div>
  )
}
