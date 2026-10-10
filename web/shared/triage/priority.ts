import type { Severity } from './taxonomy'

/**
 * Priority scoring: pure functions shared by the pipeline (on submit and on
 * merge) and the seed script. See PLAN.md §6.
 */

export type Priority = 'P1' | 'P2' | 'P3' | 'P4'

export interface Hazards {
  riskToLife: boolean
  blocksTraffic: boolean
  affectsMany: boolean
  longStanding: boolean
}

export const NO_HAZARDS: Hazards = {
  riskToLife: false,
  blocksTraffic: false,
  affectsMany: false,
  longStanding: false,
}

const SEVERITY_BASE: Record<Severity, number> = {
  low: 15,
  medium: 35,
  high: 55,
  critical: 75,
}

export function priorityScore(severity: Severity, hazards: Hazards, reportCount: number): number {
  let score = SEVERITY_BASE[severity]
  if (hazards.riskToLife) score += 12
  if (hazards.blocksTraffic) score += 6
  if (hazards.affectsMany) score += 6
  if (hazards.longStanding) score += 4
  score += Math.min(16, Math.max(0, reportCount - 1) * 4)
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function priorityBand(score: number): Priority {
  if (score >= 80) return 'P1'
  if (score >= 60) return 'P2'
  if (score >= 35) return 'P3'
  return 'P4'
}

/** Target first response per band, shown to citizens and admins. */
export const PRIORITY_TARGETS: Record<Priority, string> = {
  P1: 'within 4 hours',
  P2: 'within 24 hours',
  P3: 'within 3 days',
  P4: 'within 7 days',
}
