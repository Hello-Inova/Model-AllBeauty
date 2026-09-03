import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldCheck, LogIn } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Field, Input, PasswordInput } from '../../components/Form'
import { superAdminRoutes } from '../../utils/routes'

export function SuperAdminLoginPage() {
  const { loginSuperAdmin, session } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session?.role === 'super_admin') return <Navigate to={superAdminRoutes.home} replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await loginSuperAdmin(email, password)
    setSubmitting(false)
    if (result.ok) navigate(superAdminRoutes.home)
    else setError(result.error ?? 'Credenciais inválidas.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c1917] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl bg-white p-7 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 mb-2">
          <ShieldCheck size={32} className="text-[#1c1917]" />
          <h1 className="font-heading text-lg font-semibold">Super Admin</h1>
          <p className="text-xs text-[var(--color-muted-foreground,#6b625a)]">Gestão da plataforma e das empresas</p>
        </div>
        <Field label="E-mail"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@suaempresa.com" /></Field>
        <Field label="Senha" error={error ?? undefined}><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></Field>
        <Button type="submit" icon={<LogIn size={16} />} loading={submitting}>Entrar</Button>
      </form>
    </div>
  )
}
