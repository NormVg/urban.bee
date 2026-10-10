import type { DepartmentId, Severity } from '#shared/triage/taxonomy'
import type { Hazards } from '#shared/triage/priority'
import type { TraceStep } from '#shared/types/complaint'

export interface TriagePhoto {
  bytes: Buffer
  contentType: 'image/jpeg' | 'image/png' | 'image/webp'
  hash: string
}

export interface TriageAudio {
  bytes: Buffer
  contentType: string
  durationMs: number | null
}

/** Everything the pipeline knows about one citizen submission. */
export interface TriageInput {
  photos: TriagePhoto[]
  audio: TriageAudio | null
  description: string | null
  address: string | null
  latitude: number
  longitude: number
  accuracyM: number | null
  reportedAt: Date
}

export interface Transcript {
  text: string
  language: string | null
}

export interface Decision {
  department: DepartmentId
  category: string
  severity: Severity
  hazards: Hazards
  /** Probability that this is a real civic problem (null under rules) */
  validity: number | null
  /** Confidence in the department (0..1) */
  confidence: number
  provider: 'cloudflare' | 'rules'
  needsReview: boolean
  /** Clef's answers with probabilities, for the admin drawer */
  raw: Record<string, unknown> | null
}

export interface Description {
  title: string
  summary: string
  suggestedAction: string | null
  tags: string[]
}

/** Accumulates trace entries with timings while the pipeline runs. */
export class TraceRecorder {
  readonly steps: TraceStep[] = []

  async run<T>(
    meta: Omit<TraceStep, 'ms' | 'status'>,
    fn: () => Promise<{ value: T; status?: TraceStep['status']; note?: string; provider?: string; model?: string }>,
  ): Promise<T> {
    const started = performance.now()
    const result = await fn()
    this.steps.push({
      ...meta,
      provider: result.provider ?? meta.provider,
      model: result.model ?? meta.model,
      status: result.status ?? 'ok',
      note: result.note ?? meta.note,
      ms: Math.round(performance.now() - started),
    })
    return result.value
  }
}

export function toDataUrl(photo: TriagePhoto): string {
  return `data:${photo.contentType};base64,${photo.bytes.toString('base64')}`
}
