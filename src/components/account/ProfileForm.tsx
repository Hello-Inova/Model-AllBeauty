import { useState } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { Button, Field, Input, PasswordInput, SectionCard } from '../Form'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

/**
 * Shared "Perfil" module — changing the login e-mail and password of the
 * currently signed-in account (business admin or super admin; both are rows
 * in admin_users, so the same two API calls work for either role). Rendered
 * inside AdminLayout and SuperAdminLayout, each behind its own route.
 */
export function ProfileForm() {
  const { session } = useAuth()

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <EmailSection currentEmail={session?.email ?? ''} />
      <PasswordSection />
    </div>
  )
}

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const { updateEmail } = useAuth()
  const toast = useToast()
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateEmail(password, newEmail)
      toast.success('E-mail de acesso atualizado.')
      setNewEmail('')
      setPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar o e-mail.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard title="E-mail de acesso" description="O e-mail usado para entrar no painel.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="E-mail atual">
          <Input value={currentEmail} disabled />
        </Field>
        <Field label="Novo e-mail" required>
          <Input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="novo@email.com" />
        </Field>
        <Field label="Senha atual" hint="Confirme sua senha para alterar o e-mail." required>
          <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <Button type="submit" icon={<Mail size={16} />} loading={saving} className="self-start">
          Salvar e-mail
        </Button>
      </form>
    </SectionCard>
  )
}

function PasswordSection() {
  const { changePassword } = useAuth()
  const toast = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('A confirmação não coincide com a nova senha.')
      return
    }
    setSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      toast.success('Senha atualizada.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar a senha.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard title="Senha" description="Use uma senha com pelo menos 6 caracteres.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Senha atual" required>
          <PasswordInput required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="Nova senha" required>
          <PasswordInput required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="Confirmar nova senha" required>
          <PasswordInput required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <Button type="submit" icon={<KeyRound size={16} />} loading={saving} className="self-start">
          Salvar senha
        </Button>
      </form>
    </SectionCard>
  )
}
