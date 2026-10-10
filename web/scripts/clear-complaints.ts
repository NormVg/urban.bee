/**
 * Empties every complaint (and its reports, photos and events, by cascade)
 * plus the uploaded media. Accounts and sessions are kept.
 *
 *   pnpm db:clear
 */
import 'dotenv/config'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { db } from '../server/db'
import { complaint } from '../server/db/schema'

async function main() {
  const removed = await db.delete(complaint).returning({ id: complaint.id })
  await rm(join(process.cwd(), '.data', 'uploads'), { recursive: true, force: true })
  console.log(`Removed ${removed.length} complaints and their media. Accounts were kept.`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
