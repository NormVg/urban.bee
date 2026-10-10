import { sql } from 'drizzle-orm'
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import type { ComplaintStatus, Severity } from '../../shared/triage/taxonomy'
import type { Hazards, Priority } from '../../shared/triage/priority'
import type {
  ComplaintEventType,
  MatchReason,
  ReportRelation,
  TraceStep,
} from '../../shared/types/complaint'

/**
 * Better Auth tables (email + password, no plugins).
 * Shape is the documented Better Auth schema for Drizzle/Postgres —
 * keep column names/types in sync when plugins are added
 * (re-run schema generation after adding any plugin).
 */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/* ============================================================
   Civic complaint triage (see PLAN.md §7)
   One real-world issue = one `complaint`; every citizen submission is a
   `complaint_report` (original, duplicate or extension) with 1–4 photos.
   ============================================================ */

export const complaint = pgTable(
  'complaint',
  {
    id: text('id').primaryKey(),
    reference: text('reference').notNull().unique(),
    reporterId: text('reporter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').$type<ComplaintStatus>().notNull().default('received'),
    department: text('department').notNull(),
    category: text('category').notNull(),
    severity: text('severity').$type<Severity>().notNull(),
    priorityScore: integer('priority_score').notNull(),
    priority: text('priority').$type<Priority>().notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    suggestedAction: text('suggested_action'),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    hazards: jsonb('hazards').$type<Hazards>().notNull(),
    needsReview: boolean('needs_review').notNull().default(false),
    aiConfidence: real('ai_confidence'),
    aiProvider: text('ai_provider').notNull(),
    aiTrace: jsonb('ai_trace').$type<TraceStep[]>().notNull().default([]),
    aiRaw: jsonb('ai_raw').$type<Record<string, unknown>>(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    centerLat: doublePrecision('center_lat').notNull(),
    centerLng: doublePrecision('center_lng').notNull(),
    extentM: real('extent_m').notNull().default(0),
    address: text('address'),
    coverPhotoKey: text('cover_photo_key').notNull(),
    reportCount: integer('report_count').notNull().default(1),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    triagedAt: timestamp('triaged_at'),
    resolvedAt: timestamp('resolved_at'),
    lastReportedAt: timestamp('last_reported_at').notNull().defaultNow(),
  },
  (t) => [
    index('complaint_status_idx').on(t.status),
    index('complaint_dept_status_idx').on(t.department, t.status),
    index('complaint_created_idx').on(t.createdAt),
    index('complaint_center_idx').on(t.centerLat, t.centerLng),
  ],
)

export const complaintReport = pgTable(
  'complaint_report',
  {
    id: text('id').primaryKey(),
    complaintId: text('complaint_id')
      .notNull()
      .references(() => complaint.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    relation: text('relation').$type<ReportRelation>().notNull(),
    description: text('description'),
    photoCount: integer('photo_count').notNull(),
    audioKey: text('audio_key'),
    audioDurationMs: integer('audio_duration_ms'),
    transcript: text('transcript'),
    transcriptLanguage: text('transcript_language'),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    accuracyM: real('accuracy_m'),
    address: text('address'),
    matchReason: text('match_reason').$type<MatchReason>(),
    matchScore: real('match_score'),
    distanceM: real('distance_m'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    // The database itself refuses a second same-issue report from one account.
    uniqueIndex('complaint_report_one_per_user')
      .on(t.complaintId, t.userId)
      .where(sql`${t.relation} <> 'extension'`),
    index('complaint_report_user_idx').on(t.userId),
    index('complaint_report_complaint_idx').on(t.complaintId),
  ],
)

export const complaintPhoto = pgTable(
  'complaint_photo',
  {
    id: text('id').primaryKey(),
    reportId: text('report_id')
      .notNull()
      .references(() => complaintReport.id, { onDelete: 'cascade' }),
    complaintId: text('complaint_id')
      .notNull()
      .references(() => complaint.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    hash: text('hash').notNull(),
    contentType: text('content_type').notNull(),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('complaint_photo_hash_idx').on(t.hash),
    index('complaint_photo_complaint_idx').on(t.complaintId),
  ],
)

export const complaintEvent = pgTable(
  'complaint_event',
  {
    id: text('id').primaryKey(),
    complaintId: text('complaint_id')
      .notNull()
      .references(() => complaint.id, { onDelete: 'cascade' }),
    type: text('type').$type<ComplaintEventType>().notNull(),
    fromStatus: text('from_status').$type<ComplaintStatus>(),
    toStatus: text('to_status').$type<ComplaintStatus>(),
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('complaint_event_complaint_idx').on(t.complaintId, t.createdAt)],
)
