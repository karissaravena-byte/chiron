import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { chironDb, listWaitingForYou } from '@precast/shared/server';
import { DRAFT_STATUS_LABEL, formatDay, manilaToday } from '../lib/chiron-ui';
import { requireUser } from '../lib/session';

/** Home (D-016): one queue of everything that needs Karissa. Oldest deadline first. */
export default async function WaitingForYou() {
  await requireUser();
  const { drafts, holidays } = await listWaitingForYou(await chironDb());
  const today = manilaToday();

  return (
    <>
      <div className="flex flex-col gap-1">
        <Heading level={1}>Waiting for you</Heading>
        <Text type="supporting">
          Everything Chiron has prepared that needs your yes. Nothing on this list has been sent.
        </Text>
      </div>

      {holidays > 0 && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text>
              {holidays} proposed holiday{holidays === 1 ? '' : 's'} to confirm
            </Text>
            <Button label="Review holidays" variant="secondary" href="/holidays" />
          </div>
        </Card>
      )}

      {drafts.length === 0 ? (
        <Card>
          <EmptyState
            title="Nothing waiting for you"
            description="When Chiron prepares a new hire, their drafts show up here for your approval."
            actions={<Button label="Go to onboarding" variant="secondary" href="/onboarding" />}
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Drafts waiting for you">
          {drafts.map((d) => {
            const status = DRAFT_STATUS_LABEL[d.status]!;
            const overdue = d.dueOn && d.dueOn < today;
            return (
              <li key={d.draftId}>
                <ClickableCard
                  label={`${d.title} for ${d.talent}`}
                  href={`/drafts/${d.draftId}`}
                  padding={4}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Text weight="semibold">{d.title}</Text>
                      <div className="flex flex-wrap gap-2">
                        {d.dueOn && (
                          <Badge
                            variant={overdue ? 'error' : 'info'}
                            label={
                              overdue
                                ? `Overdue since ${formatDay(d.dueOn, false)}`
                                : `Due ${formatDay(d.dueOn, false)}`
                            }
                          />
                        )}
                        <Badge variant={status.tone} label={status.label} />
                      </div>
                    </div>
                    <Text type="supporting">
                      {d.talent} · for {d.realRecipient}
                      {d.blanks > 0
                        ? ` · ${d.blanks} blank${d.blanks === 1 ? '' : 's'} to fill`
                        : ''}
                    </Text>
                  </div>
                </ClickableCard>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
