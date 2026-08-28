// Central place for building URLs so no component hardcodes a path shape.
// The app uses HashRouter, which is what makes navigation, refreshes and
// deep links all work correctly on GitHub Pages without any server-side
// rewrite rules.

export const publicRoutes = {
  home: (slug: string) => `/empresa/${slug}`,
  services: (slug: string) => `/empresa/${slug}/servicos`,
  service: (slug: string, serviceSlug: string) => `/empresa/${slug}/servicos/${serviceSlug}`,
  professionals: (slug: string) => `/empresa/${slug}/profissionais`,
  about: (slug: string) => `/empresa/${slug}/sobre`,
  gallery: (slug: string) => `/empresa/${slug}/galeria`,
  contact: (slug: string) => `/empresa/${slug}/contato`,
  booking: (slug: string) => `/empresa/${slug}/agendamento`,
}

export const adminRoutes = {
  login: (slug: string) => `/admin/${slug}/login`,
  dashboard: (slug: string) => `/admin/${slug}`,
  agenda: (slug: string) => `/admin/${slug}/agenda`,
  services: (slug: string) => `/admin/${slug}/servicos`,
  categories: (slug: string) => `/admin/${slug}/categorias`,
  professionals: (slug: string) => `/admin/${slug}/profissionais`,
  customers: (slug: string) => `/admin/${slug}/clientes`,
  gallery: (slug: string) => `/admin/${slug}/galeria`,
  testimonials: (slug: string) => `/admin/${slug}/depoimentos`,
  settings: (slug: string) => `/admin/${slug}/configuracoes`,
  backup: (slug: string) => `/admin/${slug}/backup`,
}

export const superAdminRoutes = {
  login: '/super-admin/login',
  home: '/super-admin',
  onboarding: '/super-admin/nova-empresa',
}
