import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';

/** AGENT_SPEC F24–F25. Stub: the holiday check isn't connected yet. */
export default function HolidaysPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <Heading level={1}>Holidays</Heading>
        <Text type="supporting">
          Deadlines and reminders skip holidays you confirm here. Chiron will propose dates from the
          Official Gazette and PCO, with links, on the first working day of each month and every
          Monday.
        </Text>
      </div>
      <Card>
        <EmptyState
          title="No holidays yet"
          description="The holiday check isn't connected yet. Until it is, Chiron counts Monday to Friday only and asks you to check start dates yourself."
        />
      </Card>
    </>
  );
}
