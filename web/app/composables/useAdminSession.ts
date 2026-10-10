import type { AdminMeResponse } from '#shared/types/complaint'
import { authClient } from '~/utils/auth-client'
import { ComplaintService } from '~/services/complaint.service'

/**
 * The signed-in admin. Loaded once by the auth middleware (SSR-safe, the
 * cookie is forwarded) and shared through useState.
 */
export function useAdminSession() {
  const me = useState<AdminMeResponse | null>('admin-session', () => null)

  async function load(): Promise<AdminMeResponse | null> {
    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      me.value = await ComplaintService.me(headers)
    } catch {
      me.value = null
    }
    return me.value
  }

  /** Loads the session once per app load; later calls reuse it. */
  async function ensure(): Promise<AdminMeResponse | null> {
    return me.value ?? load()
  }

  async function signOut() {
    await authClient.signOut()
    me.value = null
    await navigateTo('/login')
  }

  return {
    user: computed(() => me.value?.user ?? null),
    isAdmin: computed(() => me.value?.isAdmin ?? false),
    load,
    ensure,
    signOut,
  }
}
