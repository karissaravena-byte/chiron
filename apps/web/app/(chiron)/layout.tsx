import type { ReactNode } from 'react';
import { PILOT, chironDb, listWaitingForYou } from '@precast/shared/server';
import { requireUser } from '../lib/session';
import { log } from '../lib/logger';
import { ChironShell } from './ChironShell';

/**
 * Every Chiron screen needs sign-in; the side menu shows how much is waiting. Next renders a
 * layout and its page in parallel, so this check does not protect a page: each page that reads
 * the tracker calls `requireUser()` itself first (guarded by test/chiron-pages-auth.spec.ts).
 */
export default async function ChironLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  let waiting = 0;
  try {
    const q = await listWaitingForYou(await chironDb());
    waiting = q.drafts.length + q.holidays;
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'tracker unavailable for the menu count');
  }
  return (
    <ChironShell
      email={user.email}
      waiting={waiting}
      pilot={{ on: PILOT.on, recipient: PILOT.recipient }}
    >
      {children}
    </ChironShell>
  );
}
