import { Link } from 'react-router-dom'
import { ArrowRight, ArrowDown, type LucideIcon } from 'lucide-react'
import { Button } from '../Form'
import { Reveal } from '../Reveal'

interface Step {
  icon: LucideIcon
  title: string
  text: string
}

/**
 * "Como funciona", em 4 passos — ITEM 4 do pedido de melhorias comerciais.
 * Os passos (definidos em LandingPage.tsx e passados via prop) refletem o
 * fluxo real do produto, não é copy inventada: o passo 1 é o campo
 * "Segmento" do cadastro (ver SignupPage.tsx / utils/segments.ts), o 2 e o 3
 * espelham itens do checklist de onboarding do painel ("Dê a cara do seu
 * negócio ao site" / "Cadastre seus serviços" / "Veja e compartilhe seu
 * site" — ver OnboardingChecklist.tsx), e o 4 é o agendamento público que já
 * existe (rota /empresa/:slug/agendamento).
 */
export function HowItWorks({ steps, ctaTo }: { steps: Step[]; ctaTo: string }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <Reveal className="text-center max-w-xl mx-auto mb-12">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Simples assim</span>
        <h2 className="font-heading text-2xl sm:text-3xl font-semibold mt-2">Como funciona</h2>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-2">Do zero ao primeiro agendamento, em 4 passos.</p>
      </Reveal>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 lg:gap-x-4 items-start">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 100} className="relative flex">
            <div className="w-full flex flex-col items-center text-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 pt-8 pb-6">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-heading font-bold flex items-center justify-center shadow-sm">
                {i + 1}
              </span>
              <div className="h-12 w-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                <s.icon size={22} />
              </div>
              <h3 className="font-heading font-semibold text-sm">{s.title}</h3>
              <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{s.text}</p>
            </div>

            {/* Seta de conexão: horizontal entre colunas no desktop (grade de
                4), vertical empilhada no mobile (1 coluna). No breakpoint
                intermediário (2 colunas) a conexão viraria uma diagonal
                confusa, então simplesmente não mostramos seta ali. */}
            {i < steps.length - 1 && (
              <>
                <ArrowRight size={18} className="hidden lg:block absolute top-1/2 -right-5 -translate-y-1/2 text-[var(--color-primary)]/40" />
                <ArrowDown size={18} className="sm:hidden absolute -bottom-7 left-1/2 -translate-x-1/2 text-[var(--color-primary)]/40" />
              </>
            )}
          </Reveal>
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <Link to={ctaTo}>
          <Button size="lg" className="transition-transform hover:scale-105 active:scale-95">Criar meu site</Button>
        </Link>
      </div>
    </div>
  )
}
