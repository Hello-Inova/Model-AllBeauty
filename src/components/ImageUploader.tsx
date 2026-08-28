import { useRef, useState } from 'react'
import type { ImageAsset } from '../types'
import { imageStorage } from '../repositories'
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_IMAGE_BYTES } from '../config'
import { messages } from '../utils/validators'
import { useResolvedImage } from '../hooks/useImage'
import { Link2, Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { Button, Input } from './Form'

interface ImageUploaderProps {
  label?: string
  value?: ImageAsset
  onChange: (asset: ImageAsset | undefined) => void
  aspect?: string // e.g. "aspect-video", "aspect-square"
  hint?: string
}

/**
 * THE single reusable image-management widget used across the entire admin
 * panel (logo, favicon, hero, banners, services, professionals, gallery,
 * testimonials...). Supports both "insert by URL" and "attach a file", with
 * preview, validation and remove/replace — per the platform spec, no module
 * should implement its own bespoke upload UI.
 */
export function ImageUploader({ label, value, onChange, aspect = 'aspect-video', hint }: ImageUploaderProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('url')
  const [urlInput, setUrlInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewSrc = useResolvedImage(value)

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setError(null)
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError(messages.invalidImage.format)
      return
    }
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      setError(messages.invalidImage.tooLarge)
      return
    }
    setBusy(true)
    try {
      const asset = await imageStorage.uploadImage(file)
      onChange(asset)
    } catch {
      setError(messages.invalidImage.loadFailed)
    } finally {
      setBusy(false)
    }
  }

  function handleUrlConfirm() {
    setError(null)
    const url = urlInput.trim()
    if (!url) return
    try {
      new URL(url)
    } catch {
      setError(messages.invalidImage.invalidUrl)
      return
    }
    const img = new Image()
    setBusy(true)
    img.onload = () => {
      setBusy(false)
      onChange(imageStorage.saveImageUrl(url))
      setUrlInput('')
    }
    img.onerror = () => {
      setBusy(false)
      setError(messages.invalidImage.loadFailed)
    }
    img.src = url
  }

  async function handleRemove() {
    await imageStorage.deleteImage(value)
    onChange(undefined)
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium">{label}</span>}

      <div className={`relative w-full ${aspect} rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)] overflow-hidden flex items-center justify-center`}>
        {busy ? (
          <Loader2 className="animate-spin text-[var(--color-muted-foreground)]" size={28} />
        ) : previewSrc ? (
          <>
            <img src={previewSrc} alt={value?.alt || 'Pré-visualização'} className="w-full h-full object-cover" onError={() => setError(messages.invalidImage.loadFailed)} />
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remover imagem"
              className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-[var(--color-muted-foreground)] text-xs px-4 text-center">
            <ImageIcon size={26} strokeWidth={1.5} />
            Nenhuma imagem selecionada
          </div>
        )}
      </div>

      <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden w-fit text-xs">
        <button type="button" onClick={() => setMode('url')} className={`px-3 py-1.5 flex items-center gap-1 ${mode === 'url' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-transparent'}`}>
          <Link2 size={13} /> URL da imagem
        </button>
        <button type="button" onClick={() => setMode('upload')} className={`px-3 py-1.5 flex items-center gap-1 border-l border-[var(--color-border)] ${mode === 'upload' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-transparent'}`}>
          <Upload size={13} /> Anexar imagem
        </button>
      </div>

      {mode === 'url' ? (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://exemplo.com/imagem.jpg"
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
          className={`flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-xs text-[var(--color-muted-foreground)] cursor-pointer transition ${dragOver ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)]'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} />
          Arraste uma imagem ou clique para selecionar (JPG, PNG, WEBP)
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {hint && !error && <span className="text-xs text-[var(--color-muted-foreground)]">{hint}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
