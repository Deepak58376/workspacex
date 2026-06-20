import crypto from 'crypto'
import { db } from '@/lib/db'
import ResetPasswordForm from './ResetPasswordForm'
import ResetPasswordError from './ResetPasswordError'

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams
  const token = params.token

  if (!token || typeof token !== 'string') {
    return <ResetPasswordError message="Missing token. Please request a new password reset link." />
  }

  let isValid = false
  let errorMsg = ""

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const tokenRecord = await db.passwordResetToken.findUnique({
      where: { token: hashedToken },
    })

    if (!tokenRecord) {
      errorMsg = "Invalid or already-used reset token. Please request a new link."
    } else if (tokenRecord.expiresAt < new Date()) {
      try {
        await db.passwordResetToken.delete({
          where: { id: tokenRecord.id },
        })
      } catch (e) {
        console.warn("Cleanup of expired token failed:", e)
      }
      errorMsg = "Reset token has expired. Please request a new link."
    } else {
      isValid = true
    }
  } catch (error) {
    console.error("Token validation page error:", error)
    errorMsg = "An error occurred during verification. Please try again."
  }

  if (!isValid) {
    return <ResetPasswordError message={errorMsg} />
  }

  return <ResetPasswordForm token={token} />
}

