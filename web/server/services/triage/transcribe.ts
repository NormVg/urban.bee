import { CF_MODELS, isCloudflareConfigured, runWhisper } from './providers/cloudflare'
import type { TraceRecorder, TriageAudio, Transcript } from './types'
import { logger } from '../../utils/logger'

const TIMEOUT_MS = 20_000

/** Step 1: voice note → text. Skipped without audio; never fails the submission. */
export function transcribe(trace: TraceRecorder, audio: TriageAudio | null): Promise<Transcript | null> {
  return trace.run(
    { step: 'transcribe', label: 'Listened to the voice note', provider: 'cloudflare', model: CF_MODELS.stt },
    async () => {
      if (!audio) return { value: null, status: 'skipped', note: 'No voice note' }
      if (!(await isCloudflareConfigured())) {
        return { value: null, status: 'skipped', provider: 'none', note: 'AI not configured' }
      }
      try {
        const result = await runWhisper(audio.bytes.toString('base64'), TIMEOUT_MS)
        if (!result.text) return { value: null, status: 'ok', note: 'No speech detected' }
        return {
          value: result,
          note: result.language ? `Language: ${result.language}` : undefined,
        }
      } catch (error) {
        logger.warn('triage', 'transcription failed', error)
        return { value: null, status: 'error', note: 'Transcription unavailable' }
      }
    },
  )
}
