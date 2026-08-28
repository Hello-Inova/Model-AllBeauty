import { useEffect, useState } from 'react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useBusinessContext } from '../../contexts/BusinessContext'
import { dataRepository } from '../../repositories'
import type { Business, BookingDepositPolicy, DaySchedule, ImageAsset } from '../../types'
import { Button, Field, Input, SectionCard, Select, TextArea } from '../../components/Form'
import { ImageUploader } from '../../components/ImageUploader'
import { WeeklyHoursEditor } from '../../components/admin/WeeklyHoursEditor'
import { useToast } from '../../contexts/ToastContext'
import { Save } from 'lucide-react'

type Tab = 'identidade' | 'contato' | 'horarios' | 'politicas'

export function SettingsAdminPage() {
  const business = useCurrentBusiness()!
  const { refresh } = useBusinessContext()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('identidade')
  const [form, setForm] = useState<Business>(business)
  const [saving, setSaving] = useState(false)

  useEffect(() => setForm(business), [business])

  function set<K extends keyof Business>(key: K, value: Business[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await dataRepository.updateBusiness(business.id, form)
      toast.success('Configurações salvas com sucesso.')
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'identidade', label: 'Identidade visual' },
    { id: 'contato', label: 'Contato & redes' },
    { id: 'horarios', label: 'Horários' },
    { id: 'politicas', label: 'Políticas de agendamento' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Configurações</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Personalize a identidade e as regras da sua empresa — sem precisar mexer em código.</p>
        </div>
        <Button icon={<Save size={16} />} loading={saving} onClick={handleSave}>Salvar alterações</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${tab === t.id ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted-foreground)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'identidade' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <SectionCard title="Dados da empresa">
            <div className="flex flex-col gap-4">
              <Field label="Nome da empresa" required><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
              <Field label="Nome de exibição" hint="Como aparece no site e no cabeçalho"><Input value={form.displayName} onChange={(e) => set('displayName', e.target.value)} /></Field>
              <Field label="Segmento"><Input value={form.segment} onChange={(e) => set('segment', e.target.value)} placeholder="Ex: Salão de beleza" /></Field>
              <Field label="Descrição"><TextArea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} /></Field>
            </div>
          </SectionCard>

          <SectionCard title="Cores e imagens">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <ColorField label="Cor primária" value={form.primaryColor} onChange={(v) => set('primaryColor', v)} />
                <ColorField label="Cor secundária" value={form.secondaryColor} onChange={(v) => set('secondaryColor', v)} />
                <ColorField label="Cor de destaque" value={form.accentColor} onChange={(v) => set('accentColor', v)} />
                <ColorField label="Cor de fundo" value={form.backgroundColor} onChange={(v) => set('backgroundColor', v)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ImageUploader label="Logo" aspect="aspect-square" value={form.logo} onChange={(img) => set('logo', img as ImageAsset)} />
                <ImageUploader label="Favicon" aspect="aspect-square" value={form.favicon} onChange={(img) => set('favicon', img as ImageAsset)} />
              </div>
              <ImageUploader label="Imagem de capa" value={form.coverImage} onChange={(img) => set('coverImage', img as ImageAsset)} />
              <ImageUploader label="Imagem de destaque (Hero)" value={form.heroImage} onChange={(img) => set('heroImage', img as ImageAsset)} />
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'contato' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <SectionCard title="Contato">
            <div className="flex flex-col gap-4">
              <Field label="Telefone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
              <Field label="WhatsApp" hint="Apenas números com DDI, ex: 5511987654321"><Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
              <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
            </div>
          </SectionCard>
          <SectionCard title="Redes sociais">
            <div className="flex flex-col gap-4">
              <Field label="Instagram"><Input value={form.instagram ?? ''} onChange={(e) => set('instagram', e.target.value)} placeholder="https://instagram.com/..." /></Field>
              <Field label="Facebook"><Input value={form.facebook ?? ''} onChange={(e) => set('facebook', e.target.value)} placeholder="https://facebook.com/..." /></Field>
              <Field label="TikTok"><Input value={form.tiktok ?? ''} onChange={(e) => set('tiktok', e.target.value)} placeholder="https://tiktok.com/@..." /></Field>
              <Field label="Website"><Input value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} /></Field>
            </div>
          </SectionCard>
          <SectionCard title="Endereço">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Endereço" hint="Rua, número e bairro"><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
              <Field label="CEP"><Input value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} /></Field>
              <Field label="Cidade"><Input value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
              <Field label="Estado"><Input value={form.state} onChange={(e) => set('state', e.target.value)} /></Field>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'horarios' && (
        <SectionCard title="Horário de funcionamento" description="Defina os dias e horários em que sua empresa atende (você pode adicionar intervalos, como almoço).">
          <WeeklyHoursEditor value={form.workingHours} onChange={(v: DaySchedule[]) => set('workingHours', v)} />
        </SectionCard>
      )}

      {tab === 'politicas' && (
        <SectionCard title="Regras de agendamento">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Antecedência mínima (minutos)"><Input type="number" min={0} value={form.bookingPolicies.minAdvanceMinutes} onChange={(e) => set('bookingPolicies', { ...form.bookingPolicies, minAdvanceMinutes: Number(e.target.value) })} /></Field>
            <Field label="Máximo de dias no futuro"><Input type="number" min={1} value={form.bookingPolicies.maxAdvanceDays} onChange={(e) => set('bookingPolicies', { ...form.bookingPolicies, maxAdvanceDays: Number(e.target.value) })} /></Field>
            <Field label="Janela de cancelamento (horas)"><Input type="number" min={0} value={form.bookingPolicies.cancellationWindowHours} onChange={(e) => set('bookingPolicies', { ...form.bookingPolicies, cancellationWindowHours: Number(e.target.value) })} /></Field>
            <Field label="Intervalo entre agendamentos (minutos)"><Input type="number" min={0} value={form.bookingPolicies.bufferBetweenAppointmentsMinutes} onChange={(e) => set('bookingPolicies', { ...form.bookingPolicies, bufferBetweenAppointmentsMinutes: Number(e.target.value) })} /></Field>
            <Field label="Tolerância de atraso (minutos)"><Input type="number" min={0} value={form.bookingPolicies.lateToleranceMinutes} onChange={(e) => set('bookingPolicies', { ...form.bookingPolicies, lateToleranceMinutes: Number(e.target.value) })} /></Field>
            <Field label="Política de pagamento">
              <Select value={form.bookingPolicies.paymentPolicy} onChange={(e) => set('bookingPolicies', { ...form.bookingPolicies, paymentPolicy: e.target.value as BookingDepositPolicy })}>
                <option value="none">Sem cobrança pelo site</option>
                <option value="pay_on_site">Pagamento no local</option>
                <option value="deposit">Sinal antecipado</option>
                <option value="full_payment">Pagamento integral antecipado</option>
              </Select>
            </Field>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-4">
            Integrações de pagamento (Asaas, Mercado Pago, Stripe) podem ser conectadas futuramente sem alterar esta tela.
          </p>
        </SectionCard>
      )}
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-10 rounded-md border border-[var(--color-border)] shrink-0 cursor-pointer" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  )
}
