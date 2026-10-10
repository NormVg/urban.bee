import type { ComplaintStatus } from '#shared/triage/taxonomy'
import type { ComplaintDetail } from '#shared/types/complaint'
import { ComplaintService } from '~/services/complaint.service'

/** One complaint in full, plus the admin's status actions. */
export function useComplaint(id: Ref<string | null>) {
  const { data, status, error, refresh } = useAsyncData<ComplaintDetail | null>(
    () => `complaint-${id.value ?? 'none'}`,
    () => (id.value ? ComplaintService.get(id.value) : Promise.resolve(null)),
    { watch: [id] },
  )

  const updating = ref<ComplaintStatus | null>(null)
  const { notify } = useToast()

  /**
   * Optimistic: the new status shows at once and the save runs in the
   * background (the database round trip can take a second or two). If the
   * save fails, the previous status comes back and the admin is told.
   */
  async function setStatus(next: ComplaintStatus, successMessage: string) {
    if (!id.value || !data.value) return false
    const previous = data.value
    updating.value = next
    data.value = { ...previous, status: next, updatedAt: new Date().toISOString() }
    notify({ tone: 'success', message: successMessage })
    try {
      data.value = await ComplaintService.setStatus(id.value, next)
      return true
    } catch {
      data.value = previous
      notify({ tone: 'danger', message: "That didn't save, so the status was put back. Please try again." })
      return false
    } finally {
      updating.value = null
    }
  }

  return {
    complaint: data,
    pending: computed(() => status.value === 'pending' && !data.value),
    error,
    refresh,
    updating,
    setStatus,
  }
}
