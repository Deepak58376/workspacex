import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import { z } from 'zod'

// Reject ASCII control characters (ASCII 0-31 and 127-159)
const controlCharsRegex = /[\x00-\x1F\x7F-\x9F]/

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(254, 'Email must not exceed 254 characters')
  .email('Invalid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password must not exceed 72 characters')

export const nameSchema = z
  .string()
  .trim()
  .max(100, 'Name must not exceed 100 characters')
  .refine(val => !controlCharsRegex.test(val), {
    message: 'Name contains invalid characters',
  })

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional().or(z.literal('')),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(72, 'Password is too long'),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
})

/**
 * Validates request payload size for Server Actions using headers.
 * Max size defaults to 10KB (10240 bytes) which is extremely safe for auth credentials.
 */
export async function enforceActionPayloadLimit(maxSizeInBytes: number = 10240) {
  const headersList = await headers()
  const contentLength = headersList.get('content-length')
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (isNaN(size) || size > maxSizeInBytes) {
      throw new Error('Payload size limit exceeded')
    }
  }
}

/**
 * Validates request payload size for API routes using NextRequest headers.
 */
export function enforceRoutePayloadLimit(req: NextRequest, maxSizeInBytes: number = 1048576) {
  const contentLength = req.headers.get('content-length')
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (isNaN(size) || size > maxSizeInBytes) {
      throw new Error('Payload size limit exceeded')
    }
  }
}
