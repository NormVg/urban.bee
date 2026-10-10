import type { ComplaintStatus, Severity } from '#shared/triage/taxonomy'
import type {
  AdminMeResponse,
  ComplaintDetail,
  ComplaintSummary,
  OverviewResponse,
} from '#shared/types/complaint'

/** All dashboard → API calls live here (AGENTS.md: service layer). */

export interface ComplaintFilters {
  department?: string
  severity?: Severity[]
  status?: ComplaintStatus[]
  q?: string
  review?: boolean
}

export function complaintQuery(filters: ComplaintFilters): Record<string, string> {
  const query: Record<string, string> = {}
  if (filters.department) query.department = filters.department
  if (filters.severity?.length) query.severity = filters.severity.join(',')
  if (filters.status?.length) query.status = filters.status.join(',')
  if (filters.q) query.q = filters.q
  if (filters.review) query.review = '1'
  return query
}

/**
 * During server rendering a plain $fetch drops the visitor's cookie, so the
 * admin API answers 401. useRequestFetch forwards it; on the client it is $fetch.
 */
function api() {
  return import.meta.server ? useRequestFetch() : $fetch
}

export const ComplaintService = {
  overviewUrl: '/api/admin/overview',
  listUrl: '/api/admin/complaints',
  detailUrl: (id: string) => `/api/admin/complaints/${id}`,

  me(headers?: Record<string, string>) {
    return api()<AdminMeResponse>('/api/admin/me', { headers })
  },

  list(filters: ComplaintFilters) {
    return api()<ComplaintSummary[]>('/api/admin/complaints', { query: complaintQuery(filters) })
  },

  get(id: string) {
    return api()<ComplaintDetail>(`/api/admin/complaints/${id}`)
  },

  overview(department?: string) {
    return api()<OverviewResponse>('/api/admin/overview', { query: department ? { department } : {} })
  },

  setStatus(id: string, status: ComplaintStatus, note?: string) {
    return $fetch<ComplaintDetail>(`/api/admin/complaints/${id}`, {
      method: 'PATCH',
      body: { status, note },
    })
  },
}
