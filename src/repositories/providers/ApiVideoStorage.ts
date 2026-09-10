import { uploadPresigned } from '@vercel/blob/client'
import type { VideoAsset } from '../../types'
import type { VideoStorage } from '../VideoStorage'
import { makeVideoId } from '../VideoStorage'

/**
 * Real backend tier: the file goes straight from the browser to Vercel Blob
 * (via the presigned-upload flow in api/upload-video.ts, which only issues a
 * signed token) — never through this app's own Serverless Function body, so
 * a 40-second video doesn't risk hitting the platform's request-size limit
 * the way api/upload.ts (used for images) would.
 *
 * Uses `uploadPresigned` (not the legacy `upload`) because the project's
 * Blob store is connected to Vercel via OIDC only — see the comment in
 * api/upload-video.ts for why.
 */
class ApiVideoStorage implements VideoStorage {
  async uploadVideo(file: File, onProgress?: (percentage: number) => void): Promise<VideoAsset> {
    const blob = await uploadPresigned(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload-video',
      onUploadProgress: onProgress ? (event) => onProgress(event.percentage) : undefined,
    })
    return {
      id: makeVideoId(),
      type: 'upload',
      url: blob.url,
      alt: file.name,
      createdAt: new Date().toISOString(),
    }
  }

  saveVideoUrl(url: string): VideoAsset {
    return {
      id: makeVideoId(),
      type: 'url',
      url,
      createdAt: new Date().toISOString(),
    }
  }

  async deleteVideo(asset: VideoAsset | undefined | null): Promise<void> {
    if (!asset || asset.type !== 'upload' || !asset.url) return
    try {
      // Reaproveita o mesmo endpoint DELETE usado para imagens — ele só
      // precisa da URL do blob, não importa como foi enviado.
      await fetch(`/api/upload?url=${encodeURIComponent(asset.url)}`, { method: 'DELETE' })
    } catch {
      /* best effort — um blob órfão é inofensivo */
    }
  }
}

export const apiVideoStorage = new ApiVideoStorage()
