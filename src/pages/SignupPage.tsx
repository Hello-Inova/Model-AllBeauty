import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Rocket, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button, Combobox, Field, Input, PasswordInput } from '../components/Form'
import { adminRoutes } from '../utils/routes'
import { OTHER_SEGMENT_OPTION, SEGMENTS } from '../utils/segments'

/**
 * Public, unauthenticated self-service signup — the entry point for a new
 * business owner to create their own account and get a brand-new site, with
 * no Hello Inova step in between (see api/auth/[...action].ts `register`).
 * Plan choice is deliberately NOT part of this form — it used to be, but
 * picking a plan before even seeing the product added friction to signup
 * for no reason (payment only happens afterwards anyway). The account is
 * created with a default billing plan and the owner picks/pays for a real
 * plan later, from the Assinatura screen, same as choosing to upgrade at
 * any other point — the dashboard's onboarding checklist walks them there.
 */
const DEFAULT_BILLING_PLAN = 'mensal'

export function SignupPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [businessName, setBusinessName] = useState('')
  const [segment, setSegment] = useState('')
  const [segmentFreeText, setSegmentFreeText] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (businessName.trim().length < 2) {
      setError('Informe o nome do seu negócio.')
      return
    }
    if (adminPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (confirmPassword !== adminPassword) {
      setError('As senhas não coincidem.')
      return
    }
    setSubmitting(true)
    const result = await register({
      businessName: businessName.trim(),
      segment,
      whatsapp,
      phone: whatsapp,
      adminEmail: adminEmail.trim(),
      adminPassword,
      billingPlan: DEFAULT_BILLING_PLAN,
    })
    setSubmitting(false)
    if (result.ok && result.businessSlug) {
      navigate(adminRoutes.dashboard(result.businessSlug))
    } else {
      setError(result.error ?? 'Não foi possível criar sua conta. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-muted)] px-4 py-10 sm:py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
            <Sparkles size={14} /> Crie seu site em minutos
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold mt-2">Comece agora</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2 max-w-lg mx-auto">
            Crie sua conta e ganhe um site completo para agendamentos do seu negócio, com 7 dias grátis. Você personaliza cores, logo,
            serviços e escolhe seu plano depois — sem pressa, direto do seu painel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8 flex flex-col gap-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome do seu negócio" required className="sm:col-span-2">
              <Input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ex: Espaço Bella Hair" />
            </Field>
            <Field label="Segmento" hint={segmentFreeText ? undefined : 'Digite para buscar na lista'}>
              {segmentFreeText ? (
                <div className="flex flex-col gap-1.5">
                  <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="Digite o segmento do seu negócio" autoFocus />
                  <button
                    type="button"
                    onClick={() => {
                      setSegmentFreeText(false)
                      setSegment('')
                    }}
                    className="text-xs text-left text-[var(--color-primary)] hover:underline w-fit"
                  >
                    Escolher da lista
                  </button>
                </div>
              ) : (
                <Combobox
                  value={segment}
                  onChange={setSegment}
                  options={SEGMENTS}
                  placeholder="Ex: Salão de Beleza"
                  onSelect={(option) => {
                    if (option === OTHER_SEGMENT_OPTION) {
                      setSegmentFreeText(true)
                      setSegment('')
                    }
                  }}
                />
              )}
            </Field>
            <Field label="WhatsApp" hint="Opcional — dá para preencher depois">
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
            </Field>
            <Field label="Seu e-mail de acesso" required>
              <Input required type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="voce@seunegocio.com" />
            </Field>
            <Field label="Crie uma senha" required hint="Mínimo de 6 caracteres">
              <PasswordInput required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            <Field
              label="Confirme sua senha"
              required
              hint={confirmPassword && confirmPassword !== adminPassword ? undefined : 'Repita a senha informada acima'}
              error={confirmPassword && confirmPassword !== adminPassword ? 'As senhas não coincidem.' : (error ?? undefined)}
            >
              <PasswordInput required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </Field>
          </div>

          <Button type="submit" icon={<Rocket size={16} />} loading={submitting} size="lg">
            Criar minha conta e começar
          </Button>
        </form>
      </div>
    </div>
  )
}
