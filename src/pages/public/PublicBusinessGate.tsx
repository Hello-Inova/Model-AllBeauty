import { Navigate, Outlet, useParams } from 'react-router-dom'
import { BusinessProvider, useBusinessContext } from '../../contexts/BusinessContext'
import { FullPageLoader, BusinessNotFound, BusinessInactiveScreen, BusinessTrialExpiredScreen } from '../../components/StateScreens'
import { PublicLayout } from '../../layouts/PublicLayout'
import { resolveBusinessSlug } from '../../utils/hostContext'
import { hasBillingAccess } from '../../utils/billing'

export function PublicBusinessGate() {
  // Na URL curta por subdomínio (beauty-demo.organyze.com.br/) não há
  // :slug no caminho — o slug vem do próprio hostname. Ver
  // src/utils/hostContext.ts.
  const slug = resolveBusinessSlug(useParams().slug)
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
  if (!hasBillingAccess(business)) return <BusinessTrialExpiredScreen name={business.displayName} />
  return (
    <PublicLayout business={business}>
      <Outlet />
    </PublicLayout>
  )
}
