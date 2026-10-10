import type { OverviewResponse } from '#shared/types/complaint'
import { OVERVIEW_REFRESH_MS } from '~/constants/dashboard'
import { ComplaintService } from '~/services/complaint.service'

/** Dashboard aggregates for the current department scope, refreshed live. */
export function useOverview() {
  const { departmentFilter } = useDepartmentScope()

  const { data, status, error, refresh } = useAsyncData<OverviewResponse>(
    'overview',
    () => ComplaintService.overview(departmentFilter.value),
    { watch: [departmentFilter] },
  )

  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    timer = setInterval(() => refresh(), OVERVIEW_REFRESH_MS)
  })
  onBeforeUnmount(() => clearInterval(timer))

  return {
    overview: data,
    pending: computed(() => status.value === 'pending' && !data.value),
    error,
    refresh,
  }
}
