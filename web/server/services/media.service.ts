import { createHash, randomUUID } from 'node:crypto'

/**
 * Media storage for photos and voice notes. Backed by Nitro storage
 * (`uploads` mount, fs driver → web/.data/uploads; see nuxt.config.ts),
 * so moving to S3 / Neon object storage is a config change.
 */

const STORAGE = 'uploads'

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'audio/mp4': 'm4a',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/3gpp': '3gp',
}

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  '3gp': 'audio/3gpp',
}

export function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

export async function saveMedia(
  kind: 'photos' | 'audio',
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  const ext = EXTENSIONS[contentType] ?? (kind === 'photos' ? 'jpg' : 'm4a')
  const key = `${kind}/${randomUUID()}.${ext}`
  await useStorage(STORAGE).setItemRaw(storageKey(key), bytes)
  return key
}

export async function readMedia(key: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  const raw = await useStorage(STORAGE).getItemRaw(storageKey(key))
  if (!raw) return null
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer)
  const ext = key.split('.').pop() ?? ''
  return { bytes, contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream' }
}

/** Public URL path for a stored key (served by /api/media/[...key]). */
export function mediaUrl(key: string): string {
  return `/api/media/${key}`
}

/** Keys look like "photos/<uuid>.jpg"; unstorage uses ":" as separator. */
function storageKey(key: string): string {
  if (!/^(photos|audio)\/[0-9a-f-]{36}\.[a-z0-9]{2,4}$/.test(key)) {
    throw createError({ statusCode: 400, message: 'Invalid media key' })
  }
  return key.replace('/', ':')
}

export function isValidMediaKey(key: string): boolean {
  return /^(photos|audio)\/[0-9a-f-]{36}\.[a-z0-9]{2,4}$/.test(key)
}
