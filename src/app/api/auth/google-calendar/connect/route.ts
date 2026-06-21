import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectTitle = searchParams.get('projectTitle') || 'Workspace'

    const protocol = req.headers.get('x-forwarded-proto') || 'http'
    const host = req.headers.get('host') || 'localhost:3000'
    const redirectUri = `${protocol}://${host}/api/auth/google-calendar/callback`

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID || '')
    googleAuthUrl.searchParams.append('redirect_uri', redirectUri)
    googleAuthUrl.searchParams.append('response_type', 'code')
    googleAuthUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar.events')
    googleAuthUrl.searchParams.append('access_type', 'offline')
    googleAuthUrl.searchParams.append('prompt', 'consent')
    googleAuthUrl.searchParams.append('state', projectTitle)

    return NextResponse.redirect(googleAuthUrl.toString(), 307)
  } catch (error) {
    console.error('Error generating Google Calendar connection redirect:', error)
    return NextResponse.json({ error: 'Failed to initiate Google Calendar connection' }, { status: 500 })
  }
}
