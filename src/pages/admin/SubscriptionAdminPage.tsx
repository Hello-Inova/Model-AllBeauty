import { useEffect, useState } from 'react'
import { CreditCard, CalendarClock, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useBusinessContext, useCurrentBusiness } from '../../contexts/BusinessContext'
import { dataRepository } from '../../repositories'
import { getBillingStatus, subscribeBilling, type BillingStatusWithHistory } from '../../services/billing'
import type { BillingPlanDef, BillingPlanId } from '../../types'
import { Badge, Button, Field, Input, SectionCard } from '../../components/Form'
import { ScrollableTable, Td, Th } from '../../components/ScrollableTable'
import { useToast } from '../../contexts/ToastContext'
import {
  BILLING_PLAN_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  daysUntil,
  formatCents,
  planDiscountPercent,
  planFinalPriceCents,
} from '../../utils/billing'
import { formatDateShort } from '../../utils/format'

export function SubscriptionAdminPage() {
  const business = useCurrentBusiness()!
  const { refresh } = useBusinessContext()
  const toast = useToast()

  const [plans, setPlans] = useState<BillingPlanDef[]>([])
  const [status, setStatus] = useState<BillingStatusWithHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  // Só usado enquanto a empresa ainda não tem nenhuma assinatura ativa —
  // é quando o próprio admin pode escolher o plano (ver `canChoosePlan`
  // abaixo). Depois de ativa, a troca continua exigindo o Super Admin.
  const [selectedPlanId, setSelectedPlanId] = useState<BillingPlanId | null>(null)

  async function load() {
    setLoading(true)
    const [p, s] = await Promise.all([dataRepository.getPlans(), getBillingStatus(business.id)])
    setPlans(p)
    setStatus(s)
    setSelectedPlanId((prev) => prev ?? s.billingPlan)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id])

  if (business.billingType === 'isento') {
    return (
      <SectionCard title="Assinatura">
        <div className="flex items-center gap-2.5 text-sm text-[var(--color-muted-foreground)]">
          <ShieldCheck size={18} className="text-emerald-600" />
          Esta empresa está marcada como cortesia (isenta) pela Hello Inova — não há cobrança configurada.
        </div>
      </SectionCard>
    )
  }

  const days = daysUntil(status?.planExpiresAt)
  const statusTone =
    status?.subscriptionStatus === 'ativa' ? 'success' : status?.subscriptionStatus === 'atrasada' ? 'danger' : 'default'
  // Antes da primeira assinatura, o admin da empresa pode escolher o plano
  // aqui mesmo no painel — depois de ativa, a troca passa a exigir o Super
  // Admin (mesma regra já aplicada no endpoint /api/billing/subscribe).
  const canChoosePlan = status?.subscriptionStatus === 'sem_assinatura'
  const highlightedPlanId = canChoosePlan ? selectedPlanId : (status?.billingPlan ?? business.billingPlan)
  // O card "Status atual" acompanha o plano clicado em "Planos disponíveis"
  // enquanto ainda não há assinatura ativa — é só uma prévia (o texto de
  // status/cobrança abaixo continua fiel ao que já está gravado; nada é
  // cobrado até a confirmação do pagamento no modal).
  const displayPlanId = canChoosePlan && selectedPlanId ? selectedPlanId : (status?.billingPlan ?? business.billingPlan)
  const currentPlan = plans.find((p) => p.id === displayPlanId)

  async function handleSubscribed() {
    setModalOpen(false)
    toast.success('Assinatura confirmada! O cartão informado será cobrado automaticamente a cada ciclo.')
    await Promise.all([load(), refresh()])
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Assinatura</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Gerencie o plano e o cartão usado para pagar a mensalidade da plataforma.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="Status atual">
          {loading || !status ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Carregando…</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Badge tone={statusTone as 'success' | 'danger' | 'default'}>{SUBSCRIPTION_STATUS_LABELS[status.subscriptionStatus] ?? status.subscriptionStatus}</Badge>
                <span className="text-sm font-medium">{BILLING_PLAN_LABELS[displayPlanId] ?? displayPlanId}</span>
              </div>
              {currentPlan && <p className="text-2xl font-heading font-semibold">{formatCents(planFinalPriceCents(currentPlan))}</p>}
              {canChoosePlan && (
                <p className="text-xs text-[var(--color-muted-foreground)] -mt-2">Prévia do plano selecionado — confirme o pagamento para ativar.</p>
              )}
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                <CalendarClock size={15} />
                {status.planExpiresAt
                  ? days !== null && days < 0
                    ? `Venceu em ${formatDateShort(status.planExpiresAt.slice(0, 10))} (há ${Math.abs(days)} dia${Math.abs(days) === 1 ? '' : 's'})`
                    : `Próxima cobrança: ${formatDateShort(status.planExpiresAt.slice(0, 10))}${days !== null ? ` (em ${days} dia${days === 1 ? '' : 's'})` : ''}`
                  : 'Nenhuma assinatura ativa ainda'}
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                <CreditCard size={15} />
                {status.cardBrand && status.cardLast4 ? `${status.cardBrand} •••• ${status.cardLast4}` : 'Nenhum cartão cadastrado'}
              </div>
              <Button icon={<CreditCard size={16} />} onClick={() => setModalOpen(true)} className="self-start mt-1">
                {status.cardLast4 ? 'Atualizar cartão' : 'Pagar agora'}
              </Button>
            </div>
          )}
        </SectionCard>

        <div className="lg:col-span-2">
          <SectionCard title="Planos disponíveis">
            <div className="grid sm:grid-cols-3 gap-3">
              {plans.map((p) => {
                const selected = p.id === highlightedPlanId
                const cardClass = `rounded-xl border p-4 flex flex-col gap-1.5 text-left w-full transition ${
                  selected ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-border)]'
                } ${canChoosePlan ? 'cursor-pointer hover:border-[var(--color-primary)]/60' : ''}`
                const content = (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-semibold text-sm">{p.name}</span>
                      {selected && <CheckCircle2 size={16} className="text-[var(--color-primary)]" />}
                    </div>
                    <p className="text-lg font-heading font-semibold">{formatCents(planFinalPriceCents(p))}</p>
                    {p.discountCents > 0 && (
                      <p className="text-xs text-emerald-700">
                        {planDiscountPercent(p)}% de desconto (de {formatCents(p.priceCents)})
                      </p>
                    )}
                  </>
                )
                return canChoosePlan ? (
                  <button key={p.id} type="button" onClick={() => setSelectedPlanId(p.id)} aria-pressed={selected} className={cardClass}>
                    {content}
                  </button>
                ) : (
                  <div key={p.id} className={cardClass}>
                    {content}
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-3">
              {canChoosePlan
                ? 'Escolha um plano acima e clique em "Pagar agora", ao lado, para ativar sua assinatura.'
                : 'Para trocar de plano, fale com a Hello Inova — a alteração é feita pelo Super Admin.'}
            </p>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Histórico de pagamentos">
        {!status || status.transactions.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">Nenhuma cobrança registrada ainda.</p>
        ) : (
          <ScrollableTable>
            <table>
              <thead>
                <tr>
                  <Th>Vencimento</Th>
                  <Th>Valor</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {status.transactions.map((t) => (
                  <tr key={t.id}>
                    <Td>{t.dueDate ? formatDateShort(t.dueDate.slice(0, 10)) : '—'}</Td>
                    <Td>{formatCents(t.valueCents)}</Td>
                    <Td>
                      <Badge tone={t.status === 'received' || t.status === 'confirmed' ? 'success' : t.status === 'overdue' || t.status === 'refused' ? 'danger' : 'default'}>
                        {t.status}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
        )}
      </SectionCard>

      {modalOpen && (
        <CardModal
          businessId={business.id}
          billingPlan={canChoosePlan ? (selectedPlanId ?? undefined) : undefined}
          planToConfirm={canChoosePlan ? plans.find((p) => p.id === selectedPlanId) : undefined}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSubscribed}
        />
      )}
    </div>
  )
}

function CardModal({
  businessId,
  billingPlan,
  planToConfirm,
  onClose,
  onSuccess,
}: {
  businessId: string
  billingPlan?: BillingPlanId
  planToConfirm?: BillingPlanDef
  onClose: () => void
  onSuccess: () => void
}) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    cardNumber: '',
    cardHolderName: '',
    cardExpiryMonth: '',
    cardExpiryYear: '',
    cardCcv: '',
    holderCpfCnpj: '',
    holderEmail: '',
    holderPostalCode: '',
    holderAddressNumber: '',
    holderPhone: '',
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await subscribeBilling({ businessId, billingPlan, ...form })
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível confirmar o pagamento.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4 py-8" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div>
          <h2 className="font-heading text-lg font-semibold">Dados de pagamento</h2>
          {planToConfirm && (
            <p className="text-sm mt-1.5">
              Plano escolhido: <span className="font-medium">{planToConfirm.name}</span> —{' '}
              <span className="font-medium">{formatCents(planFinalPriceCents(planToConfirm))}</span>
            </p>
          )}
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            Pagamento processado via cartão de crédito. Seus dados são enviados diretamente ao gateway de pagamento e não ficam salvos neste
            painel — apenas a bandeira e os 4 últimos dígitos, para você reconhecer o cartão.
          </p>
        </div>

        <Field label="Número do cartão" required>
          <Input required value={form.cardNumber} onChange={(e) => set('cardNumber', e.target.value)} placeholder="0000 0000 0000 0000" inputMode="numeric" />
        </Field>
        <Field label="Nome impresso no cartão" required>
          <Input required value={form.cardHolderName} onChange={(e) => set('cardHolderName', e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Mês" required>
            <Input required value={form.cardExpiryMonth} onChange={(e) => set('cardExpiryMonth', e.target.value)} placeholder="MM" inputMode="numeric" maxLength={2} />
          </Field>
          <Field label="Ano" required>
            <Input required value={form.cardExpiryYear} onChange={(e) => set('cardExpiryYear', e.target.value)} placeholder="AAAA" inputMode="numeric" maxLength={4} />
          </Field>
          <Field label="CVV" required>
            <Input required value={form.cardCcv} onChange={(e) => set('cardCcv', e.target.value)} placeholder="123" inputMode="numeric" maxLength={4} />
          </Field>
        </div>

        <div className="border-t border-[var(--color-border)] pt-3 mt-1">
          <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-3">Dados do titular do cartão (exigidos pelo gateway de pagamento)</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CPF ou CNPJ" required className="col-span-2">
              <Input required value={form.holderCpfCnpj} onChange={(e) => set('holderCpfCnpj', e.target.value)} />
            </Field>
            <Field label="E-mail">
              <Input type="email" value={form.holderEmail} onChange={(e) => set('holderEmail', e.target.value)} />
            </Field>
            <Field label="Telefone">
              <Input value={form.holderPhone} onChange={(e) => set('holderPhone', e.target.value)} />
            </Field>
            <Field label="CEP" required>
              <Input required value={form.holderPostalCode} onChange={(e) => set('holderPostalCode', e.target.value)} />
            </Field>
            <Field label="Número do endereço" required>
              <Input required value={form.holderAddressNumber} onChange={(e) => set('holderAddressNumber', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting} icon={<CreditCard size={16} />}>
            Confirmar pagamento
          </Button>
        </div>
      </form>
    </div>
  )
}
