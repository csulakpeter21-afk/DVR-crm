/**
 * The rep call queue (P1-05-T3).
 *
 * The plan's rule is one screen, one next action. So the top lead gets the only
 * primary button on the page; everything below it is a quiet link. A rep who
 * reads nothing and presses the obvious button is doing the right thing.
 */
import { Badge, Card, Eyebrow, LiveDot, Stat, buttonStyle } from '@devora/ui';
import Link from 'next/link';

import { repProgress, repQueue, type QueueRow } from '../../lib/queue.ts';
import { currentUser } from '../../lib/session.ts';

export const dynamic = 'force-dynamic';

const scoreTone = (score: number) =>
  score >= 80 ? 'positive' : score >= 65 ? 'accent' : 'neutral';

function QueueEntry({ row, rank }: { row: QueueRow; rank: number }) {
  const top = rank === 0;

  return (
    <Card
      as="li"
      style={{
        padding: 'var(--devora-space-5)',
        borderColor: top ? 'var(--devora-accent)' : 'var(--devora-border)',
        boxShadow: top ? 'var(--devora-shadow)' : 'var(--devora-shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--devora-space-5)', alignItems: 'flex-start' }}>
        <div
          aria-hidden="true"
          style={{
            fontFamily: 'var(--devora-font-serif)',
            fontSize: 'var(--devora-text-lg)',
            color: 'var(--devora-ink-faint)',
            width: '1.5rem',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.3,
          }}
        >
          {rank + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--devora-space-3)',
              flexWrap: 'wrap',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 'var(--devora-text-md)' }}>{row.companyName}</h2>
            <span style={{ fontSize: 'var(--devora-text-xs)', color: 'var(--devora-ink-faint)' }}>
              {row.companyDomain}
            </span>
            <Badge
              tone={scoreTone(row.icpScore)}
              title="ICP score, with its factors on the lead screen"
            >
              ICP {row.icpScore}
            </Badge>
            {row.stage !== 'queued' ? (
              <Badge tone="caution">
                <LiveDot /> {row.stage}
              </Badge>
            ) : null}
          </div>

          <p
            style={{
              margin: '0.25rem 0 0',
              fontSize: 'var(--devora-text-sm)',
              color: 'var(--devora-ink-secondary)',
            }}
          >
            {row.contactName}, {row.jobTitle}
          </p>

          {row.hook ? (
            <p
              style={{
                margin: 'var(--devora-space-3) 0 0',
                fontFamily: 'var(--devora-font-serif)',
                fontSize: 'var(--devora-text-base)',
                color: 'var(--devora-ink)',
                lineHeight: 1.45,
              }}
            >
              {row.hook}
            </p>
          ) : null}

          <div
            style={{
              display: 'flex',
              gap: 'var(--devora-space-4)',
              marginTop: 'var(--devora-space-3)',
              flexWrap: 'wrap',
              fontSize: 'var(--devora-text-xs)',
              color: 'var(--devora-ink-muted)',
            }}
          >
            <span>
              {row.signalCount} signal{row.signalCount === 1 ? '' : 's'}
              {row.freshestSignalDays !== null ? `, freshest ${row.freshestSignalDays}d old` : ''}
            </span>
            <span>
              {row.country}, {row.localTimeLabel}
            </span>
            <span>
              {row.attemptCount} attempt{row.attemptCount === 1 ? '' : 's'}
            </span>
          </div>

          {!row.window.callable ? (
            <p
              style={{
                margin: 'var(--devora-space-3) 0 0',
                fontSize: 'var(--devora-text-xs)',
                color: 'var(--devora-caution)',
                background: 'var(--devora-caution-soft)',
                padding: '0.375rem 0.5rem',
                borderRadius: 'var(--devora-radius-sm)',
              }}
            >
              Cannot call now. {row.window.reason}
            </p>
          ) : null}
        </div>

        <div style={{ flexShrink: 0 }}>
          <Link
            href={`/leads/${row.id}`}
            style={buttonStyle(top ? 'primary' : 'secondary', top ? 'lg' : 'md')}
          >
            {top ? 'Open and call' : 'Open'}
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default async function QueuePage() {
  const user = await currentUser();
  const [rows, progress] = await Promise.all([repQueue(user.id), repProgress(user.id)]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--devora-space-6)' }}>
      <header>
        <Eyebrow>Rep workspace</Eyebrow>
        <h1 style={{ margin: '0.25rem 0 0', fontSize: 'var(--devora-text-2xl)' }}>Call queue</h1>
        <p style={{ margin: '0.375rem 0 0', color: 'var(--devora-ink-muted)', maxWidth: '42rem' }}>
          Ordered by ICP score, signal freshness and calling window. Work from the top.
        </p>
      </header>

      <Card>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 'var(--devora-space-5)',
          }}
        >
          <Stat label="In queue" value={progress.queued} hint="assigned to you" />
          <Stat label="Dials today" value={progress.dials} />
          <Stat
            label="Conversations"
            value={progress.conversations}
            hint="decision maker reached"
          />
          <Stat label="Meetings booked" value={progress.booked} hint="today" />
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <p style={{ margin: 0, color: 'var(--devora-ink-muted)' }}>
            Nothing in your queue. Run <code>pnpm db:seed</code> to load synthetic leads.
          </p>
        </Card>
      ) : (
        <ol
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--devora-space-3)',
          }}
        >
          {rows.map((row, index) => (
            <QueueEntry key={row.id} row={row} rank={index} />
          ))}
        </ol>
      )}
    </div>
  );
}
