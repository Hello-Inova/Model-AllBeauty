import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put, del } from '@vercel/blob'
import { ApiError } from './_lib/db.js'
import { requireSession } from './_lib/auth.js'
import { requireSameOrigin } from './_lib/http.js'

// Handles both directions of the ImageUploader "Anexar imagem" flow:
//   POST   /api/upload   — admin sends raw file bytes, gets back a public URL
//   DELETE /api/upload   — admin asks us to remove a previously uploaded blob
// Every call requires a valid admin session (business or super admin) so the
// bucket can't be used as an open file drop by anonymous visitors.

export const config = {
  api: { bodyParser: false },
}

const MAX_BYTES = 8 * 1024 * 1024 // 8MB hard ceiling (frontend already warns above 4MB)
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

function detectedImageType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  return null
}

function safeFilename(raw: string, contentType: string): string {
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    // Invalid percent encoding is harmless here; sanitization below removes it.
  }
  const base = decoded.split(/[\\/]/).pop()?.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'upload'
  const extension = contentType === 'image/png' ? '.png' : contentType === 'image/webp' ? '.webp' : '.jpg'
  return base.replace(/\.[^.]*$/, '') + extension
}

function assertOwnedBlobUrl(rawUrl: string, scope: string): void {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new ApiError(400, 'URL de imagem inválida.')
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.blob.vercel-storage.com')) {
    throw new ApiError(400, 'Somente arquivos do armazenamento do projeto podem ser removidos.')
  }
  const firstPathSegment = decodeURIComponent(parsed.pathname).split('/').filter(Boolean)[0]
  if (firstPathSegment !== scope) throw new ApiError(403, 'Você não pode remover um arquivo de outra conta.')
}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req as any) {
    total += chunk.length
    if (total > MAX_BYTES) throw new ApiError(413, 'Arquivo maior que o limite permitido (8MB).')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireSameOrigin(req)
    const session = await requireSession(req)

    if (req.method === 'POST') {
      const declaredType = String(req.headers['content-type'] || '').toLowerCase().split(';')[0].trim()
      if (!ALLOWED_IMAGE_TYPES.has(declaredType)) throw new ApiError(415, 'Formato de imagem não permitido.')
      const buffer = await readRawBody(req)
      if (buffer.length === 0) throw new ApiError(400, 'Nenhum arquivo enviado.')
      const contentType = detectedImageType(buffer)
      if (!contentType || (declaredType !== contentType && !(declaredType === 'image/jpg' && contentType === 'image/jpeg'))) {
        throw new ApiError(415, 'O conteúdo do arquivo não corresponde a uma imagem permitida.')
      }

      const scope = session.businessId ?? 'platform'
      const filename = safeFilename(String(req.headers['x-filename'] || `upload-${Date.now()}`), contentType)
      const key = `${scope}/${Date.now()}-${filename}`.replace(/[^a-zA-Z0-9/._-]/g, '_')
      const blob = await put(key, buffer, { access: 'public', contentType })
      return res.status(201).json({ url: blob.url })
    }

    if (req.method === 'DELETE') {
      const { url } = (req.query.url ? { url: String(req.query.url) } : await readJsonFallback(req))
      if (!url) throw new ApiError(400, 'Informe a URL da imagem a remover.')
      assertOwnedBlobUrl(url, session.businessId ?? 'platform')
      await del(url)
      return res.status(200).json({ ok: true })
    }

    res.status(405).json({ error: 'Método não permitido.' })
  } catch (e) {
    if (e instanceof ApiError) return res.status(e.status).json({ error: e.message })
    console.error(e)
    res.status(500).json({ error: 'Erro ao processar a imagem.' })
  }
}

async function readJsonFallback(req: VercelRequest): Promise<{ url?: string }> {
  try {
    const buffer = await readRawBody(req)
    return JSON.parse(buffer.toString('utf-8') || '{}')
  } catch {
    return {}
  }
}
