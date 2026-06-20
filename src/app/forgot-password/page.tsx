'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/actions/password'
import dynamic from 'next/dynamic'

const StarfieldBackground = dynamic(
  () => import('@/components/scene/StarfieldBackground'),
  { ssr: false }
)

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setSuccessMessage(null)

    const localErrors: Record<string, string> = {}

    if (!email) {
      localErrors.email = 'Email is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        localErrors.email = 'Invalid email address'
      } else if (email.length > 254) {
        localErrors.email = 'Email must not exceed 254 characters'
      }
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      setError('Please correct the validation errors below.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('email', email)

      const res = await requestPasswordReset(null, formData)

      if (res && res.error) {
        setError(res.error)
        if (res.validationErrors) {
          const errorsMap: Record<string, string> = {}
          res.validationErrors.forEach((issue) => {
            errorsMap[issue.field] = issue.message
          })
          setFieldErrors(errorsMap)
        }
      } else if (res && res.success) {
        setSuccessMessage(res.message || 'If that email is registered, you will receive a reset link shortly.')
        setEmail('')
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
        <h1 style={{ margin: '0 0 1rem 0', fontWeight: 300, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.75rem' }}>FORGOT PASSWORD</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.6', textAlign: 'center' }}>
          Enter your email address below, and we will send you a secure link to reset your password.
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

        {successMessage && (
          <div 
            role="status" 
            aria-live="polite" 
            style={{ color: '#22c55e', marginBottom: '1rem', padding: '0.5rem', border: '1px solid #22c55e', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.05)', fontSize: '0.85rem' }}
          >
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', color: '#ffffff', fontSize: '0.9rem', fontWeight: 500 }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.email ? "true" : "false"}
              style={{ 
                width: '100%', 
                padding: '0.6rem 0.75rem', 
                boxSizing: 'border-box', 
                background: '#0a0a0a', 
                border: fieldErrors.email ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)', 
                borderRadius: '4px', 
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              className="auth-input"
            />
            {fieldErrors.email && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.email}</span>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isPending} 
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              cursor: isPending ? 'not-allowed' : 'pointer',
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
            {isPending ? 'SENDING LINK...' : 'SEND RESET LINK'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>
          Back to{' '}
          <Link href="/login" style={{ color: '#ffffff', textDecoration: 'underline' }}>
            Log in
          </Link>
        </p>

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
