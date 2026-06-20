import { headers } from 'next/headers'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store (should be swapped for Redis/Upstash in production)
const rateLimitStore = new Map<string, RateLimitRecord>()

export async function rateLimit(actionKey: string, limit = 5, windowMs = 60000): Promise<boolean> {
  const reqHeaders = await headers()
  
  // Try to extract client IP address from proxy headers
  const ip = 
    reqHeaders.get('x-forwarded-for')?.split(',')[0].trim() || 
    reqHeaders.get('x-real-ip') || 
    '127.0.0.1'

  const key = `${ip}:${actionKey}`
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  // If rate limit window expired, reset client count
  if (now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  record.count++
  if (record.count > limit) {
    return false
  }

  return true
}
