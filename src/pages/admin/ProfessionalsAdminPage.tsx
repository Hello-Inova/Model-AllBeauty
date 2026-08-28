import { useState } from 'react'
import { Plus, Pencil, Trash2, UserSquare2 } from 'lucide-react'
import { useCurrentBusiness } from '../../contexts/BusinessContext'
import { useProfessionals, useServices } from '../../hooks/useEntities'
import { dataRepository, imageStorage } from '../../repositories'
import type { ImageAsset, Professional } from '../../types'
import { ScrollableTable, Td, Th } from '../../components/ScrollableTable'
import { Badge, Button, Checkbox, EmptyState, Field, Input, TextArea, Toggle } from '../../components/Form'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ImageUploader } from '../../components/ImageUploader'
import { SmartImage } from '../../components/SmartImage'
import { WeeklyHoursEditor } from '../../components/admin/WeeklyHoursEditor'
import { useToast } from '../../contexts/ToastContext'
import type { DaySchedule } from '../../types'

const DEFAULT_HOURS: DaySchedule[] = [0, 1, 2, 3, 4, 5, 6].map((wd) => ({ weekday: wd as DaySchedule['weekday'], active: wd !== 0, periods: wd === 0 ? [] : [{ start: '09:00', end: '18:00' }] }))

interface FormState {
  name: string
  description: string
  specialties: string
  phone: string
  photo?: ImageAsset
  active: boolean
  serviceIds: string[]
  useBusinessHours: boolean
  workingHours: DaySchedule[]
}
function emptyForm(): FormState {
  return { name: '', description: '', specialties: '', phone: '', active: true, serviceIds: [], useBusinessHours: true, workingHours: DEFAULT_HOURS }
}

export function ProfessionalsAdminPage() {
  const business = useCurrentBusiness()!
  const { data: professionals, refresh } = useProfessionals(business.id)
  const { data: services } = useServices(business.id)
  const toast = useToast()

  const [editing, setEditing] = useState<Professional | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<Professional | null>(null)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }
  function openEdit(p: Professional) {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description,
      specialties: p.specialties.join(', '),
      phone: p.phone ?? '',
      photo: p.photo,
      active: p.active,
      serviceIds: p.serviceIds,
      useBusinessHours: p.useBusinessHours,
      workingHours: p.workingHours,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Informe o nome do profissional.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        businessId: business.id,
        name: form.name,
        description: form.description,
        specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
        phone: form.phone,
        photo: form.photo,
        active: form.active,
        serviceIds: form.serviceIds,
        useBusinessHours: form.useBusinessHours,
        workingHours: form.workingHours,
      }
      if (editing) {
        await dataRepository.updateProfessional(editing.id, payload)
        toast.success('Profissional atualizado.')
      } else {
        await dataRepository.createProfessional({ ...payload, order: professionals.length })
        toast.success('Profissional criado.')
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
    await dataRepository.deleteProfessional(deleting.id)
    toast.success('Profissional excluído.')
    setDeleting(null)
    refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Profissionais</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Gerencie sua equipe.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>Novo profissional</Button>
      </div>

      {professionals.length === 0 ? (
        <EmptyState icon={<UserSquare2 size={32} />} title="Nenhum profissional cadastrado" />
      ) : (
        <ScrollableTable>
          <table>
            <thead>
              <tr>
                <Th>Profissional</Th>
                <Th>Especialidades</Th>
                <Th>Serviços</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {professionals.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <SmartImage asset={p.photo} alt={p.name} className="h-9 w-9 rounded-full object-cover" fallbackClassName="h-9 w-9 rounded-full" />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </Td>
                  <Td className="max-w-xs truncate">{p.specialties.join(', ')}</Td>
                  <Td>{p.serviceIds.length}</Td>
                  <Td><Badge tone={p.active ? 'success' : 'default'}>{p.active ? 'Ativo' : 'Inativo'}</Badge></Td>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} aria-label="Editar" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><Pencil size={15} /></button>
                      <button onClick={() => setDeleting(p)} aria-label="Excluir" className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><Trash2 size={15} /></button>
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
        title={editing ? 'Editar profissional' : 'Novo profissional'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-4">
              <Field label="Nome" required>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </Field>
              <Field label="Telefone">
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </Field>
              <Field label="Especialidades" hint="Separe por vírgula">
                <Input value={form.specialties} onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))} placeholder="Corte, Coloração" />
              </Field>
              <Field label="Descrição">
                <TextArea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </Field>
              <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Profissional ativo" />
            </div>
            <div className="flex flex-col gap-4">
              <ImageUploader label="Foto do profissional" aspect="aspect-square" value={form.photo} onChange={(img) => setForm((f) => ({ ...f, photo: img }))} />
              {services.length > 0 && (
                <Field label="Serviços que realiza">
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border border-[var(--color-border)] rounded-lg p-3">
                    {services.map((s) => (
                      <Checkbox
                        key={s.id}
                        label={s.name}
                        checked={form.serviceIds.includes(s.id)}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, serviceIds: e.target.checked ? [...f.serviceIds, s.id] : f.serviceIds.filter((id) => id !== s.id) }))
                        }
                      />
                    ))}
                  </div>
                </Field>
              )}
            </div>
          </div>

          <div>
            <Toggle checked={form.useBusinessHours} onChange={(v) => setForm((f) => ({ ...f, useBusinessHours: v }))} label="Usar horário de funcionamento da empresa" />
            {!form.useBusinessHours && (
              <div className="mt-3">
                <WeeklyHoursEditor value={form.workingHours} onChange={(v) => setForm((f) => ({ ...f, workingHours: v }))} />
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir profissional"
        message={`Tem certeza que deseja excluir "${deleting?.name}"?`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
