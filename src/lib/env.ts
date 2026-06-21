import { z } from 'zod'

// Fallback AUTH_SECRET to NEXTAUTH_SECRET if only the latter is set
if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
})

if (process.env.SKIP_ENV_VALIDATION !== 'true' && process.env.NEXT_PHASE !== 'phase-production-build') {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('\n❌ ==========================================')
    console.error('❌ ENVIRONMENT VARIABLE VALIDATION FAILED')
    console.error('==========================================')
    const formattedErrors = parsed.error.format()
    const errorDetails: string[] = []

    for (const [key, value] of Object.entries(formattedErrors)) {
      if (key !== '_errors') {
        const errorMsgs = (value as { _errors: string[] })._errors.join(', ')
        console.error(`- ${key}: ${errorMsgs}`)
        errorDetails.push(`- ${key}: ${errorMsgs}`)
      }
    }
    console.error('==========================================\n')
    throw new Error(
      `Application startup failed: Missing or invalid environment variables:\n${errorDetails.join('\n')}`
    )
  }
}
export {}
