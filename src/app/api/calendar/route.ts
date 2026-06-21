import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRoutePayloadLimit } from '@/lib/validation'
import { CalendarEvent } from '@prisma/client'


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectTitle = searchParams.get('projectTitle') || 'Workspace'

    const events = await db.calendarEvent.findMany({
      where: { projectTitle },
      orderBy: { date: 'asc' }
    })

    const formattedEvents = events.map((e: CalendarEvent) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString().split('T')[0]
    }))


    return NextResponse.json(formattedEvents)
  } catch (error) {
    console.error('Failed to fetch calendar events:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    enforceRoutePayloadLimit(req, 50 * 1024) // 50KB limit
  } catch (err) {
    return NextResponse.json({ error: 'Payload size limit exceeded' }, { status: 413 })
  }

  try {
    const body = await req.json()
    const { title, date, projectTitle } = body

    if (!title || !date) {
      return NextResponse.json({ error: 'Missing title or date' }, { status: 400 })
    }

    const event = await db.calendarEvent.create({
      data: {
        title,
        date: new Date(date),
        projectTitle: projectTitle || 'Workspace'
      }
    })

    return NextResponse.json({
      id: event.id,
      title: event.title,
      date: event.date.toISOString().split('T')[0]
    })
  } catch (error) {
    console.error('Failed to create calendar event:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 })
    }

    await db.calendarEvent.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete calendar event:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
