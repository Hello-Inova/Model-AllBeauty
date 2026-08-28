export function TimeSlotGrid({ slots, selected, onSelect }: { slots: string[]; selected: string | null; onSelect: (time: string) => void }) {
  if (slots.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)] py-6 text-center">Nenhum horário disponível nesta data. Selecione outro dia.</p>
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((time) => (
        <button
          key={time}
          type="button"
          onClick={() => onSelect(time)}
          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
            selected === time
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
          }`}
        >
          {time}
        </button>
      ))}
    </div>
  )
}
