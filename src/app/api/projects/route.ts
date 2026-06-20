import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRoutePayloadLimit } from '@/lib/validation'


export async function GET() {
  try {
    let projects = await db.project.findMany({
      orderBy: { createdAt: 'desc' }
    })

    if (projects.length === 0) {
      // Seed starter projects so the database is initialized with default data
      const starterData = [
        { title: 'Project Icarus' },
        { title: 'Deep Horizon Warp' },
        { title: 'Quantum Core Engine' }
      ]

      try {
        await db.project.createMany({
          data: starterData,
          skipDuplicates: true
        })
      } catch (err) {
        console.warn('Seeding projects duplicate warning:', err)
      }

      projects = await db.project.findMany({
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Failed to fetch projects:', error)
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
    const { title } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Project title is required' }, { status: 400 })
    }

    const trimmedTitle = title.trim()

    // Check uniqueness
    const existing = await db.project.findUnique({
      where: { title: trimmedTitle }
    })

    if (existing) {
      return NextResponse.json({ error: 'A project with this title already exists' }, { status: 400 })
    }

    const project = await db.project.create({
      data: {
        title: trimmedTitle
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Failed to create project:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing project ID' }, { status: 400 })
    }

    const project = await db.project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Cascade delete: delete documents and events matching this projectTitle
    await db.calendarEvent.deleteMany({
      where: { projectTitle: project.title }
    })

    await db.document.deleteMany({
      where: { projectTitle: project.title }
    })

    // Delete the project itself
    await db.project.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete project:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
