import 'dotenv/config'

/**
 * Seeds the single master admin account (web console login).
 * Idempotent: re-running when the account exists is a no-op.
 * Requires the dev server running (default http://localhost:3000).
 */
const BASE_URL = process.env.SEED_BASE_URL ?? 'http://localhost:3000'

const name = process.env.MASTER_ADMIN_NAME
const email = process.env.MASTER_ADMIN_EMAIL
const password = process.env.MASTER_ADMIN_PASSWORD

if (!email || !password || !name) {
  console.error(
    'Missing MASTER_ADMIN_NAME / MASTER_ADMIN_EMAIL / MASTER_ADMIN_PASSWORD in .env',
  )
  process.exit(1)
}

const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Origin: BASE_URL,
  },
  body: JSON.stringify({ name, email, password }),
})

const body = await res.json().catch(() => null)

if (res.ok) {
  console.log(`Master admin seeded: ${email}`)
} else if (body?.message?.toLowerCase().includes('already exists')) {
  console.log(`Master admin already exists: ${email}`)
} else {
  console.error(`Failed to seed master admin (HTTP ${res.status}):`)
  console.error(body?.message ?? body ?? res.statusText)
  process.exit(1)
}
