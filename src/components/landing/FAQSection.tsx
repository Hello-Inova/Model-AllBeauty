import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface FAQItem {
  question: string
  answer: string
}

/**
 * Accordion de perguntas frequentes da landing page (ITEM 15 do pedido de
 * melhorias comerciais) — mantém no máximo uma pergunta aberta por vez pra
 * página não ficar comprida demais. Cada `<button>` real (não uma div) já
 * dá foco/teclado de graça, e os atributos aria-expanded/aria-controls
 * deixam o estado explícito pra leitor de tela.
 */
export function FAQSection({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-3">
      {items.map((item, i) => {
        const open = openIndex === i
        const panelId = `faq-panel-${i}`
        const buttonId = `faq-button-${i}`
        return (
          <div key={item.question} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
            <button
              type="button"
              id={buttonId}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full flex items-center justify-between gap-3 text-left px-4 sm:px-5 py-4 min-h-[52px] hover:bg-[var(--color-muted)]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <span className="font-heading font-semibold text-sm sm:text-base">{item.question}</span>
              <ChevronDown size={18} className={`shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
              <div className="overflow-hidden">
                <p className="px-4 sm:px-5 pb-4 text-sm text-[var(--color-muted-foreground)] leading-relaxed">{item.answer}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
