import { complaintService } from '../../services/complaint.service'
import { requireUser } from '../../utils/session'
import { readSubmitPayload } from '../../validators/complaint'

/** Citizen submits a report: photos (1–4), location, optional note and voice. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const payload = await readSubmitPayload(event)
  return complaintService.submit(user, payload)
})
