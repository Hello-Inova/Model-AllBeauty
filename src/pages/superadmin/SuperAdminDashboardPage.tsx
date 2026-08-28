import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Building2, ExternalLink, Settings2, ToggleLeft, ToggleRight, LayoutGrid, CalendarCheck2, Users } from 'lucide-react'
import { dataRepository } from '../../repositories'
import type { Business } from '../../types'
import { Badge, Button, EmptyState, SectionCard } from '../../components/Form'
import { ScrollableTable, Td, Th } from '../../components/ScrollableTable'
import { SmartImage } from '../../components/SmartImage'
import { superAdminRoutes, adminRoutes, publicRoutes } from '../../utils/routes'
import { DashboardCard } from '../../components/admin/DashboardCard'
import { useToast } from '../../contexts/ToastContext'

const PLAN_LABELS: Record<string, string> = { basico: 'Básico', profissional: 'Profissional', premium: 'Premium' }

export function SuperAdminDashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  async function load() {
    setLoading(true)
    const list = await dataRepository.getBusinesses()
    setBusinesses(list)
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
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
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
                      <div className="flex gap-1.5">
                        <Link to={publicRoutes.home(b.slug)} target="_blank" title="Ver site" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><ExternalLink size={15} /></Link>
                        <Link to={adminRoutes.dashboard(b.slug)} title="Painel administrativo" className="p-1.5 rounded-md hover:bg-[var(--color-muted)]"><Settings2 size={15} /></Link>
                        <button onClick={() => toggleActive(b)} title={b.active ? 'Desativar' : 'Ativar'} className="p-1.5 rounded-md hover:bg-[var(--color-muted)]">
                          {b.active ? <ToggleRight size={15} className="text-emerald-600" /> : <ToggleLeft size={15} />}
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
        )}
      </SectionCard>

      <SectionCard title="Planos" description="Estrutura de planos preparada para cobrança futura (não implementada nesta versão).">
        <div className="grid sm:grid-cols-3 gap-4">
          <PlanCard name="Básico" features={['Catálogo', 'Agendamento', '1 profissional']} />
          <PlanCard name="Profissional" features={['Vários profissionais', 'Clientes', 'Relatórios', 'WhatsApp']} highlighted />
          <PlanCard name="Premium" features={['Pagamentos', 'Automação', 'Relatórios avançados', 'Recursos adicionais']} />
        </div>
      </SectionCard>
    </div>
  )
}

function PlanCard({ name, features, highlighted }: { name: string; features: string[]; highlighted?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${highlighted ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarCheck2 size={16} className="text-[var(--color-primary)]" />
        <h3 className="font-heading font-semibold">{name}</h3>
      </div>
      <ul className="flex flex-col gap-1.5 text-sm text-[var(--color-muted-foreground)]">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
    </div>
  )
}
