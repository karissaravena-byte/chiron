import { notFound } from 'next/navigation';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Heading } from '@astryxdesign/core/Heading';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { chironDb, getTalentPage } from '@precast/shared/server';
import {
  DRAFT_STATUS_LABEL,
  STEP_STATUS_LABEL,
  TALENT_TYPE_LABEL,
  formatDay,
  isClosedStep,
  manilaToday,
} from '../../../lib/chiron-ui';
import { requireUser } from '../../../lib/session';

const UUID = /^[0-9a-f-]{36}$/i;

export default async function TalentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ again?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { again } = await searchParams;
  if (!UUID.test(id)) notFound();
  const page = await getTalentPage(await chironDb(), id);
  if (!page) notFound();

  const { talent: t, onboarding: o, steps, drafts } = page;
  const today = manilaToday();
  const notes = o.prepNotes;
  const openDrafts = drafts.filter((d) => d.status === 'draft' || d.status === 'approved');
  const shownDrafts = drafts.filter((d) => d.status !== 'superseded');
  const stages = [...new Set(steps.map((s) => s.stage))];
  const blanks = [...new Set(openDrafts.flatMap((d) => d.blanks))];
  const open = [
    ...notes.missing.map((m) => `Missing: ${m}`),
    ...notes.flags,
    ...steps
      .filter((s) => s.status === 'to-confirm')
      .map((s) => `${s.label}: not yet decided for this type`),
    t.startDate
      ? `Holiday check isn't connected yet. Please check ${formatDay(t.startDate)} isn't a holiday.`
      : 'Start date not given.',
  ];

  return (
    <>
      {again && (
        <Banner
          status="info"
          title="Already prepared"
          description="This hire was already in the tracker, so Chiron opened it instead of drafting everything again."
        />
      )}

      <div className="flex flex-col gap-2">
        <Link href="/onboarding">← Onboarding</Link>
        <div className="flex flex-wrap items-center gap-2">
          <Heading level={1}>{t.nickname ? `${t.name} (${t.nickname})` : t.name}</Heading>
          <Badge
            variant="neutral"
            label={t.talentType ? TALENT_TYPE_LABEL[t.talentType]! : 'Type not given'}
          />
          {t.level && <Badge variant="neutral" label={`Level ${t.level}`} />}
          {t.source === 'test-hire' && <Badge variant="warning" label="Test data" />}
        </div>
        <Text type="supporting">
          {[
            t.position,
            t.groupName,
            t.startDate && `starts ${formatDay(t.startDate)}`,
            t.managerName && `manager ${t.managerName}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </div>

      {notes.flags.length > 0 && (
        <Banner
          status="warning"
          title="Please look at this"
          description={
            <ul className="list-disc pl-5">
              {notes.flags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          }
        />
      )}

      <section aria-labelledby="drafts" className="flex flex-col gap-3">
        <Heading level={2} id="drafts">
          Drafts
        </Heading>
        {shownDrafts.length === 0 ? (
          <Text type="supporting">No drafts yet.</Text>
        ) : (
          <ul className="flex flex-col gap-2">
            {shownDrafts.map((d) => {
              const s = DRAFT_STATUS_LABEL[d.status]!;
              return (
                <li key={d.id}>
                  <ClickableCard label={d.title} href={`/drafts/${d.id}`} padding={3}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <Text weight="semibold">{d.title}</Text>
                        <Text type="supporting">
                          For {d.realRecipient}
                          {d.blanks.length
                            ? ` · ${d.blanks.length} blank${d.blanks.length === 1 ? '' : 's'}`
                            : ''}
                        </Text>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {d.dueOn && !['sent', 'discarded'].includes(d.status) && (
                          <Badge
                            variant={d.dueOn < today ? 'error' : 'info'}
                            label={`Due ${formatDay(d.dueOn, false)}`}
                          />
                        )}
                        <Badge variant={s.tone} label={s.label} />
                      </div>
                    </div>
                  </ClickableCard>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Heading level={2}>Checklist</Heading>
            <Text type="supporting">
              From the checklist for this Talent&rsquo;s type. Confirm it before anything is sent.
            </Text>
          </div>
          {stages.map((stage) => (
            <div key={stage} className="flex flex-col gap-2">
              <Text weight="semibold">{stage}</Text>
              <ul className="flex flex-col gap-2">
                {steps
                  .filter((s) => s.stage === stage)
                  .map((s) => {
                    const overdue = s.dueOn && s.dueOn < today && !isClosedStep(s.status);
                    const label = overdue
                      ? { label: 'Overdue', tone: 'error' as const }
                      : STEP_STATUS_LABEL[s.status]!;
                    return (
                      <li key={s.id} className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col">
                          <Text>{s.label}</Text>
                          <Text type="supporting">
                            {s.detail}
                            {s.dueOn && !isClosedStep(s.status)
                              ? ` · due ${formatDay(s.dueOn, false)}`
                              : ''}
                          </Text>
                        </div>
                        <Badge variant={label.tone} label={label.label} />
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ['What Chiron drafted', shownDrafts.map((d) => d.title)],
              ['What you must verify', notes.verify],
              ['What is still blank', blanks],
              ["What's still open", open],
            ] as Array<[string, string[]]>
          ).map(([title, items]) => (
            <div key={title} className="flex flex-col gap-1">
              <Text weight="semibold">{title}</Text>
              {items.length ? (
                <ul className="list-disc pl-5">
                  {items.map((i) => (
                    <li key={i}>
                      <Text type="supporting">{i}</Text>
                    </li>
                  ))}
                </ul>
              ) : (
                <Text type="supporting">Nothing</Text>
              )}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
