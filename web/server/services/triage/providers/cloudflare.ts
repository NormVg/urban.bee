/**
 * Typed client for Cloudflare Workers AI (REST).
 * Every model call in the triage pipeline goes through here, so swapping a
 * model is an env change and swapping the provider is this one file.
 *
 * POST https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}
 */

import { getCloudflareCredentials, invalidateCloudflareCredentials } from './cloudflare-auth'

const API_BASE = 'https://api.cloudflare.com/client/v4/accounts'

export const CF_MODELS = {
  get decision() {
    return process.env.CF_DECISION_MODEL || 'clef'
  },
  get stt() {
    return process.env.CF_STT_MODEL || '@cf/openai/whisper-large-v3-turbo'
  },
  get text() {
    return process.env.CF_TEXT_MODEL || '@cf/meta/llama-4-scout-17b-16e-instruct'
  },
}

export class CloudflareAiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'CloudflareAiError'
  }
}

/** True when a token is available from .env or the developer's Wrangler login. */
export async function isCloudflareConfigured(): Promise<boolean> {
  return (await getCloudflareCredentials()) !== null
}

interface CfEnvelope<T> {
  success: boolean
  result: T
  errors?: { message: string }[]
}

export async function runModel<T>(model: string, body: unknown, timeoutMs: number, retried = false): Promise<T> {
  const creds = await getCloudflareCredentials()
  if (!creds) {
    throw new CloudflareAiError('Cloudflare Workers AI is not configured')
  }

  const url = `${API_BASE}/${creds.accountId}/ai/run/${model}`
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    const reason = error instanceof Error && error.name === 'TimeoutError' ? 'timed out' : 'failed'
    throw new CloudflareAiError(`${model} request ${reason}`)
  }

  // A Wrangler login can expire mid-session: fetch a fresh token once and retry.
  if ((response.status === 401 || response.status === 403) && creds.source === 'wrangler' && !retried) {
    invalidateCloudflareCredentials()
    return runModel<T>(model, body, timeoutMs, true)
  }

  const payload = (await response.json().catch(() => null)) as CfEnvelope<T> | null
  if (!response.ok || !payload?.success) {
    const detail = payload?.errors?.map((e) => e.message).join('; ') || response.statusText
    throw new CloudflareAiError(`${model} returned ${response.status}: ${detail}`, response.status)
  }
  return payload.result
}

/* ---------------- Clef (decision model) ---------------- */

export type ClefQuestion =
  | { type: 'noul'; instructions: string }
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'score'; instructions: string; criteria: string[] }

export type ClefAnswer =
  | { type: 'noul'; noul: number }
  | { type: 'choice'; choice: string; probabilities: Record<string, number>; confidence: number }
  | {
      type: 'score'
      score: number
      legend: Record<string, string>
      probabilities: Record<string, number>
      confidence: number
    }

export interface ClefImage {
  content_type: 'image/jpeg' | 'image/png' | 'image/webp'
  base64: string
}

export interface ClefResult {
  model: string
  answers: Record<string, ClefAnswer>
  usage: { input_tokens: number; output_tokens: number }
}

export function runClef(
  input: { state: unknown; questions: Record<string, ClefQuestion>; images?: ClefImage[] },
  timeoutMs: number,
): Promise<ClefResult> {
  const model = CF_MODELS.decision
  return runModel<ClefResult>(
    `@cf/cloudflare/${model}`,
    { model, state: input.state, questions: input.questions, images: input.images?.slice(0, 4) },
    timeoutMs,
  )
}

/** Typed accessors: Clef answers are a union keyed by question id. */
export function clefNoul(result: ClefResult, id: string): number | null {
  const answer = result.answers[id]
  return answer && answer.type === 'noul' ? answer.noul : null
}

export function clefChoice(result: ClefResult, id: string) {
  const answer = result.answers[id]
  return answer && answer.type === 'choice' ? answer : null
}

export function clefScore(result: ClefResult, id: string) {
  const answer = result.answers[id]
  return answer && answer.type === 'score' ? answer : null
}

/* ---------------- Whisper (speech to text) ---------------- */

interface WhisperResult {
  text: string
  transcription_info?: { language?: string }
}

export async function runWhisper(audioBase64: string, timeoutMs: number) {
  const result = await runModel<WhisperResult>(
    CF_MODELS.stt,
    { audio: audioBase64, vad_filter: true },
    timeoutMs,
  )
  return { text: result.text?.trim() ?? '', language: result.transcription_info?.language ?? null }
}

/* ---------------- Text LLM (JSON mode) ---------------- */

interface ChatResult {
  response: string | Record<string, unknown>
}

export async function runJsonChat<T>(
  input: { system: string; text: string; imageDataUrl?: string; schema: Record<string, unknown> },
  timeoutMs: number,
): Promise<T> {
  const userContent = input.imageDataUrl
    ? [
        { type: 'text', text: input.text },
        { type: 'image_url', image_url: { url: input.imageDataUrl } },
      ]
    : input.text

  const result = await runModel<ChatResult>(
    CF_MODELS.text,
    {
      messages: [
        { role: 'system', content: input.system },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_schema', json_schema: input.schema },
      max_tokens: 400,
      temperature: 0.2,
    },
    timeoutMs,
  )

  if (typeof result.response === 'object' && result.response !== null) {
    return result.response as T
  }
  const text = String(result.response ?? '')
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  try {
    return JSON.parse(json) as T
  } catch {
    throw new CloudflareAiError(`${CF_MODELS.text} did not return valid JSON`)
  }
}
