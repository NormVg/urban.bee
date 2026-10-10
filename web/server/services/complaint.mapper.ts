import {
  STATUS_LABELS,
  categoryLabel,
  departmentLabel,
} from '#shared/triage/taxonomy'
import { PRIORITY_TARGETS } from '#shared/triage/priority'
import type {
  ComplaintDetail,
  ComplaintEventDto,
  ComplaintPhotoDto,
  ComplaintReportDto,
  ComplaintSummary,
} from '#shared/types/complaint'
import type {
  ComplaintRow,
  EventRow,
  PhotoRow,
  ReportRow,
} from '../repositories/complaint.repository'
import { mediaUrl } from './media.service'

/** Row → API DTO mapping. The only place response shapes are built. */

export function toSummary(row: ComplaintRow, photoCount: number): ComplaintSummary {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status],
    department: row.department,
    departmentLabel: departmentLabel(row.department),
    category: row.category,
    categoryLabel: categoryLabel(row.department, row.category),
    severity: row.severity,
    priority: row.priority,
    priorityScore: row.priorityScore,
    priorityTarget: PRIORITY_TARGETS[row.priority],
    title: row.title,
    summary: row.summary,
    address: row.address,
    latitude: row.centerLat,
    longitude: row.centerLng,
    extentM: Math.round(row.extentM),
    coverPhotoUrl: mediaUrl(row.coverPhotoKey),
    photoCount,
    reportCount: row.reportCount,
    needsReview: row.needsReview,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function toDetail(params: {
  row: ComplaintRow
  reports: { report: ReportRow; userName: string }[]
  photos: PhotoRow[]
  events: { event: EventRow; actorName: string | null }[]
  viewer: { id: string; isAdmin: boolean }
}): ComplaintDetail {
  const { row, reports, photos, events, viewer } = params
  const relationOf = new Map(reports.map(({ report }) => [report.id, report.relation]))

  const photoDtos: ComplaintPhotoDto[] = photos.map((p) => ({
    id: p.id,
    url: mediaUrl(p.key),
    reportId: p.reportId,
    relation: relationOf.get(p.reportId) ?? 'original',
  }))

  // Citizens see their own reports in full and only anonymous counts for others.
  const visibleReports = viewer.isAdmin ? reports : reports.filter(({ report }) => report.userId === viewer.id)

  const reportDtos: ComplaintReportDto[] = visibleReports.map(({ report, userName }) => ({
    id: report.id,
    userId: report.userId,
    userName,
    relation: report.relation,
    description: report.description,
    photoUrls: photos.filter((p) => p.reportId === report.id).map((p) => mediaUrl(p.key)),
    audioUrl: report.audioKey ? mediaUrl(report.audioKey) : null,
    audioDurationMs: report.audioDurationMs,
    transcript: report.transcript,
    transcriptLanguage: report.transcriptLanguage,
    latitude: report.latitude,
    longitude: report.longitude,
    accuracyM: report.accuracyM,
    address: report.address,
    matchReason: report.matchReason,
    matchScore: report.matchScore,
    distanceM: report.distanceM,
    createdAt: report.createdAt.toISOString(),
    isMine: report.userId === viewer.id,
  }))

  const eventDtos: ComplaintEventDto[] = events.map(({ event, actorName }) => ({
    id: event.id,
    type: event.type,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    actorName: viewer.isAdmin ? actorName : null,
    note: event.note,
    createdAt: event.createdAt.toISOString(),
  }))

  return {
    ...toSummary(row, photos.length),
    suggestedAction: row.suggestedAction,
    tags: row.tags,
    hazards: row.hazards,
    aiConfidence: row.aiConfidence,
    aiProvider: row.aiProvider,
    aiTrace: viewer.isAdmin ? row.aiTrace : [],
    aiRaw: viewer.isAdmin ? (row.aiRaw ?? null) : null,
    photos: viewer.isAdmin ? photoDtos : photoDtos.filter((p) => reportDtos.some((r) => r.id === p.reportId) || p.relation === 'original'),
    reports: reportDtos,
    events: eventDtos,
  }
}
