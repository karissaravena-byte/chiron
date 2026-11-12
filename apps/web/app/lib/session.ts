import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { approverRoleFor, parseApprovers, type ApproverRole } from '@precast/shared/server';
import { getSignedInUser } from './auth';

export type SignedInUser = { id: string; email: string; name: string };

/** The signed-in person, or a redirect to sign-in. For server components. */
export async function requireUser(): Promise<SignedInUser> {
  const user = await getSignedInUser(await headers());
  if (!user) redirect('/sign-in');
  return user;
}

/** Karissa or Mikki, from the approver list (D-009); null for anyone else. */
export function approverRole(email: string | undefined | null): ApproverRole | null {
  return approverRoleFor(email, parseApprovers(process.env.CHIRON_APPROVERS));
}
