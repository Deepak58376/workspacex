import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
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
    for (const [key, value] of Object.entries(formattedErrors)) {
      if (key !== '_errors') {
        console.error(`- ${key}: ${(value as { _errors: string[] })._errors.join(', ')}`)
      }
    }
    console.error('==========================================\n')
    throw new Error('Application startup failed: Missing or invalid environment variables.')
  }
}
export {}
