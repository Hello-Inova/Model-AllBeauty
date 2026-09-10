import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { KeyRound, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button, Field, PasswordInput } from '../components/Form'
import { APP_NAME } from '../config'
import { adminRoutes, superAdminRoutes } from '../utils/routes'

/**
 * Página compartilhada (não vive sob /admin/:slug nem /super-admin) — o
 * token do link já identifica sozinho a qual conta (empresa ou Super Admin)
 * ele pertence, então não precisamos saber isso de antemão pela URL. Depois
 * de confirmar a troca, a resposta da API diz pra onde mandar a pessoa
 * fazer login de novo (ver resetPassword em AuthContext.tsx).
 */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { resetPassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ loginUrl: string } | null>(null)

  const invalidLink = !token

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    setSubmitting(true)
    const result = await resetPassword(token, password)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível redefinir a senha agora.')
      return
    }
    const loginUrl = result.role === 'super_admin' ? superAdminRoutes.login : result.businessSlug ? adminRoutes.login(result.businessSlug) : superAdminRoutes.login
    setDone({ loginUrl })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-muted)]">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-7 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 mb-2">
          <KeyRound size={30} className="text-[var(--color-primary)]" />
          <h1 className="font-heading text-lg font-semibold">Redefinir senha</h1>
          <p className="text-xs text-[var(--color-muted-foreground)]">{APP_NAME}</p>
        </div>

        {invalidLink ? (
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <XCircle size={32} className="text-red-500" />
            <p className="text-sm text-[var(--color-foreground)]">Este link de redefinição está incompleto ou inválido.</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Solicite um novo link na tela de login.</p>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <CheckCircle2 size={32} className="text-emerald-600" />
            <p className="text-sm text-[var(--color-foreground)]">Senha redefinida com sucesso!</p>
            <Link to={done.loginUrl} className="w-full mt-1">
              <Button className="w-full">Ir para o login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Nova senha" htmlFor="password" hint="Pelo menos 6 caracteres.">
              <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>
            <Field label="Confirmar nova senha" htmlFor="confirmPassword" error={error ?? undefined}>
              <PasswordInput id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
            </Field>
            <Button type="submit" icon={<KeyRound size={16} />} loading={submitting}>Redefinir senha</Button>
          </form>
        )}
      </div>
    </div>
  )
}
