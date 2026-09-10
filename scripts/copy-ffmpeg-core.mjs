// Copies the ffmpeg.wasm single-thread core (ffmpeg-core.js + .wasm, ~31MB)
// from node_modules/@ffmpeg/core into public/ffmpeg-core/, so the browser
// can load it from our own domain (same-origin) instead of a third-party
// CDN — no CORS/blob-URL workarounds needed, no dependency on unpkg/jsdelivr
// being reachable in production.
//
// Runs automatically via the "postinstall" npm script (after `npm install`,
// both locally and on Vercel's build). public/ffmpeg-core/ is gitignored —
// these files are regenerated from node_modules on every install rather
// than committed, so the ~31MB binary never touches the git history.
//
// Safe to run more than once; a no-op if @ffmpeg/core isn't installed
// (e.g. a production-only `npm ci --omit=dev` where the devDependency was
// skipped) — video compression just won't be available client-side in that
// case, video upload itself still works.
import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const srcDir = join(root, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm')
const destDir = join(root, 'public', 'ffmpeg-core')

const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm']

if (!existsSync(srcDir)) {
  console.warn('[copy-ffmpeg-core] @ffmpeg/core not found in node_modules — skipping (video compression will be unavailable client-side).')
  process.exit(0)
}

mkdirSync(destDir, { recursive: true })

for (const file of files) {
  const src = join(srcDir, file)
  const dest = join(destDir, file)
  if (!existsSync(src)) {
    console.warn(`[copy-ffmpeg-core] Missing expected file: ${src} — skipping.`)
    continue
  }
  copyFileSync(src, dest)
}

console.log(`[copy-ffmpeg-core] Copied ffmpeg-core to ${destDir}`)
