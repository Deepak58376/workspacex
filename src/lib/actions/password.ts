'use server'

import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { sendPasswordResetEmail } from '@/lib/mail'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { forgotPasswordSchema, resetPasswordSchema, enforceActionPayloadLimit } from '@/lib/validation'


export async function requestPasswordReset(prevState: unknown, formData: FormData) {
  try {
    // 1. Enforce payload size limit (max 10KB)
    await enforceActionPayloadLimit()
  } catch (err) {
    return { error: 'Payload size limit exceeded' }
  }

  // 2. Rate limit: max 3 requests per 10 minutes per IP
  const isAllowed = await rateLimit('forgot-password', 3, 600000)
  if (!isAllowed) {
    return { error: 'Too many requests. Please try again later.' }
  }

  const email = (formData.get('email') as string || '').trim()

  // 3. Enforce schema validation
  const validation = forgotPasswordSchema.safeParse({ email })
  if (!validation.success) {
    const validationErrors = validation.error.issues.map(issue => ({
      field: issue.path[0] as string,
      message: issue.message,
    }))
    return { 
      error: validation.error.issues[0].message,
      validationErrors,
    }
  }

  try {
    const user = await db.user.findUnique({
      where: { email },
    })

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
      const expiresAt = new Date(Date.now() + 3600000) // 1 hour

      await db.passwordResetToken.deleteMany({
        where: { email },
      })

      await db.passwordResetToken.create({
        data: {
          email,
          token: hashedToken,
          expiresAt,
        },
      })

      await sendPasswordResetEmail(email, rawToken)
    }

    return { success: true, message: 'If that email is registered, you will receive a reset link shortly.' }
  } catch (err) {
    console.error('Request password reset error:', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function resetPassword(prevState: unknown, formData: FormData) {
  try {
    // 1. Enforce payload size limit (max 10KB)
    await enforceActionPayloadLimit()
  } catch (err) {
    return { error: 'Payload size limit exceeded' }
  }

  const token = formData.get('token') as string || ''
  const password = formData.get('password') as string || ''
  const confirmPassword = formData.get('confirmPassword') as string || ''

  if (password !== confirmPassword) {
    return { 
      error: 'Passwords do not match',
      validationErrors: [
        { field: 'password', message: 'Passwords do not match' },
        { field: 'confirmPassword', message: 'Passwords do not match' }
      ]
    }
  }

  // 2. Enforce schema validation
  const validation = resetPasswordSchema.safeParse({ token, password })
  if (!validation.success) {
    const validationErrors = validation.error.issues.map(issue => ({
      field: issue.path[0] as string,
      message: issue.message,
    }))
    return { 
      error: validation.error.issues[0].message,
      validationErrors,
    }
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const tokenRecord = await db.passwordResetToken.findUnique({
      where: { token: hashedToken },
    })

    if (!tokenRecord) {
      return { error: 'Invalid or already-used reset token' }
    }

    if (tokenRecord.expiresAt < new Date()) {
      await db.passwordResetToken.delete({
        where: { id: tokenRecord.id },
      })
      return { error: 'Reset token has expired. Please request a new link.' }
    }

    const user = await db.user.findUnique({
      where: { email: tokenRecord.email },
    })

    if (!user) {
      return { error: 'User associated with this token no longer exists' }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { hashedPassword },
      }),
      db.passwordResetToken.delete({
        where: { id: tokenRecord.id },
      }),
      db.session.deleteMany({
        where: { userId: user.id },
      }),
    ])

    return { success: true }
  } catch (err) {
    console.error('Reset password error:', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

