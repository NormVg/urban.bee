import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { expo } from '@better-auth/expo'
import { db } from '../db'

/**
 * Better Auth instance — the single auth surface for both the web app
 * and the Expo client (which calls the same /api/auth/* routes).
 *
 * Credentials live in env vars (BETTER_AUTH_SECRET, BETTER_AUTH_URL) —
 * do not duplicate them here. Extend this config (plugins, providers)
 * and re-run schema generation after.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [expo()],
  trustedOrigins: [
    // Expo app deep-link scheme (app.json "scheme")
    'app://',
    // Development: Expo Go / dev-client origins on the LAN
    ...(process.env.NODE_ENV === 'development'
      ? ['exp://', 'exp://**', 'exp+app://**']
      : []),
  ],
})
