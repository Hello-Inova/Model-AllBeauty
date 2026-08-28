import type { ImageAsset } from '../../types'
import type { ImageStorage } from '../ImageStorage'
import { makeImageId } from '../ImageStorage'

/**
 * Real backend tier: uploaded files go to Vercel Blob (via /api/upload) and
 * come back as a public https URL — same shape as a plain "by URL" image
 * asset, so getImage() needs no async resolution step anymore.
 */
class ApiImageStorage implements ImageStorage {
  async uploadImage(file: File): Promise<ImageAsset> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-Filename': encodeURIComponent(file.name),
      },
      body: file,
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) throw new Error(body?.error ?? 'Falha ao enviar a imagem.')
    return {
      id: makeImageId(),
      type: 'upload',
      url: body.url,
      alt: file.name,
      createdAt: new Date().toISOString(),
    }
  }

  saveImageUrl(url: string, alt?: string): ImageAsset {
    return {
      id: makeImageId(),
      type: 'url',
      url,
      alt,
      createdAt: new Date().toISOString(),
    }
  }

  async getImage(asset: ImageAsset | undefined | null): Promise<string | undefined> {
    return asset?.url || undefined
  }

  async deleteImage(asset: ImageAsset | undefined | null): Promise<void> {
    if (!asset || asset.type !== 'upload' || !asset.url) return
    try {
      await fetch(`/api/upload?url=${encodeURIComponent(asset.url)}`, { method: 'DELETE' })
    } catch {
      /* best effort — a stray blob is harmless */
    }
  }
}

export const apiImageStorage = new ApiImageStorage()
