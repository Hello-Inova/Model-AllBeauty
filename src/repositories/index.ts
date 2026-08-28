import type { DataRepository } from './DataRepository'
import type { ImageStorage } from './ImageStorage'
import { apiProvider } from './providers/ApiProvider'
import { apiImageStorage } from './providers/ApiImageStorage'

// ---------------------------------------------------------------------------
// Single place that decides which backend implementation the whole app
// talks to. The platform runs on a real Postgres database (via the
// serverless API in /api) and real Vercel Blob storage — see
// providers/ApiProvider.ts and providers/ApiImageStorage.ts.
// ---------------------------------------------------------------------------

export const dataRepository: DataRepository = apiProvider
export const imageStorage: ImageStorage = apiImageStorage

export type { DataRepository, ImageStorage }
