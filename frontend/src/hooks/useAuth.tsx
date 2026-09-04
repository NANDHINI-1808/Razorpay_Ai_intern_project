import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as authService from '@/services/auth'
import type { AuthError, AuthUser } from '@/types'

interface AuthContextValue {
  user: AuthUser | null
  isInitializing: boolean
  isSubmitting: boolean
  error: AuthError | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<boolean>
  loginWithGoogle: () => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    // Restore the session (if any) by asking the backend who the current
    // token belongs to — never trust a locally-cached user object, since
    // the token may have expired or the account may have changed.
    authService.getCurrentUser().then(setUser).finally(() => setIsInitializing(false))
  }, [])

  async function login(email: string, password: string) {
    setIsSubmitting(true)
    setError(null)
    try {
      const authedUser = await authService.login(email, password)
      setUser(authedUser)
      return true
    } catch (e) {
      setError(e as AuthError)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  async function register(name: string, email: string, password: string, confirmPassword: string) {
    setIsSubmitting(true)
    setError(null)
    try {
      const authedUser = await authService.register(name, email, password, confirmPassword)
      setUser(authedUser)
      return true
    } catch (e) {
      setError(e as AuthError)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  async function loginWithGoogle() {
    setIsSubmitting(true)
    setError(null)
    try {
      await authService.loginWithGoogle()
      return true
    } catch (e) {
      setError(e as AuthError)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  async function logout() {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isInitializing, isSubmitting, error, login, register, loginWithGoogle, logout, clearError: () => setError(null) }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
