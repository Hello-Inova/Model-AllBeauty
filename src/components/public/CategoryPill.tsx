import type { Category } from '../../types'

export function CategoryPill({ category, active, onClick }: { category: Category | null; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition ${
        active
          ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)]'
          : 'bg-transparent border-[var(--color-border)] hover:border-[var(--color-primary)]'
      }`}
    >
      {category ? category.name : 'Todos'}
    </button>
  )
}
