import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Building2, ExternalLink, Settings2, ToggleLeft, ToggleRight, LayoutGrid, Users, Trash2, MessageCircle } from 'lucide-react'
import { dataRepository } from '../../repositories'
import type { Business, BillingPlanDef, BillingPlanId, BillingType, PlatformSettings } from '../../types'
import { Badge, Button, EmptyState, SectionCard, Select } from '../../components/Form'
import { ScrollableTable, Td, Th } from '../../components/ScrollableTable'
import { SmartImage } from '../../components/SmartImage'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { superAdminRoutes, adminRoutes, publicRoutes } from '../../utils/routes'
import { businessOrigin, getHostContext } from '../../utils/hostContext'
import { DashboardCard } from '../../components/admin/DashboardCard'
import { useToast } from '../../contexts/ToastContext'
import { whatsappLink } from '../../utils/whatsapp'
import { SUBSCRIPTION_STATUS_LABELS, billingCollectionMessage, daysUntil } from '../../utils/billing'

// Esta tela é acessada tanto pela URL longa de sempre (organyze.com.br/super-admin,
// modo plataforma) quanto pelo subdomínio dedicado (admin.organyze.com.br,
// modo super-admin) — ver src/utils/hostContext.ts. No modo plataforma,
// "ver site"/"painel administrativo" de cada empresa continuam sendo links
// relativos de sempre (mesma origem). No modo super-admin, essas ações
// necessariamente cruzam pro subdomínio próprio de cada empresa — por isso
// viram URLs absolutas com uma tag <a> normal em vez de <Link>.
const onSuperAdminSubdomain = getHostContext().mode === 'super-admin'
function viewSiteHref(slug: string): string {
  return onSuperAdminSubdomain ? `${businessOrigin(slug)}/` : publicRoutes.home(slug)
}
function businessDashboardHref(slug: string): string {
  return onSuperAdminSubdomain ? `${businessOrigin(slug)}/admin` : adminRoutes.dashboard(slug)
}

const PLAN_LABELS: Record<string, string> = { basico: 'Básico', profissional: 'Profissional', premium: 'Premium' }

const EMPTY_SETTINGS: PlatformSettings = { pixKey: '', pixKeyOwnerName: '' }

export function SuperAdminDashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [plans, setPlans] = useState<BillingPlanDef[]>([])
  const [settings, setSettings] = useState<PlatformSettings>(EMPTY_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<Business | null>(null)
  const toast = useToast()

  async function load() {
    setLoading(true)
    const [list, planList, platformSettings] = await Promise.all([
      dataRepository.getBusinesses(),
      dataRepository.getPlans(),
      dataRepository.getPlatformSettings(),
    ])
    setBusinesses(list)
    setPlans(planList)
    setSettings(platformSettings)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleActive(b: Business) {
    await dataRepository.updateBusiness(b.id, { active: !b.active })
    toast.success(b.active ? 'Empresa desativada.' : 'Empresa ativada.')
    load()
  }

  async function changeBillingPlan(b: Business, billingPlan: BillingPlanId) {
    await dataRepository.updateBusiness(b.id, { billingPlan })
    toast.success('Plano de cobrança atualizado.')
    load()
  }

  async function changeBillingType(b: Business, billingType: BillingType) {
    await dataRepository.updateBusiness(b.id, { billingType })
    toast.success(billingType === 'isento' ? 'Empresa marcada como isenta.' : 'Empresa voltou a ser cobrada normalmente.')
    load()
  }

  async function handleDelete() {
    if (!deleting) return
    await dataRepository.deleteBusiness(deleting.id)
    toast.success('Empresa excluída.')
    setDeleting(null)
    load()
  }

  function sendCollectionMessage(b: Business) {
    const plan = plans.find((p) => p.id === b.billingPlan)
    const days = daysUntil(b.planExpiresAt)
    const message = billingCollectionMessage(b, plan, settings, days)
    window.open(whatsappLink(b.whatsapp, message), '_blank', 'noopener,noreferrer')
  }

  const activeCount = businesses.filter((b) => b.active).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Empresas na plataforma</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Crie e gerencie todas as empresas que utilizam esta base white-label.</p>
        </div>
        <Link to={superAdminRoutes.onboarding}>
          <Button icon={<Plus size={16} />}>Nova empresa</Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <DashboardCard label="Total de empresas" value={businesses.length} icon={<Building2 size={20} />} />
        <DashboardCard label="Empresas ativas" value={activeCount} icon={<LayoutGrid size={20} />} tone="success" />
        <DashboardCard label="Planos Premium" value={businesses.filter((b) => b.plan === 'premium').length} icon={<Users size={20} />} />
      </div>

      <SectionCard title="Todas as empresas">
        {!loading && businesses.length === 0 ? (
          <EmptyState icon={<Building2 size={32} />} title="Nenhuma empresa cadastrada" action={<Link to={superAdminRoutes.onboarding}><Button>Criar primeira empresa</Button></Link>} />
        ) : (
          <ScrollableTable>
            <table>
              <thead>
                <tr>
                  <Th>Empresa</Th>
                  <Th>Segmento</Th>
                  <Th>Plano</Th>
                  <Th>Status</Th>
                  <Th>Cobrança</Th>
                  <Th>Assinatura</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => {
                  const days = daysUntil(b.planExpiresAt)
                  return (
                    <tr key={b.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <SmartImage asset={b.logo} alt={b.name} className="h-8 w-8 rounded-full object-cover" fallbackClassName="h-8 w-8 rounded-full" icon={Building2} iconSize={16} />
                          <div>
                            <p className="font-medium">{b.displayName}</p>
                            <p className="text-xs text-[var(--color-muted-foreground)]">/{b.slug}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>{b.segment}</Td>
                      <Td><Badge tone="info">{PLAN_LABELS[b.plan] ?? b.plan}</Badge></Td>
                      <Td><Badge tone={b.active ? 'success' : 'danger'}>{b.active ? 'Ativa' : 'Inativa'}</Badge></Td>
                      <Td>
                        <Select value={b.billingType} onChange={(e) => changeBillingType(b, e.target.value as BillingType)} className="text-xs py-1.5">
                          <option value="padrao">Padrão</option>
                          <option value="isento">Isento</option>
                        </Select>
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-1 min-w-[150px]">
                          {b.billingType === 'isento' ? (
                            <span className="text-xs text-[var(--color-muted-foreground)]">Sem cobrança</span>
                          ) : (
                            <>
                              <Select value={b.billingPlan} onChange={(e) => changeBillingPlan(b, e.target.value as BillingPlanId)} className="text-xs py-1.5">
                                {plans.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </Select>
                              <div className="flex items-center gap-1.5">
                                <Badge tone={b.subscriptionStatus === 'ativa' ? 'success' : b.subscriptionStatus === 'atrasada' ? 'danger' : 'default'}>
                                  {SUBSCRIPTION_STATUS_LABELS[b.subscriptionStatus] ?? b.subscriptionStatus}
                                </Badge>
                                {days !== null && (
                                  <span className="text-[11px] text-[var(--color-muted-foreground)]">{days < 0 ? `venceu há ${Math.abs(days)}d` : `${days}d`}</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex gap-1.5">
                          {onSuperAdminSubdomain ? (
                            <a href={viewSiteHref(b.slug)} target="_blank" rel="noreferrer" title="Ver site" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><ExternalLink size={15} /></a>
                          ) : (
                            <Link to={viewSiteHref(b.slug)} target="_blank" title="Ver site" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><ExternalLink size={15} /></Link>
                          )}
                          {onSuperAdminSubdomain ? (
                            <a href={businessDashboardHref(b.slug)} title="Painel administrativo" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><Settings2 size={15} /></a>
                          ) : (
                            <Link to={businessDashboardHref(b.slug)} title="Painel administrativo" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><Settings2 size={15} /></Link>
                          )}
                          <button onClick={() => toggleActive(b)} title={b.active ? 'Desativar' : 'Ativar'} className="p-1.5 rounded-md hover:bg-[var(--color-muted)]">
                            {b.active ? <ToggleRight size={15} className="text-emerald-600" /> : <ToggleLeft size={15} />}
                          </button>
                          {b.billingType === 'padrao' && (
                            <button onClick={() => sendCollectionMessage(b)} title="Cobrar via WhatsApp" className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600">
                              <MessageCircle size={15} />
                            </button>
                          )}
                          <button onClick={() => setDeleting(b)} title="Excluir empresa" className="p-1.5 rounded-md hover:bg-red-50 text-red-600">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </ScrollableTable>
        )}
      </SectionCard>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir empresa"
        message={`Tem certeza que deseja excluir "${deleting?.displayName}"? Todos os dados dessa empresa (agenda, clientes, serviços, etc.) serão apagados permanentemente.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
