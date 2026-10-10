import { complaintService } from '../../../services/complaint.service'
import { requireAdmin } from '../../../utils/session'
import { parseStatusUpdate } from '../../../validators/complaint'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { status, note } = parseStatusUpdate(await readBody(event))
  return complaintService.changeStatus(getRouterParam(event, 'id') ?? '', admin, status, note)
})
