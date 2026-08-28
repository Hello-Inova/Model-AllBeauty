import type { ImageAsset, ImageSourceType } from '../types'

/**
 * Storage-agnostic abstraction for handling images.
 *
 * The GitHub Pages / MVP tier ships `LocalImageStorage`, which keeps
 * uploaded files inside IndexedDB (as Blobs) and resolves them to object
 * URLs on demand. Remote images added "by URL" are stored as plain URLs
 * and never touch IndexedDB.
 *
 * When the project graduates to a real backend, swap the singleton in
 * `index.ts` for `SupabaseImageStorage` / `FirebaseImageStorage` /
 * `CloudinaryImageStorage` — every screen in the app calls only the
 * methods declared here, so nothing else needs to change.
 */
export interface ImageStorage {
  /** Persist a File selected/dragged by the admin and return a ready-to-use ImageAsset. */
  uploadImage(file: File): Promise<ImageAsset>
  /** Register a remote URL as an ImageAsset (no bytes are stored). */
  saveImageUrl(url: string, alt?: string): ImageAsset
  /** Resolve an ImageAsset to a renderable src (object URL for uploads, the URL itself otherwise). */
  getImage(asset: ImageAsset | undefined | null): Promise<string | undefined>
  /** Delete a previously uploaded file from storage (no-op for 'url' type assets). */
  deleteImage(asset: ImageAsset | undefined | null): Promise<void>
}

export function makeImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function isImageSourceType(v: string): v is ImageSourceType {
  return v === 'url' || v === 'upload'
}
