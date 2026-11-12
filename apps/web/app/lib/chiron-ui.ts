/**
 * Chiron's one status vocabulary on screen (DESIGN_SYSTEM §3). Browser-safe: no database code.
 */
export type BadgeTone = 'info' | 'neutral' | 'warning' | 'success' | 'error';

export const STEP_STATUS_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pending', tone: 'info' },
  drafted: { label: 'Waiting for you', tone: 'warning' },
  'awaiting-approval': { label: 'Waiting for you', tone: 'warning' },
  sent: { label: 'Sent', tone: 'success' },
  'waiting-on-others': { label: 'Waiting on others', tone: 'neutral' },
  done: { label: 'Done', tone: 'success' },
  'n-a': { label: 'N/A', tone: 'neutral' },
  'to-confirm': { label: 'To confirm', tone: 'warning' },
};

export const DRAFT_STATUS_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Needs your approval', tone: 'warning' },
  approved: { label: 'Approved: send it yourself', tone: 'info' },
  sent: { label: 'Sent', tone: 'success' },
  discarded: { label: 'Discarded', tone: 'neutral' },
  superseded: { label: 'Replaced', tone: 'neutral' },
};

export const TALENT_TYPE_LABEL: Record<string, string> = {
  employee: 'Employee',
  consultant: 'Consultant',
  'project-based': 'Project-based',
  intern: 'Intern',
};

/** "Tue, Dec 1, 2026" from YYYY-MM-DD. */
export function formatDay(iso: string | null | undefined, withYear = true): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  });
}

/** Today in Manila as YYYY-MM-DD. */
export function manilaToday(): string {
  return new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
}

export const isClosedStep = (status: string) => ['done', 'n-a', 'sent'].includes(status);
