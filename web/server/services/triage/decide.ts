import { DEPARTMENTS, getDepartment, isDepartmentId, type Severity } from '#shared/triage/taxonomy'
import {
  CF_MODELS,
  clefChoice,
  clefNoul,
  clefScore,
  isCloudflareConfigured,
  runClef,
  type ClefQuestion,
} from './providers/cloudflare'
import { classifyByRules } from './rules'
import type { Decision, TraceRecorder, TriageInput, Transcript } from './types'
import { logger } from '../../utils/logger'

const TIMEOUT_MS = 25_000

const SEVERITY_LEVELS: Severity[] = ['low', 'medium', 'high', 'critical']

/** Clef questions (PLAN.md §4). Phrased so a photo alone can answer them. */
function buildQuestions(): Record<string, ClefQuestion> {
  const departmentCriteria = Object.fromEntries(
    DEPARTMENTS.map((d) => [d.id, `${d.label}: ${d.description}`]),
  )
  const categoryCriteria = Object.fromEntries(
    DEPARTMENTS.flatMap((d) =>
      d.categories.map((c) => [`${d.id}.${c.id}`, `${d.label} / ${c.label}: ${c.description}`]),
    ),
  )
  const basis = 'Based on the photos and any citizen text provided'

  return {
    valid: {
      type: 'noul',
      instructions: `${basis}, does this show a real civic problem in a public place that a city department should fix?`,
    },
    department: {
      type: 'choice',
      instructions: `${basis}, which municipal department is responsible for fixing this problem?`,
      criteria: departmentCriteria,
    },
    category: {
      type: 'choice',
      instructions: `${basis}, what specific problem is shown?`,
      criteria: categoryCriteria,
    },
    severity: {
      type: 'score',
      instructions: `${basis}, how severe is this problem for the public?`,
      criteria: ['Minor inconvenience', 'Moderate problem', 'Serious problem', 'Dangerous or an emergency'],
    },
    risk_to_life: {
      type: 'noul',
      instructions: `${basis}, could this problem injure or endanger people or animals?`,
    },
    blocks_traffic: {
      type: 'noul',
      instructions: `${basis}, does this block or disrupt road or foot traffic?`,
    },
    affects_many: {
      type: 'noul',
      instructions: `${basis}, does this affect many people or a whole street or area?`,
    },
    long_standing: {
      type: 'noul',
      instructions: 'Does the citizen say this problem has existed for a long time (days or more)?',
    },
  }
}

function buildState(input: TriageInput, transcript: Transcript | null) {
  return {
    citizen_note: input.description || '(none: the citizen only sent photos)',
    voice_note_transcript: transcript?.text || '(no voice note)',
    voice_note_language: transcript?.language ?? null,
    address: input.address || 'unknown',
    photos_attached: input.photos.length,
    reported_at: input.reportedAt.toISOString(),
  }
}

/** Step 2: Clef decides department, category, severity and hazards. */
export function decide(
  trace: TraceRecorder,
  input: TriageInput,
  transcript: Transcript | null,
): Promise<Decision> {
  const text = [input.description, transcript?.text].filter(Boolean).join('. ')

  return trace.run(
    { step: 'decide', label: 'Read the photos', provider: 'cloudflare', model: `@cf/cloudflare/${CF_MODELS.decision}` },
    async () => {
      if (!(await isCloudflareConfigured())) {
        return { value: classifyByRules(text), status: 'fallback', provider: 'rules', model: 'keywords', note: 'AI not configured' }
      }
      try {
        const result = await runClef(
          {
            state: buildState(input, transcript),
            questions: buildQuestions(),
            images: input.photos.map((p) => ({ content_type: p.contentType, base64: p.bytes.toString('base64') })),
          },
          TIMEOUT_MS,
        )
        const decision = mapClefResult(result)
        return {
          value: decision,
          note: `${getDepartment(decision.department)?.short} · ${Math.round(decision.confidence * 100)}% confident`,
        }
      } catch (error) {
        logger.warn('triage', 'Clef decision failed, using rules', error)
        return { value: classifyByRules(text), status: 'fallback', provider: 'rules', model: 'keywords', note: 'Clef unavailable' }
      }
    },
  )
}

function mapClefResult(result: Awaited<ReturnType<typeof runClef>>): Decision {
  const dept = clefChoice(result, 'department')
  const cat = clefChoice(result, 'category')
  const sev = clefScore(result, 'severity')
  if (!dept || !isDepartmentId(dept.choice)) {
    throw new Error('Clef returned no department')
  }
  const department = dept.choice

  // Category: best option inside the chosen department, so the two never disagree.
  let category = 'other'
  let bestProb = 0.1
  for (const [key, prob] of Object.entries(cat?.probabilities ?? {})) {
    const [deptId, catId] = key.split('.')
    if (deptId === department && catId && prob > bestProb) {
      category = catId
      bestProb = prob
    }
  }

  const level = Math.max(0, Math.min(3, Math.round(sev?.score ?? 1)))
  const yes = (id: string) => (clefNoul(result, id) ?? 0) >= 0.5
  const validity = clefNoul(result, 'valid')
  const confidence = dept.confidence ?? dept.probabilities[department] ?? 0.5

  return {
    department,
    category,
    severity: SEVERITY_LEVELS[level]!,
    hazards: {
      riskToLife: yes('risk_to_life'),
      blocksTraffic: yes('blocks_traffic'),
      affectsMany: yes('affects_many'),
      longStanding: yes('long_standing'),
    },
    validity,
    confidence,
    provider: 'cloudflare',
    needsReview: (validity !== null && validity < 0.25) || confidence < 0.35,
    raw: { model: result.model, answers: result.answers, usage: result.usage },
  }
}
