/**
 * Demo data for the dashboard (PLAN.md §13).
 *
 *   pnpm db:seed           add demo accounts + complaints (skips if already seeded)
 *   pnpm db:seed --reset   wipe complaint tables first
 *
 * City centre defaults to Bengaluru; override with SEED_LAT / SEED_LNG.
 * Photos are illustrated SVG cards (clearly demo), stored like real uploads.
 */
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../server/db'
import { complaint, complaintEvent, complaintPhoto, complaintReport, user } from '../server/db/schema'
import { auth } from '../server/utils/auth'
import { categoryLabel, getDepartment, type ComplaintStatus, type DepartmentId, type Severity } from '../shared/triage/taxonomy'
import { NO_HAZARDS, priorityBand, priorityScore, type Hazards } from '../shared/triage/priority'
import type { TraceStep } from '../shared/types/complaint'

const CENTER = {
  lat: Number(process.env.SEED_LAT ?? 12.9716),
  lng: Number(process.env.SEED_LNG ?? 77.5946),
}
const UPLOADS = join(process.cwd(), '.data', 'uploads', 'photos')
const DEMO_PASSWORD = 'urbanbee-demo'

const ACCOUNTS = [
  { name: 'City Admin', email: 'admin@urbanbee.city' },
  { name: 'Asha Menon', email: 'asha@urbanbee.city' },
  { name: 'Ravi Kumar', email: 'ravi@urbanbee.city' },
  { name: 'Farah Khan', email: 'farah@urbanbee.city' },
  { name: 'Joseph D’Souza', email: 'joseph@urbanbee.city' },
]

interface SeedItem {
  dept: DepartmentId
  cat: string
  sev: Severity
  title: string
  summary: string
  action: string
  place: string
  /** offset from centre in metres (east, north) */
  at: [number, number]
  status: ComplaintStatus
  daysAgo: number
  hazards?: Partial<Hazards>
  reporters?: number
  extentM?: number
  note?: string
  review?: boolean
}

const ITEMS: SeedItem[] = [
  { dept: 'roads', cat: 'pothole', sev: 'high', title: 'Deep pothole at bus stop', summary: 'A deep pothole in the left lane next to the bus stop; two-wheelers swerve into traffic to avoid it.', action: 'Fill and compact the pothole, cone off the lane until it sets', place: '12th Main Rd, Indiranagar', at: [3900, 900], status: 'triaged', daysAgo: 0, hazards: { riskToLife: true, blocksTraffic: true }, reporters: 3, note: 'Big hole near the bus stop, bikes keep falling' },
  { dept: 'roads', cat: 'road_damage', sev: 'high', title: 'Broken road stretch after cable work', summary: 'Road surface dug up and left broken for a long stretch after cable laying.', action: 'Resurface the trench and restore the road', place: '80 Feet Rd, Koramangala', at: [1800, -3600], status: 'in_progress', daysAgo: 4, hazards: { blocksTraffic: true, affectsMany: true, longStanding: true }, reporters: 4, extentM: 85 },
  { dept: 'roads', cat: 'traffic_signal', sev: 'critical', title: 'Traffic signal dead at junction', summary: 'All signal heads at the junction are off during peak hour; traffic is unmanaged.', action: 'Dispatch signal maintenance and request traffic police at the junction', place: 'Silk Board Junction', at: [1500, -5200], status: 'triaged', daysAgo: 0, hazards: { riskToLife: true, blocksTraffic: true, affectsMany: true }, reporters: 5 },
  { dept: 'roads', cat: 'footpath_damage', sev: 'medium', title: 'Broken footpath slabs outside school', summary: 'Several footpath slabs are broken and tilted outside the school gate.', action: 'Replace the broken slabs', place: 'Church St, Shivajinagar', at: [400, 600], status: 'triaged', daysAgo: 2, extentM: 30, reporters: 2 },
  { dept: 'roads', cat: 'illegal_parking', sev: 'low', title: 'Cars parked on the footpath', summary: 'Cars regularly parked fully on the footpath, forcing pedestrians onto the road.', action: 'Notify traffic police for enforcement', place: 'Brigade Rd', at: [500, -300], status: 'received', daysAgo: 1 },
  { dept: 'roads', cat: 'signage', sev: 'low', title: 'Fallen road name board', summary: 'Road name board has fallen and is lying on the footpath.', action: 'Re-install the sign board', place: '4th Cross, Malleshwaram', at: [-2600, 3100], status: 'resolved', daysAgo: 9 },
  { dept: 'roads', cat: 'pothole', sev: 'medium', title: 'Pothole near metro exit', summary: 'Medium pothole near the metro exit collecting rain water.', action: 'Patch the pothole', place: 'MG Road Metro', at: [900, -150], status: 'resolved', daysAgo: 12 },

  { dept: 'water', cat: 'pipe_leak', sev: 'high', title: 'Burst water pipe flooding road', summary: 'Drinking water pipe has burst, water gushing onto the road for hours.', action: 'Shut the valve and repair the burst main', place: '100 Feet Rd, HAL 2nd Stage', at: [4600, 300], status: 'in_progress', daysAgo: 1, hazards: { affectsMany: true, blocksTraffic: true }, reporters: 2, note: 'Paani beh raha hai since morning' },
  { dept: 'water', cat: 'no_supply', sev: 'high', title: 'No water supply for three days', summary: 'Residents of the lane report no municipal water supply for three days.', action: 'Check the zone valve schedule and send a tanker', place: 'Jayanagar 4th Block', at: [-800, -4100], status: 'triaged', daysAgo: 1, hazards: { affectsMany: true, longStanding: true }, reporters: 3 },
  { dept: 'water', cat: 'contaminated_water', sev: 'critical', title: 'Dirty, smelly tap water', summary: 'Tap water is brown with a sewage smell; likely contamination of the supply line.', action: 'Collect samples, flush the line and advise residents not to drink', place: 'Shanthinagar', at: [600, -1900], status: 'triaged', daysAgo: 0, hazards: { riskToLife: true, affectsMany: true } },
  { dept: 'water', cat: 'low_pressure', sev: 'low', title: 'Very low water pressure', summary: 'Water arrives at very low pressure in the morning slot.', action: 'Inspect the line pressure in the zone', place: 'Basavanagudi', at: [-2200, -2900], status: 'received', daysAgo: 3 },

  { dept: 'drainage', cat: 'open_manhole', sev: 'critical', title: 'Open manhole on busy road', summary: 'Manhole cover is missing on a busy road; the opening is hidden when it rains.', action: 'Barricade immediately and replace the cover', place: 'Residency Rd', at: [300, -800], status: 'in_progress', daysAgo: 0, hazards: { riskToLife: true, blocksTraffic: true }, reporters: 2 },
  { dept: 'drainage', cat: 'waterlogging', sev: 'high', title: 'Underpass waterlogged', summary: 'Knee-deep water in the underpass after rain; vehicles stalling.', action: 'Clear the inlet grates and pump out water', place: 'Okalipuram Underpass', at: [-1700, 800], status: 'triaged', daysAgo: 1, hazards: { blocksTraffic: true, affectsMany: true }, reporters: 4, extentM: 60 },
  { dept: 'drainage', cat: 'blocked_drain', sev: 'medium', title: 'Storm drain choked with plastic', summary: 'Roadside storm drain choked with plastic and silt.', action: 'Desilt the drain', place: 'Frazer Town', at: [1500, 2600], status: 'received', daysAgo: 2, extentM: 40 },
  { dept: 'drainage', cat: 'sewage_overflow', sev: 'high', title: 'Sewage overflowing into lane', summary: 'Sewage overflowing from a chamber into a residential lane.', action: 'Clear the sewer blockage with a jetting machine', place: 'Ejipura', at: [2400, -2500], status: 'triaged', daysAgo: 2, hazards: { affectsMany: true }, reporters: 2 },
  { dept: 'drainage', cat: 'blocked_drain', sev: 'medium', title: 'Blocked drain near market', summary: 'Drain beside the market blocked, water stagnating.', action: 'Desilt and clear the outlet', place: 'KR Market', at: [-1100, -900], status: 'resolved', daysAgo: 7 },

  { dept: 'waste', cat: 'garbage_dump', sev: 'high', title: 'Garbage dumped at street corner', summary: 'Large pile of mixed garbage dumped at the corner, attracting stray dogs.', action: 'Clear the dump and set up a no-dumping notice', place: 'Wilson Garden', at: [-300, -2700], status: 'triaged', daysAgo: 1, hazards: { affectsMany: true, longStanding: true }, reporters: 3, extentM: 25, note: 'Kachra not picked up for a week' },
  { dept: 'waste', cat: 'overflowing_bin', sev: 'medium', title: 'Overflowing community bin', summary: 'Community bin overflowing onto the road.', action: 'Empty the bin and increase pickup frequency', place: 'Richmond Town', at: [700, -1300], status: 'in_progress', daysAgo: 2 },
  { dept: 'waste', cat: 'waste_burning', sev: 'high', title: 'Garbage being burnt in open plot', summary: 'Garbage and leaves burnt in an open plot; heavy smoke near homes.', action: 'Douse the fire and fine the offender', place: 'Domlur', at: [3200, -600], status: 'triaged', daysAgo: 0, hazards: { riskToLife: true, affectsMany: true } },
  { dept: 'waste', cat: 'missed_collection', sev: 'low', title: 'Door-to-door collection missed', summary: 'Garbage van has not come to the street for two days.', action: 'Check the route and reschedule pickup', place: 'Sadashivanagar', at: [-900, 3700], status: 'received', daysAgo: 1 },
  { dept: 'waste', cat: 'dead_animal', sev: 'medium', title: 'Dead dog on the road', summary: 'Carcass of a dog on the roadside.', action: 'Remove the carcass and sanitise the spot', place: 'Ulsoor', at: [1900, 900], status: 'resolved', daysAgo: 5 },
  { dept: 'waste', cat: 'garbage_dump', sev: 'medium', title: 'Construction debris and garbage', summary: 'Mixed debris and garbage dumped on vacant land by the road.', action: 'Clear the debris', place: 'Hebbal', at: [700, 8200], status: 'triaged', daysAgo: 6, hazards: { longStanding: true } },

  { dept: 'power', cat: 'exposed_wiring', sev: 'critical', title: 'Live wires hanging low', summary: 'Electric wires hanging low over the footpath, sparking in the rain.', action: 'Isolate the line and re-secure the wiring', place: 'Vasanth Nagar', at: [-200, 1900], status: 'triaged', daysAgo: 0, hazards: { riskToLife: true }, reporters: 2 },
  { dept: 'power', cat: 'streetlight_out', sev: 'medium', title: 'Dark stretch, streetlights off', summary: 'Five consecutive streetlights are off, leaving the stretch dark at night.', action: 'Replace the faulty lamps and check the feeder', place: 'Old Airport Rd', at: [5200, -1400], status: 'in_progress', daysAgo: 3, hazards: { affectsMany: true }, reporters: 2, extentM: 110 },
  { dept: 'power', cat: 'transformer_issue', sev: 'high', title: 'Transformer leaking oil', summary: 'Transformer leaking oil and making a loud humming noise.', action: 'Inspect and service the transformer', place: 'Rajajinagar', at: [-3900, 1700], status: 'triaged', daysAgo: 1, hazards: { riskToLife: true } },
  { dept: 'power', cat: 'fallen_pole', sev: 'high', title: 'Leaning electric pole', summary: 'Electric pole leaning dangerously towards the road after a truck hit it.', action: 'Isolate and replace the pole', place: 'Yeshwanthpur', at: [-3300, 4900], status: 'resolved', daysAgo: 8 },

  { dept: 'parks', cat: 'fallen_tree', sev: 'critical', title: 'Tree fallen across the road', summary: 'Large tree has fallen across both lanes after the storm.', action: 'Send tree-cutting crew and clear the road', place: 'Palace Rd', at: [-500, 1500], status: 'in_progress', daysAgo: 0, hazards: { blocksTraffic: true, riskToLife: true }, reporters: 4 },
  { dept: 'parks', cat: 'park_damage', sev: 'low', title: 'Broken swings in children’s park', summary: 'Two swings broken in the children’s play area.', action: 'Repair the swings', place: 'Cubbon Park', at: [100, 200], status: 'received', daysAgo: 4 },
  { dept: 'parks', cat: 'overgrown_vegetation', sev: 'low', title: 'Overgrown bushes blocking footpath', summary: 'Bushes overgrown onto the footpath, pedestrians walk on the road.', action: 'Trim the vegetation', place: 'Lalbagh West Gate', at: [-1300, -2400], status: 'triaged', daysAgo: 5, extentM: 35 },

  { dept: 'safety', cat: 'stray_animals', sev: 'high', title: 'Aggressive stray dogs near school', summary: 'Pack of stray dogs chasing children near the school gate.', action: 'Inform animal birth control team for capture and vaccination', place: 'Cox Town', at: [2300, 2900], status: 'triaged', daysAgo: 1, hazards: { riskToLife: true }, reporters: 2 },
  { dept: 'safety', cat: 'unsafe_structure', sev: 'critical', title: 'Compound wall about to collapse', summary: 'Old compound wall cracked and leaning over the footpath.', action: 'Barricade the footpath and issue a notice to the owner', place: 'Chickpet', at: [-1400, -400], status: 'triaged', daysAgo: 2, hazards: { riskToLife: true } },
  { dept: 'safety', cat: 'other', sev: 'low', title: 'Unclear report near bus depot', summary: 'Photo shows a crowded street; the problem is not clear.', action: 'Call the citizen to clarify', place: 'Majestic', at: [-1600, 300], status: 'received', daysAgo: 0, review: true },

  { dept: 'planning', cat: 'encroachment', sev: 'medium', title: 'Shops encroaching on footpath', summary: 'Shop extensions occupy the full footpath width.', action: 'Issue an encroachment notice', place: 'Commercial St', at: [1100, 1300], status: 'triaged', daysAgo: 3, hazards: { blocksTraffic: true }, extentM: 50, reporters: 2 },
  { dept: 'planning', cat: 'illegal_hoarding', sev: 'medium', title: 'Unauthorised hoarding on flyover', summary: 'Large flex hoarding tied to the flyover railing.', action: 'Remove the hoarding', place: 'Richmond Circle', at: [200, -1600], status: 'resolved', daysAgo: 10 },
  { dept: 'planning', cat: 'illegal_construction', sev: 'low', title: 'Construction material on road', summary: 'Sand and bricks stored on the road for a private construction.', action: 'Notify the owner to clear within 24 hours', place: 'RT Nagar', at: [500, 5600], status: 'received', daysAgo: 2 },
]

/* ---------------- helpers ---------------- */

function offset(east: number, north: number) {
  const lat = CENTER.lat + north / 111_320
  const lng = CENTER.lng + east / (111_320 * Math.cos((CENTER.lat * Math.PI) / 180))
  return { lat, lng }
}

const PALETTE: Record<DepartmentId, [string, string]> = {
  roads: ['#1c4f78', '#e6683f'],
  water: ['#16405f', '#7fb3d5'],
  drainage: ['#123350', '#5d8aa8'],
  waste: ['#5d5142', '#e6683f'],
  power: ['#241c13', '#e8b04a'],
  parks: ['#2f5d43', '#9cc5a1'],
  safety: ['#7a2e22', '#f0a08a'],
  planning: ['#3d3a63', '#b6b0e6'],
}

function demoPhoto(item: SeedItem, variant: number): string {
  const [bg, accent] = PALETTE[item.dept]
  const label = categoryLabel(item.dept, item.cat)
  const dept = getDepartment(item.dept)?.label ?? ''
  const angle = 20 + variant * 35
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle})">
      <stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${bg}" stop-opacity="0.82"/>
    </linearGradient>
    <pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})">
      <rect width="48" height="48" fill="none"/><circle cx="6" cy="6" r="2" fill="${accent}" fill-opacity="0.18"/>
    </pattern>
  </defs>
  <rect width="1200" height="900" fill="url(#g)"/>
  <rect width="1200" height="900" fill="url(#p)"/>
  <circle cx="${900 - variant * 120}" cy="${260 + variant * 60}" r="220" fill="${accent}" fill-opacity="0.16"/>
  <circle cx="${980 - variant * 120}" cy="${340 + variant * 60}" r="120" fill="${accent}" fill-opacity="0.22"/>
  <text x="80" y="640" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="600" letter-spacing="4" fill="#efe9dc" fill-opacity="0.7">${dept.toUpperCase().replace('&', '&amp;')}</text>
  <text x="80" y="720" font-family="Helvetica, Arial, sans-serif" font-size="76" font-weight="700" fill="#efe9dc">${label}</text>
  <text x="80" y="790" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="#efe9dc" fill-opacity="0.75">${item.place} · demo photo</text>
</svg>`
}

async function storePhoto(svg: string): Promise<string> {
  const key = `photos/${randomUUID()}.svg`
  await writeFile(join(UPLOADS, key.replace('photos/', '')), svg)
  return key
}

function demoTrace(item: SeedItem, score: number): TraceStep[] {
  const r = (min: number, max: number) => Math.round(min + Math.random() * (max - min))
  return [
    item.note
      ? { step: 'transcribe', label: 'Listened to the voice note', provider: 'cloudflare', model: '@cf/openai/whisper-large-v3-turbo', status: 'ok', ms: r(700, 1600), note: 'Language: en' }
      : { step: 'transcribe', label: 'Listened to the voice note', provider: 'cloudflare', model: '@cf/openai/whisper-large-v3-turbo', status: 'skipped', ms: 0, note: 'No voice note' },
    { step: 'decide', label: 'Read the photos', provider: 'cloudflare', model: '@cf/cloudflare/clef', status: 'ok', ms: r(1400, 3200), note: `${getDepartment(item.dept)?.short} · ${r(item.review ? 22 : 78, item.review ? 34 : 97)}% confident` },
    { step: 'normalise', label: 'Matched to a team', provider: 'urban.bee', model: 'taxonomy', status: item.review ? 'fallback' : 'ok', ms: r(1, 4), note: `${getDepartment(item.dept)?.short} · ${categoryLabel(item.dept, item.cat)} · ${item.sev}` },
    { step: 'dedupe', label: 'Checked for repeats', provider: 'geo', model: '25 m search', status: 'ok', ms: r(20, 90), note: 'No similar open issue nearby' },
    { step: 'describe', label: 'Wrote the summary', provider: 'cloudflare', model: '@cf/meta/llama-4-scout-17b-16e-instruct', status: 'ok', ms: r(900, 2100) },
    { step: 'score', label: 'Set the priority', provider: 'urban.bee', model: 'priority v1', status: 'ok', ms: 1, note: `${score}/100 · ${priorityBand(score)}` },
  ]
}

async function ensureAccounts(): Promise<Map<string, string>> {
  const ids = new Map<string, string>()
  for (const account of ACCOUNTS) {
    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, account.email)).limit(1)
    if (existing) {
      ids.set(account.email, existing.id)
      continue
    }
    const result = await auth.api.signUpEmail({
      body: { name: account.name, email: account.email, password: DEMO_PASSWORD },
    })
    ids.set(account.email, result.user.id)
  }
  return ids
}

/* ---------------- main ---------------- */

async function main() {
  const reset = process.argv.includes('--reset')
  await mkdir(UPLOADS, { recursive: true })

  if (reset) {
    await db.delete(complaint)
    console.log('Cleared complaint tables')
  } else {
    const existing = await db.select({ id: complaint.id }).from(complaint).limit(1)
    if (existing.length) {
      console.log('Complaints already exist. Run with --reset to start over.')
      process.exit(0)
    }
  }

  const accounts = await ensureAccounts()
  const citizens = ACCOUNTS.slice(1).map((a) => accounts.get(a.email)!)
  const adminId = accounts.get(ACCOUNTS[0]!.email)!

  let refCounter = 0
  for (const item of ITEMS) {
    const id = randomUUID()
    const reporters = Math.min(item.reporters ?? 1, citizens.length)
    const hazards: Hazards = { ...NO_HAZARDS, ...item.hazards }
    const score = priorityScore(item.sev, hazards, reporters)
    const created = new Date(Date.now() - item.daysAgo * 86_400_000 - Math.random() * 10 * 3_600_000)
    const base = offset(item.at[0], item.at[1])
    const cover = await storePhoto(demoPhoto(item, 0))

    await db.insert(complaint).values({
      id,
      reference: `UB-${(++refCounter).toString(36).toUpperCase().padStart(2, '0')}${randomUUID().slice(0, 3).toUpperCase()}`,
      reporterId: citizens[refCounter % citizens.length]!,
      status: item.status,
      department: item.dept,
      category: item.cat,
      severity: item.sev,
      priorityScore: score,
      priority: priorityBand(score),
      title: item.title,
      summary: item.summary,
      suggestedAction: item.action,
      tags: [item.cat.replace('_', ' '), item.sev],
      hazards,
      needsReview: Boolean(item.review),
      aiConfidence: item.review ? 0.28 : 0.78 + Math.random() * 0.2,
      aiProvider: 'cloudflare',
      aiTrace: demoTrace(item, score),
      latitude: base.lat,
      longitude: base.lng,
      centerLat: base.lat,
      centerLng: base.lng,
      extentM: item.extentM ?? 0,
      address: `${item.place}, Bengaluru`,
      coverPhotoKey: cover,
      reportCount: reporters,
      createdAt: created,
      updatedAt: created,
      triagedAt: created,
      resolvedAt: item.status === 'resolved' ? new Date(Math.min(created.getTime() + 2 * 86_400_000, Date.now() - 60_000)) : null,
      lastReportedAt: created,
    })

    for (let i = 0; i < reporters; i++) {
      const reportId = randomUUID()
      const isExtension = Boolean(item.extentM) && i > 0
      const spread = isExtension ? (item.extentM! / reporters) * i : 6 * i
      const p = offset(item.at[0] + spread, item.at[1] + (i % 2 ? 4 : -3))
      // Follow-up reports land between the first report and now, never in the future.
      const when = new Date(
        Math.min(created.getTime() + i * 3_600_000 * (1 + Math.random() * 5), Date.now() - (reporters - i) * 240_000),
      )
      await db.insert(complaintReport).values({
        id: reportId,
        complaintId: id,
        userId: citizens[(refCounter + i) % citizens.length]!,
        relation: i === 0 ? 'original' : isExtension ? 'extension' : 'duplicate',
        description: i === 0 ? (item.note ?? null) : null,
        photoCount: 1,
        transcript: i === 0 ? (item.note ?? null) : null,
        transcriptLanguage: i === 0 && item.note ? 'en' : null,
        latitude: p.lat,
        longitude: p.lng,
        accuracyM: 6 + Math.random() * 10,
        address: `${item.place}, Bengaluru`,
        matchReason: i === 0 ? null : isExtension ? 'ai_extension' : 'ai_same_issue',
        matchScore: i === 0 ? null : 0.78 + Math.random() * 0.2,
        distanceM: i === 0 ? null : Math.round(spread || 8),
        createdAt: when,
      })
      await db.insert(complaintPhoto).values({
        id: randomUUID(),
        reportId,
        complaintId: id,
        key: i === 0 ? cover : await storePhoto(demoPhoto(item, i)),
        hash: randomUUID(),
        contentType: 'image/svg+xml',
        position: 0,
      })
    }

    const events: { type: 'created' | 'triaged' | 'status_changed'; from: ComplaintStatus | null; to: ComplaintStatus; at: number }[] = [
      { type: 'created', from: null, to: 'received', at: 0 },
      { type: 'triaged', from: 'received', to: 'triaged', at: 4_000 },
    ]
    if (item.status === 'in_progress' || item.status === 'resolved') {
      events.push({ type: 'status_changed', from: 'triaged', to: 'in_progress', at: 5 * 3_600_000 })
    }
    if (item.status === 'resolved') {
      events.push({ type: 'status_changed', from: 'in_progress', to: 'resolved', at: 2 * 86_400_000 })
    }
    for (const e of events) {
      await db.insert(complaintEvent).values({
        id: randomUUID(),
        complaintId: id,
        type: e.type,
        fromStatus: e.from,
        toStatus: e.to,
        actorId: e.type === 'status_changed' ? adminId : null,
        createdAt: new Date(Math.min(created.getTime() + e.at, Date.now() - 60_000)),
      })
    }
  }

  const count = await db.select({ id: complaint.id }).from(complaint).where(inArray(complaint.status, ['received', 'triaged', 'in_progress']))
  console.log(`Seeded ${ITEMS.length} complaints (${count.length} open) around ${CENTER.lat}, ${CENTER.lng}`)
  console.log(`Demo admin: ${ACCOUNTS[0]!.email} / ${DEMO_PASSWORD}`)
  console.log(`Demo citizen: ${ACCOUNTS[1]!.email} / ${DEMO_PASSWORD}`)
  process.exit(0)
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
