import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Single Postgres connection pool for the Nitro server.
 * The URL points at the Neon pooler, so keep the pool small.
 */
const url = process.env.DATABASE_URL!
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url)

const client = postgres(url, {
  max: 10,
  // Neon requires TLS; a local Postgres (offline demo) usually has none.
  ssl: isLocal ? false : 'require',
})

export const db = drizzle(client, { schema })
