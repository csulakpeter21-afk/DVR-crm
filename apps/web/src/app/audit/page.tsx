/**
 * The audit log (P1-01-T4).
 *
 * Append only, and it records refusals as well as successes. A compliance block
 * nobody can see afterwards is not a control, so a refused dial and a refused
 * transition appear here next to the transitions that went through.
 */
import { db } from '@devora/db';
import { Badge, Card, Eyebrow } from '@devora/ui';

export const dynamic = 'force-dynamic';

const REFUSAL = /refused/u;

export default async function AuditPage() {
  const entries = await db().auditLog.findMany({
    orderBy: { occurredAt: 'desc' },
    take: 60,
  });

  const outbox = await db().outboxEvent.findMany({
    orderBy: { occurredAt: 'desc' },
    take: 12,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--devora-space-5)' }}>
      <header>
        <Eyebrow>Compliance</Eyebrow>
        <h1 style={{ margin: '0.25rem 0 0', fontSize: 'var(--devora-text-2xl)' }}>Audit log</h1>
        <p style={{ margin: '0.375rem 0 0', color: 'var(--devora-ink-muted)', maxWidth: '44rem' }}>
          Every stage change and every refusal, with the actor and the reason. Written in the same
          transaction as the change it describes, so the two cannot disagree.
        </p>
      </header>

      <Card padded={false}>
        {entries.length === 0 ? (
          <p
            style={{
              margin: 0,
              padding: 'var(--devora-space-5)',
              color: 'var(--devora-ink-muted)',
            }}
          >
            Nothing yet. Run a call from the queue.
          </p>
        ) : (
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--devora-text-sm)' }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--devora-border)' }}>
                {['When', 'Action', 'From', 'To', 'Reason'].map((head) => (
                  <th
                    key={head}
                    scope="col"
                    style={{
                      padding: '0.625rem var(--devora-space-4)',
                      fontSize: 'var(--devora-text-xs)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--devora-ink-muted)',
                      fontWeight: 700,
                    }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const refused = REFUSAL.test(entry.action);
                return (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--devora-border)' }}>
                    <td
                      style={{
                        padding: '0.625rem var(--devora-space-4)',
                        color: 'var(--devora-ink-muted)',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {entry.occurredAt.toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td style={{ padding: '0.625rem var(--devora-space-4)' }}>
                      <Badge tone={refused ? 'critical' : 'neutral'}>
                        {refused ? 'refused' : 'committed'}
                      </Badge>{' '}
                      <code
                        style={{
                          fontFamily: 'var(--devora-font-mono)',
                          fontSize: 'var(--devora-text-xs)',
                        }}
                      >
                        {entry.action}
                      </code>
                    </td>
                    <td
                      style={{
                        padding: '0.625rem var(--devora-space-4)',
                        color: 'var(--devora-ink-secondary)',
                      }}
                    >
                      {entry.fromValue ?? '—'}
                    </td>
                    <td
                      style={{
                        padding: '0.625rem var(--devora-space-4)',
                        color: 'var(--devora-ink-secondary)',
                      }}
                    >
                      {entry.toValue ?? '—'}
                    </td>
                    <td
                      style={{
                        padding: '0.625rem var(--devora-space-4)',
                        color: 'var(--devora-ink-muted)',
                      }}
                    >
                      {entry.reasonCode ?? ''}
                      {entry.detail ? (
                        <span style={{ display: 'block', fontSize: 'var(--devora-text-xs)' }}>
                          {entry.detail}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <Eyebrow>Outbox, most recent</Eyebrow>
        <p
          style={{
            margin: '0.375rem 0 var(--devora-space-3)',
            fontSize: 'var(--devora-text-sm)',
            color: 'var(--devora-ink-muted)',
          }}
        >
          Events waiting for the worker to dispatch. Each carries an idempotency key, so a consumer
          that has seen one already does nothing.
        </p>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--devora-space-2)',
          }}
        >
          {outbox.map((event) => (
            <li key={event.id}>
              <Badge tone={event.dispatchedAt ? 'positive' : 'accent'}>{event.name}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
