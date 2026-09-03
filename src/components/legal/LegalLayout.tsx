import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Shared shell for the platform-wide legal pages (Termos de Uso, Política de
 * Privacidade/LGPD, Política de Cookies). These are NOT scoped to a business
 * (no BusinessProvider) — they describe Hello Inova's own SaaS relationship
 * with the companies that use the admin panel, so they render with the
 * default brand palette from index.css regardless of which business's admin
 * a reader came from.
 */
export function LegalLayout({ title, updatedAt, children }: { title: string; updatedAt: string; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[var(--color-muted)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Histórico do navegador, não um link fixo para "/": um admin sem
            os termos aceitos ainda chega aqui a partir do gate de aceite
            (TermsGate) — "Voltar" precisa devolvê-lo exatamente para lá, e
            não para o site público, ou pareceria que ele driblou o aceite. */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-6"
        >
          <ArrowLeft size={15} /> Voltar
        </button>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-10">
          <div className="flex items-center gap-2.5 mb-1.5">
            <FileText size={20} className="text-[var(--color-primary)]" />
            <h1 className="font-heading text-2xl sm:text-3xl font-semibold">{title}</h1>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)] mb-8">Última atualização: {updatedAt}</p>
          <div className="prose-legal flex flex-col gap-5 text-sm sm:text-[15px] leading-relaxed text-[var(--color-foreground)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LegalDisclaimer() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-xs sm:text-sm">
      Este documento foi elaborado com apoio de inteligência artificial, com base na Lei Geral de Proteção de Dados
      (LGPD — Lei 13.709/2018), no Marco Civil da Internet (Lei 12.965/2014) e no Código de Defesa do Consumidor (Lei
      8.078/1990), como modelo de referência. Ele não substitui a avaliação de um advogado antes de entrar em vigor —
      recomendamos revisão jurídica para adequá-lo integralmente à operação da Hello Inova.
    </div>
  )
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-heading text-lg font-semibold mt-2">{children}</h2>
}

export function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>
}

export function Ul({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-1.5 pl-5 list-disc">{children}</ul>
}
