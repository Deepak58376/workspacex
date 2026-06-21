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
): Promise<void> {
  const accessToken = await getValidGoogleToken(userId)
  if (!accessToken) {
    console.log(`Google Calendar not connected for user ${userId}. Skipping sync.`)
    return
  }

  // Google calendar timed events (start at 9:00 AM UTC, end at 10:00 AM UTC)
  const start = new Date(event.date)
  start.setUTCHours(9, 0, 0, 0)

  const end = new Date(event.date)
  end.setUTCHours(10, 0, 0, 0)

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

  console.log(`Successfully synced event "${event.title}" to Google Calendar for user ${userId}`)
}
