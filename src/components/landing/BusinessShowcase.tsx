import { Link } from 'react-router-dom'
import { Scissors, Sparkles, Smile, Dumbbell, Gem, ExternalLink, type LucideIcon } from 'lucide-react'
import { Button } from '../Form'
import { Reveal } from '../Reveal'

interface SegmentCard {
  icon: LucideIcon
  name: string
  text: string
}

// Os 6 segmentos abaixo vêm da mesma lista usada no cadastro real (ver
// SEGMENTS em src/utils/segments.ts) — não são inventados, são só um
// recorte dos mais representativos pra essa vitrine.
const SEGMENTS: SegmentCard[] = [
  { icon: Scissors, name: 'Salão de Beleza', text: 'Catálogo de serviços, profissionais e horários — tudo organizado num site só seu.' },
  { icon: Sparkles, name: 'Clínica de Estética', text: 'Apresente seus procedimentos com profissionalismo e receba agendamentos online.' },
  { icon: Smile, name: 'Clínica Odontológica', text: 'Consultas organizadas, informações centralizadas e mais credibilidade pro paciente.' },
  { icon: Scissors, name: 'Barbearia', text: 'Agenda sempre disponível, sem depender de mensagem pra marcar horário.' },
  { icon: Gem, name: 'Nail Designer', text: 'Mostre seu trabalho e deixe suas clientes marcarem sozinhas, a qualquer hora.' },
  { icon: Dumbbell, name: 'Academia', text: 'Aulas, horários e profissionais organizados num painel só, fácil de manter.' },
]

/**
 * "Como seu negócio pode ficar" (ITEM 10) — o Organyze hoje tem um único
 * negócio de demonstração real publicado (ver DEFAULT_BUSINESS_SLUG /
 * src/data/demoData.ts, segmento "Salão de beleza & estética"), então todos
 * os cards levam pra essa mesma demonstração real: é o mesmo produto,
 * adaptável a qualquer segmento de serviços — só muda a marca, as cores e o
 * catálogo. Por isso o aviso logo abaixo do título, pra não sugerir que
 * existe uma demo diferente por segmento. Os ícones abaixo são só um
 * placeholder visual (não imagens aleatórias de banco de imagens) até
 * existirem capturas de tela reais de negócios de cada segmento.
 */
export function BusinessShowcase({ demoTo, ctaTo }: { demoTo: string; ctaTo: string }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <Reveal className="text-center max-w-2xl mx-auto mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Feito pro seu segmento</span>
        <h2 className="font-heading text-2xl sm:text-3xl font-semibold mt-2">Como seu negócio pode ficar</h2>
      </Reveal>
      <p className="text-sm text-[var(--color-muted-foreground)] text-center max-w-xl mx-auto mb-12">
        O Organyze se adapta a qualquer negócio de serviços — os exemplos abaixo levam pro mesmo site de demonstração real, que você personaliza com a marca e o catálogo do seu negócio.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SEGMENTS.map((s, i) => (
          <Reveal key={s.name} delay={(i % 3) * 80}>
            <div className="group h-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--color-primary)]/40">
              {/* Placeholder visual — reservado pra receber um preview/mockup real do segmento futuramente. */}
              <div className="aspect-[16/10] bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-muted)] flex items-center justify-center text-[var(--color-primary)]">
                <s.icon size={36} strokeWidth={1.5} />
              </div>
              <div className="p-5 flex flex-col gap-2 flex-1">
                <h3 className="font-heading font-semibold text-sm">{s.name}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)] flex-1">{s.text}</p>
                <Link to={demoTo} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline mt-2">
                  Ver demonstração <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <Link to={ctaTo}>
          <Button size="lg" className="transition-transform hover:scale-105 active:scale-95">Quero um site assim</Button>
        </Link>
      </div>
    </div>
  )
}
