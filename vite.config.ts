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
    rollupOptions: {
      output: {
        // Separa as bibliotecas de terceiros (que mudam pouco) do código do
        // app (que muda a cada deploy) — o navegador do visitante recorrente
        // mantém esse chunk em cache entre deploys em vez de rebaixá-lo
        // toda vez. Funciona junto com o code-splitting por rota feito com
        // React.lazy() em src/AppRouter.tsx.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('react-router-dom') || id.includes('/react-dom/') || id.includes('/react/') || id.includes('scheduler')) return 'vendor'
          return undefined
        },
      },
    },
  },
})
