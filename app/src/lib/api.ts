import { File } from 'expo-file-system';

import { authClient } from '@/lib/auth-client';
import type { ComplaintDetail, ComplaintSummary, SubmitResponse } from '@/lib/types';

/**
 * Typed calls to the urban.bee server. Every request carries the session
 * cookie that the auth client keeps in SecureStore.
 */

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Turns a server path like /api/media/… into a full URL the phone can load. */
export function mediaUrl(path: string): string {
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookie = await authClient.getCookie();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...init.headers },
    });
  } catch (error) {
    console.warn(`[api] ${init.method ?? 'GET'} ${path} failed:`, error);
    throw new ApiError(0, 'offline');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(res.status, body?.message ?? res.statusText);
  }
  return (await res.json()) as T;
}

export interface NewReport {
  photos: { uri: string; width?: number; height?: number }[];
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address: string | null;
  description: string;
  voice: { uri: string; durationMs: number } | null;
}

/** Multipart field names match the server's validator (web/server/validators/complaint.ts). */
export function sendReport(report: NewReport): Promise<SubmitResponse> {
  const form = new FormData();
  report.photos.forEach((photo, i) => {
    // Expo's fetch needs real File objects; the old { uri, name, type } parts are rejected.
    form.append('photos', new File(photo.uri), `photo-${i + 1}.jpg`);
  });
  form.append('latitude', String(report.latitude));
  form.append('longitude', String(report.longitude));
  if (report.accuracy != null) form.append('accuracy', String(Math.round(report.accuracy)));
  if (report.address) form.append('address', report.address);
  if (report.description.trim()) form.append('description', report.description.trim());
  if (report.voice) {
    const ext = report.voice.uri.split('.').pop()?.toLowerCase() ?? 'm4a';
    form.append('audio', new File(report.voice.uri), `voice.${ext}`);
    form.append('audioDurationMs', String(Math.round(report.voice.durationMs)));
  }
  return request<SubmitResponse>('/api/complaints', { method: 'POST', body: form });
}

export function getMyReports(): Promise<ComplaintSummary[]> {
  return request<ComplaintSummary[]>('/api/complaints/mine');
}

export function getReport(id: string): Promise<ComplaintDetail> {
  return request<ComplaintDetail>(`/api/complaints/${encodeURIComponent(id)}`);
}
