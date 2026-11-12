'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { DRAFT_STATUS_LABEL, formatDay } from '../../../lib/chiron-ui';
import type { DraftActionResponse } from '../../../api/drafts/[id]/route';

interface Props {
  draft: {
    id: string;
    title: string;
    status: string;
    toAddress: string;
    realRecipient: string;
    subject: string;
    body: string;
    blanks: string[];
    dueOn: string | null;
    version: number;
    editedByKarissa: boolean;
  };
  talent: { name: string; onboardingId: string } | null;
  approval: { decision: string; role: string; at: string; current: boolean } | null;
  canAct: boolean;
}

type Action = 'approve' | 'edit' | 'discard' | 'mark-sent';

/** Draft review (DESIGN_SYSTEM §4–5, D-017): approve, edit in place, discard, mark as sent. */
export function DraftReview({ draft: d, talent, approval, canAct }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(d.subject);
  const [body, setBody] = useState(d.body);
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const closed = ['sent', 'discarded', 'superseded'].includes(d.status);
  const status = DRAFT_STATUS_LABEL[d.status]!;
  // An approval only counts for the exact version, and never while a blank remains (D-019).
  const approvedNow = d.status === 'approved' && approval?.current && d.blanks.length === 0;

  async function act(action: Action) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/drafts/${d.id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(action === 'edit' ? { action, subject, body } : { action }),
      });
      const out = (await res.json()) as DraftActionResponse;
      if (!out.ok) {
        setError(out.error);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Couldn't save that. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(`Subject: ${d.subject}\n\n${d.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {talent && <Link href={`/onboarding/${talent.onboardingId}`}>{`← ${talent.name}`}</Link>}
        <div className="flex flex-wrap items-center gap-2">
          <Heading level={1}>{d.title}</Heading>
          <Badge variant={status.tone} label={status.label} />
          {d.dueOn && !closed && (
            <Badge variant="info" label={`Due ${formatDay(d.dueOn, false)}`} />
          )}
        </div>
        {d.editedByKarissa && (
          <Text type="supporting">You edited this draft (version {d.version}).</Text>
        )}
      </div>

      {approvedNow && (
        <Banner
          status="info"
          title="Approved. Send it yourself for now"
          description="Gmail isn't connected to Chiron yet. Copy the text, send it from your inbox, then press Mark as sent so the tracker moves on."
        />
      )}
      {d.status === 'approved' && d.blanks.length > 0 && (
        <Banner
          status="warning"
          title="Fill the blanks before this can go out"
          description="This draft was approved with blanks still in it. Press Edit, fill each [bracketed] item, then approve it again."
        />
      )}
      {d.status === 'sent' && (
        <Banner status="info" title="Sent" description="This draft is closed." />
      )}
      {!canAct && !closed && (
        <Banner
          status="warning"
          title="You can read this draft, but not approve it"
          description="Only Karissa or Mikki can approve, edit or discard Chiron's drafts."
        />
      )}
      {error && <Banner status="error" title="That didn't work" description={error} />}

      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Text>
              <strong>To:</strong> {d.toAddress}{' '}
              {d.toAddress !== d.realRecipient && (
                <Text type="supporting">[Real recipient: {d.realRecipient}]</Text>
              )}
            </Text>
            {!editing && (
              <Text>
                <strong>Subject:</strong> {d.subject}
              </Text>
            )}
          </div>

          {editing ? (
            <div className="flex flex-col gap-3">
              {d.status === 'approved' && (
                <Banner
                  status="warning"
                  title="Saving cancels your earlier approval"
                  description="You'll need to approve the edited version before it can be sent."
                />
              )}
              <TextInput label="Subject" value={subject} onChange={setSubject} />
              <TextArea label="Message" value={body} onChange={setBody} rows={18} />
            </div>
          ) : (
            <Card variant="muted" padding={3} className="whitespace-pre-wrap">
              <Text>{d.body}</Text>
            </Card>
          )}

          {d.blanks.length > 0 && !editing && (
            <div className="flex flex-wrap items-center gap-2">
              <Text type="supporting">Still blank:</Text>
              {d.blanks.map((b) => (
                <Badge key={b} variant="warning" label={b} />
              ))}
            </div>
          )}

          {!closed && canAct && (
            <div className="flex flex-wrap items-center gap-2">
              {editing ? (
                <>
                  <Button
                    label="Save changes"
                    variant="primary"
                    isLoading={busy === 'edit'}
                    onClick={() => act('edit')}
                  />
                  <Button
                    label="Cancel"
                    variant="secondary"
                    onClick={() => {
                      setEditing(false);
                      setSubject(d.subject);
                      setBody(d.body);
                    }}
                  />
                </>
              ) : (
                <>
                  {d.status === 'draft' && (
                    <Button
                      label="Approve"
                      variant="primary"
                      isDisabled={d.blanks.length > 0}
                      tooltip={d.blanks.length ? 'Fill the blanks first' : undefined}
                      isLoading={busy === 'approve'}
                      onClick={() => act('approve')}
                    />
                  )}
                  {approvedNow && (
                    <>
                      <Button
                        label={copied ? 'Copied' : 'Copy text'}
                        variant="primary"
                        onClick={copy}
                      />
                      <Button
                        label="Mark as sent"
                        variant="secondary"
                        isLoading={busy === 'mark-sent'}
                        onClick={() => act('mark-sent')}
                      />
                    </>
                  )}
                  <Button label="Edit" variant="secondary" onClick={() => setEditing(true)} />
                  <Button
                    label="Discard"
                    variant="ghost"
                    isLoading={busy === 'discard'}
                    onClick={() => act('discard')}
                  />
                </>
              )}
            </div>
          )}
          {d.status === 'draft' && canAct && !editing && (
            <Text type="supporting">
              {d.blanks.length
                ? `Fill the ${d.blanks.length === 1 ? 'blank' : `${d.blanks.length} blanks`} first: press Edit and replace each [bracketed] item. Nothing goes out with a blank in it.`
                : 'Approving covers this exact version. Gmail isn’t connected yet, so after approving you’ll send it yourself.'}
            </Text>
          )}
        </div>
      </Card>
    </>
  );
}
