import { useState } from 'react'
import { Plus, Pencil, Trash2, Scissors, Star } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useCategories, useProfessionals, useServices } from '../../hooks/useEntities'
import { dataRepository, imageStorage } from '../../repositories'
import type { ImageAsset, Service } from '../../types'
import { ScrollableTable, Td, Th } from '../../components/ScrollableTable'
import { Badge, Button, Checkbox, EmptyState, Field, Input, Select, TextArea, Toggle } from '../../components/Form'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ImageUploader } from '../../components/ImageUploader'
import { SmartImage } from '../../components/SmartImage'
import { useToast } from '../../contexts/ToastContext'
import { slugify } from '../../utils/slug'
import { formatCurrency, formatDuration } from '../../utils/format'
import { getCategoryIcon } from '../../utils/categoryIcons'

interface FormState {
  name: string
  categoryId: string
  shortDescription: string
  description: string
  duration: number
  price: number
  promotionalPrice: string
  image?: ImageAsset
  active: boolean
  featured: boolean
  professionalIds: string[]
}

function emptyForm(defaultCategory: string): FormState {
  return { name: '', categoryId: defaultCategory, shortDescription: '', description: '', duration: 30, price: 0, promotionalPrice: '', active: true, featured: false, professionalIds: [] }
}

export function ServicesAdminPage() {
  const business = useCurrentBusiness()!
  const { data: services, refresh } = useServices(business.id)
  const { data: categories } = useCategories(business.id)
  const { data: professionals } = useProfessionals(business.id)
  const toast = useToast()

  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm(categories[0]?.id ?? ''))
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm(categories[0]?.id ?? ''))
    setModalOpen(true)
  }
  function openEdit(s: Service) {
    setEditing(s)
    setForm({
      name: s.name,
      categoryId: s.categoryId,
      shortDescription: s.shortDescription,
      description: s.description,
      duration: s.duration,
      price: s.price,
      promotionalPrice: s.promotionalPrice != null ? String(s.promotionalPrice) : '',
      image: s.image,
      active: s.active,
      featured: s.featured,
      professionalIds: s.professionalIds,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.categoryId) {
      toast.error('Preencha nome e categoria.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        businessId: business.id,
        categoryId: form.categoryId,
        name: form.name,
        slug: slugify(form.name),
        shortDescription: form.shortDescription,
        description: form.description,
        duration: form.duration,
        price: form.price,
        promotionalPrice: form.promotionalPrice ? Number(form.promotionalPrice) : undefined,
        image: form.image,
        active: form.active,
        featured: form.featured,
        professionalIds: form.professionalIds,
      }
      if (editing) {
        await dataRepository.updateService(editing.id, payload)
        toast.success('Serviço atualizado.')
      } else {
        await dataRepository.createService({ ...payload, order: services.length })
        toast.success('Serviço criado.')
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
    await dataRepository.deleteService(deleting.id)
    toast.success('Serviço excluído.')
    setDeleting(null)
    refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Serviços</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Gerencie seu catálogo de serviços.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate} disabled={categories.length === 0}>Novo serviço</Button>
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">Crie ao menos uma categoria antes de cadastrar serviços.</p>
      )}

      {services.length === 0 ? (
        <EmptyState icon={<Scissors size={32} />} title="Nenhum serviço cadastrado" />
      ) : (
        <ScrollableTable>
          <table>
            <thead>
              <tr>
                <Th>Serviço</Th>
                <Th>Categoria</Th>
                <Th>Duração</Th>
                <Th>Preço</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <SmartImage
                        asset={s.image}
                        alt={s.name}
                        className="h-9 w-9 rounded-md object-cover"
                        fallbackClassName="h-9 w-9 rounded-md"
                        icon={getCategoryIcon(categories.find((c) => c.id === s.categoryId)?.slug)}
                        iconSize={16}
                      />
                      <span className="font-medium flex items-center gap-1">{s.name} {s.featured && <Star size={12} className="text-[var(--color-accent)]" fill="currentColor" />}</span>
                    </div>
                  </Td>
                  <Td>{categories.find((c) => c.id === s.categoryId)?.name ?? '—'}</Td>
                  <Td>{formatDuration(s.duration)}</Td>
                  <Td>{formatCurrency(s.promotionalPrice ?? s.price)}</Td>
                  <Td><Badge tone={s.active ? 'success' : 'default'}>{s.active ? 'Ativo' : 'Inativo'}</Badge></Td>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} aria-label="Editar" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><Pencil size={15} /></button>
                      <button onClick={() => setDeleting(s)} aria-label="Excluir" className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar serviço' : 'Novo serviço'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-4">
            <Field label="Nome do serviço" required>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Categoria" required>
              <Select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Descrição curta" hint="Aparece nos cards do catálogo">
              <Input value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} />
            </Field>
            <Field label="Descrição completa">
              <TextArea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duração (min)" required>
                <Input type="number" min={5} step={5} value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))} />
              </Field>
              <Field label="Preço (R$)" required>
                <Input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
              </Field>
            </div>
            <Field label="Preço promocional (R$)" hint="Opcional">
              <Input type="number" min={0} step={0.01} value={form.promotionalPrice} onChange={(e) => setForm((f) => ({ ...f, promotionalPrice: e.target.value }))} />
            </Field>
            <div className="flex gap-5">
              <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Ativo" />
              <Toggle checked={form.featured} onChange={(v) => setForm((f) => ({ ...f, featured: v }))} label="Destaque" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <ImageUploader label="Imagem do serviço" value={form.image} onChange={(img) => setForm((f) => ({ ...f, image: img }))} />
            {professionals.length > 0 && (
              <Field label="Profissionais que realizam este serviço" hint="Deixe todos desmarcados para permitir qualquer profissional">
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border border-[var(--color-border)] rounded-lg p-3">
                  {professionals.map((p) => (
                    <Checkbox
                      key={p.id}
                      label={p.name}
                      checked={form.professionalIds.includes(p.id)}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          professionalIds: e.target.checked ? [...f.professionalIds, p.id] : f.professionalIds.filter((id) => id !== p.id),
                        }))
                      }
                    />
                  ))}
                </div>
              </Field>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir serviço"
        message={`Tem certeza que deseja excluir "${deleting?.name}"?`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
