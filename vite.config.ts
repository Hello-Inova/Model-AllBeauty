import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path support for GitHub Pages project sites (e.g. /Model-AllBeauty/).
// Set VITE_BASE_PATH env var during CI build; defaults to '/' for local dev.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
