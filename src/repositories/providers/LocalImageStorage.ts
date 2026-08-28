import type { ImageAsset } from '../../types'
import type { ImageStorage } from '../ImageStorage'
import { makeImageId } from '../ImageStorage'

const DB_NAME = 'wl-booking-images'
const DB_VERSION = 1
const STORE_NAME = 'images'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB não é suportado neste navegador.'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, value: Blob): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function idbGet(key: string): Promise<Blob | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => resolve(req.result as Blob | undefined)
    req.onerror = () => reject(req.error)
  })
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Cache of resolved object URLs so we don't recreate them on every render.
const objectUrlCache = new Map<string, string>()

class LocalImageStorage implements ImageStorage {
  async uploadImage(file: File): Promise<ImageAsset> {
    const key = makeImageId()
    try {
      await idbSet(key, file)
    } catch {
      // Fall back to base64 data URL stored directly on the asset if IndexedDB
      // is unavailable (private browsing, quota, etc). Still fully local.
      const dataUrl = await fileToDataUrl(file)
      return {
        id: key,
        type: 'upload',
        url: dataUrl,
        storageKey: undefined,
        alt: file.name,
        createdAt: new Date().toISOString(),
      }
    }
    return {
      id: key,
      type: 'upload',
      url: '',
      storageKey: key,
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
    if (!asset) return undefined
    if (asset.type === 'url') return asset.url
    if (asset.url && asset.url.startsWith('data:')) return asset.url
    if (!asset.storageKey) return asset.url || undefined
    const cached = objectUrlCache.get(asset.storageKey)
    if (cached) return cached
    try {
      const blob = await idbGet(asset.storageKey)
      if (!blob) return undefined
      const objectUrl = URL.createObjectURL(blob)
      objectUrlCache.set(asset.storageKey, objectUrl)
      return objectUrl
    } catch {
      return undefined
    }
  }

  async deleteImage(asset: ImageAsset | undefined | null): Promise<void> {
    if (!asset || asset.type !== 'upload' || !asset.storageKey) return
    const cached = objectUrlCache.get(asset.storageKey)
    if (cached) {
      URL.revokeObjectURL(cached)
      objectUrlCache.delete(asset.storageKey)
    }
    try {
      await idbDelete(asset.storageKey)
    } catch {
      /* best effort */
    }
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export const localImageStorage = new LocalImageStorage()
