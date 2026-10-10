import type { H3Event } from 'h3'
import { auth } from './auth'

export interface SessionUser {
  id: string
  name: string
  email: string
}

/** Signed-in user or 401. Works for the web (cookie) and the app (cookie header). */
export async function requireUser(event: H3Event): Promise<SessionUser> {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) {
    throw createError({ statusCode: 401, message: 'Please sign in to continue.' })
  }
  const { id, name, email } = session.user
  return { id, name, email }
}

/**
 * Admin = email listed in ADMIN_EMAILS (comma separated).
 * With ADMIN_EMAILS empty, every signed-in account is an admin (demo mode).
 */
export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.length === 0 || list.includes(email.toLowerCase())
}

export async function requireAdmin(event: H3Event): Promise<SessionUser> {
  const user = await requireUser(event)
  if (!isAdminEmail(user.email)) {
    throw createError({ statusCode: 403, message: 'This account does not have admin access.' })
  }
  return user
}
