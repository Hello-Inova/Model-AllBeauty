import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Mail, ArrowLeft, MailCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Field, Input } from '../../components/Form'
import { superAdminRoutes } from '../../utils/routes'

export function SuperAdminForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await forgotPassword({ email })
    setSubmitting(false)
    if (result.ok) setSent(true)
    else setError(result.error ?? 'Não foi possível enviar o e-mail agora. Tente novamente.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c1917] px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-7 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 mb-2">
          <ShieldCheck size={32} className="text-[#1c1917]" />
          <h1 className="font-heading text-lg font-semibold">Super Admin</h1>
          <p className="text-xs text-[var(--color-muted-foreground,#6b625a)]">Gestão da plataforma e das empresas</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <MailCheck size={32} className="text-[#1c1917]" />
            <p className="text-sm text-[#1c1917]">Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha. Confira também a caixa de spam.</p>
            <p className="text-xs text-[var(--color-muted-foreground,#6b625a)]">O link expira em 1 hora.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-muted-foreground,#6b625a)] -mt-1">Informe o e-mail da conta de Super Admin para receber um link de redefinição de senha.</p>
            <Field label="E-mail" error={error ?? undefined}>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@suaempresa.com" />
            </Field>
            <Button type="submit" icon={<Mail size={16} />} loading={submitting}>Enviar link de redefinição</Button>
          </form>
        )}

        <Link to={superAdminRoutes.login} className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-muted-foreground,#6b625a)] hover:text-[#1c1917] mt-1">
          <ArrowLeft size={13} /> Voltar para o login
        </Link>
      </div>
    </div>
  )
}
