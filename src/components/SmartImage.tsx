import { useState } from 'react'
import type { ImageAsset } from '../types'
import { useResolvedImage } from '../hooks/useImage'
import { ImageOff } from 'lucide-react'

interface SmartImageProps {
  asset?: ImageAsset | null
  alt: string
  className?: string
  fallbackClassName?: string
}

/**
 * Renders an ImageAsset with graceful fallback: never breaks the layout,
 * never shows a broken-image icon, always keeps proportions and always
 * carries an `alt`. Used everywhere an admin-managed image is displayed.
 */
export function SmartImage({ asset, alt, className, fallbackClassName }: SmartImageProps) {
  const src = useResolvedImage(asset)
  const [failed, setFailed] = useState(false)

  if (!asset || !src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--color-muted)] text-[var(--color-muted-foreground)] ${fallbackClassName ?? className ?? ''}`}
        role="img"
        aria-label={alt}
      >
        <ImageOff size={24} strokeWidth={1.5} />
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} loading="lazy" />
}
