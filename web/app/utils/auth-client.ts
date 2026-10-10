import { createAuthClient } from 'better-auth/vue'

/**
 * Browser auth client for the web app. Same-origin with the API,
 * so no baseURL is needed. Session state: authClient.useSession().
 */
export const authClient = createAuthClient()
