import type { DataRepository } from './DataRepository'
import type { ImageStorage } from './ImageStorage'
import { localStorageProvider, ensureSeedData } from './providers/LocalStorageProvider'
import { localImageStorage } from './providers/LocalImageStorage'

// ---------------------------------------------------------------------------
// Single place that decides which backend implementation the whole app
// talks to. Today it's the localStorage/IndexedDB tier used by the GitHub
// Pages build. Swapping in a real backend later (Supabase/Firebase/API)
// means creating providers/SupabaseProvider.ts (implementing DataRepository)
// and providers/SupabaseImageStorage.ts (implementing ImageStorage), then
// changing only the two exports below.
// ---------------------------------------------------------------------------

export const dataRepository: DataRepository = localStorageProvider
export const imageStorage: ImageStorage = localImageStorage

export { ensureSeedData }
export type { DataRepository, ImageStorage }
