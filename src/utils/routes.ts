// Central place for building URLs so no component hardcodes a path shape.
// The app uses BrowserRouter with clean URLs; vercel.json provides the
// server-side rewrite that makes navigation, refreshes and deep links all
// work correctly in production.
//
// Desde a URL por subdomínio (ex: beauty-demo.organyze.com.br em vez de
// organyze.com.br/empresa/beauty-demo), cada função abaixo devolve o
// caminho CURTO quando já estamos no subdomínio daquela mesma empresa (ou
// do Super Admin), e o caminho LONGO de sempre em qualquer outro contexto
// (domínio raiz/www, ou o subdomínio de uma OUTRA empresa) — assim as URLs
// antigas continuam funcionando e nenhuma chamada em toda a base de código
// precisou mudar de assinatura. Ver src/utils/hostContext.ts para a lógica
// de detecção do subdomínio atual.
//
// Isso só cobre navegação DENTRO do mesmo contexto (mesma origem — trocar
// de subdomínio sempre implica um reload de página de qualquer forma). Um
// link que cruza de propósito pra outra empresa/subdomínio (ex: o Super
// Admin abrindo o site ou o painel de uma empresa específica) deve montar a
// URL completa com hostContext.businessOrigin() e usar uma tag <a> normal —
// ver SuperAdminDashboardPage.tsx.

import { getHostContext } from './hostContext'

function onBusinessHost(slug: string): boolean {
  const ctx = getHostContext()
  return ctx.mode === 'business' && ctx.slug === slug
}

function onSuperAdminHost(): boolean {
  return getHostContext().mode === 'super-admin'
}

export const platformRoutes = {
  signup: '/comecar',
  // Redefinição de senha é uma página compartilhada (não vive sob
  // /admin/:slug nem /super-admin) porque o token do link já identifica
  // sozinho a qual conta pertence — ver api/auth/[...action].ts (ação
  // reset-password). Fica montada em qualquer subdomínio (ver
  // AppRouter.tsx), porque o e-mail de recuperação é enviado a partir da
  // própria origem de onde o login falhou.
  resetPassword: '/redefinir-senha',
}

export const publicRoutes = {
  home: (slug: string) => (onBusinessHost(slug) ? '/' : `/empresa/${slug}`),
  services: (slug: string) => (onBusinessHost(slug) ? '/servicos' : `/empresa/${slug}/servicos`),
  service: (slug: string, serviceSlug: string) => (onBusinessHost(slug) ? `/servicos/${serviceSlug}` : `/empresa/${slug}/servicos/${serviceSlug}`),
  professionals: (slug: string) => (onBusinessHost(slug) ? '/profissionais' : `/empresa/${slug}/profissionais`),
  about: (slug: string) => (onBusinessHost(slug) ? '/sobre' : `/empresa/${slug}/sobre`),
  gallery: (slug: string) => (onBusinessHost(slug) ? '/galeria' : `/empresa/${slug}/galeria`),
  contact: (slug: string) => (onBusinessHost(slug) ? '/contato' : `/empresa/${slug}/contato`),
  booking: (slug: string) => (onBusinessHost(slug) ? '/agendamento' : `/empresa/${slug}/agendamento`),
}

export const adminRoutes = {
  login: (slug: string) => (onBusinessHost(slug) ? '/login' : `/admin/${slug}/login`),
  forgotPassword: (slug: string) => (onBusinessHost(slug) ? '/esqueci-senha' : `/admin/${slug}/esqueci-senha`),
  dashboard: (slug: string) => (onBusinessHost(slug) ? '/admin' : `/admin/${slug}`),
  agenda: (slug: string) => (onBusinessHost(slug) ? '/admin/agenda' : `/admin/${slug}/agenda`),
  services: (slug: string) => (onBusinessHost(slug) ? '/admin/servicos' : `/admin/${slug}/servicos`),
  categories: (slug: string) => (onBusinessHost(slug) ? '/admin/categorias' : `/admin/${slug}/categorias`),
  professionals: (slug: string) => (onBusinessHost(slug) ? '/admin/profissionais' : `/admin/${slug}/profissionais`),
  customers: (slug: string) => (onBusinessHost(slug) ? '/admin/clientes' : `/admin/${slug}/clientes`),
  gallery: (slug: string) => (onBusinessHost(slug) ? '/admin/galeria' : `/admin/${slug}/galeria`),
  testimonials: (slug: string) => (onBusinessHost(slug) ? '/admin/depoimentos' : `/admin/${slug}/depoimentos`),
  videos: (slug: string) => (onBusinessHost(slug) ? '/admin/videos' : `/admin/${slug}/videos`),
  settings: (slug: string) => (onBusinessHost(slug) ? '/admin/configuracoes' : `/admin/${slug}/configuracoes`),
  backup: (slug: string) => (onBusinessHost(slug) ? '/admin/backup' : `/admin/${slug}/backup`),
  subscription: (slug: string) => (onBusinessHost(slug) ? '/admin/assinatura' : `/admin/${slug}/assinatura`),
  profile: (slug: string) => (onBusinessHost(slug) ? '/admin/perfil' : `/admin/${slug}/perfil`),
}

// Getters (em vez de valores fixos calculados uma única vez no carregamento
// do módulo): cada acesso reavalia onSuperAdminHost(), mantendo o mesmo uso
// como propriedade simples (superAdminRoutes.login, sem parênteses) em
// todos os componentes existentes.
export const superAdminRoutes = {
  get login() { return onSuperAdminHost() ? '/login' : '/super-admin/login' },
  get forgotPassword() { return onSuperAdminHost() ? '/esqueci-senha' : '/super-admin/esqueci-senha' },
  get home() { return onSuperAdminHost() ? '/' : '/super-admin' },
  get onboarding() { return onSuperAdminHost() ? '/nova-empresa' : '/super-admin/nova-empresa' },
  get plans() { return onSuperAdminHost() ? '/planos' : '/super-admin/planos' },
  get finance() { return onSuperAdminHost() ? '/financeiro' : '/super-admin/financeiro' },
  get settings() { return onSuperAdminHost() ? '/configuracoes' : '/super-admin/configuracoes' },
  get profile() { return onSuperAdminHost() ? '/perfil' : '/super-admin/perfil' },
}

export const legalRoutes = {
  terms: '/legal/termos-de-uso',
  privacy: '/legal/privacidade',
  cookies: '/legal/cookies',
}
