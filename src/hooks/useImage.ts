import { useEffect, useState } from 'react'
import type { ImageAsset } from '../types'
import { imageStorage } from '../repositories'

/** Resolves an ImageAsset (URL or IndexedDB-backed upload) to a renderable src string. */
export function useResolvedImage(asset: ImageAsset | undefined | null): string | undefined {
  const [src, setSrc] = useState<string | undefined>(asset?.type === 'url' ? asset.url : undefined)

  useEffect(() => {
    let cancelled = false
    imageStorage.getImage(asset).then((resolved) => {
      if (!cancelled) setSrc(resolved)
    })
    return () => {
      cancelled = true
    }
  }, [asset])

  return src
}
