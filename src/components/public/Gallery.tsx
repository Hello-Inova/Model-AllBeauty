import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react'
import type { GalleryImage } from '../../types'
import { SmartImage } from '../SmartImage'
import { useResolvedImage } from '../../hooks/useImage'
import { Carousel } from './Carousel'

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const active = openIndex !== null ? images[openIndex] : null

  return (
    <>
      <Carousel itemClassName="w-[160px] sm:w-[200px] md:w-[220px]">
        {images.map((g, i) => (
          <button key={g.id} onClick={() => setOpenIndex(i)} className="aspect-square w-full rounded-lg overflow-hidden group block">
            <SmartImage
              asset={g.image}
              alt={g.title || 'Foto da galeria'}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              icon={Camera}
            />
          </button>
        ))}
      </Carousel>

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
    <div className="fixed inset-0 z-[95] bg-black/85 flex items-center justify-center p-2 sm:p-4 animate-fade-in" role="dialog" aria-modal="true">
      <button onClick={onClose} aria-label="Fechar" className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white p-2 rounded-full hover:bg-white/10 z-10">
        <X size={24} />
      </button>
      <button onClick={onPrev} aria-label="Anterior" className="absolute left-1 sm:left-6 text-white p-2 sm:p-3 rounded-full hover:bg-white/10 z-10">
        <ChevronLeft size={26} className="sm:w-8 sm:h-8" />
      </button>
      <button onClick={onNext} aria-label="Próxima" className="absolute right-1 sm:right-6 text-white p-2 sm:p-3 rounded-full hover:bg-white/10 z-10">
        <ChevronRight size={26} className="sm:w-8 sm:h-8" />
      </button>
      {/* w-full so the image fills the available width on phones, capped and
          centered on wider screens — max-h leaves room for the caption and
          the safe-area padding above so it never gets clipped top/bottom. */}
      <figure className="w-full max-w-3xl lg:max-w-5xl max-h-[85vh] flex flex-col items-center gap-3">
        {src && <img src={src} alt={image.title || 'Foto da galeria'} className="max-h-[72vh] sm:max-h-[75vh] max-w-full rounded-lg object-contain" />}
        {image.title && <figcaption className="text-white text-sm opacity-80 text-center px-8">{image.title}</figcaption>}
      </figure>
    </div>
  )
}
