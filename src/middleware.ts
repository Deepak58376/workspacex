import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnApi = req.nextUrl.pathname.startsWith('/api') && !req.nextUrl.pathname.startsWith('/api/auth')

  if (isOnApi && !isLoggedIn) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
})

export const config = {
  // Specify which routes are intercepted by the middleware
  matcher: [
    '/dashboard/:path*',
    '/api/projects/:path*',
    '/api/documents/:path*',
    '/api/calendar/:path*',
  ],
}
