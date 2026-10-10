import { DEPARTMENTS, type DepartmentId, type Severity } from '#shared/triage/taxonomy'
import { NO_HAZARDS, type Hazards } from '#shared/triage/priority'
import type { Decision } from './types'

/**
 * Keyword fallback used only when the AI is unavailable. It needs words, so a
 * photo-only report without AI becomes "Other" and is flagged for review.
 */

const CRITICAL_WORDS = ['danger', 'dangerous', 'accident', 'electrocut', 'shock', 'collapse', 'fire', 'injur', 'died', 'death', 'khatra']
const HIGH_WORDS = ['urgent', 'child', 'children', 'school', 'hospital', 'flood', 'deep', 'big', 'huge', 'night', 'week', 'month']

const includesAny = (text: string, words: string[]) => words.some((w) => text.includes(w))

export function classifyByRules(text: string): Decision {
  const haystack = text.toLowerCase()

  let best: { department: DepartmentId; category: string; hits: number } | null = null
  for (const dept of DEPARTMENTS) {
    for (const cat of dept.categories) {
      const hits = cat.keywords.filter((k) => haystack.includes(k)).length
      if (hits > 0 && (!best || hits > best.hits)) {
        best = { department: dept.id, category: cat.id, hits }
      }
    }
  }

  const hazards: Hazards = {
    ...NO_HAZARDS,
    riskToLife: includesAny(haystack, CRITICAL_WORDS),
    blocksTraffic: includesAny(haystack, ['traffic', 'blocked road', 'jam', 'vehicles']),
    affectsMany: includesAny(haystack, ['everyone', 'whole area', 'colony', 'many people', 'all houses']),
    longStanding: includesAny(haystack, ['week', 'weeks', 'month', 'months', 'days', 'long time']),
  }

  const severity: Severity = hazards.riskToLife
    ? 'critical'
    : includesAny(haystack, HIGH_WORDS)
      ? 'high'
      : best
        ? 'medium'
        : 'low'

  return {
    department: best?.department ?? 'roads',
    category: best?.category ?? 'other',
    severity,
    hazards,
    validity: null,
    confidence: best ? 0.4 : 0.1,
    provider: 'rules',
    needsReview: !best,
    raw: null,
  }
}
