import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register the PWA service worker in production builds only, so `npm run dev`
// never serves stale cached assets during development.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => {
      // PWA install is a progressive enhancement — silently ignore failures
      // (e.g. unsupported browser, restricted context).
    })
  })
}
