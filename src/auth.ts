import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { authConfig } from './auth.config'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          return null
        }

        const { email, password } = parsedCredentials.data
        
        // Find user by email
        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user || !user.hashedPassword) {
          // Return null to trigger a generic invalid credentials error
          return null
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.hashedPassword)
        if (!passwordMatch) {
          return null
        }

        // Return user object to write to JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as unknown as Record<string, unknown>).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as unknown as Record<string, unknown>).id = token.id as string
        (session.user as unknown as Record<string, unknown>).role = token.role as string
      }
      return session
    },
    // Incorporate the authorized route guard callback
    authorized: authConfig.callbacks.authorized,
  },
})
