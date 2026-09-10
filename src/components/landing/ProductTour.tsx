import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageOff, type LucideIcon } from 'lucide-react'
import { Button } from '../Form'
import { Reveal } from '../Reveal'

export interface TourStep {
  icon: LucideIcon
  tab: string
  title: string
  text: string
}

/**
 * "Veja como funciona na prática" (ITEM 20) — tour em abas pelas telas reais
 * do produto (dashboard, personalização, serviços, agenda, site do cliente,
 * agendamento — os mesmos nomes das rotas em utils/routes.ts `adminRoutes`).
 * O projeto ainda não tem capturas de tela reais versionadas (só logo/favicon
 * em public/), então cada aba mostra um placeholder CLARAMENTE identificado
 * como tal em vez de uma imagem genérica ou inventada — é só substituir
 * `screenshotSrc` por uma captura real quando existir, sem mexer no resto.
 */
export function ProductTour({ steps, ctaTo }: { steps: TourStep[]; ctaTo: string }) {
  const [active, setActive] = useState(0)
  const current = steps[active]

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
          {/* Placeholder de captura de tela — trocar por screenshot real quando existir. */}
          <div className="aspect-video md:aspect-auto bg-[var(--color-muted)] flex flex-col items-center justify-center gap-2 text-[var(--color-muted-foreground)] border-b md:border-b-0 md:border-r border-[var(--color-border)] border-dashed p-6">
            <ImageOff size={28} strokeWidth={1.5} />
            <span className="text-xs text-center">Espaço reservado para captura de tela real de "{current.tab}"</span>
          </div>
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
    </div>
  )
}
