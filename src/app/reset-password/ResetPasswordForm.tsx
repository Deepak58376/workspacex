'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword } from '@/lib/actions/password'
import dynamic from 'next/dynamic'

const StarfieldBackground = dynamic(
  () => import('@/components/scene/StarfieldBackground'),
  { ssr: false }
)

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const localErrors: Record<string, string> = {}

    // 1. Required checks
    if (!password) localErrors.password = 'Password is required'
    if (!confirmPassword) localErrors.confirmPassword = 'Confirm password is required'

    // 2. Password length limits
    if (password) {
      if (password.length < 8) {
        localErrors.password = 'Password must be at least 8 characters long'
      } else if (password.length > 72) {
        localErrors.password = 'Password must not exceed 72 characters'
      }
    }

    // 3. Confirm password match
    if (password && confirmPassword && password !== confirmPassword) {
      localErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      setError('Please correct the validation errors below.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('token', token)
      formData.append('password', password)
      formData.append('confirmPassword', confirmPassword)

      const res = await resetPassword(null, formData)

      if (res && res.error) {
        setError(res.error)
        if (res.validationErrors) {
          const errorsMap: Record<string, string> = {}
          res.validationErrors.forEach((issue) => {
            errorsMap[issue.field] = issue.message
          })
          setFieldErrors(errorsMap)
        }
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      }
    })
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000', overflow: 'hidden' }}>
      <StarfieldBackground />

      <div 
        style={{ 
          position: 'relative', 
          zIndex: 1, 
          width: '100%', 
          maxWidth: '400px', 
          padding: '2rem 1.75rem', 
          background: 'rgba(0, 0, 0, 0.75)', 
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          borderRadius: '8px', 
          backdropFilter: 'blur(8px)', 
          fontFamily: 'Inter, sans-serif', 
          color: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        <h1 style={{ margin: '0 0 1rem 0', fontWeight: 300, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.75rem' }}>RESET PASSWORD</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.6', textAlign: 'center' }}>
          Please enter a new password for your account.
        </p>

        {error && (
          <div 
            role="alert" 
            aria-live="polite" 
            style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem', border: '1px solid #ef4444', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.05)', fontSize: '0.85rem' }}
          >
            {error}
          </div>
        )}

        {success && (
          <div 
            role="status" 
            aria-live="polite" 
            style={{ color: '#22c55e', marginBottom: '1rem', padding: '0.5rem', border: '1px solid #22c55e', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.05)', fontSize: '0.85rem' }}
          >
            Password reset successfully! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', color: '#ffffff', fontSize: '0.9rem', fontWeight: 500 }}>
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending || success}
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.password ? "true" : "false"}
              style={{ 
                width: '100%', 
                padding: '0.6rem 0.75rem', 
                boxSizing: 'border-box', 
                background: '#0a0a0a', 
                border: fieldErrors.password ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)', 
                borderRadius: '4px', 
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              className="auth-input"
            />
            {fieldErrors.password && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.password}</span>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', color: '#ffffff', fontSize: '0.9rem', fontWeight: 500 }}>
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isPending || success}
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.confirmPassword ? "true" : "false"}
              style={{ 
                width: '100%', 
                padding: '0.6rem 0.75rem', 
                boxSizing: 'border-box', 
                background: '#0a0a0a', 
                border: fieldErrors.confirmPassword ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)', 
                borderRadius: '4px', 
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              className="auth-input"
            />
            {fieldErrors.confirmPassword && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isPending || success} 
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              cursor: (isPending || success) ? 'not-allowed' : 'pointer',
              background: '#ffffff',
              border: 'none',
              color: '#000000',
              fontWeight: 600,
              borderRadius: '4px',
              fontSize: '0.9rem',
              letterSpacing: '0.05em',
              transition: 'opacity 0.2s'
            }}
            className="auth-btn"
          >
            {isPending ? 'RESETTING PASSWORD...' : 'RESET PASSWORD'}
          </button>
        </form>

        <style>{`
          .auth-btn:hover {
            opacity: 0.9;
          }
          .auth-input:focus {
            border-color: rgba(255, 255, 255, 0.6) !important;
          }
        `}</style>
      </div>
    </div>
  )
}
