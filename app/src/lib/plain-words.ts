import type { ComplaintStatus, Priority, SubmitOutcome } from '@/lib/types';
import { Brand } from '@/constants/theme';
import type { IconName } from '@/components/ui/icon';

/**
 * Every status, urgency and outcome the citizen sees, in plain words
 * (PLAN.md §12.1). No codes, no jargon.
 */

export interface StatusWords {
  /** Short chip label */
  chip: string;
  /** Full sentence for the status screen */
  sentence: string;
  color: string;
  tint: string;
  icon: IconName;
}

export const STATUS_WORDS: Record<ComplaintStatus, StatusWords> = {
  received: {
    chip: 'Sent',
    sentence: 'We’ve got your report',
    color: Brand.blue,
    tint: Brand.blueTint,
    icon: 'send',
  },
  triaged: {
    chip: 'Seen',
    sentence: 'The team has seen it',
    color: Brand.blue,
    tint: Brand.blueTint,
    icon: 'eye',
  },
  in_progress: {
    chip: 'Being fixed',
    sentence: 'Work has started',
    color: Brand.warning,
    tint: Brand.warningTint,
    icon: 'tool',
  },
  resolved: {
    chip: 'Fixed',
    sentence: 'Fixed. Thank you for helping your city',
    color: Brand.success,
    tint: Brand.successTint,
    icon: 'check-circle',
  },
  rejected: {
    chip: 'Closed',
    sentence: 'We couldn’t act on this one',
    color: Brand.ink2,
    tint: 'rgba(36, 28, 19, 0.08)',
    icon: 'x-circle',
  },
};

/** Fixed or turned down: nothing left for the city to do. These move to "Completed". */
export function isClosed(status: ComplaintStatus): boolean {
  return status === 'resolved' || status === 'rejected';
}

/** The four steps of the progress dots on the status screen. */
export const PROGRESS_STEPS = ['Sent', 'Seen', 'Being fixed', 'Fixed'] as const;

export function progressIndex(status: ComplaintStatus): number {
  switch (status) {
    case 'received':
      return 0;
    case 'triaged':
      return 1;
    case 'in_progress':
      return 2;
    case 'resolved':
      return 3;
    case 'rejected':
      return 1;
  }
}

export const URGENCY_WORDS: Record<Priority, { label: string; when: string; color: string; tint: string }> = {
  P1: { label: 'Urgent', when: 'within a few hours', color: Brand.danger, tint: Brand.dangerTint },
  P2: { label: 'High', when: 'within a day', color: Brand.orangeStrong, tint: Brand.orangeTint },
  P3: { label: 'Normal', when: 'within 3 days', color: Brand.blue, tint: Brand.blueTint },
  P4: { label: 'Low', when: 'within a week', color: Brand.ink2, tint: 'rgba(36, 28, 19, 0.08)' },
};

/** "Roads & Transport" → "Roads & Transport team" for sentences. */
export function teamName(departmentLabel: string): string {
  return `${departmentLabel} team`;
}

export function outcomeWords(
  outcome: SubmitOutcome,
  opts: { departmentLabel: string; priority: Priority; reportedOn?: string },
): { title: string; body: string } {
  const team = teamName(opts.departmentLabel);
  const urgency = URGENCY_WORDS[opts.priority];
  switch (outcome) {
    case 'created':
      return {
        title: 'Thank you!',
        body:
          opts.priority === 'P1'
            ? `Your report is with the ${team}. This looks urgent, so they aim to look at it ${urgency.when}.`
            : `Your report is with the ${team}. They aim to look at it ${urgency.when}.`,
      };
    case 'merged':
      return {
        title: 'Thank you!',
        body: 'Others have reported this too. We’ve added your photo, which helps it get fixed sooner.',
      };
    case 'extended':
      return {
        title: 'Thank you!',
        body: 'This is part of a problem we already know about. We’ve added this spot so the team sees how far it goes.',
      };
    case 'already_reported':
      return {
        title: 'You’re already on it',
        body: opts.reportedOn
          ? `You told us about this on ${opts.reportedOn}. The ${team} has it.`
          : `You’ve already told us about this. The ${team} has it.`,
      };
  }
}

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

export function formatDay(iso: string): string {
  return DATE.format(new Date(iso));
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return `on ${formatDay(iso)}`;
}

/** "Can't connect" and similar, from any thrown error. */
export function problemMessage(error: unknown): string {
  const status = (error as { status?: number } | null)?.status;
  if (status === 0) return 'We can’t reach urban.bee right now. Check your internet and try again.';
  if (status === 401) return 'Please sign in again to continue.';
  if (status === 413) return 'Those photos are too large to send. Try one or two photos.';
  return 'Something went wrong on our side. Please try again.';
}
