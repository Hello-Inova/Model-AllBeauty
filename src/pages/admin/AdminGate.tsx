import { Navigate, Outlet, useParams } from 'react-router-dom'
import { BusinessProvider, useBusinessContext } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'
import { FullPageLoader, BusinessNotFound } from '../../components/StateScreens'
import { AdminLayout } from '../../layouts/AdminLayout'
import { TermsGate } from '../../components/admin/TermsGate'
import { adminRoutes } from '../../utils/routes'
import { resolveBusinessSlug } from '../../utils/hostContext'

export function AdminGate() {
  // Na URL curta por subdomínio (beauty-demo.organyze.com.br/admin) não há
  // :slug no caminho — o slug vem do próprio hostname. Ver
  // src/utils/hostContext.ts.
  const slug = resolveBusinessSlug(useParams().slug)
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
