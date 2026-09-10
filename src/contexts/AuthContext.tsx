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

interface RegisterInput {
  businessName: string
  segment?: string
  phone?: string
  whatsapp?: string
  adminEmail: string
  adminPassword: string
  billingPlan?: string
}

interface AuthContextValue {
  session: AdminSession | null
  loading: boolean
  register: (input: RegisterInput) => Promise<{ ok: boolean; error?: string; businessSlug?: string }>
  loginBusinessAdmin: (businessSlug: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  loginSuperAdmin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  updateEmail: (currentPassword: string, newEmail: string) => Promise<void>
  acceptTerms: () => Promise<void>
  logout: () => Promise<void>
  /** "Esqueci minha senha" — omita businessSlug para o fluxo do Super Admin. Resposta sempre genérica (nunca revela se o e-mail existe). */
  forgotPassword: (input: { businessSlug?: string; email: string }) => Promise<{ ok: boolean; error?: string; message?: string }>
  /** Confirma a redefinição a partir do token recebido por e-mail. Não loga o usuário automaticamente — devolve pra onde mandar o login (role/businessSlug) pra a tela decidir. */
  resetPassword: (token: string, newPassword: string) => Promise<{ ok: boolean; error?: string; role?: AdminSession['role']; businessSlug?: string | null }>
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

  // Logout automático diário: a sessão (cookie httpOnly + JWT) já expira no
  // servidor 24h depois do login (ver SESSION_TTL_SECONDS em
  // api/_lib/auth.ts) — isso sozinho garante que nenhuma chamada à API
  // funcione depois desse prazo. Mas se a pessoa deixar a aba aberta sem
  // navegar/clicar em nada, o React nunca ficaria sabendo disso até a
  // próxima ação. Esse polling detecta a expiração e desloga no próprio
  // painel, mesmo com a aba parada, em vez de só na próxima requisição.
  const isLoggedIn = !!session
  useEffect(() => {
    if (!isLoggedIn) return
    const interval = setInterval(
      () => {
        api<{ session: AdminSession | null }>('me')
          .then((r) => {
            if (!r.session) setSession(null)
          })
          .catch(() => {})
      },
      5 * 60 * 1000, // a cada 5 minutos
    )
    return () => clearInterval(interval)
  }, [isLoggedIn])

  const register = useCallback(async (input: RegisterInput) => {
    try {
      const r = await api<{ session: AdminSession }>('register', input)
      setSession(r.session)
      return { ok: true, businessSlug: r.session.businessSlug }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : undefined }
    }
  }, [])

  const loginBusinessAdmin = useCallback(async (businessSlug: string, email: string, password: string) => {
    try {
      const r = await api<{ session: AdminSession }>('login-admin', { businessSlug, email, password })
      setSession(r.session)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : undefined }
    }
  }, [])

  const loginSuperAdmin = useCallback(async (email: string, password: string) => {
    try {
      const r = await api<{ session: AdminSession }>('login-super', { email, password })
      setSession(r.session)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : undefined }
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api('change-password', { currentPassword, newPassword })
  }, [])

  const updateEmail = useCallback(async (currentPassword: string, newEmail: string) => {
    const r = await api<{ session: AdminSession }>('update-email', { currentPassword, newEmail })
    setSession(r.session)
  }, [])

  const acceptTerms = useCallback(async () => {
    const r = await api<{ termsAcceptedAt: string }>('accept-terms', {})
    setSession((prev) => (prev ? { ...prev, termsAcceptedAt: r.termsAcceptedAt } : prev))
  }, [])

  const logout = useCallback(async () => {
    await api('logout', {}).catch(() => {})
    setSession(null)
  }, [])

  const forgotPassword = useCallback(async (input: { businessSlug?: string; email: string }) => {
    try {
      const r = await api<{ ok: boolean; message?: string }>('forgot-password', input)
      return { ok: true, message: r.message }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : undefined }
    }
  }, [])

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      const r = await api<{ ok: boolean; role?: AdminSession['role']; businessSlug?: string | null }>('reset-password', { token, newPassword })
      return { ok: true, role: r.role, businessSlug: r.businessSlug }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : undefined }
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      loading,
      register,
      loginBusinessAdmin,
      loginSuperAdmin,
      changePassword,
      updateEmail,
      acceptTerms,
      logout,
      forgotPassword,
      resetPassword,
    }),
    [session, loading, register, loginBusinessAdmin, loginSuperAdmin, changePassword, updateEmail, acceptTerms, logout, forgotPassword, resetPassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
