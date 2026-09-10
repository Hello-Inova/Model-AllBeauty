export const APP_NAME = 'Organyze'

export const STORAGE_PREFIX = 'wl-booking'
export const STORAGE_VERSION = 1

export const DEFAULT_BUSINESS_SLUG = 'beauty-demo'

export const CURRENCY_LOCALE = 'pt-BR'
export const DEFAULT_CURRENCY = 'BRL'
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo'

// Max size (bytes) accepted for a locally-uploaded image before we warn the user.
export const MAX_UPLOAD_IMAGE_BYTES = 4 * 1024 * 1024 // 4MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// ---- Vídeos institucionais (por empresa) -----------------------------------
// 1 vídeo por empresa, com no máximo 40 segundos — ver a seção "Vídeos" do
// painel admin (VideosAdminPage) e da vitrine pública (HomePage). O limite de
// bytes é generoso pois o upload vai direto do navegador para o Vercel Blob
// (ver api/upload-video.ts), sem passar pelo limite de corpo de requisição
// das Serverless Functions — por isso o teto pode (e deve) ser dimensionado
// pela DURAÇÃO aceita, não por um corpo de requisição pequeno. Um vídeo de
// celular em alta qualidade (4K/HEVC) pode passar de 60MB mesmo com menos de
// 40s, então o limite fica generoso o bastante para cobrir esse caso sem
// abrir mão de barrar um arquivo absurdamente grande.
export const MAX_VIDEOS_PER_BUSINESS = 1
// Rótulo já concordando no singular/plural com o limite acima — usado nos
// textos do painel admin em vez de fixar "vídeo(s)" na mão em cada tela.
export const MAX_VIDEOS_LABEL = MAX_VIDEOS_PER_BUSINESS === 1 ? 'vídeo' : 'vídeos'
export const MAX_VIDEO_DURATION_SECONDS = 40
export const MAX_UPLOAD_VIDEO_BYTES = 300 * 1024 * 1024 // 300MB
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

export const REPO_URL = 'https://github.com/Hello-Inova/Model-AllBeauty'
