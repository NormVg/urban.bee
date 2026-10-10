import type { IconName } from '~/constants/icons'

export interface NavItem {
  label: string
  icon: IconName
  /** Route when the page exists; omit for planned pages */
  to?: string
  /** Planned page — rendered inert with a "soon" badge */
  soon?: boolean
}

export interface NavSection {
  label: string
  items: NavItem[]
}

/** Only real, built pages are listed — add the route first, then the entry. */
export const SIDEBAR_NAV: NavSection[] = [
  {
    label: 'Operations',
    items: [
      { label: 'Overview', icon: 'dashboard', to: '/dashboard' },
      { label: 'Live map', icon: 'mapPin', to: '/map' },
      { label: 'Complaints', icon: 'list', to: '/complaints' },
      { label: 'Teams', icon: 'building', to: '/departments' },
    ],
  },
]

/** Page titles shown in the topbar, keyed by route prefix. */
export const PAGE_TITLES: { prefix: string; title: string }[] = [
  { prefix: '/complaints/', title: 'Complaint' },
  { prefix: '/complaints', title: 'Complaints' },
  { prefix: '/departments', title: 'Teams' },
  { prefix: '/map', title: 'Live map' },
  { prefix: '/dashboard', title: 'Overview' },
]
