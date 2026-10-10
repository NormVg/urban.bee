/**
 * The parts of the server's API contract the citizen app reads
 * (mirrors web/shared/types/complaint.ts; keep the two in step).
 */

export type ComplaintStatus = 'received' | 'triaged' | 'in_progress' | 'resolved' | 'rejected';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type ReportRelation = 'original' | 'duplicate' | 'extension';
export type SubmitOutcome = 'created' | 'merged' | 'extended' | 'already_reported';

export interface ComplaintSummary {
  id: string;
  reference: string;
  status: ComplaintStatus;
  department: string;
  departmentLabel: string;
  categoryLabel: string;
  priority: Priority;
  title: string;
  summary: string;
  address: string | null;
  latitude: number;
  longitude: number;
  coverPhotoUrl: string;
  photoCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintPhoto {
  id: string;
  url: string;
  reportId: string;
  relation: ReportRelation;
}

export interface ComplaintReport {
  id: string;
  relation: ReportRelation;
  description: string | null;
  photoUrls: string[];
  audioUrl: string | null;
  audioDurationMs: number | null;
  transcript: string | null;
  address: string | null;
  createdAt: string;
  isMine: boolean;
}

export interface ComplaintEvent {
  id: string;
  type: 'created' | 'triaged' | 'merged' | 'extended' | 'status_changed';
  toStatus: ComplaintStatus | null;
  createdAt: string;
}

export interface ComplaintDetail extends ComplaintSummary {
  photos: ComplaintPhoto[];
  reports: ComplaintReport[];
  events: ComplaintEvent[];
}

export interface SubmitResponse {
  outcome: SubmitOutcome;
  complaint: ComplaintDetail;
  reportId: string | null;
}
