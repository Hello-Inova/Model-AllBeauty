import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Wallet, AlertTriangle, Clock, Building2, BarChart3 } from 'lucide-react'
import { dataRepository } from '../../repositories'
import type { Business, FinanceReport, BillingTransactionStatus } from '../../types'
import { Badge, SectionCard, Select } from '../../components/Form'
import { ScrollableTable, Td, Th } from '../../components/ScrollableTable'
import { EmptyState } from '../../components/Form'
import { DashboardCard } from '../../components/admin/DashboardCard'
import { formatCents } from '../../utils/billing'
import { formatDateShort } from '../../utils/format'

const STATUS_LABELS: Record<BillingTransactionStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  received: 'Recebido',
  overdue: 'Atrasado',
  refused: 'Recusado',
  refunded: 'Estornado',
}

const STATUS_TONES: Record<BillingTransactionStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  confirmed: 'success',
  received: 'success',
  overdue: 'danger',
  refused: 'danger',
  refunded: 'default',
}

const EMPTY_REPORT: FinanceReport = {
  summary: {
    mrrCents: 0,
    confirmedThisMonthCents: 0,
    confirmedAllTimeCents: 0,
    pendingCents: 0,
    overdueCents: 0,
    businessesActive: 0,
    businessesOverdue: 0,
    businessesNoSubscription: 0,
    businessesExempt: 0,
  },
  monthly: [],
  transactions: [],
}

/** "2026-08" -> "ago/26" */
function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, 1)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(date)
  return label.replace('.', '')
}

export function SuperAdminFinancePage() {
  const [report, setReport] = useState<FinanceReport>(EMPTY_REPORT)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [businessFilter, setBusinessFilter] = useState('')

  async function load() {
    setLoading(true)
    const [financeReport, businessList] = await Promise.all([
      dataRepository.getFinanceReport({ status: statusFilter || undefined, businessId: businessFilter || undefined }),
      businesses.length ? Promise.resolve(businesses) : dataRepository.getBusinesses(),
    ])
    setReport(financeReport)
    setBusinesses(businessList)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, businessFilter])

  const { summary, monthly, transactions } = report
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.totalCents))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Gestão Financeira</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Receita da plataforma Hello Inova: assinaturas cobradas das empresas via Asaas.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard label="MRR estimado" value={formatCents(summary.mrrCents)} icon={<TrendingUp size={20} />} hint="Receita mensal recorrente das empresas ativas" />
        <DashboardCard label="Confirmado no mês" value={formatCents(summary.confirmedThisMonthCents)} icon={<DollarSign size={20} />} tone="success" />
        <DashboardCard label="Confirmado (total)" value={formatCents(summary.confirmedAllTimeCents)} icon={<Wallet size={20} />} tone="success" />
        <DashboardCard label="Em aberto" value={formatCents(summary.pendingCents)} icon={<Clock size={20} />} tone="warning" />
        <DashboardCard label="Atrasado" value={formatCents(summary.overdueCents)} icon={<AlertTriangle size={20} />} tone="danger" />
        <DashboardCard
          label="Empresas por status"
          value={`${summary.businessesActive} em dia`}
          icon={<Building2 size={20} />}
          hint={`${summary.businessesOverdue} atrasada(s) · ${summary.businessesNoSubscription} sem assinatura · ${summary.businessesExempt} isenta(s)`}
        />
      </div>

      <SectionCard title="Receita confirmada nos últimos 12 meses">
        {monthly.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">Ainda não há pagamentos confirmados registrados.</p>
        ) : (
          <div className="flex items-end gap-2 h-40 overflow-x-auto pb-1">
            {monthly.map((point) => (
              <div key={point.month} className="flex flex-col items-center justify-end gap-1.5 h-full min-w-[44px]" title={`${formatMonthLabel(point.month)}: ${formatCents(point.totalCents)}`}>
                <span className="text-[10px] text-[var(--color-muted-foreground)] whitespace-nowrap">{point.totalCents > 0 ? formatCents(point.totalCents) : ''}</span>
                <div
                  className="w-6 rounded-t bg-[var(--color-primary)]"
                  style={{ height: `${Math.max(2, Math.round((point.totalCents / maxMonthly) * 100))}%` }}
                />
                <span className="text-[10px] text-[var(--color-muted-foreground)] whitespace-nowrap">{formatMonthLabel(point.month)}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Transações"
        description="Cobranças geradas pelo Asaas para todas as empresas da plataforma."
        actions={
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs py-1.5">
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            <Select value={businessFilter} onChange={(e) => setBusinessFilter(e.target.value)} className="text-xs py-1.5">
              <option value="">Todas as empresas</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.displayName}</option>
              ))}
            </Select>
          </div>
        }
      >
        {!loading && transactions.length === 0 ? (
          <EmptyState icon={<BarChart3 size={32} />} title="Nenhuma transação encontrada" description="Ajuste os filtros ou aguarde a primeira cobrança ser processada pelo Asaas." />
        ) : (
          <ScrollableTable maxHeight="480px">
            <table>
              <thead>
                <tr>
                  <Th>Empresa</Th>
                  <Th>Valor</Th>
                  <Th>Status</Th>
                  <Th>Vencimento</Th>
                  <Th>Pago em</Th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <Td>
                      <p className="font-medium">{t.businessName}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">/{t.businessSlug}</p>
                    </Td>
                    <Td>{formatCents(t.valueCents)}</Td>
                    <Td><Badge tone={STATUS_TONES[t.status]}>{STATUS_LABELS[t.status]}</Badge></Td>
                    <Td>{t.dueDate ? formatDateShort(t.dueDate.slice(0, 10)) : '—'}</Td>
                    <Td>{t.paidAt ? formatDateShort(t.paidAt.slice(0, 10)) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
        )}
      </SectionCard>
    </div>
  )
}
