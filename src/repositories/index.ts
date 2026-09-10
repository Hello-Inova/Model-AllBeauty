import type { DataRepository } from './DataRepository'
import type { ImageStorage } from './ImageStorage'
import type { VideoStorage } from './VideoStorage'
import { apiProvider } from './providers/ApiProvider'
import { apiImageStorage } from './providers/ApiImageStorage'
import { apiVideoStorage } from './providers/ApiVideoStorage'

// ---------------------------------------------------------------------------
// Single place that decides which backend implementation the whole app
// talks to. The platform runs on a real Postgres database (via the
// serverless API in /api) and real Vercel Blob storage — see
// providers/ApiProvider.ts, providers/ApiImageStorage.ts and
// providers/ApiVideoStorage.ts.
// ---------------------------------------------------------------------------

export const dataRepository: DataRepository = apiProvider
export const imageStorage: ImageStorage = apiImageStorage
export const videoStorage: VideoStorage = apiVideoStorage

export type { DataRepository, ImageStorage, VideoStorage }
