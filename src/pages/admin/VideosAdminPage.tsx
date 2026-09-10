import { useState } from 'react'
import { Plus, Trash2, Video as VideoIcon, ArrowUp, ArrowDown, Pencil } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useVideos } from '../../hooks/useEntities'
import { dataRepository, videoStorage } from '../../repositories'
import type { BusinessVideo, VideoAsset } from '../../types'
import { Badge, Button, EmptyState, Field, Input, Toggle } from '../../components/Form'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { VideoUploader } from '../../components/VideoUploader'
import { useToast } from '../../contexts/ToastContext'
import { MAX_VIDEOS_PER_BUSINESS, MAX_VIDEO_DURATION_SECONDS } from '../../config'

interface FormState {
  title: string
  video?: VideoAsset
  active: boolean
}
const emptyForm: FormState = { title: '', active: true }

export function VideosAdminPage() {
  const business = useCurrentBusiness()!
  const { data: videos, refresh } = useVideos(business.id)
  const toast = useToast()
  const [editing, setEditing] = useState<BusinessVideo | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<BusinessVideo | null>(null)
  const [saving, setSaving] = useState(false)

  const limitReached = videos.length >= MAX_VIDEOS_PER_BUSINESS

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }
  function openEdit(v: BusinessVideo) {
    setEditing(v)
    setForm({ title: v.title ?? '', video: v.video, active: v.active })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.video) {
      toast.error('Envie um vídeo ou informe uma URL.')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await dataRepository.updateVideo(editing.id, { title: form.title, video: form.video, active: form.active })
        toast.success('Vídeo atualizado.')
      } else {
        await dataRepository.createVideo({ businessId: business.id, title: form.title, video: form.video, active: form.active, order: videos.length })
        toast.success('Vídeo adicionado.')
      }
      setModalOpen(false)
      refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível salvar o vídeo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    await videoStorage.deleteVideo(deleting.video)
    await dataRepository.deleteVideo(deleting.id)
    toast.success('Vídeo removido.')
    setDeleting(null)
    refresh()
  }

  async function move(v: BusinessVideo, dir: -1 | 1) {
    const sorted = [...videos].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((x) => x.id === v.id)
    const swapWith = sorted[idx + dir]
    if (!swapWith) return
    const ids = sorted.map((x) => x.id)
    ;[ids[idx], ids[idx + dir]] = [ids[idx + dir], ids[idx]]
    await dataRepository.reorderVideos(business.id, ids)
    refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Vídeos</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Até {MAX_VIDEOS_PER_BUSINESS} vídeos, cada um com até {MAX_VIDEO_DURATION_SECONDS} segundos. Exibidos no site — em carrossel quando houver mais de um.
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate} disabled={limitReached}>
          Adicionar vídeo
        </Button>
      </div>

      {limitReached && (
        <p className="text-xs text-[var(--color-muted-foreground)] -mt-2">
          Limite de {MAX_VIDEOS_PER_BUSINESS} vídeos atingido. Remova um vídeo para adicionar outro.
        </p>
      )}

      {videos.length === 0 ? (
        <EmptyState
          icon={<VideoIcon size={32} />}
          title="Nenhum vídeo cadastrado"
          description={`Envie até ${MAX_VIDEOS_PER_BUSINESS} vídeos de até ${MAX_VIDEO_DURATION_SECONDS} segundos para exibir no seu site.`}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...videos].sort((a, b) => a.order - b.order).map((v, i, arr) => (
            <div key={v.id} className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-card)]">
              <div className="aspect-video bg-black">
                <video src={v.video.url} className="w-full h-full object-cover" controls muted playsInline />
              </div>
              <div className="p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{v.title || 'Sem título'}</span>
                  <Badge tone={v.active ? 'success' : 'default'}>{v.active ? 'Ativo' : 'Oculto'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button disabled={i === 0} onClick={() => move(v, -1)} aria-label="Mover para cima" className="p-1.5 rounded-md hover:bg-[var(--color-muted)] disabled:opacity-30">
                      <ArrowUp size={14} />
                    </button>
                    <button disabled={i === arr.length - 1} onClick={() => move(v, 1)} aria-label="Mover para baixo" className="p-1.5 rounded-md hover:bg-[var(--color-muted)] disabled:opacity-30">
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(v)} aria-label="Editar" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><Pencil size={14} /></button>
                    <button onClick={() => setDeleting(v)} aria-label="Excluir" className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar vídeo' : 'Novo vídeo'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <VideoUploader label="Vídeo" value={form.video} onChange={(video) => setForm((f) => ({ ...f, video }))} />
          <Field label="Título" hint="Opcional — usado apenas internamente">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Visível no site" />
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Excluir vídeo" message="Tem certeza que deseja excluir este vídeo?" confirmLabel="Excluir" danger onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  )
}
