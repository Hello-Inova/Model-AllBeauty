import { Link } from 'react-router-dom'
import { Rocket } from 'lucide-react'

/**
 * Barra de CTA fixa no rodapé, só no mobile (ITEM 14 do pedido de melhorias
 * comerciais) — no desktop o CTA do header/hero já fica visível o tempo
 * todo, então essa barra só existe pra telas pequenas, onde rolar a página
 * some com o CTA. `sm:hidden` segue a mesma convenção de breakpoint já usada
 * no resto da LandingPage (menu hambúrguer vs. nav completa).
 *
 * `pb-[calc(...)]` soma um respiro fixo ao safe-area-inset-bottom do iOS,
 * pra não colar no indicador de home do iPhone. A LandingPage precisa
 * reservar um espaço equivalente no fim do conteúdo (ver `pb-20 sm:pb-0` no
 * wrapper) pra essa barra não cobrir o footer.
 */
export function MobileStickyCTA({ to }: { to: string }) {
  return (
    <div
      className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur px-4 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <Link
        to={to}
        className="flex items-center justify-center gap-2 h-12 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-medium text-sm transition hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      >
        <Rocket size={17} /> Criar meu site
      </Link>
    </div>
  )
}
