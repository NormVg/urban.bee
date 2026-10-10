import type { AdminMeResponse } from '#shared/types/complaint'
import { isAdminEmail, requireUser } from '../../utils/session'

export default defineEventHandler(async (event): Promise<AdminMeResponse> => {
  const user = await requireUser(event)
  return { user, isAdmin: isAdminEmail(user.email) }
})
