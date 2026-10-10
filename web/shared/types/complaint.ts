import type { ComplaintStatus, DepartmentId, Severity } from '../triage/taxonomy'
import type { Hazards, Priority } from '../triage/priority'

/** API contract shared by the server and the dashboard (PLAN.md §8). */

export type ReportRelation = 'original' | 'duplicate' | 'extension'

export type MatchReason = 'same_photo' | 'ai_same_issue' | 'ai_extension' | 'rules_10m'

export type SubmitOutcome = 'created' | 'merged' | 'extended' | 'already_reported'

export type ComplaintEventType = 'created' | 'triaged' | 'merged' | 'extended' | 'status_changed'

export type TraceStatus = 'ok' | 'skipped' | 'fallback' | 'error'

export interface TraceStep {
  step: 'transcribe' | 'decide' | 'normalise' | 'dedupe' | 'describe' | 'score'
  label: string
  provider: string
  model?: string
  status: TraceStatus
  ms: number
  note?: string
}

export interface ComplaintSummary {
  id: string
  reference: string
  status: ComplaintStatus
  statusLabel: string
  department: DepartmentId | string
  departmentLabel: string
  category: string
  categoryLabel: string
  severity: Severity
  priority: Priority
  priorityScore: number
  priorityTarget: string
  title: string
  summary: string
  address: string | null
  latitude: number
  longitude: number
  extentM: number
  coverPhotoUrl: string
  photoCount: number
  reportCount: number
  needsReview: boolean
  createdAt: string
  updatedAt: string
}

export interface ComplaintPhotoDto {
  id: string
  url: string
  reportId: string
  relation: ReportRelation
}

export interface ComplaintReportDto {
  id: string
  userId: string
  userName: string
  relation: ReportRelation
  description: string | null
  photoUrls: string[]
  audioUrl: string | null
  audioDurationMs: number | null
  transcript: string | null
  transcriptLanguage: string | null
  latitude: number
  longitude: number
  accuracyM: number | null
  address: string | null
  matchReason: MatchReason | null
  matchScore: number | null
  distanceM: number | null
  createdAt: string
  isMine: boolean
}

export interface ComplaintEventDto {
  id: string
  type: ComplaintEventType
  fromStatus: ComplaintStatus | null
  toStatus: ComplaintStatus | null
  actorName: string | null
  note: string | null
  createdAt: string
}

export interface ComplaintDetail extends ComplaintSummary {
  suggestedAction: string | null
  tags: string[]
  hazards: Hazards
  aiConfidence: number | null
  aiProvider: string
  aiTrace: TraceStep[]
  /** Clef's per-option probabilities, admin only */
  aiRaw: Record<string, unknown> | null
  photos: ComplaintPhotoDto[]
  reports: ComplaintReportDto[]
  events: ComplaintEventDto[]
}

export interface SubmitResponse {
  outcome: SubmitOutcome
  complaint: ComplaintDetail
  /** The report this submission created (absent for already_reported) */
  reportId: string | null
}

export interface OverviewResponse {
  stats: {
    open: number
    p1Open: number
    resolved30d: number
    medianTriageSeconds: number | null
    total: number
    reportsMerged: number
  }
  series: { date: string; label: string; value: number }[]
  severity: Record<Severity, number>
  priority: Record<Priority, number>
  departments: {
    id: string
    label: string
    icon: string
    open: number
    p1: number
    resolved: number
    avgPriority: number
    status: 'healthy' | 'watch' | 'critical'
  }[]
  latestCritical: ComplaintSummary[]
}

export interface AdminMeResponse {
  user: { id: string; name: string; email: string }
  isAdmin: boolean
}
