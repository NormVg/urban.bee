import type { MatchReason } from '#shared/types/complaint'
import { complaintRepository, type ComplaintRow } from '../../repositories/complaint.repository'
import { readMedia } from '../media.service'
import { boundingBox, haversineM, type LatLng } from '../../utils/geo'
import { logger } from '../../utils/logger'
import {
  CF_MODELS,
  clefChoice,
  isCloudflareConfigured,
  runClef,
  type ClefImage,
  type ClefQuestion,
} from './providers/cloudflare'
import type { Decision, TraceRecorder, TriageInput, Transcript } from './types'

/**
 * Duplicate prevention and issue extension (PLAN.md §5).
 *
 *  1. Same photo (sha256) within 300 m                 → same issue
 *     (a reused photo from far away is not the same problem)
 *  2. Candidates: open, same department + category,
 *     within 25 m (60 m for spreading categories)      → never decided on distance alone
 *  3. Clef relation per candidate: same / extension / different
 *  No AI: same category within 10 m → same issue; never extension.
 */

const SAME_RADIUS_M = 25
/** A matching photo only proves the same problem if it was sent from roughly the same place. */
const SAME_PHOTO_RADIUS_M = 300
const EXTENSION_RADIUS_M = 60
const RULES_RADIUS_M = 10
const SAME_THRESHOLD = 0.75
const EXTENSION_THRESHOLD = 0.7
const LOOKBACK_DAYS = 30
const MAX_CANDIDATES = 3
const TIMEOUT_MS = 20_000
const CLEF_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** Categories whose problem can stretch along a road or spread across an area. */
const SPREADING = new Set([
  'roads.road_damage',
  'roads.footpath_damage',
  'drainage.waterlogging',
  'drainage.sewage_overflow',
  'drainage.blocked_drain',
  'waste.garbage_dump',
  'parks.overgrown_vegetation',
  'power.streetlight_out',
  'planning.encroachment',
])

export type DedupeResult =
  | { outcome: 'new' }
  | {
      outcome: 'same' | 'extension'
      complaint: ComplaintRow
      reason: MatchReason
      score: number | null
      distanceM: number
    }

interface Candidate {
  complaint: ComplaintRow
  distanceM: number
  label: string
}

export function findMatch(
  trace: TraceRecorder,
  input: TriageInput,
  decision: Decision,
  transcript: Transcript | null,
): Promise<DedupeResult> {
  return trace.run(
    { step: 'dedupe', label: 'Checked for repeats', provider: 'cloudflare', model: `@cf/cloudflare/${CF_MODELS.decision}` },
    async () => {
      const point: LatLng = { latitude: input.latitude, longitude: input.longitude }

      // Layer 1: the same photo sent from nearby is unambiguous.
      const samePhoto = (await complaintRepository.findOpenByPhotoHashes(input.photos.map((p) => p.hash)))
        .map((c) => ({ complaint: c, distanceM: Math.round(haversineM(point, { latitude: c.centerLat, longitude: c.centerLng })) }))
        .filter((m) => m.distanceM <= SAME_PHOTO_RADIUS_M)
        .sort((a, b) => a.distanceM - b.distanceM)
      if (samePhoto[0]) {
        const { complaint: match, distanceM } = samePhoto[0]
        return {
          value: { outcome: 'same', complaint: match, reason: 'same_photo', score: 1, distanceM },
          provider: 'sha256',
          model: 'photo hash',
          note: `Same photo as ${match.reference}`,
        }
      }

      // Layer 2: nearby candidates of the same category.
      const spreading = SPREADING.has(`${decision.department}.${decision.category}`)
      const radius = spreading ? EXTENSION_RADIUS_M : SAME_RADIUS_M
      const candidates = await findCandidates(point, decision, radius)
      if (candidates.length === 0) {
        return { value: { outcome: 'new' }, provider: 'geo', model: `${radius} m search`, note: 'No similar open issue nearby' }
      }

      // Layer 3: Clef decides the relation. Without AI, only a very close match merges.
      if (!(await isCloudflareConfigured()) || decision.provider === 'rules') {
        const nearest = candidates[0]!
        if (nearest.distanceM <= RULES_RADIUS_M) {
          return {
            value: { outcome: 'same', complaint: nearest.complaint, reason: 'rules_10m', score: null, distanceM: nearest.distanceM },
            status: 'fallback',
            provider: 'rules',
            model: `${RULES_RADIUS_M} m rule`,
            note: `Same category ${nearest.distanceM} m away`,
          }
        }
        return { value: { outcome: 'new' }, status: 'fallback', provider: 'rules', model: `${RULES_RADIUS_M} m rule`, note: 'No match without AI' }
      }

      try {
        const result = await classifyRelation(input, transcript, candidates, spreading)
        return { value: result.value, note: result.note }
      } catch (error) {
        logger.warn('triage', 'Clef relation check failed', error)
        return { value: { outcome: 'new' }, status: 'error', note: 'Relation check unavailable, kept separate' }
      }
    },
  )
}

async function findCandidates(point: LatLng, decision: Decision, radiusM: number): Promise<Candidate[]> {
  // Search wide on centres (complaints with a long extent), then measure exactly
  // against every report point of each complaint.
  const rows = await complaintRepository.findOpenInBox({
    department: decision.department,
    category: decision.category,
    since: new Date(Date.now() - LOOKBACK_DAYS * 86_400_000),
    box: boundingBox(point, radiusM + 400),
  })
  if (rows.length === 0) return []

  const points = await complaintRepository.reportPoints(rows.map((r) => r.id))
  const nearest = new Map<string, number>()
  for (const p of points) {
    const d = haversineM(point, p)
    nearest.set(p.complaintId, Math.min(nearest.get(p.complaintId) ?? Infinity, d))
  }

  return rows
    .map((complaint) => ({ complaint, distanceM: Math.round(nearest.get(complaint.id) ?? Infinity) }))
    .filter((c) => c.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, MAX_CANDIDATES)
    .map((c, i) => ({ ...c, label: String.fromCharCode(65 + i) }))
}

async function classifyRelation(
  input: TriageInput,
  transcript: Transcript | null,
  candidates: Candidate[],
  spreading: boolean,
): Promise<{ value: DedupeResult; note: string }> {
  // Image budget is 4: new report first, then one cover per candidate
  // (with a single candidate: two of each when available).
  const newImages = input.photos.slice(0, candidates.length === 1 ? 2 : 1)
  const images: ClefImage[] = newImages.map((p) => ({ content_type: p.contentType, base64: p.bytes.toString('base64') }))
  const guide: string[] = [`Images 1${newImages.length > 1 ? '-2' : ''}: the NEW report`]

  for (const c of candidates) {
    const media = await readMedia(c.complaint.coverPhotoKey)
    // Seeded demo photos are SVG illustrations, which Clef can't read.
    if (media && CLEF_IMAGE_TYPES.has(media.contentType) && images.length < 4) {
      images.push({ content_type: media.contentType as ClefImage['content_type'], base64: media.bytes.toString('base64') })
      guide.push(`Image ${images.length}: existing issue ${c.label}`)
    }
  }

  const relationCriteria: Record<string, string> = {
    same: 'The SAME physical problem as the existing issue (the same pothole, the same garbage pile, the same pole), just photographed again',
    ...(spreading
      ? { extension: 'The same continuous problem continuing to a new spot (the same damaged road stretch, the same flooded area, the same garbage spread)' }
      : {}),
    different: 'A separate problem of the same type at a different spot',
  }

  const questions: Record<string, ClefQuestion> = Object.fromEntries(
    candidates.map((c) => [
      `relation_${c.label}`,
      {
        type: 'choice',
        instructions: `Compare the NEW report with existing issue ${c.label} (${c.distanceM} m away). How are they related?`,
        criteria: relationCriteria,
      },
    ]),
  )

  const result = await runClef(
    {
      state: {
        image_guide: guide.join('. '),
        new_report: {
          note: input.description || '(none)',
          voice_note: transcript?.text || '(none)',
          address: input.address || 'unknown',
        },
        existing_issues: candidates.map((c) => ({
          id: c.label,
          distance_m: c.distanceM,
          title: c.complaint.title,
          summary: c.complaint.summary,
          address: c.complaint.address,
          affected_area_radius_m: Math.round(c.complaint.extentM),
        })),
      },
      questions,
      images,
    },
    TIMEOUT_MS,
  )

  let bestSame: { c: Candidate; p: number } | null = null
  let bestExt: { c: Candidate; p: number } | null = null
  for (const c of candidates) {
    const answer = clefChoice(result, `relation_${c.label}`)
    const pSame = answer?.probabilities.same ?? 0
    const pExt = answer?.probabilities.extension ?? 0
    if (!bestSame || pSame > bestSame.p) bestSame = { c, p: pSame }
    if (!bestExt || pExt > bestExt.p) bestExt = { c, p: pExt }
  }

  if (bestSame && bestSame.p >= SAME_THRESHOLD && bestSame.c.distanceM <= SAME_RADIUS_M) {
    const { c, p } = bestSame
    return {
      value: { outcome: 'same', complaint: c.complaint, reason: 'ai_same_issue', score: p, distanceM: c.distanceM },
      note: `Same as ${c.complaint.reference} (${Math.round(p * 100)}%, ${c.distanceM} m)`,
    }
  }
  if (spreading && bestExt && bestExt.p >= EXTENSION_THRESHOLD) {
    const { c, p } = bestExt
    return {
      value: { outcome: 'extension', complaint: c.complaint, reason: 'ai_extension', score: p, distanceM: c.distanceM },
      note: `Extends ${c.complaint.reference} (${Math.round(p * 100)}%, ${c.distanceM} m)`,
    }
  }
  return {
    value: { outcome: 'new' },
    note: `${candidates.length} nearby checked, all different`,
  }
}
