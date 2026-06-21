import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRoutePayloadLimit } from '@/lib/validation'
import { auth } from '@/auth'
import { createGoogleCalendarEvent } from '@/lib/google-calendar'

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  date: Date
  projectTitle: string
  status?: string
  platformId?: string | null
  assignedId?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectTitle: string = searchParams.get('projectTitle') || 'Workspace'

    const events = (await db.calendarEvent.findMany({
      where: { projectTitle, assignedId: session.user.id },
      orderBy: { date: 'asc' }
    })) as CalendarEvent[]

    const formattedEvents = events.map((e: CalendarEvent) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString().split('T')[0]
    }))

    return NextResponse.json(formattedEvents)
  } catch (error: unknown) {
    console.error('Failed to fetch calendar events:', error)
    const message: string = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    enforceRoutePayloadLimit(req, 50 * 1024) // 50KB limit
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Payload size limit exceeded' }, { status: 413 })
  }

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { title?: string; date?: string; projectTitle?: string }
    const { title, date, projectTitle } = body

    if (!title || !date) {
      return NextResponse.json({ error: 'Missing title or date' }, { status: 400 })
    }

    const event = (await db.calendarEvent.create({
      data: {
        title,
        date: new Date(date),
        projectTitle: projectTitle || 'Workspace',
        assignedId: session.user.id
      }
    })) as CalendarEvent

    // Sync with Google Calendar if connected (fails silently to prevent blocking)
    try {
      await createGoogleCalendarEvent(session.user.id, {
        title: event.title,
        date: event.date
      })
    } catch (gErr) {
      console.error('Google Calendar Sync failed:', gErr)
    }

    return NextResponse.json({
      id: event.id,
      title: event.title,
      date: event.date.toISOString().split('T')[0]
    })
  } catch (error: unknown) {
    console.error('Failed to create calendar event:', error)
    const message: string = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id: string | null = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 })
    }

    const result = await db.calendarEvent.deleteMany({
      where: { id, assignedId: session.user.id }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Failed to delete calendar event:', error)
    const message: string = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

