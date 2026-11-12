'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from '@astryxdesign/core/AppShell';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { Text } from '@astryxdesign/core/Text';
import { authClient } from '../lib/auth-client';

const NAV = [
  {
    href: '/',
    label: 'Waiting for you',
    match: (p: string) => p === '/' || p.startsWith('/drafts'),
  },
  { href: '/onboarding', label: 'Onboarding', match: (p: string) => p.startsWith('/onboarding') },
  { href: '/holidays', label: 'Holidays', match: (p: string) => p.startsWith('/holidays') },
  { href: '/playbook', label: 'Playbook', match: (p: string) => p.startsWith('/playbook') },
  { href: '/settings', label: 'Settings', match: (p: string) => p.startsWith('/settings') },
];

const LATER = ['Offboarding', 'Manpower'];

/** The app frame (DESIGN_SYSTEM §4, D-015): side menu on desktop, menu button on phones. */
export function ChironShell({
  email,
  waiting,
  pilot,
  children,
}: {
  email: string;
  waiting: number;
  pilot: { on: boolean; recipient: string };
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '/';

  const nav = (
    <SideNav
      header={<SideNavHeading heading="Chiron" subheading="917V People Ops" />}
      footer={
        <div className="flex flex-col gap-2 p-2">
          <Text type="supporting">{email}</Text>
          <div>
            <Button
              label="Sign out"
              variant="ghost"
              size="sm"
              onClick={() =>
                void authClient.signOut().then(() => window.location.assign('/sign-in'))
              }
            />
          </div>
        </div>
      }
    >
      <SideNavSection title="Work" isHeaderHidden>
        {NAV.map((item) => (
          <SideNavItem
            key={item.href}
            as={Link}
            href={item.href}
            label={item.label}
            isSelected={item.match(pathname)}
            endContent={
              item.href === '/' && waiting > 0 ? (
                <Badge variant="warning" label={String(waiting)} />
              ) : undefined
            }
          />
        ))}
      </SideNavSection>
      <SideNavSection title="Coming later">
        {LATER.map((label) => (
          <SideNavItem key={label} label={label} isDisabled />
        ))}
      </SideNavSection>
    </SideNav>
  );

  return (
    <AppShell
      sideNav={nav}
      mobileNav={{ hasToggle: true }}
      contentPadding={0}
      banner={
        pilot.on ? (
          <Banner
            status="info"
            title="Pilot mode is on"
            description={`Every draft is addressed to you (${pilot.recipient}); the real recipient is shown in brackets. Nothing goes out unless you send it.`}
          />
        ) : undefined
      }
    >
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">{children}</main>
    </AppShell>
  );
}
