'use client';

import Link from 'next/link';
import { Badge } from '@astryxdesign/core/Badge';
import { Link as AxLink } from '@astryxdesign/core/Link';
import { Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';

export interface OnboardingTableRow extends Record<string, unknown> {
  id: string;
  talent: string;
  type: string;
  position: string;
  starts: string;
  nextStep: string;
  waiting: number;
  overdue: number;
}

/** D-018: a compact table, one row per Talent. */
export function OnboardingTable({ rows }: { rows: OnboardingTableRow[] }) {
  return (
    <Table<OnboardingTableRow>
      density="compact"
      dividers="rows"
      hasHover
      idKey="id"
      data={rows}
      columns={[
        {
          key: 'talent',
          header: 'Talent',
          renderCell: (r) => (
            <AxLink as={Link} href={`/onboarding/${r.id}`}>
              {r.talent}
            </AxLink>
          ),
        },
        { key: 'type', header: 'Type' },
        { key: 'position', header: 'Position' },
        { key: 'starts', header: 'Starts' },
        { key: 'nextStep', header: 'Next step' },
        {
          key: 'status',
          header: 'Status',
          renderCell: (r) => (
            <div className="flex flex-wrap gap-1">
              {r.overdue > 0 && <Badge variant="error" label={`${r.overdue} overdue`} />}
              {r.waiting > 0 && <Badge variant="warning" label={`${r.waiting} waiting for you`} />}
              {r.overdue === 0 && r.waiting === 0 && <Text type="supporting">On track</Text>}
            </div>
          ),
        },
      ]}
    />
  );
}
