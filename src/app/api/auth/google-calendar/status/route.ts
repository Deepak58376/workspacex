import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = await db.googleCalendarToken.findUnique({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ connected: !!token })
  } catch (error) {
    console.error('Failed to check Google Calendar status:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.googleCalendarToken.deleteMany({
      where: { userId: session.user.id }
    })

    console.log(`Google Calendar disconnected for user ${session.user.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to disconnect Google Calendar:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
