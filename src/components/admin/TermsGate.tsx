import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Button, Checkbox } from '../Form'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { legalRoutes } from '../../utils/routes'

/**
 * Blocks the admin panel behind a consent screen on a business admin's
 * FIRST login (admin_users.terms_accepted_at is null). Super admin (Hello
 * Inova's own team) is never gated — this is the client-facing consent for
 * businesses using the platform, per LGPD/Marco Civil requirements.
 *
 * Renders EITHER the gate OR the children — never both — so no admin data
 * is mounted in the DOM before consent is given.
 */
export function TermsGate({ children }: { children: ReactNode }) {
  const { session, acceptTerms } = useAuth()
  const toast = useToast()
  const [checked, setChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const needsConsent = !!session && session.role !== 'super_admin' && !session.termsAcceptedAt
  if (!needsConsent) return <>{children}</>

  async function handleAccept() {
    setSubmitting(true)
    try {
      await acceptTerms()
    } catch {
      toast.error('Não foi possível registrar o aceite. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="w-full max-w-lg rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 sm:p-7 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={22} className="text-[var(--color-primary)]" />
          <h2 className="font-heading text-lg font-semibold">Antes de continuar</h2>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Para usar o painel administrativo, leia e aceite os documentos abaixo. Isso é exigido apenas no seu primeiro acesso a esta conta.
        </p>
        <div className="flex flex-col gap-1.5 text-sm">
          {/* Navegação na MESMA aba (não target="_blank") de propósito: assim
              o botão "Voltar" da página legal usa o histórico do navegador e
              retorna para cá, mantendo o gate ativo enquanto não houver
              aceite — em vez de abrir uma aba nova cujo "Voltar" cairia na
              home pública, dando a impressão de acesso liberado. */}
          <Link to={legalRoutes.terms} className="text-[var(--color-primary)] hover:underline">
            Termos de Uso →
          </Link>
          <Link to={legalRoutes.privacy} className="text-[var(--color-primary)] hover:underline">
            Política de Privacidade (LGPD) →
          </Link>
          <Link to={legalRoutes.cookies} className="text-[var(--color-primary)] hover:underline">
            Política de Cookies →
          </Link>
        </div>
        <Checkbox
          label="Li e aceito os Termos de Uso, a Política de Privacidade (LGPD) e a Política de Cookies."
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <Button onClick={handleAccept} disabled={!checked} loading={submitting} className="self-start">
          Aceitar e continuar
        </Button>
      </div>
    </div>
  )
}
