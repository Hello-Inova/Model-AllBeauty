import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client'
import { issueSignedToken } from '@vercel/blob'
import { ApiError } from './_lib/db.js'
import { requireSession } from './_lib/auth.js'
import { ACCEPTED_VIDEO_TYPES, MAX_UPLOAD_VIDEO_BYTES } from '../src/config/index.js'

// ---------------------------------------------------------------------------
// Vídeos institucionais (até 40s cada) são grandes o bastante para estourar
// o limite de corpo de requisição das Serverless Functions da Vercel — por
// isso, ao contrário de api/upload.ts (que recebe os bytes da imagem
// diretamente), este endpoint só EMITE UM TOKEN autorizando o navegador a
// enviar o arquivo diretamente para o Vercel Blob (ver
// src/repositories/providers/ApiVideoStorage.ts, que usa `uploadPresigned()`
// de @vercel/blob/client). Exige sessão de admin antes de emitir qualquer
// token, então só quem está logado no painel consegue subir um vídeo.
//
// Usa o fluxo `handleUploadPresigned` (em vez do `handleUpload` legado)
// porque, a partir de 2026, a Vercel passou a conectar o Blob store ao
// projeto só via OIDC — sem provisionar mais um `BLOB_READ_WRITE_TOKEN`
// estático. `issueSignedToken` funciona com OIDC (`VERCEL_OIDC_TOKEN`,
// injetado automaticamente em cada execução) + `BLOB_STORE_ID`, que é
// exatamente o que o projeto já tem conectado — sem exigir nenhum token
// fixo configurado à mão.
//
// A remoção de um vídeo (DELETE) reaproveita /api/upload.ts, que já apaga
// qualquer blob por URL independente de como foi enviado.
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método não permitido.' })
      return
    }

    await requireSession(req)

    const body = req.body as HandleUploadPresignedBody
    const jsonResponse = await handleUploadPresigned({
      body,
      request: req as unknown as Request,
      getSignedToken: async (pathname) => {
        const token = await issueSignedToken({
          pathname,
          operations: ['put'],
          allowedContentTypes: ACCEPTED_VIDEO_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_VIDEO_BYTES,
        })
        return {
          token,
          urlOptions: {
            allowedContentTypes: ACCEPTED_VIDEO_TYPES,
            maximumSizeInBytes: MAX_UPLOAD_VIDEO_BYTES,
            addRandomSuffix: true,
          },
        }
      },
      onUploadCompleted: async () => {
        // Nada a fazer aqui: o cliente cria o registro do vídeo (tabela
        // business_videos) só depois que uploadPresigned() resolve, via a
        // API de dados normal — ver VideoUploader.tsx / VideosAdminPage.tsx.
        // Este callback também não roda em ambiente local (precisa de uma
        // URL pública para o webhook do Blob chamar de volta).
      },
    })

    return res.status(200).json(jsonResponse)
  } catch (e) {
    if (e instanceof ApiError) return res.status(e.status).json({ error: e.message })
    console.error(e)
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao autorizar o envio do vídeo.' })
  }
}
