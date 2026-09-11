import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Mail, Building2, ArrowLeft, MailCheck } from 'lucide-react'
import { BusinessProvider, useBusinessContext } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Field, Input } from '../../components/Form'
import { SmartImage } from '../../components/SmartImage'
import { FullPageLoader, BusinessNotFound } from '../../components/StateScreens'
import { adminRoutes } from '../../utils/routes'
import { resolveBusinessSlug } from '../../utils/hostContext'

export function ForgotPasswordPage() {
  // Na URL curta por subdomínio (beauty-demo.organyze.com.br/esqueci-senha)
  // não há :slug no caminho — o slug vem do próprio hostname. Ver
  // src/utils/hostContext.ts.
  const slug = resolveBusinessSlug(useParams().slug)
  if (!slug) return <Navigate to="/" replace />
  return (
    <BusinessProvider slug={slug}>
      <ForgotPasswordInner />
    </BusinessProvider>
  )
}

function ForgotPasswordInner() {
  const { business, loading, notFound } = useBusinessContext()
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  if (loading) return <FullPageLoader />
  if (notFound || !business) return <BusinessNotFound />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!business) return
    setSubmitting(true)
    setError(null)
    const result = await forgotPassword({ businessSlug: business.slug, email })
    setSubmitting(false)
    if (result.ok) setSent(true)
    else setError(result.error ?? 'Não foi possível enviar o e-mail agora. Tente novamente.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-muted)]">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-7 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 mb-2">
          <SmartImage asset={business.logo} alt={business.name} className="h-14 w-14 rounded-full object-cover" fallbackClassName="h-14 w-14 rounded-full" icon={Building2} iconSize={26} />
          <h1 className="font-heading text-lg font-semibold">{business.displayName}</h1>
          <p className="text-xs text-[var(--color-muted-foreground)]">Painel administrativo</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <MailCheck size={32} className="text-[var(--color-primary)]" />
            <p className="text-sm text-[var(--color-foreground)]">Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha. Confira também a caixa de spam.</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">O link expira em 1 hora.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-muted-foreground)] -mt-1">Informe o e-mail da sua conta administrativa para receber um link de redefinição de senha.</p>
            <Field label="E-mail" htmlFor="email" error={error ?? undefined}>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={business.email} />
            </Field>
            <Button type="submit" icon={<Mail size={16} />} loading={submitting}>Enviar link de redefinição</Button>
          </form>
        )}

        <Link to={adminRoutes.login(business.slug)} className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mt-1">
          <ArrowLeft size={13} /> Voltar para o login
        </Link>
      </div>
    </div>
  )
}
