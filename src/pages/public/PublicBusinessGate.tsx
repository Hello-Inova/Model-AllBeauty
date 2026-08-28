import { Navigate, Outlet, useParams } from 'react-router-dom'
import { BusinessProvider, useBusinessContext } from '../../contexts/BusinessContext'
import { FullPageLoader, BusinessNotFound, BusinessInactiveScreen } from '../../components/StateScreens'
import { PublicLayout } from '../../layouts/PublicLayout'

export function PublicBusinessGate() {
  const { slug } = useParams()
  if (!slug) return <Navigate to="/" replace />
  return (
    <BusinessProvider slug={slug}>
      <PublicBusinessGateInner />
    </BusinessProvider>
  )
}

function PublicBusinessGateInner() {
  const { business, loading, notFound } = useBusinessContext()
  if (loading) return <FullPageLoader />
  if (notFound || !business) return <BusinessNotFound />
  if (!business.active) return <BusinessInactiveScreen name={business.displayName} />
  return (
    <PublicLayout business={business}>
      <Outlet />
    </PublicLayout>
  )
}
