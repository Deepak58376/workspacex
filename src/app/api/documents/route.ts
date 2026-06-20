import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRoutePayloadLimit } from '@/lib/validation'


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectTitle = searchParams.get('projectTitle') || 'Workspace'

    const docs = await db.document.findMany({
      where: { projectTitle },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(docs)
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    enforceRoutePayloadLimit(req, 5 * 1024 * 1024) // 5MB limit
  } catch (err) {
    return NextResponse.json({ error: 'Payload size limit exceeded' }, { status: 413 })
  }

  try {
    const body = await req.json()
    const { name, size, date, url, projectTitle } = body

    if (!name || !size || !date) {
      return NextResponse.json({ error: 'Missing name, size, or date' }, { status: 400 })
    }

    const doc = await db.document.create({
      data: {
        name,
        size,
        date,
        url,
        projectTitle: projectTitle || 'Workspace'
      }
    })

    return NextResponse.json(doc)
  } catch (error) {
    console.error('Failed to save document:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing document ID' }, { status: 400 })
    }

    await db.document.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete document:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
