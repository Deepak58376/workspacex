'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerUser } from '@/lib/actions/auth'
import dynamic from 'next/dynamic'

const StarfieldBackground = dynamic(
  () => import('@/components/scene/StarfieldBackground'),
  { ssr: false }
)

export default function SignupPage() {
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
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
    setSuccess(false)

    const localErrors: Record<string, string> = {}

    // 1. Required fields checks
    if (!email) localErrors.email = 'Email is required'
    if (!password) localErrors.password = 'Password is required'
    if (!confirmPassword) localErrors.confirmPassword = 'Confirm password is required'

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
    if (password) {
      if (password.length < 8) {
        localErrors.password = 'Password must be at least 8 characters long'
      } else if (password.length > 72) {
        localErrors.password = 'Password must not exceed 72 characters'
      }
    }

    // 4. Mismatched passwords check
    if (password && confirmPassword && password !== confirmPassword) {
      localErrors.confirmPassword = 'Passwords do not match'
    }

    // 5. Name bounds & control characters check
    if (name) {
      if (name.length > 100) {
        localErrors.name = 'Name must not exceed 100 characters'
      } else if (/[\x00-\x1F\x7F-\x9F]/.test(name)) {
        localErrors.name = 'Name contains invalid characters'
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
      formData.append('password', password)
      formData.append('name', name)

      const res = await registerUser(null, formData)

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
        // Redirect to login page after a short delay
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
        <h1 style={{ margin: '0 0 1.5rem 0', fontWeight: 300, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.75rem' }}>SIGN UP</h1>
        
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
            Account created successfully! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', color: '#ffffff', fontSize: '0.9rem', fontWeight: 500 }}>
              Full Name (Optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending || success}
              style={{ 
                width: '100%', 
                padding: '0.6rem 0.75rem', 
                boxSizing: 'border-box', 
                background: '#0a0a0a', 
                border: fieldErrors.name ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)', 
                borderRadius: '4px', 
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              className="auth-input"
            />
            {fieldErrors.name && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.name}</span>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', color: '#ffffff', fontSize: '0.9rem', fontWeight: 500 }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending || success}
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

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', color: '#ffffff', fontSize: '0.9rem', fontWeight: 500 }}>
              Password
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
              Confirm Password
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
            {isPending ? 'SIGNING UP...' : 'SIGN UP'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>
          Already have an account?{' '}
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
