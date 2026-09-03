import { useEffect, useState } from 'react'
import { CalendarCheck2, Save } from 'lucide-react'
import { dataRepository } from '../../repositories'
import type { BillingPlanDef } from '../../types'
import { Button, Field, Input, SectionCard } from '../../components/Form'
import { useToast } from '../../contexts/ToastContext'
import { BILLING_PLAN_LABELS, formatCents, planDiscountPercent } from '../../utils/billing'

export function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<BillingPlanDef[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setPlans(await dataRepository.getPlans())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Planos de assinatura</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Valores cobrados mensalmente das empresas via Asaas (cartão de crédito).</p>
      </div>

      <SectionCard title="Mensal, semestral e anual" description="Edite os valores abaixo — a mudança vale para a próxima cobrança de cada empresa nesse plano.">
        {loading ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">Carregando…</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {plans.map((p) => (
              <BillingPlanEditor key={p.id} plan={p} onSaved={load} />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Estrutura de planos do site" description="Recursos incluídos em cada nível de plano do site white-label — não relacionado à cobrança da mensalidade acima.">
        <div className="grid sm:grid-cols-3 gap-4">
          <PlanCard name="Básico" features={['Catálogo', 'Agendamento', '1 profissional']} />
          <PlanCard name="Profissional" features={['Vários profissionais', 'Clientes', 'Relatórios', 'WhatsApp']} highlighted />
          <PlanCard name="Premium" features={['Pagamentos', 'Automação', 'Relatórios avançados', 'Recursos adicionais']} />
        </div>
      </SectionCard>
    </div>
  )
}

function BillingPlanEditor({ plan, onSaved }: { plan: BillingPlanDef; onSaved: () => void }) {
  const toast = useToast()
  const [priceReais, setPriceReais] = useState((plan.priceCents / 100).toFixed(2))
  const [discountReais, setDiscountReais] = useState((plan.discountCents / 100).toFixed(2))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const priceCents = Math.round(parseFloat(priceReais.replace(',', '.')) * 100)
    const discountCents = Math.round(parseFloat(discountReais.replace(',', '.')) * 100)
    if (Number.isNaN(priceCents) || Number.isNaN(discountCents)) {
      toast.error('Informe valores numéricos válidos.')
      return
    }
    setSaving(true)
    try {
      await dataRepository.updatePlan(plan.id, { priceCents, discountCents })
      toast.success('Plano atualizado.')
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o plano.')
    } finally {
      setSaving(false)
    }
  }

  const finalCents = Math.round((parseFloat(priceReais.replace(',', '.')) || 0) * 100) - Math.round((parseFloat(discountReais.replace(',', '.')) || 0) * 100)

  return (
    <div className="rounded-xl border border-[var(--color-border)] p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <CalendarCheck2 size={16} className="text-[var(--color-primary)]" />
        <h3 className="font-heading font-semibold text-sm">{BILLING_PLAN_LABELS[plan.id] ?? plan.name}</h3>
      </div>
      <Field label="Valor cheio (R$)">
        <Input inputMode="decimal" value={priceReais} onChange={(e) => setPriceReais(e.target.value)} />
      </Field>
      <Field label="Desconto (R$)">
        <Input inputMode="decimal" value={discountReais} onChange={(e) => setDiscountReais(e.target.value)} />
      </Field>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Cobrado: <span className="font-medium">{formatCents(Math.max(finalCents, 0))}</span>
        {plan.discountCents > 0 && ` (${planDiscountPercent(plan)}% off atualmente salvo)`}
      </p>
      <Button size="sm" variant="outline" icon={<Save size={14} />} loading={saving} onClick={handleSave} className="self-start">
        Salvar
      </Button>
    </div>
  )
}

function PlanCard({ name, features, highlighted }: { name: string; features: string[]; highlighted?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${highlighted ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarCheck2 size={16} className="text-[var(--color-primary)]" />
        <h3 className="font-heading font-semibold">{name}</h3>
      </div>
      <ul className="flex flex-col gap-1.5 text-sm text-[var(--color-muted-foreground)]">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
    </div>
  )
}
