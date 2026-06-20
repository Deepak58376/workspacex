'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'

const StarfieldBackground = dynamic(
  () => import('@/components/scene/StarfieldBackground'),
  { ssr: false }
)

export default function ResetPasswordError({ message }: { message: string }) {
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
          boxSizing: 'border-box',
          textAlign: 'center'
        }}
      >
        <h1 style={{ margin: '0 0 1rem 0', fontWeight: 300, letterSpacing: '0.1em', fontSize: '1.5rem' }}>VERIFICATION FAILED</h1>
        <div 
          role="alert" 
          style={{ color: '#ef4444', margin: '1.5rem 0', padding: '1rem', border: '1px solid #ef4444', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.05)', fontSize: '0.9rem' }}
        >
          {message}
        </div>
        <p style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <Link href="/forgot-password" style={{ color: '#ffffff', textDecoration: 'underline' }}>Forgot password</Link>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>&bull;</span>
          <Link href="/login" style={{ color: '#ffffff', textDecoration: 'underline' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
