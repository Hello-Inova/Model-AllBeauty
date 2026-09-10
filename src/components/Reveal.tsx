import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Wraps children in a scroll-triggered fade-in-up reveal (IntersectionObserver-based,
 * so it costs nothing until the element nears the viewport, and only fires once).
 * Used across the Organyze landing page for a bit of motion polish without a full
 * animation library.
 */
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // If IntersectionObserver isn't available for some reason, just show it.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className={`${visible ? 'animate-fade-in-up' : 'opacity-0'} ${className}`} style={visible ? { animationDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  )
}
