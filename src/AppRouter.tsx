import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider } from './contexts/AuthContext'
import { NotFoundPage, FullPageLoader } from './components/StateScreens'
import { ScrollToTop } from './components/ScrollToTop'

// A LandingPage é a única rota importada de forma estática (é a porta de
// entrada mais visitada — a "/" — e não deve esperar um round-trip extra de
// chunk). Todo o resto (site público das empresas, painel admin, super-admin
// e páginas legais) é carregado sob demanda via React.lazy(): antes disso,
// um único bundle de +630KB trazia o painel admin inteiro (e o super-admin)
// para quem só abria a landing page pública. Ver <Suspense> com
// FullPageLoader como fallback logo abaixo.
import { LandingPage } from './pages/LandingPage'
const SignupPage = lazy(() => import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })))
const PublicBusinessGate = lazy(() => import('./pages/public/PublicBusinessGate').then((m) => ({ default: m.PublicBusinessGate })))
const HomePage = lazy(() => import('./pages/public/HomePage').then((m) => ({ default: m.HomePage })))
const ServicesPage = lazy(() => import('./pages/public/ServicesPage').then((m) => ({ default: m.ServicesPage })))
const ServiceDetailPage = lazy(() => import('./pages/public/ServiceDetailPage').then((m) => ({ default: m.ServiceDetailPage })))
const ProfessionalsPage = lazy(() => import('./pages/public/ProfessionalsPage').then((m) => ({ default: m.ProfessionalsPage })))
const AboutPage = lazy(() => import('./pages/public/AboutPage').then((m) => ({ default: m.AboutPage })))
const GalleryPage = lazy(() => import('./pages/public/GalleryPage').then((m) => ({ default: m.GalleryPage })))
const ContactPage = lazy(() => import('./pages/public/ContactPage').then((m) => ({ default: m.ContactPage })))
const BookingPage = lazy(() => import('./pages/public/BookingPage').then((m) => ({ default: m.BookingPage })))

const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })))
const AdminGate = lazy(() => import('./pages/admin/AdminGate').then((m) => ({ default: m.AdminGate })))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const AgendaPage = lazy(() => import('./pages/admin/AgendaPage').then((m) => ({ default: m.AgendaPage })))
const ServicesAdminPage = lazy(() => import('./pages/admin/ServicesAdminPage').then((m) => ({ default: m.ServicesAdminPage })))
const CategoriesAdminPage = lazy(() => import('./pages/admin/CategoriesAdminPage').then((m) => ({ default: m.CategoriesAdminPage })))
const ProfessionalsAdminPage = lazy(() => import('./pages/admin/ProfessionalsAdminPage').then((m) => ({ default: m.ProfessionalsAdminPage })))
const CustomersAdminPage = lazy(() => import('./pages/admin/CustomersAdminPage').then((m) => ({ default: m.CustomersAdminPage })))
const GalleryAdminPage = lazy(() => import('./pages/admin/GalleryAdminPage').then((m) => ({ default: m.GalleryAdminPage })))
const VideosAdminPage = lazy(() => import('./pages/admin/VideosAdminPage').then((m) => ({ default: m.VideosAdminPage })))
const TestimonialsAdminPage = lazy(() => import('./pages/admin/TestimonialsAdminPage').then((m) => ({ default: m.TestimonialsAdminPage })))
const SettingsAdminPage = lazy(() => import('./pages/admin/SettingsAdminPage').then((m) => ({ default: m.SettingsAdminPage })))
const BackupAdminPage = lazy(() => import('./pages/admin/BackupAdminPage').then((m) => ({ default: m.BackupAdminPage })))
const SubscriptionAdminPage = lazy(() => import('./pages/admin/SubscriptionAdminPage').then((m) => ({ default: m.SubscriptionAdminPage })))
const ProfileAdminPage = lazy(() => import('./pages/admin/ProfileAdminPage').then((m) => ({ default: m.ProfileAdminPage })))

const TermsPage = lazy(() => import('./pages/legal/TermsPage').then((m) => ({ default: m.TermsPage })))
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })))
const CookiesPolicyPage = lazy(() => import('./pages/legal/CookiesPolicyPage').then((m) => ({ default: m.CookiesPolicyPage })))

const SuperAdminLoginPage = lazy(() => import('./pages/superadmin/SuperAdminLoginPage').then((m) => ({ default: m.SuperAdminLoginPage })))
const SuperAdminGate = lazy(() => import('./pages/superadmin/SuperAdminGate').then((m) => ({ default: m.SuperAdminGate })))
const SuperAdminDashboardPage = lazy(() => import('./pages/superadmin/SuperAdminDashboardPage').then((m) => ({ default: m.SuperAdminDashboardPage })))
const SuperAdminOnboardingPage = lazy(() => import('./pages/superadmin/SuperAdminOnboardingPage').then((m) => ({ default: m.SuperAdminOnboardingPage })))
const SuperAdminPlansPage = lazy(() => import('./pages/superadmin/SuperAdminPlansPage').then((m) => ({ default: m.SuperAdminPlansPage })))
const SuperAdminFinancePage = lazy(() => import('./pages/superadmin/SuperAdminFinancePage').then((m) => ({ default: m.SuperAdminFinancePage })))
const SuperAdminSettingsPage = lazy(() => import('./pages/superadmin/SuperAdminSettingsPage').then((m) => ({ default: m.SuperAdminSettingsPage })))
const SuperAdminProfilePage = lazy(() => import('./pages/superadmin/SuperAdminProfilePage').then((m) => ({ default: m.SuperAdminProfilePage })))

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<FullPageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/comecar" element={<SignupPage />} />

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
              <Route path="videos" element={<VideosAdminPage />} />
              <Route path="depoimentos" element={<TestimonialsAdminPage />} />
              <Route path="configuracoes" element={<SettingsAdminPage />} />
              <Route path="backup" element={<BackupAdminPage />} />
              <Route path="assinatura" element={<SubscriptionAdminPage />} />
              <Route path="perfil" element={<ProfileAdminPage />} />
            </Route>

            <Route path="/legal/termos-de-uso" element={<TermsPage />} />
            <Route path="/legal/privacidade" element={<PrivacyPolicyPage />} />
            <Route path="/legal/cookies" element={<CookiesPolicyPage />} />

            <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
            <Route path="/super-admin" element={<SuperAdminGate />}>
              <Route index element={<SuperAdminDashboardPage />} />
              <Route path="nova-empresa" element={<SuperAdminOnboardingPage />} />
              <Route path="planos" element={<SuperAdminPlansPage />} />
              <Route path="financeiro" element={<SuperAdminFinancePage />} />
              <Route path="configuracoes" element={<SuperAdminSettingsPage />} />
              <Route path="perfil" element={<SuperAdminProfilePage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
