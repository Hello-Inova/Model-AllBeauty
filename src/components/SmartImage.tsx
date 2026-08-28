import { useState, useMemo } from 'react'
import type { ImageAsset } from '../types'
import { useResolvedImage } from '../hooks/useImage'
import { ImageIcon, type LucideIcon } from 'lucide-react'

interface SmartImageProps {
  asset?: ImageAsset | null
  alt: string
  className?: string
  fallbackClassName?: string
  /** Icon shown in the fallback state. Defaults to a generic image icon. */
  icon?: LucideIcon
  /** Relative icon size inside the fallback (px). Defaults to 28. */
  iconSize?: number
}

// Small deterministic hash so the same item always gets the same fallback
// tone/angle, but different items don't all look identical side by side.
function hashSeed(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const GRADIENT_ANGLES = [135, 160, 110, 145]

/**
 * Renders an ImageAsset with graceful fallback: never breaks the layout,
 * never shows a broken-image icon, always keeps proportions and always
 * carries an `alt`. Used everywhere an admin-managed image is displayed.
 *
 * When no image is set (or it fails to load), instead of a flat "broken
 * image" placeholder this renders an on-brand soft gradient (derived from
 * the business's theme colors) with a contextual icon — so the site still
 * looks intentional and polished before real photos are uploaded.
 */
export function SmartImage({ asset, alt, className, fallbackClassName, icon: Icon = ImageIcon, iconSize = 28 }: SmartImageProps) {
  const src = useResolvedImage(asset)
  const [failed, setFailed] = useState(false)

  const angle = useMemo(() => GRADIENT_ANGLES[hashSeed(alt) % GRADIENT_ANGLES.length], [alt])

  if (!asset || !src || failed) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden ${fallbackClassName ?? className ?? ''}`}
        style={{
          background: `linear-gradient(${angle}deg, color-mix(in srgb, var(--color-primary) 16%, var(--color-muted)) 0%, color-mix(in srgb, var(--color-secondary) 22%, var(--color-muted)) 100%)`,
        }}
        role="img"
        aria-label={alt}
      >
        <Icon size={iconSize} strokeWidth={1.25} className="text-[var(--color-primary)] opacity-50" />
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} loading="lazy" />
}
