import { useRef, useState } from 'react'
import { Download, Upload, DatabaseBackup, AlertTriangle } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { dataRepository } from '../../repositories'
import { Button, SectionCard } from '../../components/Form'
import { useToast } from '../../contexts/ToastContext'
import type { BusinessBackup } from '../../types'

export function BackupAdminPage() {
  const business = useCurrentBusiness()!
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  async function handleExport() {
    const backup = await dataRepository.exportBusinessBackup(business.id)
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${business.slug}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup exportado.')
  }

  async function handleImportFile(file: File) {
    setImporting(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as BusinessBackup
      if (!parsed.business || !parsed.business.id) throw new Error('Arquivo inválido')
      await dataRepository.importBusinessBackup(parsed)
      toast.success('Backup restaurado com sucesso. Atualize a página para ver os dados restaurados.')
    } catch {
      toast.error('Não foi possível importar este arquivo. Verifique se é um backup válido.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Backup</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Exporte ou restaure todos os dados desta empresa.</p>
      </div>

      <SectionCard title="Exportar dados">
        <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
          Gera um arquivo JSON com todos os dados desta empresa: serviços, categorias, profissionais, clientes, agendamentos, galeria e depoimentos.
        </p>
        <Button icon={<Download size={16} />} onClick={handleExport}>Exportar backup (.json)</Button>
      </SectionCard>

      <SectionCard title="Importar / restaurar dados">
        <p className="text-sm text-[var(--color-muted-foreground)] mb-4">Restaura os dados desta empresa a partir de um arquivo de backup exportado anteriormente.</p>
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])} />
        <Button variant="outline" icon={<Upload size={16} />} loading={importing} onClick={() => fileInputRef.current?.click()}>Selecionar arquivo de backup</Button>
      </SectionCard>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          No modo GitHub Pages, os dados ficam salvos apenas no armazenamento local deste navegador. Faça backups regularmente — limpar os dados do navegador ou trocar de dispositivo fará você perder o acesso aos dados atuais, a menos que restaure um backup.
        </p>
      </div>

      <SectionCard title="Sobre o armazenamento local">
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <DatabaseBackup size={16} /> Dados armazenados localmente (localStorage + IndexedDB para imagens anexadas).
        </div>
      </SectionCard>
    </div>
  )
}
