'use server'

import { db } from '@/lib/db'
import { signIn, signOut } from '@/auth'
import { rateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { signupSchema, loginSchema, enforceActionPayloadLimit } from '@/lib/validation'

export async function registerUser(prevState: unknown, formData: FormData) {
  try {
    // 1. Enforce payload size limit (max 10KB)
    await enforceActionPayloadLimit()
  } catch (err) {
    return { error: 'Payload size limit exceeded' }
  }

  // 2. Rate limit signup: max 5 requests per minute per IP
  const isAllowed = await rateLimit('signup', 5, 60000)
  if (!isAllowed) {
    return { error: 'Too many requests. Please try again later.' }
  }

  const email = (formData.get('email') as string || '').trim()
  const password = formData.get('password') as string || ''
  const name = (formData.get('name') as string || '').trim()

  // 3. Enforce schema validation
  const validation = signupSchema.safeParse({ email, password, name })
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
    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { 
        error: 'Email is already taken',
        validationErrors: [{ field: 'email', message: 'Email is already taken' }]
      }
    }

    // Hash password with 10 salt rounds
    const hashedPassword = await bcrypt.hash(password, 10)

    // Save user record to PostgreSQL database
    await db.user.create({
      data: {
        email,
        hashedPassword,
        name: name || null,
      },
    })

    return { success: true }
  } catch (err) {
    console.error('Registration error:', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function loginUser(prevState: unknown, formData: FormData) {
  try {
    // 1. Enforce payload size limit (max 10KB)
    await enforceActionPayloadLimit()
  } catch (err) {
    return { error: 'Payload size limit exceeded' }
  }

  // 2. Rate limit login: max 5 requests per minute per IP
  const isAllowed = await rateLimit('login', 5, 60000)
  if (!isAllowed) {
    return { error: 'Too many requests. Please try again later.' }
  }

  const email = (formData.get('email') as string || '').trim()
  const password = formData.get('password') as string || ''

  // 3. Enforce schema validation
  const validation = loginSchema.safeParse({ email, password })
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
    // Run credentials sign-in process
    await signIn('credentials', {
      email,
      password,
      redirect: false, // Handle client-side routing explicitly
    })

    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          // Generic error message: do not expose whether the email exists or password is wrong
          return { error: 'Invalid email or password' }
        default:
          return { error: 'Something went wrong. Please try again.' }
      }
    }
    throw error
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: '/' })
}

