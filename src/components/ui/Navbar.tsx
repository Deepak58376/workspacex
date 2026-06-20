'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { logoutUser } from '@/lib/actions/auth'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<{ user?: { name?: string | null; email?: string | null } } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          setSession(data)
        }
      } catch (err) {
        console.error('Failed to fetch session:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [pathname])

  // Hide the navbar on dashboard routes
  if (pathname?.startsWith('/dashboard')) {
    return null
  }

  const handleLogout = async () => {
    await logoutUser()
    setSession(null)
    router.refresh()
  }

  return (
    <header
      className="nav-header"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 2rem',
        background: 'transparent',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <style>{`
        .nav-btn {
          white-space: nowrap !important;
          display: inline-block !important;
          transition: all 0.2s ease !important;
        }
        .nav-btn:hover {
          opacity: 0.85;
        }
        .nav-logo {
          white-space: nowrap !important;
          transition: opacity 0.2s ease !important;
        }
        .nav-logo:hover {
          opacity: 0.8;
        }

        @media (max-width: 640px) {
          .nav-header {
            padding: 1rem 1rem !important;
          }
          .nav-logo {
            font-size: 0.95rem !important;
            letter-spacing: 0.15em !important;
          }
          .nav-buttons-container {
            gap: 0.5rem !important;
          }
          .nav-btn {
            font-size: 0.75rem !important;
            padding: 0.35rem 0.75rem !important;
          }
          .nav-operator-text {
            display: none !important;
          }
        }
      `}</style>

      <div>
        <Link
          href="/"
          className="nav-logo"
          style={{
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '1.1rem',
            fontWeight: 300,
            letterSpacing: '0.25em',
          }}
        >
          WORKSPACEX
        </Link>
      </div>

      <nav>
        {loading ? (
          // Graceful placeholder to prevent flashing
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
            CONNECTING...
          </span>
        ) : session?.user ? (
          <div className="nav-buttons-container" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span className="nav-operator-text" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.02em' }}>
              Operator: <strong style={{ color: '#ffffff' }}>{session.user.name || session.user.email}</strong>
            </span>
            <Link
              href="/dashboard"
              className="nav-btn"
              style={{
                fontSize: '0.82rem',
                color: '#ffffff',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.4rem 1rem',
                borderRadius: '3px',
                fontWeight: 500,
                letterSpacing: '0.05em',
              }}
            >
              DASHBOARD
            </Link>
            <button
              onClick={handleLogout}
              className="nav-btn"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '3px',
                color: 'rgba(255,255,255,0.7)',
                padding: '0.4rem 1rem',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              LOG OUT
            </button>
          </div>
        ) : (
          <div className="nav-buttons-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/login"
              className="nav-btn"
              style={{
                fontSize: '0.82rem',
                color: '#ffffff',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.4rem 1rem',
                borderRadius: '3px',
                fontWeight: 500,
                letterSpacing: '0.05em',
              }}
            >
              LOG IN
            </Link>
            <Link
              href="/signup"
              className="nav-btn"
              style={{
                fontSize: '0.82rem',
                color: '#000000',
                background: '#ffffff',
                textDecoration: 'none',
                border: '1px solid #ffffff',
                padding: '0.4rem 1rem',
                borderRadius: '3px',
                fontWeight: 600,
                letterSpacing: '0.05em',
              }}
            >
              SIGN UP
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}



