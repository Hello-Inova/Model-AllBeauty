import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Business } from '../types'
import { dataRepository } from '../repositories'
import { applyBusinessTheme } from '../themes/applyTheme'

interface BusinessContextValue {
  business: Business | null
  loading: boolean
  notFound: boolean
  refresh: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextValue | null>(null)

export function BusinessProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const found = await dataRepository.getBusinessBySlug(slug)
    if (found) {
      setBusiness(found)
      setNotFound(false)
      applyBusinessTheme(found)
    } else {
      setBusiness(null)
      setNotFound(true)
    }
    setLoading(false)
  }, [slug])

  useEffect(() => {
    refresh()
  }, [refresh])

  return <BusinessContext.Provider value={{ business, loading, notFound, refresh }}>{children}</BusinessContext.Provider>
}

export function useBusinessContext(): BusinessContextValue {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error('useBusinessContext deve ser usado dentro de BusinessProvider')
  return ctx
}

/** Convenience hook for screens that require a loaded business (throws-friendly pattern is avoided; callers should check loading/notFound first). */
export function useCurrentBusiness(): Business | null {
  return useBusinessContext().business
}
