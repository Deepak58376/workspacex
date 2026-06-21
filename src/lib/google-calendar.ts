import { db } from './db'

export async function getValidGoogleToken(userId: string): Promise<string | null> {
  try {
    const tokenEntry = await db.googleCalendarToken.findUnique({
      where: { userId }
    })

    if (!tokenEntry) {
      return null
    }

    const isExpired = new Date(Date.now() + 5 * 60 * 1000) > tokenEntry.expiresAt

    if (!isExpired) {
      return tokenEntry.accessToken
    }

    if (!tokenEntry.refreshToken) {
      // No refresh token, delete invalid record and require reconnection
      await db.googleCalendarToken.delete({ where: { userId } })
      return null
    }

    // Refresh Google access token
    console.log(`Refreshing Google OAuth token for user ${userId}...`)
    const params = new URLSearchParams()
    params.append('client_id', process.env.GOOGLE_CLIENT_ID || '')
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET || '')
    params.append('refresh_token', tokenEntry.refreshToken)
    params.append('grant_type', 'refresh_token')

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!res.ok) {
      const errDetails = await res.text()
      console.error(`Google token refresh failed for user ${userId}:`, errDetails)
      // Delete local invalid tokens
      await db.googleCalendarToken.delete({ where: { userId } })
      return null
    }

    const data = await res.json()
    const newAccessToken = data.access_token
    const newExpiresAt = new Date(Date.now() + data.expires_in * 1000)

    // Save refreshed token to DB
    await db.googleCalendarToken.update({
      where: { userId },
      data: {
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
        // If a new refresh token is returned, update it; otherwise keep current one
        ...(data.refresh_token ? { refreshToken: data.refresh_token } : {})
      }
    })

    return newAccessToken
  } catch (error) {
    console.error(`Error validating Google token for user ${userId}:`, error)
    return null
  }
}

export async function createGoogleCalendarEvent(
  userId: string,
  event: { title: string; date: Date }
): Promise<string | null> {
  const accessToken = await getValidGoogleToken(userId)
  if (!accessToken) {
    console.log(`Google Calendar not connected for user ${userId}. Skipping sync.`)
    return null
  }

  // Calculate start time: match current hours/minutes on target date
  const start = new Date(event.date)
  const now = new Date()
  start.setUTCHours(now.getUTCHours(), now.getUTCMinutes(), 0, 0)

  // If start is today or in the past, push it 1 hour into the future to guarantee reminders fire
  if (start.getTime() <= now.getTime() + 5 * 60 * 1000) {
    const futureTime = new Date(now.getTime() + 60 * 60 * 1000)
    start.setUTCFullYear(futureTime.getUTCFullYear(), futureTime.getUTCMonth(), futureTime.getUTCDate())
    start.setUTCHours(futureTime.getUTCHours(), futureTime.getUTCMinutes(), 0, 0)
  }

  const end = new Date(start.getTime() + 60 * 60 * 1000)

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: event.title,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'UTC'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 }
        ]
      }
    })
  })

  if (!res.ok) {
    const errorMsg = await res.text()
    throw new Error(`Google Calendar API event creation failed: ${errorMsg}`)
  }

  const data = await res.json()
  console.log(`Successfully synced event "${event.title}" to Google Calendar for user ${userId} (Google Event ID: ${data.id})`)
  return data.id || null
}

export async function deleteGoogleCalendarEvent(
  userId: string,
  googleEventId: string
): Promise<void> {
  const accessToken = await getValidGoogleToken(userId)
  if (!accessToken) {
    return
  }

  console.log(`Deleting Google Calendar event ${googleEventId} for user ${userId}...`)
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!res.ok) {
    const errorMsg = await res.text()
    if (res.status === 404 || res.status === 410) {
      console.warn(`Google Calendar event ${googleEventId} already deleted or not found on Google Calendar side.`)
      return
    }
    throw new Error(`Google Calendar API event deletion failed: ${errorMsg}`)
  }

  console.log(`Successfully deleted event ${googleEventId} from Google Calendar for user ${userId}`)
}
