// ─────────────────────────────────────────────────────────────────────────
// AUTHENTICATION SERVICE — talks to the real PayShield AI backend
// (see ../../backend). No hardcoded demo account, no fake success paths.
//
// Session storage: only the JWT access token is persisted to localStorage
// (key below). The current user's profile is always re-fetched from
// GET /api/auth/me — never cached/trusted from an old session — so a
// stale or revoked token is caught immediately rather than showing
// out-of-date user info. Passwords are never stored client-side.
// ─────────────────────────────────────────────────────────────────────────
import { API_BASE_URL } from '@/lib/apiConfig'
import type { AuthError, AuthUser } from '@/types'

const TOKEN_KEY = 'payshield_access_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    const err: AuthError = {
      code: 'NETWORK_ERROR',
      message: 'Could not reach the PayShield AI server. Check your connection or that the backend is running.',
    }
    throw err
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status}).`
    try {
      const body = await response.json()
      // FastAPI validation errors return `detail` as an array; auth
      // errors return it as a string. Never surface raw backend
      // internals beyond that user-facing detail message.
      if (typeof body.detail === 'string') detail = body.detail
      else if (Array.isArray(body.detail) && body.detail[0]?.msg) detail = body.detail[0].msg
    } catch {
      // response wasn't JSON — keep the generic message
    }
    const code: AuthError['code'] =
      response.status === 401 ? 'INVALID_CREDENTIALS' :
      response.status === 501 ? 'NOT_IMPLEMENTED' :
      'NETWORK_ERROR'
    const err: AuthError = { code, message: detail }
    throw err
  }

  return response.json() as Promise<T>
}

interface BackendUser {
  id: string
  name: string
  email: string
  role: string
  initials: string
  created_at: string
}
interface AuthResponse {
  access_token: string
  token_type: string
  user: BackendUser
}

function toAuthUser(u: BackendUser): AuthUser {
  return { name: u.name, email: u.email, role: u.role, initials: u.initials }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  storeToken(res.access_token)
  return toAuthUser(res.user)
}

export async function register(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): Promise<AuthUser> {
  const res = await apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, confirm_password: confirmPassword }),
  })
  storeToken(res.access_token)
  return toAuthUser(res.user)
}

/**
 * Returns the current user if a valid session exists, or null if there is
 * no token or the backend rejects it (expired/invalid) — never throws for
 * the "not logged in" case, since that's an expected state on first load.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getStoredToken()
  if (!token) return null
  try {
    const res = await apiFetch<BackendUser>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return toAuthUser(res)
  } catch {
    clearToken()
    return null
  }
}

/**
 * Not implemented — there is no OAuth provider configured. Kept as a real
 * async function (not a fake redirect) so the failure is explicit.
 */
export async function loginWithGoogle(): Promise<never> {
  const err: AuthError = { code: 'NOT_IMPLEMENTED', message: 'Google sign-in requires OAuth configuration.' }
  throw err
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function logout(): Promise<void> {
  const token = getStoredToken()
  clearToken()
  if (!token) return
  try {
    await apiFetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  } catch {
    // Token is already cleared client-side regardless of whether the
    // backend call succeeds — logout must never leave a stale session.
  }
}
