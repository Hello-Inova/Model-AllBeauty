import { useState } from 'react'
import { Plus, Pencil, Trash2, Quote, Star } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useTestimonials } from '../../hooks/useEntities'
import { dataRepository, imageStorage } from '../../repositories'
import type { ImageAsset, Testimonial } from '../../types'
import { Badge, Button, EmptyState, Field, Input, TextArea, Toggle } from '../../components/Form'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ImageUploader } from '../../components/ImageUploader'
import { SmartImage } from '../../components/SmartImage'
import { useToast } from '../../contexts/ToastContext'

interface FormState {
  name: string
  text: string
  rating: number
  photo?: ImageAsset
  active: boolean
  demo: boolean
}
const emptyForm: FormState = { name: '', text: '', rating: 5, active: true, demo: false }

export function TestimonialsAdminPage() {
  const business = useCurrentBusiness()!
  const { data: testimonials, refresh } = useTestimonials(business.id)
  const toast = useToast()
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<Testimonial | null>(null)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }
  function openEdit(t: Testimonial) {
    setEditing(t)
    setForm({ name: t.name, text: t.text, rating: t.rating, photo: t.photo, active: t.active, demo: t.demo })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.text.trim()) {
      toast.error('Preencha nome e depoimento.')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await dataRepository.updateTestimonial(editing.id, { ...form })
        toast.success('Depoimento atualizado.')
      } else {
        await dataRepository.createTestimonial({ businessId: business.id, ...form, order: testimonials.length })
        toast.success('Depoimento criado.')
      }
      setModalOpen(false)
      refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    await imageStorage.deleteImage(deleting.photo)
    await dataRepository.deleteTestimonial(deleting.id)
    toast.success('Depoimento excluído.')
    setDeleting(null)
    refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Depoimentos</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Avaliações exibidas no site.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>Novo depoimento</Button>
      </div>

      {testimonials.length === 0 ? (
        <EmptyState icon={<Quote size={32} />} title="Nenhum depoimento cadastrado" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div key={t.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <SmartImage asset={t.photo} alt={t.name} className="h-9 w-9 rounded-full object-cover" fallbackClassName="h-9 w-9 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11} fill={i < t.rating ? 'currentColor' : 'none'} className={i < t.rating ? '' : 'text-[var(--color-border)]'} />
                    ))}
                  </div>
                </div>
                <Badge tone={t.active ? 'success' : 'default'}>{t.active ? 'Ativo' : 'Oculto'}</Badge>
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-3">{t.text}</p>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => openEdit(t)} aria-label="Editar" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><Pencil size={14} /></button>
                <button onClick={() => setDeleting(t)} aria-label="Excluir" className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar depoimento' : 'Novo depoimento'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <ImageUploader label="Foto (opcional)" aspect="aspect-square" value={form.photo} onChange={(img) => setForm((f) => ({ ...f, photo: img }))} />
          <Field label="Nome" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Depoimento" required><TextArea value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} /></Field>
          <Field label="Avaliação">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, rating: n }))} aria-label={`${n} estrelas`}>
                  <Star size={22} className={n <= form.rating ? 'text-amber-400' : 'text-[var(--color-border)]'} fill={n <= form.rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </Field>
          <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Visível no site" />
          <Toggle checked={form.demo} onChange={(v) => setForm((f) => ({ ...f, demo: v }))} label="Marcar como depoimento demonstrativo" />
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Excluir depoimento" message={`Tem certeza que deseja excluir o depoimento de "${deleting?.name}"?`} confirmLabel="Excluir" danger onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  )
}
