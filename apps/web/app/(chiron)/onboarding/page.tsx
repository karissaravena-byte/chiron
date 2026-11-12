import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { chironDb, listOnboardings } from '@precast/shared/server';
import { TALENT_TYPE_LABEL, formatDay } from '../../lib/chiron-ui';
import { TEST_HIRES } from '../../lib/test-hires';
import { OnboardingTable } from './OnboardingTable';
import { TestHirePanel } from './TestHirePanel';

export default async function OnboardingPage() {
  const rows = await listOnboardings(await chironDb());
  const tableRows = rows.map((r) => ({
    id: r.onboardingId,
    talent: r.talent,
    type: r.talentType ? (TALENT_TYPE_LABEL[r.talentType] ?? r.talentType) : 'Type not given',
    position: r.position ?? '',
    starts: formatDay(r.startDate, false),
    nextStep: r.status === 'complete' ? 'Complete' : (r.nextStep ?? 'Nothing open'),
    waiting: r.waitingForYou,
    overdue: r.overdue,
  }));

  return (
    <>
      <div className="flex flex-col gap-1">
        <Heading level={1}>Onboarding</Heading>
        <Text type="supporting">Every Talent Chiron is onboarding, soonest start first.</Text>
      </div>

      <Card padding={0}>
        {tableRows.length ? (
          <OnboardingTable rows={tableRows} />
        ) : (
          <EmptyState
            title="No one is being onboarded yet"
            description="When Argus hands over a confirmed hire, they appear here. Until then, try a test hire below."
          />
        )}
      </Card>

      <section aria-labelledby="test-hires" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Heading level={2} id="test-hires">
            Try a test hire
          </Heading>
          <Badge variant="warning" label="Test data" />
        </div>
        <Text type="supporting">
          Argus isn&rsquo;t connected yet. These fictional hires stand in for its handoff, each one
          showing a different rule. Sending one again opens the one already prepared.
        </Text>
        <TestHirePanel
          hires={TEST_HIRES.map((h) => ({
            id: h.id,
            name: `${h.details.nickname ?? h.details.firstName} ${h.details.lastName}`,
            type: h.details.talentType ? TALENT_TYPE_LABEL[h.details.talentType]! : '',
            line: `${h.details.position} · starts ${formatDay(h.details.startDate, false)}`,
            scenario: h.scenario,
          }))}
        />
      </section>
    </>
  );
}
