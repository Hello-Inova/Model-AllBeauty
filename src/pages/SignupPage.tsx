import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Rocket, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dataRepository } from '../repositories'
import type { BillingPlanDef } from '../types'
import { Button, Field, Input, PasswordInput } from '../components/Form'
import { adminRoutes } from '../utils/routes'
import { BILLING_PLAN_LABELS, formatCents, planDiscountPercent, planFinalPriceCents } from '../utils/billing'

/**
 * Public, unauthenticated self-service signup — the entry point for a new
 * business owner to create their own account, pick a billing plan, and get
 * a brand-new site, with no Hello Inova step in between (see api/auth/
 * [...action].ts `register`). Payment itself happens afterwards, from the
 * Assinatura screen — this page only picks the plan and creates the
 * account; the dashboard's onboarding checklist walks the owner through
 * paying, branding, and publishing from there.
 */
export function SignupPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [plans, setPlans] = useState<BillingPlanDef[]>([])
  const [businessName, setBusinessName] = useState('')
  const [segment, setSegment] = useState('Salão de beleza')
  const [whatsapp, setWhatsapp] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [billingPlan, setBillingPlan] = useState('mensal')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    dataRepository
      .getPlans()
      .then((p) => setPlans(p.filter((x) => x.active)))
      .catch(() => setPlans([]))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (businessName.trim().length < 2) {
      setError('Informe o nome do seu negócio.')
      return
    }
    if (adminPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setSubmitting(true)
    const result = await register({
      businessName: businessName.trim(),
      segment,
      whatsapp,
      phone: whatsapp,
      adminEmail: adminEmail.trim(),
      adminPassword,
      billingPlan,
    })
    setSubmitting(false)
    if (result.ok && result.businessSlug) {
      navigate(adminRoutes.dashboard(result.businessSlug))
    } else {
      setError(result.error ?? 'Não foi possível criar sua conta. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-muted)] px-4 py-10 sm:py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
            <Sparkles size={14} /> Crie seu site em minutos
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold mt-2">Comece agora</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2 max-w-lg mx-auto">
            Crie sua conta, escolha um plano e ganhe um site completo para agendamentos do seu negócio. Você personaliza cores, logo e
            serviços depois — sem pressa, direto do seu painel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8 flex flex-col gap-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome do seu negócio" required className="sm:col-span-2">
              <Input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ex: Espaço Bella Hair" />
            </Field>
            <Field label="Segmento">
              <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="Salão de beleza" />
            </Field>
            <Field label="WhatsApp" hint="Opcional — dá para preencher depois">
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
            </Field>
            <Field label="Seu e-mail de acesso" required>
              <Input required type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="voce@seunegocio.com" />
            </Field>
            <Field label="Crie uma senha" required hint="Mínimo de 6 caracteres" error={error ?? undefined}>
              <PasswordInput required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" />
            </Field>
          </div>

          <div>
            <p className="text-sm font-medium mb-2.5">Escolha seu plano</p>
            {plans.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">Carregando planos…</p>
            ) : (
              <div className="grid sm:grid-cols-3 gap-3">
                {plans.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setBillingPlan(p.id)}
                    className={`text-left rounded-xl border p-4 flex flex-col gap-1.5 transition ${
                      billingPlan === p.id ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-semibold text-sm">{p.name || BILLING_PLAN_LABELS[p.id]}</span>
                      {billingPlan === p.id && <CheckCircle2 size={16} className="text-[var(--color-primary)]" />}
                    </div>
                    <p className="text-lg font-heading font-semibold">{formatCents(planFinalPriceCents(p))}</p>
                    {p.discountCents > 0 && (
                      <p className="text-xs text-emerald-700">{planDiscountPercent(p)}% de desconto (de {formatCents(p.priceCents)})</p>
                    )}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-[var(--color-muted-foreground)] mt-2.5">
              O pagamento é feito depois, direto no seu painel — sua conta e seu site já ficam prontos agora.
            </p>
          </div>

          <Button type="submit" icon={<Rocket size={16} />} loading={submitting} size="lg">
            Criar minha conta e começar
          </Button>
        </form>
      </div>
    </div>
  )
}
