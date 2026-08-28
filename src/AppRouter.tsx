import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider } from './contexts/AuthContext'
import { ensureSeedData } from './repositories'
import { FullPageLoader } from './components/StateScreens'
import { NotFoundPage } from './components/StateScreens'

import { RootRedirect } from './pages/RootRedirect'
import { PublicBusinessGate } from './pages/public/PublicBusinessGate'
import { HomePage } from './pages/public/HomePage'
import { ServicesPage } from './pages/public/ServicesPage'
import { ServiceDetailPage } from './pages/public/ServiceDetailPage'
import { ProfessionalsPage } from './pages/public/ProfessionalsPage'
import { AboutPage } from './pages/public/AboutPage'
import { GalleryPage } from './pages/public/GalleryPage'
import { ContactPage } from './pages/public/ContactPage'
import { BookingPage } from './pages/public/BookingPage'

import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminGate } from './pages/admin/AdminGate'
import { DashboardPage } from './pages/admin/DashboardPage'
import { AgendaPage } from './pages/admin/AgendaPage'
import { ServicesAdminPage } from './pages/admin/ServicesAdminPage'
import { CategoriesAdminPage } from './pages/admin/CategoriesAdminPage'
import { ProfessionalsAdminPage } from './pages/admin/ProfessionalsAdminPage'
import { CustomersAdminPage } from './pages/admin/CustomersAdminPage'
import { GalleryAdminPage } from './pages/admin/GalleryAdminPage'
import { TestimonialsAdminPage } from './pages/admin/TestimonialsAdminPage'
import { SettingsAdminPage } from './pages/admin/SettingsAdminPage'
import { BackupAdminPage } from './pages/admin/BackupAdminPage'

import { SuperAdminLoginPage } from './pages/superadmin/SuperAdminLoginPage'
import { SuperAdminGate } from './pages/superadmin/SuperAdminGate'
import { SuperAdminDashboardPage } from './pages/superadmin/SuperAdminDashboardPage'
import { SuperAdminOnboardingPage } from './pages/superadmin/SuperAdminOnboardingPage'

export default function AppRouter() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureSeedData()
    setReady(true)
  }, [])

  if (!ready) return <FullPageLoader />

  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            <Route path="/empresa/:slug" element={<PublicBusinessGate />}>
              <Route index element={<HomePage />} />
              <Route path="servicos" element={<ServicesPage />} />
              <Route path="servicos/:serviceSlug" element={<ServiceDetailPage />} />
              <Route path="profissionais" element={<ProfessionalsPage />} />
              <Route path="sobre" element={<AboutPage />} />
              <Route path="galeria" element={<GalleryPage />} />
              <Route path="contato" element={<ContactPage />} />
              <Route path="agendamento" element={<BookingPage />} />
            </Route>

            <Route path="/admin/:slug/login" element={<AdminLoginPage />} />
            <Route path="/admin/:slug" element={<AdminGate />}>
              <Route index element={<DashboardPage />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="servicos" element={<ServicesAdminPage />} />
              <Route path="categorias" element={<CategoriesAdminPage />} />
              <Route path="profissionais" element={<ProfessionalsAdminPage />} />
              <Route path="clientes" element={<CustomersAdminPage />} />
              <Route path="galeria" element={<GalleryAdminPage />} />
              <Route path="depoimentos" element={<TestimonialsAdminPage />} />
              <Route path="configuracoes" element={<SettingsAdminPage />} />
              <Route path="backup" element={<BackupAdminPage />} />
            </Route>

            <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
            <Route path="/super-admin" element={<SuperAdminGate />}>
              <Route index element={<SuperAdminDashboardPage />} />
              <Route path="nova-empresa" element={<SuperAdminOnboardingPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  )
}
