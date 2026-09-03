import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { dataRepository } from '../../repositories'
import type { PlatformSettings } from '../../types'
import { Button, Field, Input, SectionCard } from '../../components/Form'
import { useToast } from '../../contexts/ToastContext'

const EMPTY_SETTINGS: PlatformSettings = { pixKey: '', pixKeyOwnerName: '' }

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

      <SectionCard title="Chave Pix" description="Incluída automaticamente nas mensagens de cobrança enviadas às empresas via WhatsApp.">
        {loading ? <p className="text-sm text-[var(--color-muted-foreground)]">Carregando…</p> : <PlatformSettingsForm settings={settings} onSaved={load} />}
      </SectionCard>
    </div>
  )
}

function PlatformSettingsForm({ settings, onSaved }: { settings: PlatformSettings; onSaved: () => void }) {
  const toast = useToast()
  const [pixKey, setPixKey] = useState(settings.pixKey)
  const [pixKeyOwnerName, setPixKeyOwnerName] = useState(settings.pixKeyOwnerName)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPixKey(settings.pixKey)
    setPixKeyOwnerName(settings.pixKeyOwnerName)
  }, [settings])

  async function handleSave() {
    setSaving(true)
    try {
      await dataRepository.updatePlatformSettings({ pixKey, pixKeyOwnerName })
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
      <Field label="Chave Pix da Hello Inova" hint="Enviada nas mensagens de cobrança por WhatsApp, junto ao botão de pagamento por cartão.">
        <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CNPJ, e-mail, telefone ou chave aleatória" />
      </Field>
      <Field label="Nome do titular da chave Pix">
        <Input value={pixKeyOwnerName} onChange={(e) => setPixKeyOwnerName(e.target.value)} placeholder="Hello Inova Ltda" />
      </Field>
      <Button icon={<Wallet size={16} />} loading={saving} onClick={handleSave} className="self-start">
        Salvar configurações
      </Button>
    </div>
  )
}
