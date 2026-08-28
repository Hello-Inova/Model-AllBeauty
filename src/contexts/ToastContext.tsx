import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const STYLES: Record<ToastVariant, string> = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, message, variant }])
      setTimeout(() => remove(id), 4500)
    },
    [remove],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m: string) => show(m, 'success'),
      error: (m: string) => show(m, 'error'),
      info: (m: string) => show(m, 'info'),
      warning: (m: string) => show(m, 'warning'),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant]
          return (
            <div
              key={t.id}
              className={`animate-toast-in flex items-start gap-2 rounded-lg border px-4 py-3 shadow-lg text-sm ${STYLES[t.variant]}`}
              role="status"
            >
              <Icon size={18} className="shrink-0 mt-0.5" />
              <p className="flex-1">{t.message}</p>
              <button onClick={() => remove(t.id)} aria-label="Fechar notificação" className="shrink-0 opacity-60 hover:opacity-100">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
