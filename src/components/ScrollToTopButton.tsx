import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

// Só faz sentido oferecer "voltar ao topo" depois que a pessoa já rolou uma
// boa distância — nos primeiros pixels de scroll o topo já está ali do lado.
const SHOW_AFTER_PX = 480

/**
 * Seta flutuante "voltar ao topo" — canto inferior direito, sem fundo (só o
 * ícone, com uma sombra leve pra continuar legível em cima de qualquer cor
 * de seção da landing) e com uma pulsação suave pra chamar atenção sem ser
 * agressiva. Some/aparece conforme a rolagem e some por completo pra quem
 * prefere menos movimento na tela (prefers-reduced-motion).
 *
 * `bottom-28` no mobile deixa espaço de sobra acima da barra fixa do
 * MobileStickyCTA (ver src/components/landing/MobileStickyCTA.tsx — ela
 * soma ~72px de altura + a safe-area do iOS, então esse respiro evita
 * sobrepor os dois); no desktop, sem essa barra, `sm:bottom-8` já basta.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let ticking = false
    function update() {
      setVisible(window.scrollY > SHOW_AFTER_PX)
      ticking = false
    }
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.35))' }}
      className={`fixed right-4 sm:right-6 bottom-28 sm:bottom-8 z-40 flex h-12 w-12 items-center justify-center rounded-full text-[var(--color-primary)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowUp size={30} strokeWidth={2.5} className="animate-gentle-pulse motion-reduce:animate-none" />
    </button>
  )
}
