import { useState } from 'react'
import { Plus, Trash2, Images, ArrowUp, ArrowDown, Pencil, Camera } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useGallery } from '../../hooks/useEntities'
import { dataRepository, imageStorage } from '../../repositories'
import type { GalleryImage, ImageAsset } from '../../types'
import { Badge, Button, EmptyState, Field, Input, Toggle } from '../../components/Form'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ImageUploader } from '../../components/ImageUploader'
import { SmartImage } from '../../components/SmartImage'
import { useToast } from '../../contexts/ToastContext'

interface FormState {
  title: string
  description: string
  image?: ImageAsset
  active: boolean
}
const emptyForm: FormState = { title: '', description: '', active: true }

export function GalleryAdminPage() {
  const business = useCurrentBusiness()!
  const { data: gallery, refresh } = useGallery(business.id)
  const toast = useToast()
  const [editing, setEditing] = useState<GalleryImage | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<GalleryImage | null>(null)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }
  function openEdit(g: GalleryImage) {
    setEditing(g)
    setForm({ title: g.title ?? '', description: g.description ?? '', image: g.image, active: g.active })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.image) {
      toast.error('Adicione uma imagem.')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await dataRepository.updateGalleryImage(editing.id, { title: form.title, description: form.description, image: form.image, active: form.active })
        toast.success('Imagem atualizada.')
      } else {
        await dataRepository.createGalleryImage({ businessId: business.id, title: form.title, description: form.description, image: form.image, active: form.active, order: gallery.length })
        toast.success('Imagem adicionada à galeria.')
      }
      setModalOpen(false)
      refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    await imageStorage.deleteImage(deleting.image)
    await dataRepository.deleteGalleryImage(deleting.id)
    toast.success('Imagem removida.')
    setDeleting(null)
    refresh()
  }

  async function move(g: GalleryImage, dir: -1 | 1) {
    const sorted = [...gallery].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((x) => x.id === g.id)
    const swapWith = sorted[idx + dir]
    if (!swapWith) return
    const ids = sorted.map((x) => x.id)
    ;[ids[idx], ids[idx + dir]] = [ids[idx + dir], ids[idx]]
    await dataRepository.reorderGallery(business.id, ids)
    refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Galeria</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Fotos do ambiente e resultados.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>Adicionar imagem</Button>
      </div>

      {gallery.length === 0 ? (
        <EmptyState icon={<Images size={32} />} title="Nenhuma imagem na galeria" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...gallery].sort((a, b) => a.order - b.order).map((g, i, arr) => (
            <div key={g.id} className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-card)]">
              <div className="aspect-square">
                <SmartImage asset={g.image} alt={g.title || 'Imagem'} className="w-full h-full object-cover" icon={Camera} />
              </div>
              <div className="p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{g.title || 'Sem título'}</span>
                  <Badge tone={g.active ? 'success' : 'default'}>{g.active ? 'Ativa' : 'Oculta'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button disabled={i === 0} onClick={() => move(g, -1)} aria-label="Mover para cima" className="p-1.5 rounded-md hover:bg-[var(--color-muted)] disabled:opacity-30">
                      <ArrowUp size={14} />
                    </button>
                    <button disabled={i === arr.length - 1} onClick={() => move(g, 1)} aria-label="Mover para baixo" className="p-1.5 rounded-md hover:bg-[var(--color-muted)] disabled:opacity-30">
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(g)} aria-label="Editar" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><Pencil size={14} /></button>
                    <button onClick={() => setDeleting(g)} aria-label="Excluir" className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
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
        title={editing ? 'Editar imagem' : 'Nova imagem'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <ImageUploader label="Imagem" aspect="aspect-square" value={form.image} onChange={(img) => setForm((f) => ({ ...f, image: img }))} />
          <Field label="Título"><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Descrição"><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Visível no site" />
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Excluir imagem" message="Tem certeza que deseja excluir esta imagem da galeria?" confirmLabel="Excluir" danger onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  )
}
