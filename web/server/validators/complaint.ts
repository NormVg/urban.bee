import type { H3Event } from 'h3'
import { SEVERITIES, STATUSES, type ComplaintStatus, type Severity } from '#shared/triage/taxonomy'
import type { TriageAudio, TriagePhoto } from '../services/triage/types'
import { sha256 } from '../services/media.service'

const MAX_PHOTOS = 4
const MAX_PHOTO_BYTES = 4 * 1024 * 1024
const MAX_AUDIO_BYTES = 10 * 1024 * 1024
const MAX_DESCRIPTION = 1000

const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export interface SubmitPayload {
  photos: TriagePhoto[]
  audio: TriageAudio | null
  description: string | null
  latitude: number
  longitude: number
  accuracyM: number | null
  address: string | null
}

const bad = (message: string) => createError({ statusCode: 400, message })

/** Parse and validate the citizen's multipart submission. */
export async function readSubmitPayload(event: H3Event): Promise<SubmitPayload> {
  const parts = await readMultipartFormData(event)
  if (!parts) throw bad('Please attach at least one photo.')

  const fields = new Map<string, string>()
  const photos: TriagePhoto[] = []
  let audio: TriageAudio | null = null

  for (const part of parts) {
    if (!part.name) continue
    if (part.name === 'photos' || part.name === 'photo') {
      const type = normalisePhotoType(part.type, part.filename)
      if (!type) throw bad('Photos must be JPEG, PNG or WebP.')
      if (part.data.length > MAX_PHOTO_BYTES) throw bad('One of the photos is too large.')
      photos.push({ bytes: part.data, contentType: type, hash: sha256(part.data) })
    } else if (part.name === 'audio') {
      if (part.data.length > MAX_AUDIO_BYTES) throw bad('The voice note is too long.')
      if (part.data.length > 0) {
        audio = { bytes: part.data, contentType: part.type || 'audio/mp4', durationMs: null }
      }
    } else {
      fields.set(part.name, part.data.toString('utf8'))
    }
  }

  if (photos.length === 0) throw bad('Please attach at least one photo.')
  if (photos.length > MAX_PHOTOS) throw bad(`You can attach up to ${MAX_PHOTOS} photos.`)

  const latitude = Number(fields.get('latitude'))
  const longitude = Number(fields.get('longitude'))
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
    throw bad('We need your location to send this report.')
  }

  const accuracy = Number(fields.get('accuracy'))
  const duration = Number(fields.get('audioDurationMs'))
  if (audio && Number.isFinite(duration) && duration > 0) audio.durationMs = Math.round(duration)

  const description = fields.get('description')?.trim().slice(0, MAX_DESCRIPTION) || null
  const address = fields.get('address')?.trim().slice(0, 300) || null

  return {
    photos,
    audio,
    description,
    latitude,
    longitude,
    accuracyM: Number.isFinite(accuracy) && accuracy > 0 ? accuracy : null,
    address,
  }
}

function normalisePhotoType(type: string | undefined, filename: string | undefined): TriagePhoto['contentType'] | null {
  if (type && PHOTO_TYPES.has(type)) return type as TriagePhoto['contentType']
  if (type === 'image/jpg') return 'image/jpeg'
  const ext = filename?.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return null
}

/** Comma-separated query values, filtered to an allowed set. */
export function csvParam<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (typeof value !== 'string' || !value) return []
  return value.split(',').filter((v): v is T => (allowed as readonly string[]).includes(v))
}

export const parseSeverities = (v: unknown): Severity[] => csvParam(v, SEVERITIES)
export const parseStatuses = (v: unknown): ComplaintStatus[] => csvParam(v, STATUSES)

export function parseStatusUpdate(body: unknown): { status: ComplaintStatus; note: string | null } {
  const data = (body ?? {}) as { status?: unknown; note?: unknown }
  if (typeof data.status !== 'string' || !(STATUSES as readonly string[]).includes(data.status)) {
    throw bad('Choose a valid status.')
  }
  const note = typeof data.note === 'string' ? data.note.trim().slice(0, 500) || null : null
  return { status: data.status as ComplaintStatus, note }
}
