import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Text } from '@astryxdesign/core/Text';
import { PILOT } from '@precast/shared/server';
import { approverRole, requireUser } from '../../lib/session';

const CONNECTORS: Array<[string, string]> = [
  ['Gmail (as chiron@917ventures.com)', 'Not connected: you send approved drafts yourself'],
  ['Google Calendar', 'Not connected: schedules are proposed without checking calendars'],
  ['Slack', 'Not connected: updates are shown here instead'],
  ['Argus', 'Not connected: use a test hire'],
  ['Manpower Masterlist', 'Not connected'],
];

export default async function SettingsPage() {
  const user = await requireUser();
  const role = approverRole(user.email);
  return (
    <>
      <div className="flex flex-col gap-1">
        <Heading level={1}>Settings</Heading>
        <Text type="supporting">How Chiron is set up right now.</Text>
      </div>
      <Card>
        <MetadataList title="Pilot and approvals" columns="single">
          <MetadataListItem label="Pilot mode">
            {PILOT.on
              ? `On: every draft goes to ${PILOT.recipient}. Turning it off needs both Karissa and Rase to confirm, which isn't built yet.`
              : 'Off'}
          </MetadataListItem>
          <MetadataListItem label="You">
            {role
              ? `An approver (${role === 'karissa' ? 'Karissa' : 'Mikki'})`
              : 'Not an approver: you can read drafts but not approve them'}
          </MetadataListItem>
        </MetadataList>
      </Card>
      <Card>
        <MetadataList title="Connections" columns="single">
          {CONNECTORS.map(([name, state]) => (
            <MetadataListItem key={name} label={name}>
              {state}
            </MetadataListItem>
          ))}
        </MetadataList>
      </Card>
    </>
  );
}
