import { isDepartmentId } from '#shared/triage/taxonomy'
import { complaintService } from '../../../services/complaint.service'
import { requireAdmin } from '../../../utils/session'
import { parseSeverities, parseStatuses } from '../../../validators/complaint'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const days = Number(query.days)
  return complaintService.listForAdmin({
    department: isDepartmentId(query.department) ? query.department : undefined,
    severities: parseSeverities(query.severity),
    statuses: parseStatuses(query.status),
    q: typeof query.q === 'string' && query.q.trim() ? query.q.trim().slice(0, 100) : undefined,
    since: Number.isFinite(days) && days > 0 ? new Date(Date.now() - days * 86_400_000) : undefined,
    needsReview: query.review === '1',
  })
})
