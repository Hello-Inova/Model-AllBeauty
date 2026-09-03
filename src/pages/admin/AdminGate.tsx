import { Navigate, Outlet, useParams } from 'react-router-dom'
import { BusinessProvider, useBusinessContext } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'
import { FullPageLoader, BusinessNotFound } from '../../components/StateScreens'
import { AdminLayout } from '../../layouts/AdminLayout'
import { TermsGate } from '../../components/admin/TermsGate'
import { adminRoutes } from '../../utils/routes'

export function AdminGate() {
  const { slug } = useParams()
  if (!slug) return <Navigate to="/" replace />
  return (
    <BusinessProvider slug={slug}>
      <AdminGateInner slug={slug} />
    </BusinessProvider>
  )
}

function AdminGateInner({ slug }: { slug: string }) {
  const { business, loading, notFound } = useBusinessContext()
  const { session, loading: authLoading } = useAuth()

  if (loading || authLoading) return <FullPageLoader />
  if (notFound || !business) return <BusinessNotFound />
  if (!session || (session.businessSlug !== slug && session.role !== 'super_admin')) {
    return <Navigate to={adminRoutes.login(slug)} replace />
  }

  return (
    <TermsGate>
      <AdminLayout business={business}>
        <Outlet />
      </AdminLayout>
    </TermsGate>
  )
}
