import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthShell } from '@/components/auth/AuthShell'
import { AlertTriangle, Eye, EyeOff, Info } from 'lucide-react'

export default function Login() {
  const { user, login, loginWithGoogle, isSubmitting, error, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [lastAttempt, setLastAttempt] = useState<'password' | 'google' | null>(null)

  if (user) {
    const from = (location.state as { from?: string })?.from ?? '/'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearError()
    setLastAttempt('password')
    const ok = await login(email, password)
    if (ok) navigate('/', { replace: true })
  }

  async function handleGoogleClick() {
    clearError()
    setLastAttempt('google')
    await loginWithGoogle()
  }

  return (
    <AuthShell>
      <h2 className="font-[var(--font-display)] text-[22px] font-semibold text-ink-900">Login to PayShield AI</h2>
      <p className="mt-1 text-[13px] text-ink-500">AI Risk Manager for payment fraud prevention.</p>

      <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-brand-50 px-3.5 py-2.5 text-[11.5px] text-brand-600">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>New to PayShield AI? <Link to="/register" className="font-semibold underline">Create an account</Link> to sign in.</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-[10px] border border-ink-100 bg-canvas px-3.5 py-2.5 text-[13px] text-ink-900 placeholder:text-ink-300 focus:border-electric-500 focus:bg-surface focus:outline-none"
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-[10px] border border-ink-100 bg-canvas px-3.5 py-2.5 pr-10 text-[13px] text-ink-900 placeholder:text-ink-300 focus:border-electric-500 focus:bg-surface focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {error && lastAttempt === 'password' && (
          <div className="flex items-center gap-2 rounded-[10px] bg-critical-100 px-3.5 py-2.5 text-[12px] text-critical-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-[12px] font-medium text-brand-500 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-[10px] bg-brand-600 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-600/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-100" />
        <span className="text-[11px] font-medium text-ink-300">OR</span>
        <div className="h-px flex-1 bg-ink-100" />
      </div>

      <button
        onClick={handleGoogleClick}
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-ink-100 py-2.5 text-[13px] font-medium text-ink-700 transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      {error && lastAttempt === 'google' && (
        <div className="mt-3 flex items-start gap-2 rounded-[10px] bg-warning-100 px-3.5 py-2.5 text-[12px] text-warning-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error.message}
        </div>
      )}

      <p className="mt-6 text-center text-[12.5px] text-ink-500">
        Don't have an account? <Link to="/register" className="font-semibold text-brand-500 hover:underline">Create account</Link>
      </p>
    </AuthShell>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-ink-700">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.9 0 6.6 1.7 8.1 3.1l6-6C34.6 3.1 29.8 1 24 1 14.9 1 7.1 6.4 3.5 14.1l7 5.4C12.2 13.6 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4H24v7.9h12.7c-.3 2.1-1.7 5.3-4.9 7.4l7.5 5.8c4.5-4.2 7.2-10.3 7.2-17.1z" />
      <path fill="#FBBC05" d="M10.5 19.5A14.4 14.4 0 0 0 9.7 24c0 1.5.3 3 .8 4.5l-7 5.4A23.9 23.9 0 0 1 1 24c0-3.9.9-7.6 2.5-10.9l7 5.4z" />
      <path fill="#34A853" d="M24 47c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.4-8.4 2.4-6.4 0-11.8-4.1-13.5-9.9l-7 5.4C7.1 41.6 14.9 47 24 47z" />
    </svg>
  )
}
