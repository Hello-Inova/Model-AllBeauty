import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Globe,
  LayoutDashboard,
  ListChecks,
  Menu,
  MonitorSmartphone,
  Palette,
  PiggyBank,
  Rocket,
  Scissors,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react'
import { dataRepository } from '../repositories'
import type { BillingPlanDef } from '../types'
import { Button } from '../components/Form'
import { Reveal } from '../components/Reveal'
import { HowItWorks } from '../components/landing/HowItWorks'
import { InstagramVsSite } from '../components/landing/InstagramVsSite'
import { ProductTour, type TourStep } from '../components/landing/ProductTour'
import { FAQSection, type FAQItem } from '../components/landing/FAQSection'
import { MobileStickyCTA } from '../components/landing/MobileStickyCTA'
import { APP_NAME, DEFAULT_BUSINESS_SLUG } from '../config'
import { platformRoutes, publicRoutes, legalRoutes } from '../utils/routes'
import { BILLING_PLAN_LABELS, formatCents, planDiscountPercent, planFinalPriceCents, planMonthlyEquivalentCents, planYearlySavingsCents } from '../utils/billing'

// No mobile/tablet (grade de até 2 colunas) mostramos 3 cards recolhidos;
// no desktop (grade de 4 colunas) mostramos 4, preenchendo a linha inteira
// em vez de deixar um espaço vazio. O 4º card fica sempre no DOM (índice 3
// de FEATURES) mas só aparece a partir do breakpoint `lg` — ver o `hidden
// lg:block` aplicado abaixo no card recolhido de índice >= COLLAPSED_COUNT.
const FEATURES_COLLAPSED_COUNT = 3
const FEATURES_COLLAPSED_COUNT_DESKTOP = 4

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

// Os 4 passos abaixo refletem o fluxo real de cadastro e onboarding do
// produto (ver o comentário em src/components/landing/HowItWorks.tsx).
const HOW_IT_WORKS_STEPS = [
  { icon: ListChecks, title: 'Escolha seu segmento', text: 'Diga o que é o seu negócio — salão, clínica, barbearia e outros — e já comece com tudo pensado pro seu tipo de negócio.' },
  { icon: Palette, title: 'Personalize', text: 'Adicione logo, cores, fotos, serviços, profissionais e horários de atendimento.' },
  { icon: Globe, title: 'Publique', text: 'Seu site já fica no ar automaticamente — é só compartilhar o link com seus clientes.' },
  { icon: CalendarCheck2, title: 'Receba agendamentos', text: 'Seu cliente escolhe o serviço e o horário direto pelo site, sem precisar te chamar no WhatsApp.' },
]

// Sequência do tour (ver comentário em ProductTour.tsx) — nomes alinhados
// às telas reais do painel (adminRoutes em utils/routes.ts).
const TOUR_STEPS: TourStep[] = [
  { icon: LayoutDashboard, tab: 'Dashboard', title: 'Um painel com a visão geral do seu negócio', text: 'Acompanhe agendamentos, clientes e a situação da sua assinatura, tudo em um só lugar.' },
  { icon: Palette, tab: 'Personalização', title: 'Deixe o site com a cara do seu negócio', text: 'Logo, cores e identidade visual ficam a seu critério — o site parece feito sob medida para você.' },
  { icon: Scissors, tab: 'Serviços', title: 'Cadastre seu catálogo completo', text: 'Categorias, serviços, preços, duração e os profissionais responsáveis por cada atendimento.' },
  { icon: CalendarClock, tab: 'Agenda', title: 'Configure seus horários de atendimento', text: 'Defina os dias e horários disponíveis — a agenda online passa a respeitar essa configuração automaticamente.' },
  { icon: MonitorSmartphone, tab: 'Site do cliente', title: 'Seu site, pronto para receber visitas', text: 'Seus clientes acessam pelo celular ou computador e encontram tudo o que precisam saber sobre o seu negócio.' },
  { icon: CalendarCheck2, tab: 'Agendamento', title: 'O cliente escolhe o serviço e o horário', text: 'Em poucos cliques o agendamento fica concluído — sem trocar mensagem, a qualquer hora do dia.' },
]

// Perguntas frequentes — só o que o produto realmente oferece hoje (ver
// comentário em FAQSection.tsx sobre a pergunta de domínio próprio).
const FAQS: FAQItem[] = [
  { question: 'Preciso saber programar?', answer: 'Não. Você personaliza seu site inteiro pelo painel administrativo — cores, logo, serviços e horários — sem escrever nenhuma linha de código.' },
  { question: 'Posso personalizar meu site?', answer: 'Sim. Cores, logo, fotos e a identidade visual do seu negócio ficam a seu critério, direto pelo painel.' },
  { question: 'Posso adicionar minha logo e minhas imagens?', answer: 'Sim. Você pode enviar sua logo, imagem de capa, galeria de fotos e vídeos do seu negócio.' },
  { question: 'Posso cadastrar meus serviços?', answer: 'Sim. Você cadastra categorias, serviços, preços, duração e os profissionais responsáveis por cada atendimento.' },
  { question: 'Meus clientes conseguem agendar pelo site?', answer: 'Sim. Seus clientes escolhem o serviço e o horário direto pelo site, a qualquer hora do dia — sem precisar chamar no WhatsApp.' },
  { question: 'O site funciona no celular?', answer: 'Sim. O site e o painel administrativo funcionam bem no celular, já que é por onde a maioria dos seus clientes acessa.' },
  { question: 'Posso cancelar minha assinatura?', answer: 'Sim, você pode cancelar quando quiser, direto na área de Assinatura do seu painel administrativo.' },
  { question: 'Quais planos estão disponíveis?', answer: 'Mensal, semestral e anual — quanto maior o ciclo, maior o desconto. Os valores atualizados ficam na seção de Planos, logo acima.' },
  { question: 'O que acontece depois que eu assino?', answer: 'Você já pode personalizar seu site, cadastrar seus serviços e compartilhar o link com seus clientes — tudo na hora, pelo painel administrativo.' },
  { question: 'Posso utilizar meu próprio domínio?', answer: 'Hoje cada negócio recebe um endereço próprio dentro da plataforma, fácil de compartilhar nas redes sociais e no WhatsApp.' },
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

  // ---- Calculadora de economia (ITEM 8) — 100% derivada dos preços reais já
  // carregados via dataRepository.getPlans(); nunca inventa um valor. Quando
  // não há plano suficiente para comparar, `yearlySavingsCents` fica null e a
  // UI simplesmente omite o destaque de economia (ver JSX da seção Planos).
  const mensalPlan = plans.find((p) => p.id === 'mensal')
  const bestValuePlan = plans.reduce<BillingPlanDef | undefined>(
    (best, p) => (!best || planMonthlyEquivalentCents(p) < planMonthlyEquivalentCents(best) ? p : best),
    undefined,
  )
  const yearlySavingsCents = planYearlySavingsCents(mensalPlan, bestValuePlan)
  const savingsPeriodLabel = bestValuePlan?.months === 12 ? 'por ano' : bestValuePlan?.months === 6 ? 'no semestre' : bestValuePlan ? `a cada ${bestValuePlan.months} meses` : ''

  /**
   * Um único card de plano — usado tanto na grade estática do desktop (todos
   * os planos lado a lado, sem carrossel, já que cabem na tela) quanto no
   * carrossel de swipe do mobile/tablet (um plano por vez). Extraído aqui
   * pra não duplicar o markup entre as duas versões.
   */
  function renderPlanCard(p: BillingPlanDef) {
    const featured = p.discountCents > 0 && p.id === plans.reduce((a, b) => (b.discountCents > a.discountCents ? b : a), plans[0]).id
    const monthlyEquivalent = p.months > 1 ? planMonthlyEquivalentCents(p) : null
    return (
      <div className={`h-full rounded-xl border p-6 flex flex-col gap-4 ${featured ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] relative' : 'border-[var(--color-border)]'}`}>
        {featured && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-xs font-semibold bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-3 py-1 rounded-full whitespace-nowrap">
            <Star size={12} fill="currentColor" /> MELHOR CUSTO-BENEFÍCIO
          </span>
        )}
        <div>
          <p className="font-heading font-semibold">{p.name || BILLING_PLAN_LABELS[p.id]}</p>
          <p className="text-3xl font-heading font-semibold mt-1.5">{formatCents(planFinalPriceCents(p))}</p>
          {monthlyEquivalent !== null && <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">≈ {formatCents(monthlyEquivalent)}/mês</p>}
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
          <Button variant={featured ? 'primary' : 'outline'} className="w-full transition-transform hover:scale-[1.03] active:scale-95">Assinar agora</Button>
        </Link>
      </div>
    )
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
    <div className="min-h-screen bg-[var(--color-background)] pb-24 sm:pb-0">
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
            <a href="#faq" onClick={() => setMenuOpen(false)} className="py-2.5 text-[var(--color-muted-foreground)]">Perguntas frequentes</a>
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
            Seu negócio não precisa depender só das redes sociais e do WhatsApp. Ganhe um site profissional com agendamento online, painel
            administrativo completo e a identidade visual do seu negócio — sem precisar contratar um desenvolvedor.
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

      {/* Redes sociais x site próprio (ITEM 6 + reforço de posicionamento do ITEM 19) */}
      <section id="site-proprio" className="py-16 sm:py-20">
        <InstagramVsSite ctaTo={platformRoutes.signup} />
      </section>

      {/* Features / Benefícios (ITEM 5 — já escrito em tom de benefício comercial) */}
      <section id="recursos" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <Reveal className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Tudo em um só lugar</span>
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold mt-2">Feito para o dia a dia do seu negócio</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(featuresExpanded ? FEATURES : FEATURES.slice(0, FEATURES_COLLAPSED_COUNT_DESKTOP)).map((f, i) => (
            <Reveal
              key={f.title}
              delay={(i % FEATURES_COLLAPSED_COUNT_DESKTOP) * 80}
              className={!featuresExpanded && i >= FEATURES_COLLAPSED_COUNT ? 'hidden lg:block' : undefined}
            >
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

        {/* CTA "depois dos benefícios" (ITEM 13) */}
        <div className="flex justify-center mt-8">
          <Link to={platformRoutes.signup}>
            <Button size="lg" variant="outline" className="transition-transform hover:scale-105 active:scale-95">Começar agora</Button>
          </Link>
        </div>
      </section>

      {/* How it works (ITEM 4) */}
      <section id="como-funciona" className="bg-[var(--color-muted)] py-16 sm:py-20 overflow-hidden">
        <HowItWorks steps={HOW_IT_WORKS_STEPS} ctaTo={platformRoutes.signup} />
      </section>

      {/* Tour do produto (ITEM 20) */}
      <section id="tour" className="bg-[var(--color-muted)] py-16 sm:py-20">
        <ProductTour steps={TOUR_STEPS} ctaTo={platformRoutes.signup} />
      </section>

      {/* Pricing (ITEM 7 + calculadora de economia do ITEM 8) */}
      <section id="planos" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <Reveal className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Sem surpresas</span>
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold mt-2">Planos para todo tamanho de negócio</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2">Quanto maior o ciclo, maior o desconto. Cancele quando quiser.</p>
        </Reveal>
        {plans.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center">Carregando planos…</p>
        ) : (
          <>
            {/* Desktop: os planos cabem todos na tela, então mostramos os 3
                lado a lado numa grade fixa — sem carrossel, sem swipe. */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-stretch">
              {plans.map((p) => (
                <div key={p.id}>{renderPlanCard(p)}</div>
              ))}
            </div>

            {/* Mobile/tablet: carrossel de swipe, um plano por vez — mais
                confortável numa tela estreita do que espremer 3 cards. */}
            <div className="lg:hidden max-w-md mx-auto">
              <div
                className="overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="flex transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${planIndex * 100}%)` }}
                >
                  {plans.map((p) => (
                    <div key={p.id} className="w-full shrink-0 px-1">
                      {renderPlanCard(p)}
                    </div>
                  ))}
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

            {/* Calculadora de economia (ITEM 8) — só aparece com pelo menos 2
                planos carregados; o destaque de economia só aparece quando
                dá pra calculá-lo a partir dos preços reais (ver
                planYearlySavingsCents em utils/billing.ts). */}
            {plans.length > 1 && (
              <Reveal delay={150} className="mt-10 max-w-2xl mx-auto">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-5 py-5 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                    {plans.map((p) => (
                      <div key={p.id} className="text-center">
                        <p className="text-xs text-[var(--color-muted-foreground)]">{p.name || BILLING_PLAN_LABELS[p.id]}</p>
                        <p className="text-sm font-heading font-semibold">{formatCents(planMonthlyEquivalentCents(p))}/mês</p>
                      </div>
                    ))}
                  </div>
                  {yearlySavingsCents !== null && bestValuePlan && (
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-700 border-t border-[var(--color-border)] pt-4 text-center">
                      <PiggyBank size={16} className="shrink-0" />
                      Com o plano {bestValuePlan.name || BILLING_PLAN_LABELS[bestValuePlan.id]} você economiza {formatCents(yearlySavingsCents)} {savingsPeriodLabel}.
                    </div>
                  )}
                </div>
              </Reveal>
            )}
          </>
        )}
      </section>

      {/* FAQ (ITEM 15) */}
      <section id="faq" className="bg-[var(--color-muted)] py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-10">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold">Perguntas frequentes</h2>
          </Reveal>
          <FAQSection items={FAQS} />
        </div>
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
            <Button size="lg" icon={<ArrowRight size={18} />} className="transition-transform hover:scale-105 active:scale-95">Quero profissionalizar meu negócio</Button>
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

      {/* Barra de CTA fixa no mobile (ITEM 14) */}
      <MobileStickyCTA to={platformRoutes.signup} />
    </div>
  )
}
