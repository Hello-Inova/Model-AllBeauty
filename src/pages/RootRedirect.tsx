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
    // Public visitors are never authenticated here, so this must only ever
    // call the public "business by slug" lookup — never the admin-only
    // "list all businesses" endpoint (which 401s for anonymous visitors and
    // used to leave this page stuck on the loader forever).
    dataRepository
      .getBusinessBySlug(DEFAULT_BUSINESS_SLUG)
      .then((business) => {
        setSlug(business ? business.slug : DEFAULT_BUSINESS_SLUG)
      })
      .catch(() => {
        setSlug(DEFAULT_BUSINESS_SLUG)
      })
  }, [])

  if (!slug) return <FullPageLoader />
  return <Navigate to={publicRoutes.home(slug)} replace />
}
