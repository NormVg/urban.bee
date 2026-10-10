import { categoryLabel, departmentLabel } from '#shared/triage/taxonomy'
import { CF_MODELS, isCloudflareConfigured, runJsonChat } from './providers/cloudflare'
import type { Decision, Description, TraceRecorder, TriageInput, Transcript } from './types'
import { toDataUrl } from './types'
import { logger } from '../../utils/logger'

const TIMEOUT_MS = 15_000

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Short title, at most 8 words, no trailing period' },
    summary: { type: 'string', description: 'One sentence for a city officer describing the problem and where' },
    suggested_action: { type: 'string', description: 'One short sentence: what the crew should do' },
    tags: { type: 'array', items: { type: 'string' }, description: 'Up to 4 lowercase tags' },
  },
  required: ['title', 'summary', 'suggested_action', 'tags'],
}

/** Step 5: human-readable title, summary and suggested action. */
export function describe(
  trace: TraceRecorder,
  input: TriageInput,
  decision: Decision,
  transcript: Transcript | null,
): Promise<Description> {
  return trace.run(
    { step: 'describe', label: 'Wrote the summary', provider: 'cloudflare', model: CF_MODELS.text },
    async () => {
      const fallback = templateDescription(input, decision, transcript)
      if (!(await isCloudflareConfigured())) {
        return { value: fallback, status: 'fallback', provider: 'template', model: 'template', note: 'AI not configured' }
      }
      try {
        const result = await runJsonChat<{
          title?: string
          summary?: string
          suggested_action?: string
          tags?: string[]
        }>(
          {
            system:
              'You write concise, factual records for a municipal complaint system in India. Use plain English. Never invent details that are not visible in the photo or stated by the citizen.',
            text: [
              `Department: ${departmentLabel(decision.department)}`,
              `Problem type: ${categoryLabel(decision.department, decision.category)}`,
              `Severity: ${decision.severity}`,
              `Address: ${input.address ?? 'unknown'}`,
              `Citizen note: ${input.description || '(none)'}`,
              `Voice note transcript: ${transcript?.text || '(none)'}`,
              'Write the title, summary, suggested action and tags for this complaint.',
            ].join('\n'),
            imageDataUrl: input.photos[0] ? toDataUrl(input.photos[0]) : undefined,
            schema: SCHEMA,
          },
          TIMEOUT_MS,
        )
        if (!result.title || !result.summary) throw new Error('Incomplete description')
        return {
          value: {
            title: clean(result.title, 80),
            summary: clean(result.summary, 300),
            suggestedAction: result.suggested_action ? clean(result.suggested_action, 200) : fallback.suggestedAction,
            tags: (result.tags ?? []).slice(0, 4).map((t) => clean(t.toLowerCase(), 24)),
          },
        }
      } catch (error) {
        logger.warn('triage', 'description failed, using template', error)
        return { value: fallback, status: 'fallback', provider: 'template', model: 'template', note: 'Text model unavailable' }
      }
    },
  )
}

function clean(text: string, max: number): string {
  return text.replace(/\s+/g, ' ').trim().replace(/\.$/, '').slice(0, max)
}

function shortPlace(address: string | null): string | null {
  return address?.split(',')[0]?.trim() || null
}

export function templateDescription(
  input: Pick<TriageInput, 'address' | 'description'>,
  decision: Pick<Decision, 'department' | 'category' | 'severity'>,
  transcript: Transcript | null,
): Description {
  const label = categoryLabel(decision.department, decision.category)
  const place = shortPlace(input.address)
  const said = (input.description || transcript?.text || '').trim()
  return {
    title: place ? `${label} near ${place}` : label,
    summary: said
      ? `${label} reported${place ? ` near ${place}` : ''}: "${said.slice(0, 160)}"`
      : `${label} reported by a citizen with photos${place ? ` near ${place}` : ''}`,
    suggestedAction: `Inspect the site and assign a ${departmentLabel(decision.department)} crew`,
    tags: [decision.category.replace('_', ' '), decision.severity],
  }
}
