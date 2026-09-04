import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '@/services/auth'
import { AuthShell } from '@/components/auth/AuthShell'
import { AlertTriangle, ArrowLeft, Info } from 'lucide-react'
import type { AuthError } from '@/types'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setResultMessage(null)
    setIsSubmitting(true)
    try {
      const { message } = await requestPasswordReset(email)
      setResultMessage(message)
    } catch (e) {
      setError(e as AuthError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <Link to="/login" className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to login
      </Link>

      <h2 className="mt-4 font-[var(--font-display)] text-[22px] font-semibold text-ink-900">Reset your password</h2>
      <p className="mt-1 text-[13px] text-ink-500">Enter the email associated with your PayShield AI account.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="text-[12.5px] font-medium text-ink-700">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="mt-1.5 w-full rounded-[10px] border border-ink-100 bg-canvas px-3.5 py-2.5 text-[13px] text-ink-900 placeholder:text-ink-300 focus:border-electric-500 focus:bg-surface focus:outline-none"
          />
        </div>

        {resultMessage && (
          <div className="flex items-start gap-2 rounded-[10px] bg-warning-100 px-3.5 py-2.5 text-[12px] text-warning-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            {resultMessage}
          </div>
        )}
        {error && (
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
          {isSubmitting ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
    </AuthShell>
  )
}
