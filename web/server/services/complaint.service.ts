import { randomUUID } from 'node:crypto'
import { priorityBand, priorityScore } from '#shared/triage/priority'
import type { ComplaintStatus, Severity } from '#shared/triage/taxonomy'
import type { ComplaintDetail, ComplaintSummary, SubmitOutcome, SubmitResponse } from '#shared/types/complaint'
import {
  complaintRepository as repo,
  type ComplaintRow,
} from '../repositories/complaint.repository'
import { runTriage, type TriageResult } from './triage/pipeline'
import { saveMedia } from './media.service'
import { toDetail, toSummary } from './complaint.mapper'
import { extentOf } from '../utils/geo'
import { logger } from '../utils/logger'
import type { SessionUser } from '../utils/session'
import { isAdminEmail } from '../utils/session'
import type { SubmitPayload } from '../validators/complaint'

/** Business rules for complaints: submit (triage + dedupe), read, status changes. */

const SEVERITY_RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2, critical: 3 }
const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

async function newReference(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Array.from({ length: 5 }, () => REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)]).join('')
    const reference = `UB-${code}`
    if (!(await repo.referenceExists(reference))) return reference
  }
  return `UB-${randomUUID().slice(0, 8).toUpperCase()}`
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505'
}

export const complaintService = {
  async submit(user: SessionUser, payload: SubmitPayload): Promise<SubmitResponse> {
    const triage = await runTriage({ ...payload, reportedAt: new Date() })
    const { match } = triage

    // Same citizen, same issue: nothing is written.
    if (match.outcome === 'same' && (await repo.findUserSameIssueReport(match.complaint.id, user.id))) {
      return this.alreadyReported(match.complaint.id, user)
    }

    const photoKeys = await Promise.all(payload.photos.map((p) => saveMedia('photos', p.bytes, p.contentType)))
    const audioKey = payload.audio ? await saveMedia('audio', payload.audio.bytes, payload.audio.contentType) : null

    try {
      const { complaintId, reportId, outcome } =
        match.outcome === 'new'
          ? await this.createComplaint(user, payload, triage, photoKeys, audioKey)
          : await this.linkReport(user, payload, triage, match, photoKeys, audioKey)

      return { outcome, complaint: await this.detailFor(complaintId, user), reportId }
    } catch (error) {
      // Race: the unique index refused a second same-issue report from this user.
      if (isUniqueViolation(error) && match.outcome === 'same') {
        return this.alreadyReported(match.complaint.id, user)
      }
      logger.error('complaints', 'failed to save report', error)
      throw createError({ statusCode: 500, message: "We couldn't save your report. Please try again." })
    }
  },

  async alreadyReported(complaintId: string, user: SessionUser): Promise<SubmitResponse> {
    return { outcome: 'already_reported', complaint: await this.detailFor(complaintId, user), reportId: null }
  },

  async createComplaint(
    user: SessionUser,
    payload: SubmitPayload,
    triage: TriageResult,
    photoKeys: string[],
    audioKey: string | null,
  ): Promise<{ complaintId: string; reportId: string; outcome: SubmitOutcome }> {
    const { decision, description, transcript } = triage
    const complaintId = randomUUID()
    const reportId = randomUUID()
    const now = new Date()
    const reference = await newReference()

    await repo.transaction(async (tx) => {
      await repo.insertComplaint(
        {
          id: complaintId,
          reference,
          reporterId: user.id,
          status: 'triaged',
          department: decision.department,
          category: decision.category,
          severity: decision.severity,
          priorityScore: triage.score,
          priority: triage.priority,
          title: description!.title,
          summary: description!.summary,
          suggestedAction: description!.suggestedAction,
          tags: description!.tags,
          hazards: decision.hazards,
          needsReview: decision.needsReview,
          aiConfidence: decision.confidence,
          aiProvider: decision.provider,
          aiTrace: triage.trace,
          aiRaw: decision.raw,
          latitude: payload.latitude,
          longitude: payload.longitude,
          centerLat: payload.latitude,
          centerLng: payload.longitude,
          extentM: 0,
          address: payload.address,
          coverPhotoKey: photoKeys[0]!,
          reportCount: 1,
          createdAt: now,
          updatedAt: now,
          triagedAt: now,
          lastReportedAt: now,
        },
        tx,
      )
      await repo.insertReport(
        {
          id: reportId,
          complaintId,
          userId: user.id,
          relation: 'original',
          description: payload.description,
          photoCount: photoKeys.length,
          audioKey,
          audioDurationMs: payload.audio?.durationMs ?? null,
          transcript: transcript?.text ?? null,
          transcriptLanguage: transcript?.language ?? null,
          latitude: payload.latitude,
          longitude: payload.longitude,
          accuracyM: payload.accuracyM,
          address: payload.address,
          createdAt: now,
        },
        tx,
      )
      await repo.insertPhotos(photoRows(photoKeys, payload, reportId, complaintId), tx)
      await repo.insertEvent({ id: randomUUID(), complaintId, type: 'created', toStatus: 'received', actorId: user.id, createdAt: now }, tx)
      await repo.insertEvent(
        {
          id: randomUUID(),
          complaintId,
          type: 'triaged',
          fromStatus: 'received',
          toStatus: 'triaged',
          note: `Sent to ${decision.department} · ${triage.priority}`,
          createdAt: new Date(now.getTime() + 1),
        },
        tx,
      )
    })

    return { complaintId, reportId, outcome: 'created' }
  },

  async linkReport(
    user: SessionUser,
    payload: SubmitPayload,
    triage: TriageResult,
    match: Extract<TriageResult['match'], { outcome: 'same' | 'extension' }>,
    photoKeys: string[],
    audioKey: string | null,
  ): Promise<{ complaintId: string; reportId: string; outcome: SubmitOutcome }> {
    const { decision, transcript } = triage
    const complaintId = match.complaint.id
    const relation = match.outcome === 'same' ? 'duplicate' : 'extension'
    const reportId = randomUUID()
    const now = new Date()

    await repo.transaction(async (tx) => {
      const current = (await repo.findById(complaintId, tx)) as ComplaintRow
      const isNewCitizen = !(await repo.hasAnyUserReport(complaintId, user.id, tx))

      await repo.insertReport(
        {
          id: reportId,
          complaintId,
          userId: user.id,
          relation,
          description: payload.description,
          photoCount: photoKeys.length,
          audioKey,
          audioDurationMs: payload.audio?.durationMs ?? null,
          transcript: transcript?.text ?? null,
          transcriptLanguage: transcript?.language ?? null,
          latitude: payload.latitude,
          longitude: payload.longitude,
          accuracyM: payload.accuracyM,
          address: payload.address,
          matchReason: match.reason,
          matchScore: match.score,
          distanceM: match.distanceM,
          createdAt: now,
        },
        tx,
      )
      await repo.insertPhotos(photoRows(photoKeys, payload, reportId, complaintId), tx)

      // Affected area grows with every point; more citizens and a wider area raise priority.
      const points = await repo.reportPoints([complaintId], tx)
      const { center, radiusM } = extentOf(points)
      const reportCount = current.reportCount + (isNewCitizen ? 1 : 0)
      const severity =
        SEVERITY_RANK[decision.severity] > SEVERITY_RANK[current.severity] && decision.provider === 'cloudflare'
          ? decision.severity
          : current.severity
      const hazards = {
        riskToLife: current.hazards.riskToLife || (decision.provider === 'cloudflare' && decision.hazards.riskToLife),
        blocksTraffic: current.hazards.blocksTraffic || (decision.provider === 'cloudflare' && decision.hazards.blocksTraffic),
        affectsMany: current.hazards.affectsMany || radiusM > 50 || reportCount >= 4,
        longStanding: current.hazards.longStanding || decision.hazards.longStanding,
      }
      const score = priorityScore(severity, hazards, reportCount)

      await repo.updateComplaint(
        complaintId,
        {
          reportCount,
          severity,
          hazards,
          priorityScore: score,
          priority: priorityBand(score),
          centerLat: center.latitude,
          centerLng: center.longitude,
          extentM: radiusM,
          lastReportedAt: now,
        },
        tx,
      )
      await repo.insertEvent(
        {
          id: randomUUID(),
          complaintId,
          type: relation === 'duplicate' ? 'merged' : 'extended',
          actorId: user.id,
          note:
            relation === 'duplicate'
              ? `Reported again (${reportCount} people) · priority ${current.priority} → ${priorityBand(score)}`
              : `Problem continues ${Math.round(match.distanceM)} m away · now covers about ${Math.round(radiusM * 2)} m`,
          createdAt: now,
        },
        tx,
      )
    })

    return { complaintId, reportId, outcome: relation === 'duplicate' ? 'merged' : 'extended' }
  },

  async detailFor(complaintId: string, viewer: SessionUser): Promise<ComplaintDetail> {
    const isAdmin = isAdminEmail(viewer.email)
    const row = await repo.findById(complaintId)
    if (!row) throw createError({ statusCode: 404, message: 'We could not find that report.' })

    const reports = await repo.listReports(complaintId)
    if (!isAdmin && !reports.some(({ report }) => report.userId === viewer.id)) {
      throw createError({ statusCode: 404, message: 'We could not find that report.' })
    }

    const [photos, events] = await Promise.all([repo.listPhotos(complaintId), repo.listEvents(complaintId)])
    return toDetail({ row, reports, photos, events, viewer: { id: viewer.id, isAdmin } })
  },

  async adminDetail(complaintId: string, admin: SessionUser): Promise<ComplaintDetail> {
    return this.detailFor(complaintId, admin)
  },

  async listMine(user: SessionUser): Promise<ComplaintSummary[]> {
    const rows = await repo.listForUser(user.id)
    return summaries(rows)
  },

  async listForAdmin(filters: Parameters<typeof repo.listForAdmin>[0]): Promise<ComplaintSummary[]> {
    return summaries(await repo.listForAdmin(filters))
  },

  async changeStatus(
    complaintId: string,
    admin: SessionUser,
    status: ComplaintStatus,
    note: string | null,
  ): Promise<ComplaintDetail> {
    const row = await repo.findById(complaintId)
    if (!row) throw createError({ statusCode: 404, message: 'We could not find that report.' })
    if (row.status !== status) {
      const now = new Date()
      await repo.transaction(async (tx) => {
        await repo.updateComplaint(
          complaintId,
          { status, resolvedAt: status === 'resolved' ? now : row.resolvedAt },
          tx,
        )
        await repo.insertEvent(
          { id: randomUUID(), complaintId, type: 'status_changed', fromStatus: row.status, toStatus: status, actorId: admin.id, note, createdAt: now },
          tx,
        )
      })
    }
    return this.adminDetail(complaintId, admin)
  },
}

async function summaries(rows: ComplaintRow[]): Promise<ComplaintSummary[]> {
  const counts = await repo.photoCounts(rows.map((r) => r.id))
  return rows.map((row) => toSummary(row, counts.get(row.id) ?? 1))
}

function photoRows(keys: string[], payload: SubmitPayload, reportId: string, complaintId: string) {
  return keys.map((key, position) => ({
    id: randomUUID(),
    reportId,
    complaintId,
    key,
    hash: payload.photos[position]!.hash,
    contentType: payload.photos[position]!.contentType,
    position,
  }))
}
