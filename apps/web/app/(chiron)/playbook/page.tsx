import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';

/** AGENT_SPEC F38–F39, D-007. Stub: the playbook still lives in code. */
export default function PlaybookPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <Heading level={1}>Playbook</Heading>
        <Text type="supporting">
          The checklists, templates and 1:1 contact list Chiron works from. After each finished
          onboarding, Chiron will propose one improvement here for you to approve or reject.
        </Text>
      </div>
      <Card>
        <EmptyState
          title="Your templates aren't loaded yet"
          description="Chiron is using its built-in checklist and sample wording for now. Your own checklist by type, request templates, welcome emails and 1:1 contact list come next."
        />
      </Card>
    </>
  );
}
