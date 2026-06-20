'use client'

import { useState, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/lib/actions/auth'
import dynamic from 'next/dynamic'

const StarfieldBackground = dynamic(
  () => import('@/components/scene/StarfieldBackground'),
  { ssr: false }
)

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const localErrors: Record<string, string> = {}

    // 1. Required fields checks
    if (!email) localErrors.email = 'Email is required'
    if (!password) localErrors.password = 'Password is required'

    // 2. Email format & length checks
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        localErrors.email = 'Invalid email address'
      } else if (email.length > 254) {
        localErrors.email = 'Email must not exceed 254 characters'
      }
    }

    // 3. Password length limits
    if (password && password.length > 72) {
      localErrors.password = 'Password must not exceed 72 characters'
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      setError('Please correct the validation errors below.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)

      const res = await loginUser(null, formData)

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
        // Redirect to callback URL or dashboard
        router.push(callbackUrl)
        router.refresh()
      }
    })
  }

  return (
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
      <h1 style={{ margin: '0 0 1.5rem 0', fontWeight: 300, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.75rem' }}>LOGIN</h1>
      
      {error && (
        <div 
          role="alert" 
          aria-live="polite" 
          style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem', border: '1px solid #ef4444', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.05)', fontSize: '0.85rem' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '1.25rem' }}>
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

        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
            <label htmlFor="password" style={{ margin: 0, color: '#ffffff', fontSize: '0.9rem', fontWeight: 500 }}>
              Password
            </label>
            <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: '#ffffff', textDecoration: 'none' }} className="auth-link">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
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
          {isPending ? 'LOGGING IN...' : 'LOG IN'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={{ color: '#ffffff', textDecoration: 'underline' }}>
          Sign up
        </Link>
      </p>

      <style>{`
        .auth-link:hover {
          text-decoration: underline !important;
        }
        .auth-btn:hover {
          opacity: 0.9;
        }
        .auth-input:focus {
          border-color: rgba(255, 255, 255, 0.6) !important;
        }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000', overflow: 'hidden' }}>
      <StarfieldBackground />
      <Suspense fallback={<div style={{ textAlign: 'center', color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>Loading login form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
