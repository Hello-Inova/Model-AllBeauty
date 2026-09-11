import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ImageOff, Maximize2, X, type LucideIcon } from 'lucide-react'
import { Button } from '../Form'
import { Reveal } from '../Reveal'

export interface TourStep {
  icon: LucideIcon
  tab: string
  title: string
  text: string
  /**
   * Captura de tela real da respectiva área do produto (ver src/assets/tour/
   * README-like comment em LandingPage.tsx). Opcional: quando ausente, cai no
   * placeholder tracejado abaixo em vez de quebrar o layout.
   */
  image?: string
}

/**
 * "Veja como funciona na prática" (ITEM 20) — tour em abas pelas telas reais
 * do produto (dashboard, personalização, serviços, agenda, site do cliente,
 * agendamento — os mesmos nomes das rotas em utils/routes.ts `adminRoutes`).
 */
export function ProductTour({ steps, ctaTo }: { steps: TourStep[]; ctaTo: string }) {
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const current = steps[active]

  // Índices das etapas que têm captura de tela — é entre elas que o
  // lightbox passeia (setas/teclado), pulando etapas sem imagem em vez de
  // travar nelas.
  const imageIndexes = steps.reduce<number[]>((acc, s, i) => (s.image ? [...acc, i] : acc), [])
  const showImageNav = imageIndexes.length > 1
  function stepBy(delta: 1 | -1) {
    if (imageIndexes.length === 0) return
    const pos = imageIndexes.indexOf(active)
    const from = pos === -1 ? 0 : pos
    const nextPos = (from + delta + imageIndexes.length) % imageIndexes.length
    setActive(imageIndexes[nextPos])
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <Reveal className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Conheça o Organyze</span>
        <h2 className="font-heading text-2xl sm:text-3xl font-semibold mt-2">Veja como funciona na prática</h2>
      </Reveal>

      <Reveal delay={100}>
        {/* Tabs — rolagem horizontal no mobile, sem quebrar layout. */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {steps.map((s, i) => (
            <button
              key={s.tab}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-medium border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                active === i
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)]'
                  : 'bg-transparent border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50'
              }`}
            >
              <s.icon size={14} /> {s.tab}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden grid md:grid-cols-2">
          {current.image ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label={`Ampliar captura de tela de ${current.tab}`}
              className="group relative aspect-video md:aspect-auto bg-[var(--color-muted)] border-b md:border-b-0 md:border-r border-[var(--color-border)] overflow-hidden cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <img src={current.image} alt={`Tela de ${current.tab} do painel Organyze`} className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                <span className="flex items-center gap-1.5 rounded-full bg-black/60 text-white text-xs font-medium px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 size={13} /> Ampliar
                </span>
              </span>
            </button>
          ) : (
            <div className="aspect-video md:aspect-auto bg-[var(--color-muted)] flex flex-col items-center justify-center gap-2 text-[var(--color-muted-foreground)] border-b md:border-b-0 md:border-r border-[var(--color-border)] border-dashed p-6">
              <ImageOff size={28} strokeWidth={1.5} />
              <span className="text-xs text-center">Espaço reservado para captura de tela real de "{current.tab}"</span>
            </div>
          )}
          <div className="p-6 sm:p-8 flex flex-col justify-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
              <current.icon size={20} />
            </div>
            <h3 className="font-heading font-semibold text-lg">{current.title}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">{current.text}</p>
          </div>
        </div>
      </Reveal>

      <div className="flex justify-center mt-10">
        <Link to={ctaTo}>
          <Button size="lg" className="transition-transform hover:scale-105 active:scale-95">Quero experimentar</Button>
        </Link>
      </div>

      {expanded && current.image && (
        <ImageLightbox
          src={current.image}
          alt={`Tela de ${current.tab} do painel Organyze`}
          caption={current.title}
          onClose={() => setExpanded(false)}
          onPrev={showImageNav ? () => stepBy(-1) : undefined}
          onNext={showImageNav ? () => stepBy(1) : undefined}
        />
      )}
    </div>
  )
}

/**
 * Tela cheia ao clicar na captura de tela do tour — fecha com Esc, clique
 * fora ou no X. Quando há mais de uma captura no tour, também navega entre
 * elas (setas na tela ou ← →) sem precisar fechar e reabrir.
 */
function ImageLightbox({
  src,
  alt,
  caption,
  onClose,
  onPrev,
  onNext,
}: {
  src: string
  alt: string
  caption?: string
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev?.()
      else if (e.key === 'ArrowRight') onNext?.()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  return (
    <div className="fixed inset-0 z-[95] bg-black/85 flex items-center justify-center p-2 sm:p-4 animate-fade-in" role="dialog" aria-modal="true" onClick={onClose}>
      <button onClick={onClose} aria-label="Fechar" className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white p-2 rounded-full hover:bg-white/10 z-10">
        <X size={24} />
      </button>
      {onPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          aria-label="Captura anterior"
          className="absolute left-1 sm:left-6 text-white p-2 sm:p-3 rounded-full hover:bg-white/10 z-10"
        >
          <ChevronLeft size={26} className="sm:w-8 sm:h-8" />
        </button>
      )}
      {onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          aria-label="Próxima captura"
          className="absolute right-1 sm:right-6 text-white p-2 sm:p-3 rounded-full hover:bg-white/10 z-10"
        >
          <ChevronRight size={26} className="sm:w-8 sm:h-8" />
        </button>
      )}
      <figure className="w-full max-w-4xl lg:max-w-6xl max-h-[85vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className="max-h-[75vh] sm:max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl" />
        {caption && <figcaption className="text-white text-sm opacity-80 text-center px-8">{caption}</figcaption>}
      </figure>
    </div>
  )
}
