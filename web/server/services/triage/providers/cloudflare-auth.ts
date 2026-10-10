import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { logger } from '../../../utils/logger'

/**
 * Where the Cloudflare account and token come from, in order:
 *  1. CLOUDFLARE_API_TOKEN (+ CLOUDFLARE_ACCOUNT_ID) in web/.env
 *  2. The developer's Wrangler login (`wrangler login`), read with
 *     `wrangler auth token`, which also refreshes an expired login.
 * The account id comes from CLOUDFLARE_ACCOUNT_ID when set, otherwise from
 * the accounts this token can see. Nothing is written to disk.
 */

const run = promisify(execFile)
const API = 'https://api.cloudflare.com/client/v4'
/** Wrangler's OAuth tokens last about an hour; ask again well before that. */
const TOKEN_TTL_MS = 15 * 60 * 1000

export interface CloudflareCredentials {
  accountId: string
  token: string
  source: 'env' | 'wrangler'
}

let cached: { creds: CloudflareCredentials; expiresAt: number } | null = null
let pending: Promise<CloudflareCredentials | null> | null = null
let wranglerUnavailableUntil = 0
let announced = false

/** Commands to try for Wrangler: an explicit path, a global install, then npx. */
function wranglerCommands(): [string, string[]][] {
  const args = ['auth', 'token', '--json']
  const list: [string, string[]][] = []
  if (process.env.CF_WRANGLER_BIN) list.push([process.env.CF_WRANGLER_BIN, args])
  list.push(['wrangler', args])
  list.push(['npx', ['--yes', 'wrangler@4', ...args]])
  return list
}

const TOKEN_SHAPE = /^[A-Za-z0-9._~+/=-]{30,}$/

/** Finds the token in `wrangler auth token` output, JSON or plain. */
function extractToken(stdout: string): string | null {
  const text = stdout.trim()
  try {
    const parsed: unknown = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
    const queue: unknown[] = [parsed]
    while (queue.length) {
      const node = queue.shift()
      if (!node || typeof node !== 'object') continue
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        if (typeof value === 'string' && /token/i.test(key) && TOKEN_SHAPE.test(value)) return value
        if (value && typeof value === 'object') queue.push(value)
      }
    }
  } catch {
    // not JSON; fall through to plain output
  }
  const line = text.split('\n').map((l) => l.trim()).reverse().find((l) => TOKEN_SHAPE.test(l))
  return line ?? null
}

async function tokenFromWrangler(): Promise<string | null> {
  if (Date.now() < wranglerUnavailableUntil) return null
  for (const [cmd, args] of wranglerCommands()) {
    try {
      const { stdout } = await run(cmd, args, {
        timeout: 60_000,
        env: { ...process.env, WRANGLER_SEND_METRICS: 'false', NO_COLOR: '1' },
        maxBuffer: 1024 * 1024,
      })
      const token = extractToken(stdout)
      if (token) return token
    } catch {
      // try the next way of running wrangler
    }
  }
  // Not logged in or not installed: don't retry on every report.
  wranglerUnavailableUntil = Date.now() + 5 * 60 * 1000
  logger.warn('cloudflare', 'No Cloudflare token: set CLOUDFLARE_API_TOKEN or run `npx wrangler login`')
  return null
}

async function accountIdFor(token: string): Promise<string | null> {
  if (process.env.CLOUDFLARE_ACCOUNT_ID) return process.env.CLOUDFLARE_ACCOUNT_ID
  try {
    const res = await fetch(`${API}/accounts?per_page=50`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    })
    const body = (await res.json()) as { success: boolean; result?: { id: string; name: string }[] }
    const accounts = body.result ?? []
    if (!body.success || !accounts[0]) return null
    if (accounts.length > 1) {
      logger.warn(
        'cloudflare',
        `Your login can see ${accounts.length} accounts; using "${accounts[0].name}". Set CLOUDFLARE_ACCOUNT_ID to pick another.`,
      )
    }
    return accounts[0].id
  } catch {
    return null
  }
}

async function resolve(): Promise<CloudflareCredentials | null> {
  const envToken = process.env.CLOUDFLARE_API_TOKEN
  const source: CloudflareCredentials['source'] = envToken ? 'env' : 'wrangler'
  const token = envToken || (process.env.CF_USE_WRANGLER === '0' ? null : await tokenFromWrangler())
  if (!token) return null

  const accountId = (cached?.creds.token === token ? cached.creds.accountId : null) ?? (await accountIdFor(token))
  if (!accountId) {
    logger.warn('cloudflare', 'Could not find the Cloudflare account; set CLOUDFLARE_ACCOUNT_ID')
    return null
  }
  if (!announced) {
    announced = true
    logger.info('cloudflare', source === 'env' ? 'Using Cloudflare token from .env' : 'Using your Wrangler login for Cloudflare')
  }
  return { accountId, token, source }
}

/** Current credentials, or null when Workers AI is not set up (the pipeline then uses rules). */
export async function getCloudflareCredentials(): Promise<CloudflareCredentials | null> {
  if (cached && cached.expiresAt > Date.now()) return cached.creds
  pending ??= resolve().finally(() => {
    pending = null
  })
  const creds = await pending
  // .env tokens don't expire; Wrangler's do, so re-read them periodically.
  if (creds) cached = { creds, expiresAt: creds.source === 'env' ? Infinity : Date.now() + TOKEN_TTL_MS }
  return creds
}

/** Forget the token after Cloudflare rejects it, so the next call asks Wrangler again. */
export function invalidateCloudflareCredentials() {
  if (cached?.creds.source === 'wrangler') cached = null
}
