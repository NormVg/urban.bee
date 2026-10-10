import { isValidMediaKey, readMedia } from '../../services/media.service'

/** Photos and voice notes. Keys are random UUIDs, so URLs are unguessable. */
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key') ?? ''
  if (!isValidMediaKey(key)) throw createError({ statusCode: 404, message: 'Not found' })

  const media = await readMedia(key)
  if (!media) throw createError({ statusCode: 404, message: 'Not found' })

  setResponseHeaders(event, {
    'Content-Type': media.contentType,
    'Content-Length': String(media.bytes.length),
    'Cache-Control': 'private, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  })
  return media.bytes
})
