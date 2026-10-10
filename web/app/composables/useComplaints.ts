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

  /** Update one row in place (optimistic UI) without refetching the whole list. */
  function patchLocal(id: string, patch: Partial<ComplaintSummary>) {
    if (!data.value) return
    data.value = data.value.map((c) => (c.id === id ? { ...c, ...patch } : c))
  }

  return {
    complaints: computed(() => data.value ?? []),
    patchLocal,
    /** True on every fetch, including filter changes and background refreshes. */
    pending: computed(() => status.value === 'pending'),
    /** First load only (nothing on screen yet): show skeletons. */
    initialLoading: computed(() => status.value === 'pending' && !(data.value?.length)),
    error,
    refresh,
    statusId,
    severities,
    search,
    reviewOnly,
  }
}
