import { and, desc, eq, gte, inArray, lte, ne, or, sql, ilike, type SQL } from 'drizzle-orm'
import { db } from '../db'
import {
  complaint,
  complaintEvent,
  complaintPhoto,
  complaintReport,
  user,
} from '../db/schema'
import { OPEN_STATUSES, type ComplaintStatus, type Severity } from '#shared/triage/taxonomy'

/** Database access for complaints. No business rules here (PLAN.md §9). */

export type ComplaintRow = typeof complaint.$inferSelect
export type ComplaintInsert = typeof complaint.$inferInsert
export type ReportRow = typeof complaintReport.$inferSelect
export type ReportInsert = typeof complaintReport.$inferInsert
export type PhotoRow = typeof complaintPhoto.$inferSelect
export type PhotoInsert = typeof complaintPhoto.$inferInsert
export type EventRow = typeof complaintEvent.$inferSelect
export type EventInsert = typeof complaintEvent.$inferInsert

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Executor = typeof db | Tx

const isOpen = inArray(complaint.status, OPEN_STATUSES)

export const complaintRepository = {
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return db.transaction(fn)
  },

  async findById(id: string, ex: Executor = db): Promise<ComplaintRow | null> {
    const [row] = await ex.select().from(complaint).where(eq(complaint.id, id)).limit(1)
    return row ?? null
  },

  async referenceExists(reference: string): Promise<boolean> {
    const [row] = await db
      .select({ id: complaint.id })
      .from(complaint)
      .where(eq(complaint.reference, reference))
      .limit(1)
    return Boolean(row)
  },

  /** Open complaints that already contain any of these exact photos. */
  async findOpenByPhotoHashes(hashes: string[]): Promise<ComplaintRow[]> {
    if (hashes.length === 0) return []
    return db
      .selectDistinct({ c: complaint })
      .from(complaintPhoto)
      .innerJoin(complaint, eq(complaintPhoto.complaintId, complaint.id))
      .where(and(inArray(complaintPhoto.hash, hashes), isOpen))
      .then((rows) => rows.map((r) => r.c))
  },

  /** Open complaints of one category whose centre lies inside a lat/lng box. */
  async findOpenInBox(params: {
    department: string
    category: string
    since: Date
    box: { minLat: number; maxLat: number; minLng: number; maxLng: number }
  }): Promise<ComplaintRow[]> {
    const { box } = params
    return db
      .select()
      .from(complaint)
      .where(
        and(
          isOpen,
          eq(complaint.department, params.department),
          eq(complaint.category, params.category),
          gte(complaint.lastReportedAt, params.since),
          gte(complaint.centerLat, box.minLat),
          lte(complaint.centerLat, box.maxLat),
          gte(complaint.centerLng, box.minLng),
          lte(complaint.centerLng, box.maxLng),
        ),
      )
      .limit(50)
  },

  async reportPoints(complaintIds: string[], ex: Executor = db) {
    if (complaintIds.length === 0) return []
    return ex
      .select({
        complaintId: complaintReport.complaintId,
        latitude: complaintReport.latitude,
        longitude: complaintReport.longitude,
      })
      .from(complaintReport)
      .where(inArray(complaintReport.complaintId, complaintIds))
  },

  /** Has this user already filed a same-issue (non-extension) report on it? */
  async findUserSameIssueReport(complaintId: string, userId: string): Promise<ReportRow | null> {
    const [row] = await db
      .select()
      .from(complaintReport)
      .where(
        and(
          eq(complaintReport.complaintId, complaintId),
          eq(complaintReport.userId, userId),
          ne(complaintReport.relation, 'extension'),
        ),
      )
      .limit(1)
    return row ?? null
  },

  async hasAnyUserReport(complaintId: string, userId: string, ex: Executor = db): Promise<boolean> {
    const [row] = await ex
      .select({ id: complaintReport.id })
      .from(complaintReport)
      .where(and(eq(complaintReport.complaintId, complaintId), eq(complaintReport.userId, userId)))
      .limit(1)
    return Boolean(row)
  },

  async insertComplaint(values: ComplaintInsert, ex: Executor = db) {
    await ex.insert(complaint).values(values)
  },

  async updateComplaint(id: string, values: Partial<ComplaintInsert>, ex: Executor = db) {
    await ex
      .update(complaint)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(complaint.id, id))
  },

  async insertReport(values: ReportInsert, ex: Executor = db) {
    await ex.insert(complaintReport).values(values)
  },

  async insertPhotos(values: PhotoInsert[], ex: Executor = db) {
    if (values.length) await ex.insert(complaintPhoto).values(values)
  },

  async insertEvent(values: EventInsert, ex: Executor = db) {
    await ex.insert(complaintEvent).values(values)
  },

  async listReports(complaintId: string) {
    return db
      .select({ report: complaintReport, userName: user.name })
      .from(complaintReport)
      .innerJoin(user, eq(complaintReport.userId, user.id))
      .where(eq(complaintReport.complaintId, complaintId))
      .orderBy(complaintReport.createdAt)
  },

  async listPhotos(complaintId: string): Promise<PhotoRow[]> {
    return db
      .select()
      .from(complaintPhoto)
      .where(eq(complaintPhoto.complaintId, complaintId))
      .orderBy(complaintPhoto.createdAt, complaintPhoto.position)
  },

  async listEvents(complaintId: string) {
    return db
      .select({ event: complaintEvent, actorName: user.name })
      .from(complaintEvent)
      .leftJoin(user, eq(complaintEvent.actorId, user.id))
      .where(eq(complaintEvent.complaintId, complaintId))
      .orderBy(complaintEvent.createdAt)
  },

  async photoCounts(complaintIds: string[]): Promise<Map<string, number>> {
    if (complaintIds.length === 0) return new Map()
    const rows = await db
      .select({ id: complaintPhoto.complaintId, n: sql<number>`count(*)::int` })
      .from(complaintPhoto)
      .where(inArray(complaintPhoto.complaintId, complaintIds))
      .groupBy(complaintPhoto.complaintId)
    return new Map(rows.map((r) => [r.id, r.n]))
  },

  /** Complaints the user has any report on, newest activity first. */
  async listForUser(userId: string): Promise<ComplaintRow[]> {
    const ids = db
      .selectDistinct({ id: complaintReport.complaintId })
      .from(complaintReport)
      .where(eq(complaintReport.userId, userId))
    return db
      .select()
      .from(complaint)
      .where(inArray(complaint.id, ids))
      .orderBy(desc(complaint.lastReportedAt))
      .limit(100)
  },

  async listForAdmin(filters: {
    department?: string
    severities?: Severity[]
    statuses?: ComplaintStatus[]
    q?: string
    since?: Date
    needsReview?: boolean
  }): Promise<ComplaintRow[]> {
    const where: SQL[] = []
    if (filters.department) where.push(eq(complaint.department, filters.department))
    if (filters.severities?.length) where.push(inArray(complaint.severity, filters.severities))
    if (filters.statuses?.length) where.push(inArray(complaint.status, filters.statuses))
    if (filters.since) where.push(gte(complaint.createdAt, filters.since))
    if (filters.needsReview) where.push(eq(complaint.needsReview, true))
    if (filters.q) {
      const like = `%${filters.q}%`
      where.push(
        or(
          ilike(complaint.title, like),
          ilike(complaint.summary, like),
          ilike(complaint.address, like),
          ilike(complaint.reference, like),
        )!,
      )
    }
    return db
      .select()
      .from(complaint)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(complaint.priorityScore), desc(complaint.createdAt))
      .limit(500)
  },

  /** All complaints for dashboard aggregates (fine at hackathon scale). */
  async listForOverview(department?: string): Promise<ComplaintRow[]> {
    return db
      .select()
      .from(complaint)
      .where(department ? eq(complaint.department, department) : undefined)
  },

  async countMergedReports(department?: string): Promise<number> {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(complaintReport)
      .innerJoin(complaint, eq(complaintReport.complaintId, complaint.id))
      .where(
        and(
          ne(complaintReport.relation, 'original'),
          department ? eq(complaint.department, department) : undefined,
        ),
      )
    return row?.n ?? 0
  },
}
