import type { FFmpeg } from '@ffmpeg/ffmpeg'

// Vídeos abaixo desse tamanho já são pequenos o bastante — comprimir só
// adicionaria espera sem ganho real, então esses vão direto pro upload.
export const COMPRESS_ABOVE_BYTES = 15 * 1024 * 1024 // 15MB

let ffmpegSingleton: FFmpeg | null = null
let loadPromise: Promise<FFmpeg> | null = null

/**
 * Carrega o ffmpeg.wasm (single-thread, sem precisar de cabeçalhos
 * COOP/COEP) uma única vez por sessão do navegador — os ~31MB do núcleo
 * (public/ffmpeg-core/, gerado a partir de node_modules/@ffmpeg/core pelo
 * script scripts/copy-ffmpeg-core.mjs, servido do próprio domínio) só são
 * baixados na primeira vez que alguém comprime um vídeo; uploads seguintes
 * reaproveitam a mesma instância.
 */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegSingleton?.loaded) return ffmpegSingleton
  if (!loadPromise) {
    loadPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const instance = new FFmpeg()
      await instance.load({
        coreURL: '/ffmpeg-core/ffmpeg-core.js',
        wasmURL: '/ffmpeg-core/ffmpeg-core.wasm',
      })
      ffmpegSingleton = instance
      return instance
    })()
  }
  return loadPromise
}

export function shouldCompress(file: File): boolean {
  return file.size > COMPRESS_ABOVE_BYTES
}

/**
 * Comprime um vídeo no próprio navegador do admin (ffmpeg.wasm, roda 100%
 * client-side, sem precisar de servidor) antes do upload — reduz resolução
 * e bitrate para cortar drasticamente o tamanho de vídeos gravados em
 * celular em alta qualidade (4K/HEVC), já que armazenamento e transferência
 * no Vercel Blob escalam com o tamanho do arquivo enviado.
 *
 * Se a compressão falhar por qualquer motivo (navegador sem suporte a
 * WebAssembly de ~31MB, pouca memória disponível, core não carregado etc.),
 * devolve o arquivo ORIGINAL sem interromper o upload — comprimir é uma
 * otimização, nunca um requisito para conseguir subir o vídeo.
 */
export async function compressVideo(file: File, onProgress?: (ratio: number) => void): Promise<File> {
  let ffmpeg: FFmpeg
  try {
    ffmpeg = await getFFmpeg()
  } catch (e) {
    console.warn('Não foi possível carregar o compressor de vídeo — enviando o arquivo original.', e)
    return file
  }

  const progressHandler = onProgress
    ? ({ progress }: { progress: number }) => onProgress(Math.min(1, Math.max(0, progress)))
    : undefined
  if (progressHandler) ffmpeg.on('progress', progressHandler)

  const extMatch = file.name.match(/\.[a-zA-Z0-9]+$/)
  const inputName = `input${extMatch ? extMatch[0] : '.mp4'}`
  const outputName = 'output.mp4'

  try {
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()))
    await ffmpeg.exec([
      '-i', inputName,
      // Limita a largura a 1280px (mantendo a proporção) só quando o vídeo
      // de origem é maior — resoluções 4K de celular são o maior fator de
      // tamanho de arquivo e raramente fazem diferença visual na vitrine.
      '-vf', "scale='min(1280,iw)':-2",
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '28',
      '-c:a', 'aac',
      '-b:a', '96k',
      '-movflags', '+faststart',
      outputName,
    ])
    const data = await ffmpeg.readFile(outputName)
    if (!(data instanceof Uint8Array)) throw new Error('unexpected-output')

    // ffmpeg.wasm's Uint8Array can be typed as ArrayBufferLike (which
    // includes SharedArrayBuffer) depending on the TS lib version — copy
    // into a plain Uint8Array/ArrayBuffer so it satisfies Blob's BlobPart type.
    const compressed = new Blob([new Uint8Array(data).buffer as ArrayBuffer], { type: 'video/mp4' })
    // Se a "compressão" não ajudou (arquivo de origem já eficiente), fica
    // com o original em vez de trocar por algo maior ou igual.
    if (compressed.size >= file.size) return file

    const newName = file.name.replace(/\.[a-zA-Z0-9]+$/, '') + '.mp4'
    return new File([compressed], newName, { type: 'video/mp4' })
  } catch (e) {
    console.warn('Falha ao comprimir o vídeo no navegador — enviando o arquivo original.', e)
    return file
  } finally {
    if (progressHandler) ffmpeg.off('progress', progressHandler)
    // Best-effort cleanup do sistema de arquivos virtual do ffmpeg — não
    // deixa restos de uma compressão para a próxima, mas nunca falha o
    // fluxo por causa disso.
    try {
      await ffmpeg.deleteFile(inputName)
    } catch {
      /* arquivo pode não ter chegado a ser escrito */
    }
    try {
      await ffmpeg.deleteFile(outputName)
    } catch {
      /* arquivo pode não ter chegado a ser gerado */
    }
  }
}
