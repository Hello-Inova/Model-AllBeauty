import { useState } from 'react'
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useCategories } from '../../hooks/useEntities'
import { dataRepository } from '../../repositories'
import type { Category } from '../../types'
import { ScrollableTable, Td, Th } from '../../components/ScrollableTable'
import { Badge, Button, EmptyState, Field, Input, TextArea, Toggle } from '../../components/Form'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../contexts/ToastContext'
import { slugify } from '../../utils/slug'

interface FormState {
  name: string
  description: string
  active: boolean
}
const emptyForm: FormState = { name: '', description: '', active: true }

export function CategoriesAdminPage() {
  const business = useCurrentBusiness()!
  const { data: categories, refresh } = useCategories(business.id)
  const toast = useToast()
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }
  function openEdit(c: Category) {
    setEditing(c)
    setForm({ name: c.name, description: c.description ?? '', active: c.active })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Informe o nome da categoria.')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await dataRepository.updateCategory(editing.id, { name: form.name, description: form.description, active: form.active })
        toast.success('Categoria atualizada.')
      } else {
        await dataRepository.createCategory({
          businessId: business.id,
          name: form.name,
          slug: slugify(form.name),
          description: form.description,
          order: categories.length,
          active: form.active,
        })
        toast.success('Categoria criada.')
      }
      setModalOpen(false)
      refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    await dataRepository.deleteCategory(deleting.id)
    toast.success('Categoria excluída.')
    setDeleting(null)
    refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Categorias</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Organize seus serviços em categorias.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>Nova categoria</Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={<Tags size={32} />} title="Nenhuma categoria cadastrada" action={<Button onClick={openCreate}>Criar primeira categoria</Button>} />
      ) : (
        <ScrollableTable>
          <table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Descrição</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <Td className="font-medium">{c.name}</Td>
                  <Td className="max-w-xs truncate text-[var(--color-muted-foreground)]">{c.description}</Td>
                  <Td><Badge tone={c.active ? 'success' : 'default'}>{c.active ? 'Ativa' : 'Inativa'}</Badge></Td>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} aria-label="Editar" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><Pencil size={15} /></button>
                      <button onClick={() => setDeleting(c)} aria-label="Excluir" className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><Trash2 size={15} /></button>
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
        title={editing ? 'Editar categoria' : 'Nova categoria'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nome" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Cabelo" />
          </Field>
          <Field label="Descrição">
            <TextArea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Categoria ativa" />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir categoria"
        message={`Tem certeza que deseja excluir "${deleting?.name}"? Os serviços associados não serão excluídos.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
