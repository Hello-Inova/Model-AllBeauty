import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { STORAGE_PREFIX } from '../config'

/**
 * DEMONSTRATION AUTHENTICATION ONLY.
 *
 * This is a frontend-only session flag meant to gate the admin UI in the
 * GitHub Pages / MVP tier. It provides no real security — anyone with
 * browser dev tools can bypass it. When this project grows a real backend,
 * replace this file with Supabase Auth / Firebase Auth / a JWT-based
 * ApiProvider and enforce access control server-side. See README →
 * "Segurança" for details.
 */

export const DEMO_ADMIN_PASSWORD = 'demo123'
export const SUPER_ADMIN_EMAIL = 'super@plataforma.com'
export const SUPER_ADMIN_PASSWORD = 'superadmin123'

interface AdminSession {
  businessSlug: string
  email: string
  role: 'owner' | 'super_admin'
}

interface AuthContextValue {
  session: AdminSession | null
  loginBusinessAdmin: (businessSlug: string, email: string, password: string) => boolean
  loginSuperAdmin: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const SESSION_KEY = `${STORAGE_PREFIX}:admin-session`

function readSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AdminSession) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(() => readSession())

  const persist = useCallback((s: AdminSession | null) => {
    setSession(s)
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else localStorage.removeItem(SESSION_KEY)
  }, [])

  const loginBusinessAdmin = useCallback(
    (businessSlug: string, email: string, password: string) => {
      if (password !== DEMO_ADMIN_PASSWORD) return false
      persist({ businessSlug, email, role: 'owner' })
      return true
    },
    [persist],
  )

  const loginSuperAdmin = useCallback(
    (email: string, password: string) => {
      if (email !== SUPER_ADMIN_EMAIL || password !== SUPER_ADMIN_PASSWORD) return false
      persist({ businessSlug: '*', email, role: 'super_admin' })
      return true
    },
    [persist],
  )

  const logout = useCallback(() => persist(null), [persist])

  const value = useMemo(() => ({ session, loginBusinessAdmin, loginSuperAdmin, logout }), [session, loginBusinessAdmin, loginSuperAdmin, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
