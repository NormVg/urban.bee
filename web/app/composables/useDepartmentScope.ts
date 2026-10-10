import { DEPARTMENTS, type DepartmentDef } from '#shared/triage/taxonomy'
import { SCOPE_ALL } from '~/constants/dashboard'
import type { IconName } from '~/constants/icons'
import { departmentIcon } from '~/constants/complaints'

/**
 * Department scope — the "workspace switcher" of the dashboard.
 * The sidebar owns the switcher UI; every page reads the scope here so a
 * change re-scopes the overview, the map and the departments page at once.
 * Persisted in a cookie (SSR-safe, no hydration flash) and validated on read.
 */

const SCOPE_COOKIE = 'ubee.department-scope'

export interface ScopeOption {
  id: string
  name: string
  icon: IconName
  caption: string
}

export function useDepartmentScope() {
  const cookie = useCookie<string>(SCOPE_COOKIE, {
    default: () => SCOPE_ALL.id,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  const knownIds = new Set<string>([SCOPE_ALL.id, ...DEPARTMENTS.map((d) => d.id)])
  const scopeId = computed<string>({
    get: () => (knownIds.has(cookie.value) ? cookie.value : SCOPE_ALL.id),
    set: (value) => {
      cookie.value = value
    },
  })

  const activeDepartment = computed<DepartmentDef | null>(
    () => DEPARTMENTS.find((d) => d.id === scopeId.value) ?? null,
  )

  /** Department id for API filters; undefined means city-wide. */
  const departmentFilter = computed(() => activeDepartment.value?.id)

  const scopeOptions = computed<ScopeOption[]>(() => [
    { id: SCOPE_ALL.id, name: SCOPE_ALL.name, icon: SCOPE_ALL.icon, caption: 'City-wide view' },
    ...DEPARTMENTS.map((d) => ({
      id: d.id,
      name: d.label,
      icon: departmentIcon(d.icon),
      caption: d.description,
    })),
  ])

  return { scopeId, activeDepartment, departmentFilter, scopeOptions }
}
