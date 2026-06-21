import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') || 'Workspace'

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is missing' }, { status: 400 })
    }

    const protocol = req.headers.get('x-forwarded-proto') || 'http'
    const host = req.headers.get('host') || 'localhost:3000'
    const redirectUri = `${protocol}://${host}/api/auth/google-calendar/callback`

    // Exchange code for Google OAuth tokens
    const params = new URLSearchParams()
    params.append('client_id', process.env.GOOGLE_CLIENT_ID || '')
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET || '')
    params.append('code', code)
    params.append('grant_type', 'authorization_code')
    params.append('redirect_uri', redirectUri)

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Failed to exchange authorization code for Google tokens:', errText)
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 400 })
    }

    const data = await res.json()
    const expiresAt = new Date(Date.now() + data.expires_in * 1000)

    // Store tokens associated with the logged-in user in database
    await db.googleCalendarToken.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: expiresAt
      },
      update: {
        accessToken: data.access_token,
        expiresAt: expiresAt,
        ...(data.refresh_token ? { refreshToken: data.refresh_token } : {})
      }
    })

    console.log(`Google Calendar connected successfully for user ${session.user.id}`)

    // Redirect user back to workspace dashboard page
    const dashboardUrl = new URL('/dashboard', req.url)
    dashboardUrl.searchParams.append('title', state)

    return NextResponse.redirect(dashboardUrl.toString(), 307)
  } catch (error) {
    console.error('Google Calendar OAuth callback failed:', error)
    return NextResponse.json({ error: 'Google Calendar connection failed' }, { status: 500 })
  }
}
