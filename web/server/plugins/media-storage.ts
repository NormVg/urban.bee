import fsDriver from 'unstorage/drivers/fs'
import s3Driver from 'unstorage/drivers/s3'

/**
 * Where photos and voice notes are stored (the `uploads` mount).
 *  - dev: disk, web/.data/uploads (nitro.devStorage in nuxt.config.ts)
 *  - production with S3 credentials (Vercel): an S3 bucket, since serverless
 *    hosts have no persistent disk
 *  - production without them (self-hosted): disk again
 * MEDIA_DRIVER=s3 / fs forces a choice. Credentials are read at runtime,
 * never baked into the build.
 */
export default defineNitroPlugin(() => {
  const dev = import.meta.dev
  const driver = process.env.MEDIA_DRIVER ?? (dev ? 'fs' : 's3')
  const storage = useStorage()

  if (driver === 's3') {
    const { AWS_ENDPOINT_URL_S3: endpoint, MEDIA_BUCKET: bucket, AWS_ACCESS_KEY_ID: accessKeyId, AWS_SECRET_ACCESS_KEY: secretAccessKey } = process.env
    if (endpoint && bucket && accessKeyId && secretAccessKey) {
      const s3 = s3Driver({ endpoint, bucket, accessKeyId, secretAccessKey, region: process.env.AWS_REGION || 'auto' })
      // In dev the disk mount from devStorage already exists; replace it once it is gone.
      if (dev) void storage.unmount('uploads').then(() => storage.mount('uploads', s3))
      else storage.mount('uploads', s3)
      console.info(`[media] uploads stored in S3 bucket "${bucket}"`)
      return
    }
    console.warn('[media] S3 storage needs AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and MEDIA_BUCKET; falling back to disk')
  }

  if (!dev) storage.mount('uploads', fsDriver({ base: './.data/uploads' }))
})
