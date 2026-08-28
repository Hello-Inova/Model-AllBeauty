import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { dataRepository } from '../repositories'
import { DEFAULT_BUSINESS_SLUG } from '../config'
import { publicRoutes } from '../utils/routes'
import { FullPageLoader } from '../components/StateScreens'

/** Root "/" — sends visitors straight to the demo business's public site. */
export function RootRedirect() {
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    dataRepository.getBusinesses().then((list) => {
      const demo = list.find((b) => b.slug === DEFAULT_BUSINESS_SLUG) ?? list[0]
      setSlug(demo ? demo.slug : DEFAULT_BUSINESS_SLUG)
    })
  }, [])

  if (!slug) return <FullPageLoader />
  return <Navigate to={publicRoutes.home(slug)} replace />
}
