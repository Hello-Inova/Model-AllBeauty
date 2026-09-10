import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { LogIn, Building2, MailCheck } from 'lucide-react'
import { BusinessProvider, useBusinessContext } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Field, Input, PasswordInput } from '../../components/Form'
import { SmartImage } from '../../components/SmartImage'
import { FullPageLoader, BusinessNotFound } from '../../components/StateScreens'
import { adminRoutes } from '../../utils/routes'

export function AdminLoginPage() {
  const { slug } = useParams()
  if (!slug) return <Navigate to="/" replace />
  return (
    <BusinessProvider slug={slug}>
      <AdminLoginInner />
    </BusinessProvider>
  )
}

function AdminLoginInner() {
  const { business, loading, notFound } = useBusinessContext()
  const { loginBusinessAdmin, session } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Depois da 3ª senha errada, o backend dispara sozinho o mesmo fluxo de
  // "esqueci minha senha" (ver failLoginAttempt em api/auth/[...action].ts)
  // e sinaliza isso com recoveryTriggered — em vez de só mostrar um erro de
  // "tente amanhã", a tela troca pro mesmo tipo de aviso da página de
  // recuperação, avisando que um e-mail com o link já foi enviado.
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null)

  if (loading) return <FullPageLoader />
  if (notFound || !business) return <BusinessNotFound />

  if (session && session.businessSlug === business.slug) {
    return <Navigate to={adminRoutes.dashboard(business.slug)} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!business) return
    setSubmitting(true)
    setError(null)
    const result = await loginBusinessAdmin(business.slug, email || business.email, password)
    setSubmitting(false)
    if (result.ok) navigate(adminRoutes.dashboard(business.slug))
    else if (result.recoveryTriggered) setRecoveryMessage(result.error ?? null)
    else setError(result.error ?? 'E-mail ou senha inválidos.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-muted)]">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-7 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 mb-2">
          <SmartImage asset={business.logo} alt={business.name} className="h-14 w-14 rounded-full object-cover" fallbackClassName="h-14 w-14 rounded-full" icon={Building2} iconSize={26} />
          <h1 className="font-heading text-lg font-semibold">{business.displayName}</h1>
          <p className="text-xs text-[var(--color-muted-foreground)]">Painel administrativo</p>
        </div>

        {recoveryMessage ? (
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <MailCheck size={32} className="text-[var(--color-primary)]" />
            <p className="text-sm text-[var(--color-foreground)]">{recoveryMessage}</p>
            <button
              type="button"
              onClick={() => {
                setRecoveryMessage(null)
                setPassword('')
              }}
              className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] underline mt-1"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="E-mail" htmlFor="email">
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={business.email} />
            </Field>
            <Field label="Senha" htmlFor="password" error={error ?? undefined}>
              <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            <Button type="submit" icon={<LogIn size={16} />} loading={submitting}>Entrar</Button>
            <Link to={adminRoutes.forgotPassword(business.slug)} className="text-center text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
              Esqueci minha senha
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
