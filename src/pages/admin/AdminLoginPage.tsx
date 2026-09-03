import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { LogIn, Building2 } from 'lucide-react'
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
    else setError(result.error ?? 'E-mail ou senha inválidos.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-muted)]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-7 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 mb-2">
          <SmartImage asset={business.logo} alt={business.name} className="h-14 w-14 rounded-full object-cover" fallbackClassName="h-14 w-14 rounded-full" icon={Building2} iconSize={26} />
          <h1 className="font-heading text-lg font-semibold">{business.displayName}</h1>
          <p className="text-xs text-[var(--color-muted-foreground)]">Painel administrativo</p>
        </div>

        <Field label="E-mail" htmlFor="email">
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={business.email} />
        </Field>
        <Field label="Senha" htmlFor="password" error={error ?? undefined}>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <Button type="submit" icon={<LogIn size={16} />} loading={submitting}>Entrar</Button>
      </form>
    </div>
  )
}
