import { isDepartmentId } from '#shared/triage/taxonomy'
import { overviewService } from '../../services/overview.service'
import { requireAdmin } from '../../utils/session'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { department } = getQuery(event)
  return overviewService.build(isDepartmentId(department) ? department : undefined)
})
