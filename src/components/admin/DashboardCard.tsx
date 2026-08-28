import type { ReactNode } from 'react'

export function DashboardCard({ label, value, icon, tone = 'default', hint }: { label: string; value: ReactNode; icon: ReactNode; tone?: 'default' | 'success' | 'warning' | 'danger'; hint?: string }) {
  const tones: Record<string, string> = {
    default: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10',
    success: 'text-emerald-600 bg-emerald-100',
    warning: 'text-amber-600 bg-amber-100',
    danger: 'text-red-600 bg-red-100',
  }
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 flex items-start gap-4">
      <span className={`rounded-lg p-2.5 ${tones[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">{label}</p>
        <p className="font-heading text-2xl font-semibold mt-0.5 truncate">{value}</p>
        {hint && <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{hint}</p>}
      </div>
    </div>
  )
}
