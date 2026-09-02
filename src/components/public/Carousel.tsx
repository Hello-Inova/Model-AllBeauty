import { Children, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Horizontal, swipeable carousel with "anterior/próximo" arrow buttons.
 * Used by every card-grid section of the public site (services, professionals,
 * gallery, testimonials) that needs next/prev navigation instead of a static grid.
 *
 * Each child is wrapped in a fixed-width, non-shrinking, scroll-snapped slide —
 * callers control slide width (and therefore how many are visible per
 * breakpoint) via `itemClassName`. Native horizontal scroll drives everything,
 * so touch swipe works for free on mobile; the arrow buttons just call
 * `scrollBy()`. Arrows auto-hide at each end, and the whole control row hides
 * itself when there's nothing to scroll (e.g. only 1-2 items).
 */
export function Carousel({ children, itemClassName = '' }: { children: ReactNode; itemClassName?: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  const updateEdges = () => {
    const el = trackRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    updateEdges()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateEdges, { passive: true })
    window.addEventListener('resize', updateEdges)
    return () => {
      el.removeEventListener('scroll', updateEdges)
      window.removeEventListener('resize', updateEdges)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children])

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  const items = Children.toArray(children)
  const hasOverflow = !(atStart && atEnd)

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((child, i) => (
          <div key={i} className={`shrink-0 snap-start ${itemClassName}`}>
            {child}
          </div>
        ))}
      </div>

      {/* Desktop: overlaid side arrows, only where there's room to scroll that way */}
      {atStart ? null : (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label="Anterior"
          className="hidden sm:flex absolute top-1/2 -left-4 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-[var(--color-card,#fff)] border border-[var(--color-border)] shadow-md hover:bg-[var(--color-muted)] transition z-10"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {atEnd ? null : (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label="Próximo"
          className="hidden sm:flex absolute top-1/2 -right-4 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-[var(--color-card,#fff)] border border-[var(--color-border)] shadow-md hover:bg-[var(--color-muted)] transition z-10"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Mobile: side overlays would get clipped by the viewport edge, so the
          controls sit below the track instead — swipe still works too. */}
      {hasOverflow && (
        <div className="flex sm:hidden justify-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={atStart}
            aria-label="Anterior"
            className="h-9 w-9 flex items-center justify-center rounded-full border border-[var(--color-border)] disabled:opacity-30 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={atEnd}
            aria-label="Próximo"
            className="h-9 w-9 flex items-center justify-center rounded-full border border-[var(--color-border)] disabled:opacity-30 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
