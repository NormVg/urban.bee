import { priorityBand, priorityScore, type Priority } from '#shared/triage/priority'
import { categoryLabel, getDepartment } from '#shared/triage/taxonomy'
import type { TraceStep } from '#shared/types/complaint'
import { decide } from './decide'
import { findMatch, type DedupeResult } from './dedupe'
import { describe } from './describe'
import { transcribe } from './transcribe'
import { TraceRecorder, type Decision, type Description, type TriageInput, type Transcript } from './types'

/**
 * The AI triage pipeline (PLAN.md §4):
 *   1 transcribe → 2 decide (Clef) → 3 normalise → 4 dedupe → 5 describe → 6 score
 * Pure orchestration: no database writes. The complaint service persists the result.
 */

export interface TriageResult {
  transcript: Transcript | null
  decision: Decision
  match: DedupeResult
  /** Only computed for brand-new complaints */
  description: Description | null
  score: number
  priority: Priority
  trace: TraceStep[]
}

export async function runTriage(input: TriageInput): Promise<TriageResult> {
  const trace = new TraceRecorder()

  const transcript = await transcribe(trace, input.audio)
  const decision = await decide(trace, input, transcript)

  await trace.run({ step: 'normalise', label: 'Matched to a team', provider: 'urban.bee', model: 'taxonomy' }, async () => {
    const dept = getDepartment(decision.department)
    return {
      value: null,
      status: decision.needsReview ? 'fallback' : 'ok',
      note: `${dept?.short ?? decision.department} · ${categoryLabel(decision.department, decision.category)} · ${decision.severity}${decision.needsReview ? ' · needs review' : ''}`,
    }
  })

  const match = await findMatch(trace, input, decision, transcript)

  const description =
    match.outcome === 'new' ? await describe(trace, input, decision, transcript) : null
  if (!description) {
    trace.steps.push({ step: 'describe', label: 'Wrote the summary', provider: 'urban.bee', status: 'skipped', ms: 0, note: 'Added to an existing report' })
  }

  // Scored for a new complaint here; merged/extended complaints are re-scored on write.
  const score = await trace.run({ step: 'score', label: 'Set the priority', provider: 'urban.bee', model: 'priority v1' }, async () => {
    const value = priorityScore(decision.severity, decision.hazards, 1)
    return { value, note: `${value}/100 · ${priorityBand(value)}` }
  })

  return {
    transcript,
    decision,
    match,
    description,
    score,
    priority: priorityBand(score),
    trace: trace.steps,
  }
}
