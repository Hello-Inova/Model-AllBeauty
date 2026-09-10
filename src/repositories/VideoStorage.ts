import type { VideoAsset } from '../types'

/**
 * Storage-agnostic abstraction for handling videos — mirrors ImageStorage,
 * but uploads go straight from the browser to blob storage (see
 * providers/ApiVideoStorage.ts) instead of through a Serverless Function,
 * since a 40-second video can easily exceed the function body-size limit.
 */
export interface VideoStorage {
  /** Persist a File selected/dragged by the admin and return a ready-to-use VideoAsset. */
  uploadVideo(file: File, onProgress?: (percentage: number) => void): Promise<VideoAsset>
  /** Register a remote URL as a VideoAsset (no bytes are stored). */
  saveVideoUrl(url: string): VideoAsset
  /** Delete a previously uploaded file from storage (no-op for 'url' type assets). */
  deleteVideo(asset: VideoAsset | undefined | null): Promise<void>
}

export function makeVideoId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
