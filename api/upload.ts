import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put, del } from '@vercel/blob'
import { ApiError } from './_lib/db'
import { requireSession } from './_lib/auth'

// Handles both directions of the ImageUploader "Anexar imagem" flow:
//   POST   /api/upload   — admin sends raw file bytes, gets back a public URL
//   DELETE /api/upload   — admin asks us to remove a previously uploaded blob
// Every call requires a valid admin session (business or super admin) so the
// bucket can't be used as an open file drop by anonymous visitors.

export const config = {
  api: { bodyParser: false },
}

const MAX_BYTES = 8 * 1024 * 1024 // 8MB hard ceiling (frontend already warns above 4MB)

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
    const session = await requireSession(req)

    if (req.method === 'POST') {
      const filename = String(req.headers['x-filename'] || `upload-${Date.now()}`)
      const contentType = String(req.headers['content-type'] || 'application/octet-stream')
      const buffer = await readRawBody(req)
      if (buffer.length === 0) throw new ApiError(400, 'Nenhum arquivo enviado.')

      const scope = session.businessId ?? 'platform'
      const key = `${scope}/${Date.now()}-${filename}`.replace(/[^a-zA-Z0-9/._-]/g, '_')
      const blob = await put(key, buffer, { access: 'public', contentType })
      return res.status(201).json({ url: blob.url })
    }

    if (req.method === 'DELETE') {
      const { url } = (req.query.url ? { url: String(req.query.url) } : await readJsonFallback(req))
      if (!url) throw new ApiError(400, 'Informe a URL da imagem a remover.')
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
