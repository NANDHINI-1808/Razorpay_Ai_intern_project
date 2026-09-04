import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthShell } from '@/components/auth/AuthShell'
import { AlertTriangle } from 'lucide-react'

export default function Register() {
  const { user, register, loginWithGoogle, isSubmitting, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [lastAttempt, setLastAttempt] = useState<'register' | 'google' | null>(null)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearError()
    setValidationError(null)
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.')
      return
    }
    setLastAttempt('register')
    const ok = await register(name, email, password, confirmPassword)
    if (ok) navigate('/', { replace: true })
  }

  async function handleGoogleClick() {
    clearError()
    setLastAttempt('google')
    await loginWithGoogle()
  }

  return (
    <AuthShell>
      <h2 className="font-[var(--font-display)] text-[22px] font-semibold text-ink-900">Create your account</h2>
      <p className="mt-1 text-[13px] text-ink-500">Set up analyst access to PayShield AI.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field label="Full Name" htmlFor="name">
          <input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" className={inputClass} />
        </Field>
        <Field label="Email" htmlFor="email">
          <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={inputClass} />
        </Field>
        <Field label="Password" htmlFor="password">
          <input id="password" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className={inputClass} />
        </Field>
        <Field label="Confirm Password" htmlFor="confirmPassword">
          <input id="confirmPassword" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
        </Field>

        {validationError && (
          <div className="flex items-center gap-2 rounded-[10px] bg-critical-100 px-3.5 py-2.5 text-[12px] text-critical-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {validationError}
          </div>
        )}
        {error && lastAttempt === 'register' && (
          <div className="flex items-start gap-2 rounded-[10px] bg-critical-100 px-3.5 py-2.5 text-[12px] text-critical-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-[10px] bg-brand-600 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-600/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Create Account'}
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
        Continue with Google
      </button>

      {error && lastAttempt === 'google' && (
        <div className="mt-3 flex items-start gap-2 rounded-[10px] bg-warning-100 px-3.5 py-2.5 text-[12px] text-warning-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error.message}
        </div>
      )}

      <p className="mt-6 text-center text-[12.5px] text-ink-500">
        Already have an account? <Link to="/login" className="font-semibold text-brand-500 hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  )
}

const inputClass = 'w-full rounded-[10px] border border-ink-100 bg-canvas px-3.5 py-2.5 text-[13px] text-ink-900 placeholder:text-ink-300 focus:border-electric-500 focus:bg-surface focus:outline-none'

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-ink-700">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}
