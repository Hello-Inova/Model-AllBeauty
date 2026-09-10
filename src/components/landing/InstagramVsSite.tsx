import { Link } from 'react-router-dom'
import { AtSign, Store, ClipboardList, CalendarCheck2, Users2, Check, X, ArrowRight, ArrowDown } from 'lucide-react'
import { Button } from '../Form'
import { Reveal } from '../Reveal'

const SOCIAL_POINTS = [
  'Depende do algoritmo pra ser visto',
  'Informações espalhadas entre posts e bio do perfil',
  'Cliente precisa te chamar no privado pra perguntar preço e horário',
  'Serviços difíceis de organizar num feed',
  'Agendamento geralmente depende de conversa manual',
]

const SITE_POINTS = [
  'Endereço profissional só seu',
  'Serviços organizados, com preço e duração',
  'Informações centralizadas num só lugar',
  'Catálogo profissional, fácil de navegar',
  'Agendamento online, sem trocar mensagem',
]

const FLOW = [
  { icon: AtSign, label: 'Redes sociais', text: 'Descoberta' },
  { icon: Store, label: 'Seu site', text: 'Apresentação' },
  { icon: ClipboardList, label: 'Serviços', text: 'Informação' },
  { icon: CalendarCheck2, label: 'Agendamento', text: 'Conversão' },
  { icon: Users2, label: 'Cliente', text: 'Fidelização' },
]

/**
 * Comparação "Redes sociais x site próprio" (ITEM 6) — o tom é deliberadamente
 * não-adversarial: as redes sociais continuam tendo o seu papel (descoberta),
 * o site é o que vem depois (apresentação profissional + conversão). A frase
 * de destaque no fim ("Suas redes sociais atraem...") é o reforço de
 * posicionamento pedido no ITEM 19, tecido aqui em vez de virar uma seção
 * própria separada.
 */
export function InstagramVsSite({ ctaTo }: { ctaTo: string }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <Reveal className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Redes sociais + site próprio</span>
        <h2 className="font-heading text-2xl sm:text-3xl font-semibold mt-2">
          Suas redes sociais são importantes. Mas elas não precisam ser seu único canal de vendas.
        </h2>
      </Reveal>

      <Reveal delay={100}>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 flex flex-col gap-4">
            <h3 className="font-heading font-semibold flex items-center gap-2 text-[var(--color-muted-foreground)]">
              <AtSign size={18} /> Só as redes sociais
            </h3>
            <ul className="flex flex-col gap-3 text-sm">
              {SOCIAL_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-2 text-[var(--color-muted-foreground)]">
                  <X size={15} className="shrink-0 mt-0.5 text-[var(--color-muted-foreground)]/60" /> {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-card)] p-6 flex flex-col gap-4 ring-1 ring-[var(--color-primary)]/20">
            <h3 className="font-heading font-semibold flex items-center gap-2 text-[var(--color-primary)]">
              <Store size={18} /> Seu próprio site
            </h3>
            <ul className="flex flex-col gap-3 text-sm">
              {SITE_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <Check size={15} className="shrink-0 mt-0.5 text-[var(--color-primary)]" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>

      {/* Fluxo visual: descoberta (redes sociais) -> apresentação (site) -> informação (serviços) -> conversão (agendamento) -> cliente.
          No mobile é uma linha do tempo vertical (grade de 2 colunas: ícone
          alinhado à esquerda + texto, com a seta centralizada embaixo de
          cada ícone, conectando um passo ao próximo). No desktop continua
          em linha, com setas horizontais entre os cards. */}
      <Reveal delay={200}>
        <div className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] px-5 py-8 sm:px-6">
          {/* Mobile */}
          <div className="flex flex-col sm:hidden">
            {FLOW.map((f, i) => (
              <div key={f.label}>
                <div className="grid grid-cols-[44px_1fr] items-center gap-x-4">
                  <div className="h-11 w-11 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)]">
                    <f.icon size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{f.label}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">{f.text}</span>
                  </div>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="grid grid-cols-[44px_1fr]">
                    <div className="flex justify-center py-1">
                      <ArrowDown size={16} className="text-[var(--color-primary)]/50 shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden sm:flex items-center justify-between gap-2">
            {FLOW.map((f, i) => (
              <div key={f.label} className="flex flex-1 items-center gap-2 flex-col text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)]">
                    <f.icon size={18} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium">{f.label}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">{f.text}</span>
                  </div>
                </div>
                {i < FLOW.length - 1 && <ArrowRight size={16} className="text-[var(--color-primary)]/50 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={250} className="text-center mt-10 flex flex-col items-center gap-6">
        <p className="font-heading text-lg sm:text-xl font-semibold max-w-2xl">
          Suas redes sociais atraem. Seu site apresenta. Seu agendamento converte.
        </p>
        <Link to={ctaTo}>
          <Button size="lg" className="transition-transform hover:scale-105 active:scale-95">Quero ter meu site</Button>
        </Link>
      </Reveal>
    </div>
  )
}
