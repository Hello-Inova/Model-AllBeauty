import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * Real authentication: the server verifies email/password against
 * admin_users (bcrypt hash) and issues an httpOnly session cookie — this
 * context never sees or stores a password or token itself, it only mirrors
 * what the server confirms. See api/auth/[...action].ts.
 */

interface AdminSession {
  businessSlug: string
  email: string
  role: 'owner' | 'manager' | 'staff' | 'super_admin'
  /** null = este login ainda não aceitou os Termos de Uso/LGPD/Cookies. */
  termsAcceptedAt: string | null
}

interface AuthContextValue {
  session: AdminSession | null
  loading: boolean
  loginBusinessAdmin: (businessSlug: string, email: string, password: string) => Promise<boolean>
  loginSuperAdmin: (email: string, password: string) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  acceptTerms: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/auth/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? 'Não foi possível completar a operação.')
  return data as T
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api<{ session: AdminSession | null }>('me')
      .then((r) => {
        if (!cancelled) setSession(r.session)
      })
      .catch(() => {
        if (!cancelled) setSession(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loginBusinessAdmin = useCallback(async (businessSlug: string, email: string, password: string) => {
    try {
      const r = await api<{ session: AdminSession }>('login-admin', { businessSlug, email, password })
      setSession(r.session)
      return true
    } catch {
      return false
    }
  }, [])

  const loginSuperAdmin = useCallback(async (email: string, password: string) => {
    try {
      const r = await api<{ session: AdminSession }>('login-super', { email, password })
      setSession(r.session)
      return true
    } catch {
      return false
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api('change-password', { currentPassword, newPassword })
  }, [])

  const acceptTerms = useCallback(async () => {
    const r = await api<{ termsAcceptedAt: string }>('accept-terms', {})
    setSession((prev) => (prev ? { ...prev, termsAcceptedAt: r.termsAcceptedAt } : prev))
  }, [])

  const logout = useCallback(async () => {
    await api('logout', {}).catch(() => {})
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, loading, loginBusinessAdmin, loginSuperAdmin, changePassword, acceptTerms, logout }),
    [session, loading, loginBusinessAdmin, loginSuperAdmin, changePassword, acceptTerms, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
