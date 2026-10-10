import { auth } from '../../../utils/auth'

/**
 * Better Auth catch-all: every /api/auth/* request (sign-up, sign-in,
 * session, sign-out, ...) is handled by the shared auth instance.
 */
export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event))
})
