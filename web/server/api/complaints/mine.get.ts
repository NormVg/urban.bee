import { complaintService } from '../../services/complaint.service'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return complaintService.listMine(user)
})
