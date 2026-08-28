import type { Business } from '../types'

function readableForeground(hex: string): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return '#ffffff'
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1c1917' : '#ffffff'
}

/** Injects the business's colors as CSS variables on :root — the white-label mechanism. */
export function applyBusinessTheme(business: Pick<Business, 'primaryColor' | 'secondaryColor' | 'accentColor' | 'backgroundColor' | 'foregroundColor' | 'theme' | 'name'>): void {
  const root = document.documentElement
  root.style.setProperty('--color-primary', business.primaryColor)
  root.style.setProperty('--color-primary-foreground', readableForeground(business.primaryColor))
  root.style.setProperty('--color-secondary', business.secondaryColor)
  root.style.setProperty('--color-secondary-foreground', readableForeground(business.secondaryColor))
  root.style.setProperty('--color-accent', business.accentColor)
  root.style.setProperty('--color-background', business.backgroundColor)
  root.style.setProperty('--color-foreground', business.foregroundColor)
  document.title = business.name

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', business.primaryColor)
}

export function resetTheme(): void {
  const root = document.documentElement
  ;['--color-primary', '--color-primary-foreground', '--color-secondary', '--color-secondary-foreground', '--color-accent', '--color-background', '--color-foreground'].forEach((v) =>
    root.style.removeProperty(v),
  )
}
