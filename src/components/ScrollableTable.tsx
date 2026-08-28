import type { ReactNode } from 'react'

/**
 * Mandatory wrapper for EVERY table in the app (public or admin). Guarantees
 * horizontal + vertical scroll happens inside the table, never on the page,
 * so tables never break the layout on small screens or with many columns.
 */
export function ScrollableTable({ children, maxHeight }: { children: ReactNode; maxHeight?: string }) {
  return (
    <div className="table-scroll" style={maxHeight ? { maxHeight } : undefined}>
      {children}
    </div>
  )
}

export function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th className={`sticky top-0 bg-[var(--color-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] px-4 py-3 whitespace-nowrap border-b border-[var(--color-border)] ${className}`}>
      {children}
    </th>
  )
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm border-b border-[var(--color-border)] whitespace-nowrap ${className}`}>{children}</td>
}
