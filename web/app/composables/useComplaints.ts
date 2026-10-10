import type { Severity } from '#shared/triage/taxonomy'
import type { ComplaintSummary } from '#shared/types/complaint'
import { STATUS_FILTERS, type StatusFilterId } from '~/constants/complaints'
import { ComplaintService } from '~/services/complaint.service'

/**
 * Complaint list for the map page. Filters live in the URL query so a view
 * can be shared and survives reloads; the department comes from the scope.
 */
export function useComplaints() {
  const route = useRoute()
  const router = useRouter()
  const { departmentFilter } = useDepartmentScope()

  const statusId = computed<StatusFilterId>({
    get: () => (STATUS_FILTERS.some((f) => f.id === route.query.status) ? (route.query.status as StatusFilterId) : 'open'),
    set: (value) => setQuery({ status: value === 'open' ? undefined : value }),
  })

  const severities = computed<Severity[]>({
    get: () => String(route.query.severity ?? '').split(',').filter(Boolean) as Severity[],
    set: (value) => setQuery({ severity: value.length ? value.join(',') : undefined }),
  })

  const search = computed<string>({
    get: () => String(route.query.q ?? ''),
    set: (value) => setQuery({ q: value || undefined }),
  })

  const reviewOnly = computed<boolean>({
    get: () => route.query.review === '1',
    set: (value) => setQuery({ review: value ? '1' : undefined }),
  })

  function setQuery(patch: Record<string, string | undefined>) {
    router.replace({ query: { ...route.query, ...patch } })
  }

  const filters = computed(() => ({
    department: departmentFilter.value,
    status: [...(STATUS_FILTERS.find((f) => f.id === statusId.value)?.statuses ?? [])],
    severity: severities.value,
    q: search.value.trim() || undefined,
    review: reviewOnly.value,
  }))

  const { data, status, error, refresh } = useAsyncData<ComplaintSummary[]>(
    'complaints',
    () => ComplaintService.list(filters.value),
    { watch: [filters], default: () => [] },
  )

  return {
    complaints: computed(() => data.value ?? []),
    pending: computed(() => status.value === 'pending'),
    error,
    refresh,
    statusId,
    severities,
    search,
    reviewOnly,
  }
}
