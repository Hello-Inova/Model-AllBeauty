import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { dataRepository } from '../../repositories'
import type { PlatformSettings } from '../../types'
import { Button, Field, Input, SectionCard } from '../../components/Form'
import { useToast } from '../../contexts/ToastContext'

const EMPTY_SETTINGS: PlatformSettings = { pixKey: '', pixKeyOwnerName: '', trialDays: 7 }

export function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(EMPTY_SETTINGS)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setSettings(await dataRepository.getPlatformSettings())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Configurações da plataforma</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Dados globais da Hello Inova usados em toda a plataforma.</p>
      </div>

      <SectionCard title="Configurações comerciais" description="Defina o teste grátis para novas empresas e os dados de pagamento alternativo.">
        {loading ? <p className="text-sm text-[var(--color-muted-foreground)]">Carregando…</p> : <PlatformSettingsForm settings={settings} onSaved={load} />}
      </SectionCard>
    </div>
  )
}

function PlatformSettingsForm({ settings, onSaved }: { settings: PlatformSettings; onSaved: () => void }) {
  const toast = useToast()
  const [pixKey, setPixKey] = useState(settings.pixKey)
  const [pixKeyOwnerName, setPixKeyOwnerName] = useState(settings.pixKeyOwnerName)
  const [trialDays, setTrialDays] = useState(String(settings.trialDays))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPixKey(settings.pixKey)
    setPixKeyOwnerName(settings.pixKeyOwnerName)
    setTrialDays(String(settings.trialDays))
  }, [settings])

  async function handleSave() {
    const parsedTrialDays = Number(trialDays)
    if (!Number.isInteger(parsedTrialDays) || parsedTrialDays < 1 || parsedTrialDays > 90) {
      toast.error('Informe um período de teste entre 1 e 90 dias.')
      return
    }
    setSaving(true)
    try {
      await dataRepository.updatePlatformSettings({ pixKey, pixKeyOwnerName, trialDays: parsedTrialDays })
      toast.success('Configurações salvas.')
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4 items-end">
      <Field label="Dias de teste grátis" hint="Aplicado somente às empresas criadas depois desta alteração (mínimo 1, máximo 90 dias).">
        <Input type="number" min={1} max={90} step={1} value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
      </Field>
      <div className="hidden sm:block" />
      <Field label="Chave Pix da Hello Inova" hint="Enviada nas mensagens de cobrança por WhatsApp, junto ao botão de pagamento por cartão.">
        <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CNPJ, e-mail, telefone ou chave aleatória" />
      </Field>
      <Field label="Nome do titular da chave Pix">
        <Input value={pixKeyOwnerName} onChange={(e) => setPixKeyOwnerName(e.target.value)} placeholder="Hello Inova Ltda" />
      </Field>
      <Button icon={<Save size={16} />} loading={saving} onClick={handleSave} className="self-start">
        Salvar configurações
      </Button>
    </div>
  )
}
