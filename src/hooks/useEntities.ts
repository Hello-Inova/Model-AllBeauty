import { useCallback, useEffect, useState } from 'react'
import { dataRepository } from '../repositories'
import type {
  Appointment,
  Banner,
  BlockedDate,
  Category,
  Customer,
  GalleryImage,
  Professional,
  Service,
  Testimonial,
} from '../types'

interface CollectionState<T> {
  data: T[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

function useBusinessCollection<T>(businessId: string | undefined, fetcher: (businessId: string) => Promise<T[]>): CollectionState<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!businessId) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await fetcher(businessId)
      setData(result)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}

export function useCategories(businessId: string | undefined) {
  return useBusinessCollection<Category>(businessId, (id) => dataRepository.getCategories(id))
}

export function useServices(businessId: string | undefined) {
  return useBusinessCollection<Service>(businessId, (id) => dataRepository.getServices(id))
}

export function useProfessionals(businessId: string | undefined) {
  return useBusinessCollection<Professional>(businessId, (id) => dataRepository.getProfessionals(id))
}

export function useCustomers(businessId: string | undefined) {
  return useBusinessCollection<Customer>(businessId, (id) => dataRepository.getCustomers(id))
}

export function useAppointments(businessId: string | undefined) {
  return useBusinessCollection<Appointment>(businessId, (id) => dataRepository.getAppointments(id))
}

export function useGallery(businessId: string | undefined) {
  return useBusinessCollection<GalleryImage>(businessId, (id) => dataRepository.getGallery(id))
}

export function useTestimonials(businessId: string | undefined) {
  return useBusinessCollection<Testimonial>(businessId, (id) => dataRepository.getTestimonials(id))
}

export function useBanners(businessId: string | undefined) {
  return useBusinessCollection<Banner>(businessId, (id) => dataRepository.getBanners(id))
}

export function useBlockedDates(businessId: string | undefined) {
  return useBusinessCollection<BlockedDate>(businessId, (id) => dataRepository.getBlockedDates(id))
}
