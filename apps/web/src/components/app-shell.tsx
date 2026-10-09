/**
 * The application shell (P1-05-T2).
 *
 * Navigation is scoped per role. Only the rep sections are built; the rest are
 * listed and marked so the shape of the product is visible and nobody wonders
 * whether a screen is missing or merely unbuilt.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';

import { currentUser } from '../lib/session.ts';

interface NavItem {
  readonly label: string;
  readonly href?: string;
  readonly phase?: string;
}

const NAV: readonly { readonly group: string; readonly items: readonly NavItem[] }[] = [
  {
    group: 'Rep',
    items: [
      { label: 'Call queue', href: '/queue' },
      { label: 'Day progress', phase: 'P2' },
    ],
  },
  {
    group: 'Qualifier',
    items: [
      { label: 'Meetings', phase: 'P3' },
      { label: 'Briefs', phase: 'P3' },
    ],
  },
  {
    group: 'Growth',
    items: [
      { label: 'ICP and signals', phase: 'P2' },
      { label: 'Experiments', phase: 'P3' },
      { label: 'Dashboards', phase: 'P3' },
    ],
  },
  {
    group: 'Compliance',
    items: [
      { label: 'Country rules', phase: 'P1' },
      { label: 'Suppression', phase: 'P1' },
      { label: 'Audit log', href: '/audit' },
    ],
  },
];

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await currentUser();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav
        aria-label="Main"
        style={{
          width: '15rem',
          flexShrink: 0,
          borderRight: '1px solid var(--devora-border)',
          background: 'var(--devora-surface)',
          padding: 'var(--devora-space-5) var(--devora-space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--devora-space-6)',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--devora-font-serif)',
              fontSize: 'var(--devora-text-md)',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            Devora
          </p>
          <p
            style={{
              margin: '0.0625rem 0 0',
              fontSize: 'var(--devora-text-xs)',
              color: 'var(--devora-ink-muted)',
            }}
          >
            Sales Engine
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--devora-space-5)' }}>
          {NAV.map((section) => (
            <div key={section.group}>
              <p
                style={{
                  margin: '0 0 var(--devora-space-2)',
                  fontSize: 'var(--devora-text-xs)',
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: 'var(--devora-ink-faint)',
                }}
              >
                {section.group}
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.125rem',
                }}
              >
                {section.items.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        style={{
                          display: 'block',
                          padding: '0.3125rem 0.5rem',
                          borderRadius: 'var(--devora-radius-sm)',
                          fontSize: 'var(--devora-text-sm)',
                          color: 'var(--devora-ink-secondary)',
                          textDecoration: 'none',
                        }}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.3125rem 0.5rem',
                          fontSize: 'var(--devora-text-sm)',
                          color: 'var(--devora-ink-faint)',
                        }}
                      >
                        {item.label}
                        <span
                          style={{
                            fontSize: 'var(--devora-text-xs)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {item.phase}
                        </span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 'auto',
            borderTop: '1px solid var(--devora-border)',
            paddingTop: 'var(--devora-space-3)',
          }}
        >
          <p style={{ margin: 0, fontSize: 'var(--devora-text-sm)', fontWeight: 600 }}>
            {user.displayName}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--devora-text-xs)',
              color: 'var(--devora-ink-muted)',
            }}
          >
            Signed in as {user.role.replace(/_/gu, ' ')}
          </p>
        </div>
      </nav>

      <main
        style={{ flex: 1, minWidth: 0, padding: 'var(--devora-space-6) var(--devora-space-6)' }}
      >
        <div style={{ maxWidth: 'var(--devora-max-width)', margin: '0 auto' }}>{children}</div>
      </main>
    </div>
  );
}
