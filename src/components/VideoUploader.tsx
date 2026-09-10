import { useRef, useState } from 'react'
import type { VideoAsset } from '../types'
import { videoStorage } from '../repositories'
import { ACCEPTED_VIDEO_TYPES, MAX_UPLOAD_VIDEO_BYTES, MAX_VIDEO_DURATION_SECONDS } from '../config'
import { messages } from '../utils/validators'
import { compressVideo, shouldCompress } from '../utils/videoCompression'
import { Link2, Upload, X, Video as VideoIcon, Loader2 } from 'lucide-react'
import { Button, Input } from './Form'

interface VideoUploaderProps {
  label?: string
  value?: VideoAsset
  onChange: (asset: VideoAsset | undefined) => void
}

const ACCEPTED_LABEL = 'MP4, WebM ou MOV'

/** Reads a video File's duration (seconds) without uploading it, so we can reject an over-long clip client-side before spending any bandwidth. */
function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const el = document.createElement('video')
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(el.duration)
    }
    el.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('load-failed'))
    }
    el.src = url
  })
}

/**
 * The video-management widget used in the admin panel's "Vídeos" section —
 * mirrors ImageUploader's URL/Upload toggle and preview/remove UX, but adds
 * client-side duration validation (rejecting a clip over 40s before it's
 * ever sent) and always shows the accepted format/count/duration limits, as
 * required by the platform spec for this feature.
 */
export function VideoUploader({ label, value, onChange }: VideoUploaderProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('upload')
  const [urlInput, setUrlInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState<'compress' | 'upload' | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setError(null)
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setError(messages.invalidVideo.format)
      return
    }
    if (file.size > MAX_UPLOAD_VIDEO_BYTES) {
      setError(messages.invalidVideo.tooLarge(file.size, MAX_UPLOAD_VIDEO_BYTES))
      return
    }
    try {
      const duration = await readVideoDuration(file)
      if (Number.isFinite(duration) && duration > MAX_VIDEO_DURATION_SECONDS + 0.5) {
        setError(messages.invalidVideo.tooLong)
        return
      }
    } catch {
      setError(messages.invalidVideo.loadFailed)
      return
    }
    setBusy(true)
    let fileToUpload = file
    // Vídeos de celular em alta qualidade costumam vir bem maiores do que
    // precisam — comprimir no navegador antes de enviar reduz bastante o
    // custo de armazenamento/transferência sem exigir nenhum servidor.
    // Arquivos já pequenos pulam essa etapa (COMPRESS_ABOVE_BYTES).
    if (shouldCompress(file)) {
      setStage('compress')
      setProgress(0)
      fileToUpload = await compressVideo(file, setProgress)
    }
    setStage('upload')
    setProgress(0)
    try {
      const asset = await videoStorage.uploadVideo(fileToUpload, setProgress)
      onChange(asset)
    } catch {
      setError(messages.invalidVideo.loadFailed)
    } finally {
      setBusy(false)
      setStage(null)
      setProgress(null)
    }
  }

  async function handleUrlConfirm() {
    setError(null)
    const url = urlInput.trim()
    if (!url) return
    try {
      new URL(url)
    } catch {
      setError(messages.invalidVideo.invalidUrl)
      return
    }
    onChange(videoStorage.saveVideoUrl(url))
    setUrlInput('')
  }

  async function handleRemove() {
    await videoStorage.deleteVideo(value)
    onChange(undefined)
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium">{label}</span>}

      <div className="relative w-full aspect-video rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)] overflow-hidden flex items-center justify-center">
        {busy ? (
          <div className="flex flex-col items-center gap-2 text-[var(--color-muted-foreground)] text-xs px-4 text-center">
            <Loader2 className="animate-spin" size={28} />
            <span>{stage === 'compress' ? 'Comprimindo vídeo…' : 'Enviando vídeo…'}</span>
            {progress !== null && <span>{Math.round(progress)}%</span>}
            {stage === 'compress' && <span className="text-[10px] opacity-75">Isso reduz o tamanho do arquivo antes do envio — pode levar um pouco em vídeos maiores.</span>}
          </div>
        ) : value ? (
          <>
            <video src={value.url} className="w-full h-full object-cover" controls muted playsInline onError={() => setError(messages.invalidVideo.loadFailed)} />
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remover vídeo"
              className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80 z-10"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-[var(--color-muted-foreground)] text-xs px-4 text-center">
            <VideoIcon size={26} strokeWidth={1.5} />
            Nenhum vídeo selecionado
          </div>
        )}
      </div>

      <div className="flex w-full rounded-lg border border-[var(--color-border)] overflow-hidden text-xs">
        <button type="button" onClick={() => setMode('upload')} className={`flex-1 min-w-0 px-2 py-1.5 flex items-center justify-center gap-1 text-center ${mode === 'upload' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-transparent'}`}>
          <Upload size={13} className="shrink-0" /> <span className="truncate">Anexar vídeo</span>
        </button>
        <button type="button" onClick={() => setMode('url')} className={`flex-1 min-w-0 px-2 py-1.5 flex items-center justify-center gap-1 text-center border-l border-[var(--color-border)] ${mode === 'url' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-transparent'}`}>
          <Link2 size={13} className="shrink-0" /> <span className="truncate">URL do vídeo</span>
        </button>
      </div>

      {mode === 'url' ? (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://exemplo.com/video.mp4"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlConfirm())}
          />
          <Button type="button" variant="outline" onClick={handleUrlConfirm} disabled={busy}>
            Usar
          </Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={`flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-xs text-[var(--color-muted-foreground)] cursor-pointer transition text-center ${dragOver ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)]'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} className="shrink-0" />
          Arraste um vídeo ou clique para selecionar
          <input ref={fileInputRef} type="file" accept={ACCEPTED_VIDEO_TYPES.join(',')} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>
      )}

      {/* Sempre visível — o formato aceito, o limite de quantidade e a duração máxima precisam ficar claros para o admin. */}
      <span className="text-xs text-[var(--color-muted-foreground)]">
        Formatos aceitos: {ACCEPTED_LABEL}. Duração máxima: {MAX_VIDEO_DURATION_SECONDS} segundos.
      </span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
