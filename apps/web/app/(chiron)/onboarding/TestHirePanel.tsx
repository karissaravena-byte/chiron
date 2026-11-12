'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { SelectableCard } from '@astryxdesign/core/SelectableCard';
import { Text } from '@astryxdesign/core/Text';
import type { HandoffResponse } from '../../api/onboarding/handoff/route';

interface HireOption {
  id: string;
  name: string;
  type: string;
  line: string;
  scenario: string;
}

/** Sends a test hire to Chiron as if Argus had, then opens that Talent's page. */
export function TestHirePanel({ hires }: { hires: HireOption[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(hires[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding/handoff', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hireId: selected }),
      });
      const body = (await res.json()) as HandoffResponse;
      if (!body.ok) {
        setError(body.error);
        setBusy(false);
        return;
      }
      router.push(`/onboarding/${body.onboardingId}${body.alreadyPrepared ? '?again=1' : ''}`);
      router.refresh();
    } catch {
      setError("Couldn't reach Chiron. Check that it's running and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {hires.map((h) => (
          <SelectableCard
            key={h.id}
            label={h.name}
            isSelected={selected === h.id}
            onChange={() => setSelected(h.id)}
            padding={3}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <Text weight="semibold">{h.name}</Text>
                {h.type && <Badge variant="neutral" label={h.type} />}
              </div>
              <Text type="supporting">{h.line}</Text>
              <Text type="supporting">{h.scenario}</Text>
            </div>
          </SelectableCard>
        ))}
      </div>
      {error && (
        <Banner status="error" title="Chiron couldn't prepare this hire" description={error} />
      )}
      <div className="flex items-center gap-3">
        <Button
          label={busy ? 'Chiron is preparing…' : 'Send handoff to Chiron'}
          variant="primary"
          isLoading={busy}
          isDisabled={busy || !selected}
          onClick={send}
        />
        {busy && (
          <Text type="supporting">Checking details, drafting and saving. About 10 seconds.</Text>
        )}
      </div>
    </div>
  );
}
