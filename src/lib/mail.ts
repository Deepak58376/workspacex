import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
  
  const subject = "Reset your WORKSPACEX password"
  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="font-weight: 300; letter-spacing: 0.1em; color: #111;">WORKSPACEX SECURITY PORTAL</h2>
      <p style="color: #444; font-size: 15px; line-height: 1.6;">You requested a password reset for your account. Please click the button below to choose a new password. This link is valid for 1 hour.</p>
      <div style="margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">RESET PASSWORD</a>
      </div>
      <p style="color: #666; font-size: 13px; line-height: 1.6;">If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="font-size: 13px; word-break: break-all;"><a href="${resetLink}">${resetLink}</a></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #999; font-size: 12px;">If you did not request this email, you can safely ignore it. Your password will remain unchanged.</p>
    </div>
  `
  const textBody = `
WORKSPACEX SECURITY PORTAL

You requested a password reset for your account. Please visit the following link to choose a new password. This link is valid for 1 hour:

${resetLink}

If you did not request this email, you can safely ignore it. Your password will remain unchanged.
  `

  if (resend) {
    try {
      await resend.emails.send({
        from: 'WORKSPACEX <onboarding@resend.dev>', // Resend sandbox default sender
        to: email,
        subject,
        html: htmlBody,
        text: textBody,
      })
      console.log(`Password reset email sent successfully to ${email} via Resend.`)
    } catch (err) {
      console.error(`Failed to send email to ${email} via Resend API:`, err)
      logFallback(email, resetLink, textBody)
    }
  } else {
    logFallback(email, resetLink, textBody)
  }
}

function logFallback(email: string, resetLink: string, textBody: string) {
  console.log("\n==========================================")
  console.log("📨 PASSWORD RESET EMAIL LOG (DEV FALLBACK)")
  console.log(`To: ${email}`)
  console.log("Subject: Reset your WORKSPACEX password")
  console.log("Reset Link:", resetLink)
  console.log("------------------------------------------")
  console.log(textBody)
  console.log("==========================================\n")
}
