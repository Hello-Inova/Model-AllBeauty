import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Plus, Rocket, Trash2 } from 'lucide-react'
import { dataRepository } from '../../repositories'
import type { DaySchedule, ImageAsset, PlanId } from '../../types'
import { Button, Field, Input, PasswordInput, Select, TextArea, Toggle } from '../../components/Form'
import { ImageUploader } from '../../components/ImageUploader'
import { WeeklyHoursEditor } from '../../components/admin/WeeklyHoursEditor'
import { slugify } from '../../utils/slug'
import { useToast } from '../../contexts/ToastContext'
import { adminRoutes } from '../../utils/routes'

const DEFAULT_HOURS: DaySchedule[] = [0, 1, 2, 3, 4, 5, 6].map((wd) => ({
  weekday: wd as DaySchedule['weekday'],
  active: wd !== 0,
  periods: wd === 0 ? [] : [{ start: '09:00', end: '18:00' }],
}))

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
const STEP_TITLES: Record<Step, string> = {
  1: 'Empresa', 2: 'Logo e identidade visual', 3: 'Contatos', 4: 'Endereço', 5: 'Horários',
  6: 'Categorias', 7: 'Serviços', 8: 'Profissionais', 9: 'Configurações', 10: 'Publicar',
}

interface DraftCategory { id: string; name: string }
interface DraftService { id: string; name: string; categoryId: string; price: string; duration: string }
interface DraftProfessional { id: string; name: string; specialties: string }

export function SuperAdminOnboardingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState<Step>(1)
  const [publishing, setPublishing] = useState(false)

  // Step 1
  const [name, setName] = useState('')
  const [segment, setSegment] = useState('Salão de beleza')
  const [description, setDescription] = useState('')
  // Step 2
  const [logo, setLogo] = useState<ImageAsset | undefined>()
  const [heroImage, setHeroImage] = useState<ImageAsset | undefined>()
  const [primaryColor, setPrimaryColor] = useState('#b3873e')
  const [secondaryColor, setSecondaryColor] = useState('#2b2320')
  // Step 3
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  // Step 4
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  // Step 5
  const [workingHours, setWorkingHours] = useState<DaySchedule[]>(DEFAULT_HOURS)
  // Step 6
  const [categories, setCategories] = useState<DraftCategory[]>([{ id: 'c1', name: 'Serviços gerais' }])
  // Step 7
  const [services, setServices] = useState<DraftService[]>([])
  // Step 8
  const [professionals, setProfessionals] = useState<DraftProfessional[]>([])
  // Step 9
  const [plan, setPlan] = useState<PlanId>('basico')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  const slug = slugify(name || 'nova-empresa')

  function next() {
    if (step === 1 && !name.trim()) {
      toast.error('Informe o nome da empresa.')
      return
    }
    if (step === 9 && adminPassword && adminPassword.length < 6) {
      toast.error('A senha de acesso deve ter ao menos 6 caracteres.')
      return
    }
    if (step < 10) setStep((s) => (s + 1) as Step)
  }
  function back() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  async function handlePublish() {
    const finalAdminEmail = (adminEmail || email).trim()
    if (!finalAdminEmail) {
      toast.error('Informe o e-mail de acesso do administrador (passo 9).')
      setStep(9)
      return
    }
    if (adminPassword.length < 6) {
      toast.error('A senha de acesso deve ter ao menos 6 caracteres (passo 9).')
      setStep(9)
      return
    }
    setPublishing(true)
    try {
      const business = await dataRepository.createBusiness({
        slug,
        name,
        displayName: name,
        description: description || 'Nova empresa cadastrada na plataforma.',
        segment,
        logo,
        heroImage,
        coverImage: heroImage,
        phone,
        whatsapp: whatsapp.replace(/\D/g, ''),
        email,
        instagram: instagram || undefined,
        address,
        city,
        state,
        country: 'Brasil',
        zipCode,
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        primaryColor,
        secondaryColor,
        accentColor: primaryColor,
        backgroundColor: '#ffffff',
        foregroundColor: '#1c1917',
        theme: 'light',
        active: true,
        demo: false,
        plan,
        // Toda empresa nova entra no plano mensal, cobrança padrão, ainda
        // sem assinatura ativa no Asaas — o Super Admin ajusta o tipo de
        // plano/cobrança depois, e a própria empresa assina em Assinatura.
        billingType: 'padrao',
        billingPlan: 'mensal',
        subscriptionStatus: 'sem_assinatura',
        workingHours,
        bookingPolicies: {
          minAdvanceMinutes: 60,
          maxAdvanceDays: 30,
          cancellationWindowHours: 24,
          allowReschedule: true,
          bufferBetweenAppointmentsMinutes: 10,
          lateToleranceMinutes: 15,
          requireEmail: false,
          requireNotes: false,
          paymentPolicy: 'pay_on_site',
        },
      }, { email: finalAdminEmail, password: adminPassword })

      const categoryIdMap = new Map<string, string>()
      for (const c of categories.filter((c) => c.name.trim())) {
        const created = await dataRepository.createCategory({ businessId: business.id, name: c.name, slug: slugify(c.name), order: 0, active: true })
        categoryIdMap.set(c.id, created.id)
      }

      for (const s of services.filter((s) => s.name.trim())) {
        await dataRepository.createService({
          businessId: business.id,
          categoryId: categoryIdMap.get(s.categoryId) ?? [...categoryIdMap.values()][0] ?? '',
          name: s.name,
          slug: slugify(s.name),
          shortDescription: '',
          description: '',
          duration: Number(s.duration) || 30,
          price: Number(s.price) || 0,
          active: true,
          featured: false,
          order: 0,
          professionalIds: [],
        })
      }

      for (const p of professionals.filter((p) => p.name.trim())) {
        await dataRepository.createProfessional({
          businessId: business.id,
          name: p.name,
          description: '',
          specialties: p.specialties.split(',').map((x) => x.trim()).filter(Boolean),
          serviceIds: [],
          workingHours,
          useBusinessHours: true,
          active: true,
          order: 0,
        })
      }

      toast.success('Empresa publicada com sucesso!')
      navigate(adminRoutes.dashboard(business.slug))
    } catch (err) {
      const message = err instanceof Error ? err.message : null
      toast.error(message || 'Não foi possível publicar a empresa. Verifique os dados e tente novamente.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-heading text-2xl font-semibold mb-1">Nova empresa</h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-6">Assistente de cadastro — em poucos passos sua empresa estará pronta para receber agendamentos.</p>

      <ol className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-1">
        {(Object.keys(STEP_TITLES) as unknown as Step[]).map((s) => (
          <li key={s} className="flex items-center gap-1.5 shrink-0">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${s < step ? 'bg-[var(--color-primary,#b3873e)] text-white' : s === step ? 'border-2 border-[var(--color-primary,#b3873e)] text-[var(--color-primary,#b3873e)]' : 'bg-[var(--color-muted,#eee)] text-[var(--color-muted-foreground,#888)]'}`}>
              {s < step ? <Check size={11} /> : s}
            </span>
            {s < 10 && <span className="w-3 h-px bg-[var(--color-border,#ddd)]" />}
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-[var(--color-border,#e5e0d6)] bg-[var(--color-card,#fff)] p-6">
        <h2 className="font-heading text-lg font-semibold mb-4">{step}. {STEP_TITLES[step]}</h2>

        {step === 1 && (
          <div className="flex flex-col gap-4 max-w-md">
            <Field label="Nome da empresa" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Studio Bela Vida" /></Field>
            <Field label="Segmento">
              <Select value={segment} onChange={(e) => setSegment(e.target.value)}>
                {['Salão de beleza', 'Barbearia', 'Clínica de estética', 'Spa', 'Studio de unhas', 'Studio de cílios', 'Studio de sobrancelhas', 'Clínica de massagem', 'Centro de bem-estar', 'Profissional autônomo', 'Outro'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Descrição"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Fale um pouco sobre a empresa" /></Field>
            <p className="text-xs text-[var(--color-muted-foreground)]">Endereço do site: /empresa/{slug || '...'}</p>
          </div>
        )}

        {step === 2 && (
          <div className="grid sm:grid-cols-2 gap-5">
            <ImageUploader label="Logo" aspect="aspect-square" value={logo} onChange={setLogo} />
            <ImageUploader label="Imagem de destaque (Hero)" value={heroImage} onChange={setHeroImage} />
            <Field label="Cor primária">
              <div className="flex items-center gap-2">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-10 rounded-md border border-[var(--color-border)] cursor-pointer" />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>
            </Field>
            <Field label="Cor secundária">
              <div className="flex items-center gap-2">
                <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-10 w-10 rounded-md border border-[var(--color-border)] cursor-pointer" />
                <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
              </div>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 max-w-md">
            <Field label="Telefone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <Field label="WhatsApp" hint="Com DDI, ex: 5511987654321"><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></Field>
            <Field label="E-mail"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Instagram"><Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." /></Field>
          </div>
        )}

        {step === 4 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Endereço"><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
            <Field label="CEP"><Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} /></Field>
            <Field label="Cidade"><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
            <Field label="Estado"><Input value={state} onChange={(e) => setState(e.target.value)} /></Field>
          </div>
        )}

        {step === 5 && <WeeklyHoursEditor value={workingHours} onChange={setWorkingHours} />}

        {step === 6 && (
          <ListEditor
            items={categories}
            onChange={setCategories}
            addLabel="Adicionar categoria"
            newItem={() => ({ id: crypto.randomUUID(), name: '' })}
            renderItem={(item, update) => <Input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} placeholder="Nome da categoria" />}
          />
        )}

        {step === 7 && (
          <ListEditor
            items={services}
            onChange={setServices}
            addLabel="Adicionar serviço"
            newItem={() => ({ id: crypto.randomUUID(), name: '', categoryId: categories[0]?.id ?? '', price: '', duration: '30' })}
            renderItem={(item, update) => (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                <Input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} placeholder="Nome do serviço" className="col-span-2 sm:col-span-1" />
                <Select value={item.categoryId} onChange={(e) => update({ ...item, categoryId: e.target.value })}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name || 'Categoria'}</option>
                  ))}
                </Select>
                <Input type="number" value={item.duration} onChange={(e) => update({ ...item, duration: e.target.value })} placeholder="Min" />
                <Input type="number" value={item.price} onChange={(e) => update({ ...item, price: e.target.value })} placeholder="R$" />
              </div>
            )}
          />
        )}

        {step === 8 && (
          <ListEditor
            items={professionals}
            onChange={setProfessionals}
            addLabel="Adicionar profissional"
            newItem={() => ({ id: crypto.randomUUID(), name: '', specialties: '' })}
            renderItem={(item, update) => (
              <div className="grid grid-cols-2 gap-2 flex-1">
                <Input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} placeholder="Nome" />
                <Input value={item.specialties} onChange={(e) => update({ ...item, specialties: e.target.value })} placeholder="Especialidades (vírgula)" />
              </div>
            )}
          />
        )}

        {step === 9 && (
          <div className="flex flex-col gap-4 max-w-md">
            <Field label="Plano">
              <Select value={plan} onChange={(e) => setPlan(e.target.value as PlanId)}>
                <option value="basico">Básico</option>
                <option value="profissional">Profissional</option>
                <option value="premium">Premium</option>
              </Select>
            </Field>
            <Toggle checked label="Site publicado assim que criado" onChange={() => {}} />
            <div className="pt-2 border-t border-[var(--color-border,#e5e0d6)] flex flex-col gap-4">
              <p className="text-xs text-[var(--color-muted-foreground)]">Crie o acesso do administrador desta empresa — ele usará esse e-mail e senha para entrar no painel.</p>
              <Field label="E-mail de acesso" required hint="Se deixar em branco, será usado o e-mail de contato.">
                <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder={email || 'admin@empresa.com'} />
              </Field>
              <Field label="Senha de acesso" required hint="Mínimo de 6 caracteres.">
                <PasswordInput value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" />
              </Field>
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Após publicar, você pode ajustar qualquer configuração pelo painel administrativo, sem editar código.</p>
          </div>
        )}

        {step === 10 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-muted-foreground)]">Revise um resumo e publique. A empresa ficará disponível imediatamente em <strong>/empresa/{slug}</strong>.</p>
            <dl className="grid grid-cols-2 gap-y-2 text-sm rounded-lg bg-[var(--color-muted,#f5f1ea)] p-4">
              <dt className="text-[var(--color-muted-foreground)]">Nome</dt><dd className="text-right font-medium">{name || '—'}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Segmento</dt><dd className="text-right font-medium">{segment}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Categorias</dt><dd className="text-right font-medium">{categories.filter((c) => c.name).length}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Serviços</dt><dd className="text-right font-medium">{services.filter((s) => s.name).length}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Profissionais</dt><dd className="text-right font-medium">{professionals.filter((p) => p.name).length}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Plano</dt><dd className="text-right font-medium capitalize">{plan}</dd>
            </dl>
            <Button size="lg" icon={<Rocket size={18} />} loading={publishing} onClick={handlePublish}>Publicar empresa</Button>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--color-border,#e5e0d6)]">
          <Button variant="ghost" icon={<ChevronLeft size={16} />} onClick={back} disabled={step === 1}>Voltar</Button>
          {step < 10 && (
            <Button icon={<ChevronRight size={16} />} onClick={next}>Continuar</Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ListEditor<T extends { id: string }>({
  items,
  onChange,
  newItem,
  renderItem,
  addLabel,
}: {
  items: T[]
  onChange: (items: T[]) => void
  newItem: () => T
  renderItem: (item: T, update: (item: T) => void) => React.ReactNode
  addLabel: string
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          {renderItem(item, (updated) => onChange(items.map((i) => (i.id === item.id ? updated : i))))}
          <button onClick={() => onChange(items.filter((i) => i.id !== item.id))} aria-label="Remover" className="p-2 rounded-md hover:bg-red-50 text-red-600 shrink-0">
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} className="w-fit" onClick={() => onChange([...items, newItem()])}>
        {addLabel}
      </Button>
    </div>
  )
}
