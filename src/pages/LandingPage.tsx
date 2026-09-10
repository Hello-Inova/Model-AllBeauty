import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck2,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Globe,
  Menu,
  Palette,
  Rocket,
  Scissors,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { dataRepository } from '../repositories'
import type { BillingPlanDef } from '../types'
import { Button } from '../components/Form'
import { Reveal } from '../components/Reveal'
import { Carousel } from '../components/public/Carousel'
import { APP_NAME, DEFAULT_BUSINESS_SLUG } from '../config'
import { platformRoutes, publicRoutes, legalRoutes } from '../utils/routes'
import { BILLING_PLAN_LABELS, formatCents, planDiscountPercent, planFinalPriceCents } from '../utils/billing'

const FEATURES_COLLAPSED_COUNT = 3

const FEATURES = [
  { icon: Globe, title: 'Site profissional', text: 'Um site bonito e rápido para o seu negócio, pronto em minutos — sem precisar contratar ninguém.' },
  { icon: CalendarCheck2, title: 'Agenda online 24h', text: 'Seus clientes marcam horário a qualquer momento, direto pelo celular, sem trocar mensagens.' },
  { icon: Palette, title: 'Sua cara, sua marca', text: 'Logo, cores e identidade visual do seu jeito — o site parece feito sob medida para você.' },
  { icon: Scissors, title: 'Serviços e profissionais', text: 'Cadastre seu catálogo completo: preços, duração, fotos e quem faz cada atendimento.' },
  { icon: Users, title: 'Clientes organizados', text: 'Histórico de cada cliente e de cada agendamento, tudo num painel só.' },
  { icon: Camera, title: 'Galeria e depoimentos', text: 'Mostre o resultado do seu trabalho e a opinião de quem já foi atendido.' },
  { icon: Smartphone, title: 'Funciona em qualquer tela', text: 'Painel e site pensados para celular — a maioria dos seus clientes vai acessar por ali.' },
  { icon: ShieldCheck, title: 'Seus dados, protegidos', text: 'Backup e exportação completos sempre que você quiser, sem depender de ninguém.' },
]

const STEPS = [
  { icon: UserPlus, title: 'Crie sua conta', text: 'Nome do negócio, e-mail e senha. Menos de 2 minutos e sua conta já está pronta.' },
  { icon: Palette, title: 'Personalize seu site', text: 'Logo, cores e serviços — o painel te guia passo a passo no que falta configurar.' },
  { icon: CalendarCheck2, title: 'Comece a receber agendamentos', text: 'Compartilhe o link do seu site e deixe seus clientes marcarem sozinhos.' },
]

export function LandingPage() {
  const [plans, setPlans] = useState<BillingPlanDef[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [planIndex, setPlanIndex] = useState(0)
  const [featuresExpanded, setFeaturesExpanded] = useState(false)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    dataRepository
      .getPlans()
      .then((p) => setPlans(p.filter((x) => x.active)))
      .catch(() => setPlans([]))
  }, [])

  useEffect(() => {
    setPlanIndex((i) => (plans.length === 0 ? 0 : Math.min(i, plans.length - 1)))
  }, [plans.length])

  function goToPlan(delta: number) {
    setPlanIndex((i) => (plans.length === 0 ? 0 : (i + delta + plans.length) % plans.length))
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) return
    goToPlan(delta < 0 ? 1 : -1)
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-background)]/90 backdrop-blur border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <img src="/logo.png" alt={APP_NAME} className="h-8 w-8 rounded-full" />
            <span className="font-heading text-lg font-semibold">{APP_NAME}</span>
          </span>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <a href="#recursos" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">Recursos</a>
            <a href="#como-funciona" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">Como funciona</a>
            <a href="#planos" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">Planos</a>
            <Link to={publicRoutes.home(DEFAULT_BUSINESS_SLUG)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">Ver demonstração</Link>
          </nav>
          <div className="hidden sm:block">
            <Link to={platformRoutes.signup}>
              <Button size="sm">Criar minha conta</Button>
            </Link>
          </div>
          <button className="sm:hidden p-2 -mr-2" onClick={() => setMenuOpen((v) => !v)} aria-label="Abrir menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile side menu (70% width, full height) */}
      <div className={`sm:hidden fixed inset-0 z-50 ${menuOpen ? '' : 'pointer-events-none'}`} aria-hidden={!menuOpen}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute right-0 top-0 h-full w-[70%] bg-[var(--color-background)] shadow-xl flex flex-col transition-transform duration-300 ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 h-16 border-b border-[var(--color-border)] shrink-0">
            <span className="flex items-center gap-2">
              <img src="/logo.png" alt={APP_NAME} className="h-7 w-7 rounded-full" />
              <span className="font-heading text-lg font-semibold">{APP_NAME}</span>
            </span>
            <button className="p-2 -mr-2" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
              <X size={22} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-4 py-6 text-sm flex-1 overflow-y-auto">
            <a href="#recursos" onClick={() => setMenuOpen(false)} className="py-2.5 text-[var(--color-muted-foreground)]">Recursos</a>
            <a href="#como-funciona" onClick={() => setMenuOpen(false)} className="py-2.5 text-[var(--color-muted-foreground)]">Como funciona</a>
            <a href="#planos" onClick={() => setMenuOpen(false)} className="py-2.5 text-[var(--color-muted-foreground)]">Planos</a>
            <Link to={publicRoutes.home(DEFAULT_BUSINESS_SLUG)} onClick={() => setMenuOpen(false)} className="py-2.5 text-[var(--color-muted-foreground)]">
              Ver demonstração
            </Link>
          </nav>
          <div className="px-4 pb-6 shrink-0">
            <Link to={platformRoutes.signup} onClick={() => setMenuOpen(false)}>
              <Button size="sm" className="w-full">Criar minha conta</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-muted)] to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <span className="animate-float-slow inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-full">
            <Sparkles size={13} className="animate-pulse" /> Para salões, clínicas e profissionais da beleza
          </span>
          <h1 className="animate-fade-in-up font-heading text-3xl sm:text-5xl font-semibold mt-5 max-w-3xl mx-auto leading-tight">
            O site e a agenda online do seu negócio, prontos em minutos
          </h1>
          <p className="animate-fade-in-up text-base sm:text-lg text-[var(--color-muted-foreground)] mt-5 max-w-xl mx-auto" style={{ animationDelay: '100ms' }}>
            Crie sua conta, escolha um plano e ganhe um site profissional com agendamento online, painel administrativo completo e a
            identidade visual do seu negócio — sem precisar contratar um desenvolvedor.
          </p>
          <div className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-3 mt-8" style={{ animationDelay: '200ms' }}>
            <Link to={platformRoutes.signup}>
              <Button size="lg" icon={<Rocket size={18} />} className="transition-transform hover:scale-105 active:scale-95">Criar meu site agora</Button>
            </Link>
            <Link to={publicRoutes.home(DEFAULT_BUSINESS_SLUG)}>
              <Button size="lg" variant="outline" className="transition-transform hover:scale-105 active:scale-95">Ver site de demonstração</Button>
            </Link>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-4">Sua conta e seu site ficam prontos na hora — o pagamento você faz depois, direto no painel.</p>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <Reveal className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Tudo em um só lugar</span>
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold mt-2">Feito para o dia a dia do seu negócio</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(featuresExpanded ? FEATURES : FEATURES.slice(0, FEATURES_COLLAPSED_COUNT)).map((f, i) => (
            <Reveal key={f.title} delay={(i % FEATURES_COLLAPSED_COUNT) * 80}>
              <div className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 flex flex-col gap-3 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--color-primary)]/40">
                <div className="h-10 w-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <f.icon size={20} />
                </div>
                <h3 className="font-heading font-semibold text-sm">{f.title}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {FEATURES.length > FEATURES_COLLAPSED_COUNT && (
          <div className="flex justify-center mt-10">
            {featuresExpanded ? (
              <button
                type="button"
                onClick={() => {
                  setFeaturesExpanded(false)
                  document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                aria-label="Ver menos recursos"
                className="group relative flex items-center justify-center h-12 w-12 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md hover:opacity-90 transition"
              >
                <ChevronUp size={22} className="relative" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setFeaturesExpanded(true)}
                aria-label="Ver mais recursos"
                className="group relative flex items-center justify-center h-12 w-12 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md hover:opacity-90 transition"
              >
                <span className="absolute inset-0 rounded-full bg-[var(--color-primary)] animate-ping-slow" />
                <ChevronDown size={22} className="relative animate-nudge-down" />
              </button>
            )}
          </div>
        )}
      </section>

      {/* How it works */}
      <section id="como-funciona" className="bg-[var(--color-muted)] py-16 sm:py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Simples assim</span>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold mt-2">Como funciona</h2>
          </Reveal>

          <Reveal delay={100}>
            <Carousel itemClassName="w-[82%] xs:w-[70%] sm:w-[320px]">
              {STEPS.map((s, i) => (
                <div key={s.title} className="relative h-full flex flex-col items-center text-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-6 pt-10 pb-8">
                  <span className="absolute top-4 left-1/2 -translate-x-1/2 font-heading text-6xl font-bold text-[var(--color-primary)]/10 select-none">
                    {i + 1}
                  </span>
                  <div className="relative flex flex-col items-center gap-4 w-full">
                    <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-lg shadow-[var(--color-primary)]/30 transition-transform duration-300 hover:scale-110">
                      <s.icon size={26} />
                      <span className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--color-primary)]/40 scale-125" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg">{s.title}</h3>
                    <p className="text-sm text-[var(--color-muted-foreground)] max-w-xs">{s.text}</p>
                  </div>
                </div>
              ))}
            </Carousel>
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <Reveal className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Sem surpresas</span>
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold mt-2">Planos para todo tamanho de negócio</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2">Quanto maior o ciclo, maior o desconto. Cancele quando quiser.</p>
        </Reveal>
        {plans.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center">Carregando planos…</p>
        ) : (
          <div className="max-w-md mx-auto">
            <div
              className="overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${planIndex * 100}%)` }}
              >
                {plans.map((p) => {
                  const featured = p.discountCents > 0 && p.id === plans.reduce((a, b) => (b.discountCents > a.discountCents ? b : a), plans[0]).id
                  return (
                    <div key={p.id} className="w-full shrink-0 px-1">
                      <div
                        className={`rounded-xl border p-6 flex flex-col gap-4 ${featured ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] relative' : 'border-[var(--color-border)]'}`}
                      >
                        {featured && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-3 py-1 rounded-full">
                            Melhor custo-benefício
                          </span>
                        )}
                        <div>
                          <p className="font-heading font-semibold">{p.name || BILLING_PLAN_LABELS[p.id]}</p>
                          <p className="text-3xl font-heading font-semibold mt-1.5">{formatCents(planFinalPriceCents(p))}</p>
                          {p.discountCents > 0 ? (
                            <p className="text-xs text-emerald-700 mt-1">{planDiscountPercent(p)}% de desconto (de {formatCents(p.priceCents)})</p>
                          ) : (
                            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Cobrança recorrente</p>
                          )}
                        </div>
                        <ul className="flex flex-col gap-2 text-sm">
                          {['Site e agenda online', 'Painel administrativo completo', 'Personalização de marca', 'Suporte da Hello Inova'].map((f) => (
                            <li key={f} className="flex items-center gap-2">
                              <CheckCircle2 size={15} className="text-[var(--color-primary)] shrink-0" /> {f}
                            </li>
                          ))}
                        </ul>
                        <Link to={`${platformRoutes.signup}?plano=${p.id}`} className="mt-auto">
                          <Button variant={featured ? 'primary' : 'outline'} className="w-full transition-transform hover:scale-[1.03] active:scale-95">Escolher este plano</Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {plans.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => goToPlan(-1)}
                  aria-label="Plano anterior"
                  className="h-9 w-9 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                  {plans.map((p, i) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPlanIndex(i)}
                      aria-label={`Ver plano ${p.name || BILLING_PLAN_LABELS[p.id]}`}
                      className={`h-2 rounded-full transition-all ${i === planIndex ? 'w-6 bg-[var(--color-primary)]' : 'w-2 bg-[var(--color-border)]'}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => goToPlan(1)}
                  aria-label="Próximo plano"
                  className="h-9 w-9 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]">
        <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center flex flex-col items-center gap-5">
          <Clock size={28} className="opacity-70 animate-float-slow" />
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold">Comece a receber agendamentos hoje mesmo</h2>
          <p className="text-sm sm:text-base opacity-80 max-w-lg">
            Crie sua conta agora — leva menos de 2 minutos, e você não precisa saber nada de tecnologia.
          </p>
          <Link to={platformRoutes.signup}>
            <Button size="lg" icon={<ArrowRight size={18} />} className="transition-transform hover:scale-105 active:scale-95">Criar meu site grátis</Button>
          </Link>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-muted-foreground)]">
        <span>© {new Date().getFullYear()} {APP_NAME}. Uma plataforma Hello Inova.</span>
        <div className="flex items-center gap-5">
          <Link to={legalRoutes.terms} className="hover:text-[var(--color-foreground)]">Termos de Uso</Link>
          <Link to={legalRoutes.privacy} className="hover:text-[var(--color-foreground)]">Privacidade</Link>
          <Link to={legalRoutes.cookies} className="hover:text-[var(--color-foreground)]">Cookies</Link>
        </div>
      </footer>
    </div>
  )
}
