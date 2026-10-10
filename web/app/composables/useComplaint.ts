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

  async function setStatus(next: ComplaintStatus, successMessage: string) {
    if (!id.value) return false
    updating.value = next
    try {
      data.value = await ComplaintService.setStatus(id.value, next)
      notify({ tone: 'success', message: successMessage })
      return true
    } catch {
      notify({ tone: 'danger', message: "That didn't save. Please try again." })
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
