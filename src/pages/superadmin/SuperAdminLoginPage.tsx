import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ShieldCheck, LogIn, MailCheck } from 'lucide-react'
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
  // Depois da 3ª senha errada, o backend dispara sozinho o fluxo de "esqueci
  // minha senha" (ver failLoginAttempt em api/auth/[...action].ts) e sinaliza
  // isso com recoveryTriggered — a tela troca o erro comum por este aviso de
  // que um e-mail com o link de redefinição já foi enviado.
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null)

  if (session?.role === 'super_admin') return <Navigate to={superAdminRoutes.home} replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await loginSuperAdmin(email, password)
    setSubmitting(false)
    if (result.ok) navigate(superAdminRoutes.home)
    else if (result.recoveryTriggered) setRecoveryMessage(result.error ?? null)
    else setError(result.error ?? 'Credenciais inválidas.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c1917] px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-7 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 mb-2">
          <ShieldCheck size={32} className="text-[#1c1917]" />
          <h1 className="font-heading text-lg font-semibold">Super Admin</h1>
          <p className="text-xs text-[var(--color-muted-foreground,#6b625a)]">Gestão da plataforma e das empresas</p>
        </div>

        {recoveryMessage ? (
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <MailCheck size={32} className="text-[#1c1917]" />
            <p className="text-sm text-[#1c1917]">{recoveryMessage}</p>
            <button
              type="button"
              onClick={() => {
                setRecoveryMessage(null)
                setPassword('')
              }}
              className="text-xs text-[var(--color-muted-foreground,#6b625a)] hover:text-[#1c1917] underline mt-1"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="E-mail"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@suaempresa.com" /></Field>
            <Field label="Senha" error={error ?? undefined}><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></Field>
            <Button type="submit" icon={<LogIn size={16} />} loading={submitting}>Entrar</Button>
            <Link to={superAdminRoutes.forgotPassword} className="text-center text-xs text-[var(--color-muted-foreground,#6b625a)] hover:text-[#1c1917]">
              Esqueci minha senha
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
