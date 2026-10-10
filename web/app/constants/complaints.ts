import type { ComplaintStatus, Severity } from '#shared/triage/taxonomy'
import type { Priority } from '#shared/triage/priority'
import type { MatchReason, ReportRelation, TraceStep } from '#shared/types/complaint'
import type { IconName } from '~/constants/icons'

/**
 * Admin-facing words and tones for complaint data (PLAN.md §12.1).
 * Technical values never reach the screen directly; they go through here.
 */

export type BadgeTone = 'neutral' | 'info' | 'orange' | 'success' | 'warning' | 'danger'

export const SEVERITY_META: Record<Severity, { label: string; tone: BadgeTone; color: string }> = {
  critical: { label: 'Critical', tone: 'danger', color: 'var(--danger)' },
  high: { label: 'High', tone: 'orange', color: 'var(--orange)' },
  medium: { label: 'Medium', tone: 'warning', color: 'var(--warning)' },
  low: { label: 'Low', tone: 'success', color: 'var(--success)' },
}

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low']

export const PRIORITY_META: Record<Priority, { label: string; tone: BadgeTone; color: string }> = {
  P1: { label: 'Urgent', tone: 'danger', color: 'var(--danger)' },
  P2: { label: 'High', tone: 'orange', color: 'var(--orange)' },
  P3: { label: 'Normal', tone: 'info', color: 'var(--blue)' },
  P4: { label: 'Low', tone: 'neutral', color: 'var(--ink-3)' },
}

export const STATUS_META: Record<ComplaintStatus, { label: string; tone: BadgeTone; icon: IconName }> = {
  received: { label: 'New', tone: 'info', icon: 'inbox' },
  triaged: { label: 'Seen', tone: 'info', icon: 'eye' },
  in_progress: { label: 'In progress', tone: 'warning', icon: 'construction' },
  resolved: { label: 'Fixed', tone: 'success', icon: 'checkCircle' },
  rejected: { label: 'Not actionable', tone: 'neutral', icon: 'xCircle' },
}

/** Status filter presets for the map page. */
export const STATUS_FILTERS = [
  { id: 'open', label: 'Open', statuses: ['received', 'triaged', 'in_progress'] as ComplaintStatus[] },
  { id: 'in_progress', label: 'In progress', statuses: ['in_progress'] as ComplaintStatus[] },
  { id: 'resolved', label: 'Fixed', statuses: ['resolved'] as ComplaintStatus[] },
  { id: 'all', label: 'All', statuses: [] as ComplaintStatus[] },
] as const

export type StatusFilterId = (typeof STATUS_FILTERS)[number]['id']

export const RELATION_META: Record<ReportRelation, { label: string; tone: BadgeTone }> = {
  original: { label: 'First report', tone: 'info' },
  duplicate: { label: 'Reported again', tone: 'orange' },
  extension: { label: 'Problem continues here', tone: 'warning' },
}

export const MATCH_REASON_LABEL: Record<MatchReason, string> = {
  same_photo: 'Same photo as an earlier report',
  ai_same_issue: 'AI matched it to the same problem',
  ai_extension: 'AI found the problem continues here',
  rules_10m: 'Same problem type within 10 m',
}

export const TRACE_ICON: Record<TraceStep['step'], IconName> = {
  transcribe: 'mic',
  decide: 'eye',
  normalise: 'layers',
  dedupe: 'repeat',
  describe: 'message',
  score: 'activity',
}

/** Taxonomy icon names are chosen to exist in the icon registry. */
export function departmentIcon(icon: string): IconName {
  return icon as IconName
}
