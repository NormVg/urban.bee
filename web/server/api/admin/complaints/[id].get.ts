import { complaintService } from '../../../services/complaint.service'
import { requireAdmin } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  return complaintService.adminDetail(getRouterParam(event, 'id') ?? '', admin)
})
