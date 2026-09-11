// Resolve qual "superfície" do app o hostname atual representa, pra permitir
// URLs curtas e elegantes por empresa (ex: beauty-demo.organyze.com.br) sem
// quebrar as URLs antigas (organyze.com.br/admin/beauty-demo,
// organyze.com.br/empresa/beauty-demo) — que continuam funcionando
// normalmente quando acessadas pelo domínio raiz/www, em links antigos já
// compartilhados, em e-mails já enviados, etc.
//
// Só lê window.location (não há renderização no servidor aqui), então é
// seguro chamar a qualquer momento no cliente.

/** Domínio raiz da plataforma em produção. */
export const PLATFORM_BASE_DOMAIN = 'organyze.com.br'

/** Subdomínio reservado para o painel da própria plataforma (Super Admin). */
export const SUPER_ADMIN_SUBDOMAIN = 'admin'

// Slugs que uma empresa nunca pode usar, porque colidiriam com um
// subdomínio já reservado pela plataforma ou por infraestrutura comum
// (painel de e-mail, DNS, CDN, etc.) — ver isReservedSlug() abaixo. Usado
// tanto ao validar o nome de uma empresa nova (SuperAdminOnboardingPage)
// quanto no backend (api/data/[...path].ts), que é a barreira que
// realmente importa.
const RESERVED_SUBDOMAINS = new Set([
  'www', 'admin', 'app', 'api', 'mail', 'email', 'ftp', 'blog', 'docs',
  'status', 'help', 'suporte', 'support', 'smtp', 'ns1', 'ns2', 'webmail',
  'painel', 'plataforma', 'organyze', 'staging', 'dev', 'test',
])

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SUBDOMAINS.has(slug.toLowerCase().trim())
}

export type HostContext =
  | { mode: 'platform' }
  | { mode: 'super-admin' }
  | { mode: 'business'; slug: string }

// Este arquivo é importado tanto pelo frontend (tsconfig.app.json, com lib
// DOM) quanto pelas funções serverless em api/ (tsconfig.api.json, sem lib
// DOM — roda em Node, nunca no navegador) — só por causa de
// isReservedSlug(), que api/data/[...path].ts usa pra validar o slug de uma
// empresa nova. Por isso o acesso a `window` abaixo passa por globalThis
// (sempre existe em ambos os libs) em vez do identificador `window` direto,
// que não é um nome válido sob lib ES2023 sem DOM.
function currentLocation(): { hostname: string; protocol: string; port: string } | null {
  const win = (globalThis as { window?: { location?: { hostname?: string; protocol?: string; port?: string } } }).window
  if (!win?.location?.hostname) return null
  return { hostname: win.location.hostname, protocol: win.location.protocol ?? 'https:', port: win.location.port ?? '' }
}

/**
 * Em desenvolvimento local não há DNS de verdade — mas o Chrome (e a
 * maioria dos navegadores modernos) resolve qualquer *.localhost pra
 * 127.0.0.1 automaticamente, então dá pra testar subdomínios assim:
 * http://beauty-demo.localhost:4178/, http://admin.localhost:4178/.
 */
export function getHostContext(hostnameOverride?: string): HostContext {
  const hostname = (hostnameOverride ?? currentLocation()?.hostname ?? '').toLowerCase()
  if (!hostname) return { mode: 'platform' }

  // *.vercel.app — domínio de fallback do próprio projeto na Vercel
  // (produção e previews) — sempre modo plataforma, nunca por subdomínio.
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.vercel.app')) {
    return { mode: 'platform' }
  }

  let subdomain: string | null = null
  if (hostname.endsWith('.localhost')) {
    subdomain = hostname.slice(0, -'.localhost'.length)
  } else if (hostname === PLATFORM_BASE_DOMAIN || hostname === `www.${PLATFORM_BASE_DOMAIN}`) {
    return { mode: 'platform' }
  } else if (hostname.endsWith(`.${PLATFORM_BASE_DOMAIN}`)) {
    subdomain = hostname.slice(0, -(`.${PLATFORM_BASE_DOMAIN}`.length))
  }

  // Sem subdomínio reconhecido, ou um subdomínio "aninhado" inesperado
  // (algo.outracoisa.organyze.com.br) — cai pro modo plataforma em vez de
  // quebrar. É sempre a opção segura: as rotas antigas continuam válidas.
  if (!subdomain || subdomain.includes('.') || subdomain === 'www') return { mode: 'platform' }
  if (subdomain === SUPER_ADMIN_SUBDOMAIN) return { mode: 'super-admin' }
  if (isReservedSlug(subdomain)) return { mode: 'platform' }
  return { mode: 'business', slug: subdomain }
}

/**
 * Usa o slug da URL (:slug) quando presente — senão cai pro slug do
 * subdomínio atual, se estivermos em modo "business". É o que permite
 * páginas como AdminLoginPage e PublicBusinessGate funcionarem tanto na
 * URL longa (/admin/:slug/login) quanto na URL curta por subdomínio
 * (beauty-demo.organyze.com.br/login), sem duplicar lógica.
 */
export function resolveBusinessSlug(paramSlug: string | undefined): string | undefined {
  if (paramSlug) return paramSlug
  const ctx = getHostContext()
  return ctx.mode === 'business' ? ctx.slug : undefined
}

/**
 * Origem completa (protocolo + host, sem caminho) do site/painel de uma
 * empresa pelo subdomínio dela — só deve ser usada pra links que cruzam de
 * origem (ex: o painel do Super Admin, que vive em admin.organyze.com.br,
 * linkando pro site ou pro painel de uma empresa específica). Um link
 * dentro do mesmo contexto deve preferir os caminhos relativos de
 * src/utils/routes.ts, que preservam a navegação client-side (sem reload).
 */
export function businessOrigin(slug: string): string {
  const loc = currentLocation()
  if (loc && loc.hostname.endsWith('.localhost')) {
    return `${loc.protocol}//${slug}.localhost:${loc.port}`
  }
  return `https://${slug}.${PLATFORM_BASE_DOMAIN}`
}
