import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { FullPageLoader } from '../../components/StateScreens'
import { SuperAdminLayout } from '../../layouts/SuperAdminLayout'
import { superAdminRoutes } from '../../utils/routes'

export function SuperAdminGate() {
  const { session, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!session || session.role !== 'super_admin') return <Navigate to={superAdminRoutes.login} replace />
  return (
    <SuperAdminLayout>
      <Outlet />
    </SuperAdminLayout>
  )
}
