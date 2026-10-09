/**
 * The lead workspace (P1-05-T3).
 *
 * Left: the call console, which is where the rep's attention goes. Right: the
 * dossier, which is the 15-second read. Every claim on this page carries its
 * source and the date it was retrieved, because no unsourced claim may reach a
 * rep, let alone a prospect.
 */
import { Badge, Card, Eyebrow, EmptyState } from '@devora/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CallConsole } from '../../../components/call-console.tsx';
import { leadDetail, publishedScript } from '../../../lib/lead.ts';

export const dynamic = 'force-dynamic';

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, script] = await Promise.all([leadDetail(id), publishedScript()]);
  if (!lead) notFound();

  const hook = lead.signals[0]?.headline ?? lead.dossier?.hook ?? undefined;
  const blocked = lead.suppressed
    ? `This contact is suppressed: ${lead.suppressed.reason.replace(/_/gu, ' ')}. Only the compliance role can lift that.`
    : lead.window.reason;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--devora-space-5)' }}>
      <div>
        <Link
          href="/queue"
          style={{
            fontSize: 'var(--devora-text-sm)',
            color: 'var(--devora-ink-muted)',
            textDecoration: 'none',
          }}
        >
          ← Call queue
        </Link>
      </div>

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--devora-space-5)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Eyebrow>
            {lead.company.industry ?? 'Company'} · {lead.company.sizeBand ?? 'size unknown'} ·{' '}
            {lead.company.country}
          </Eyebrow>
          <h1 style={{ margin: '0.25rem 0 0', fontSize: 'var(--devora-text-2xl)' }}>
            {lead.company.name}
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--devora-ink-secondary)' }}>
            {lead.contact.firstName} {lead.contact.lastName}, {lead.contact.jobTitle}
            {lead.contact.decisionMaker ? ' · decision maker' : ' · not the budget holder'}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 'var(--devora-space-2)',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Badge tone={lead.icpScore >= 80 ? 'positive' : 'accent'}>ICP {lead.icpScore}</Badge>
          <Badge tone={lead.suppressed ? 'critical' : 'neutral'}>
            {lead.stage.replace(/_/gu, ' ')}
          </Badge>
          <Badge tone="neutral">{lead.window.localTime} local</Badge>
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)',
          gap: 'var(--devora-space-5)',
          alignItems: 'start',
        }}
      >
        <CallConsole
          leadId={lead.id}
          script={script}
          variables={{
            first_name: lead.contact.firstName,
            company: lead.company.name,
            ...(hook ? { signal_hook: hook } : {}),
          }}
          callable={lead.window.callable && !lead.suppressed}
          blockedReason={blocked}
          recordingNoticeRequired={lead.window.recordingNoticeRequired}
          phone={lead.contact.phone}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--devora-space-4)' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Eyebrow>Dossier</Eyebrow>
              <Badge tone={lead.dossier?.status === 'ready' ? 'positive' : 'caution'}>
                {lead.dossier?.status === 'ready' ? 'Sourced' : 'Not ready'}
              </Badge>
            </div>

            {lead.dossier?.hook ? (
              <p
                style={{
                  margin: 'var(--devora-space-3) 0 0',
                  fontFamily: 'var(--devora-font-serif)',
                  fontSize: 'var(--devora-text-md)',
                  lineHeight: 1.4,
                }}
              >
                {lead.dossier.hook}
              </p>
            ) : null}

            {lead.dossier?.summary ? (
              <p
                style={{
                  margin: 'var(--devora-space-3) 0 0',
                  fontSize: 'var(--devora-text-sm)',
                  color: 'var(--devora-ink-secondary)',
                  lineHeight: 1.55,
                }}
              >
                {lead.dossier.summary}
              </p>
            ) : null}

            {lead.dossier?.risks ? (
              <p
                style={{
                  margin: 'var(--devora-space-3) 0 0',
                  fontSize: 'var(--devora-text-xs)',
                  color: 'var(--devora-caution)',
                  background: 'var(--devora-caution-soft)',
                  padding: '0.5rem',
                  borderRadius: 'var(--devora-radius-sm)',
                }}
              >
                Watch for: {lead.dossier.risks}
              </p>
            ) : null}
          </Card>

          <Card>
            <Eyebrow>Sourced claims</Eyebrow>
            {lead.dossier && lead.dossier.claims.length > 0 ? (
              <ul
                style={{
                  listStyle: 'none',
                  margin: 'var(--devora-space-3) 0 0',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--devora-space-3)',
                }}
              >
                {lead.dossier.claims.map((claim) => (
                  <li
                    key={claim.sourceUrl + claim.claim}
                    style={{ fontSize: 'var(--devora-text-sm)' }}
                  >
                    <span style={{ color: 'var(--devora-ink-secondary)' }}>{claim.claim}</span>
                    <br />
                    <a
                      href={claim.sourceUrl}
                      style={{ fontSize: 'var(--devora-text-xs)', color: 'var(--devora-accent)' }}
                    >
                      {new URL(claim.sourceUrl).hostname}
                    </a>
                    <span
                      style={{
                        fontSize: 'var(--devora-text-xs)',
                        color: 'var(--devora-ink-faint)',
                      }}
                    >
                      {' '}
                      · retrieved {claim.retrievedAt}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ marginTop: 'var(--devora-space-3)' }}>
                <EmptyState
                  title="No sourced claims"
                  detail="The dossier stays not ready until every sentence links to a source."
                />
              </div>
            )}
          </Card>

          <Card>
            <Eyebrow>ICP score {lead.icpScore}</Eyebrow>
            <ul
              style={{
                listStyle: 'none',
                margin: 'var(--devora-space-3) 0 0',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}
            >
              {lead.icpFactors.map((factor) => (
                <li
                  key={factor.factor}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 'var(--devora-space-3)',
                    fontSize: 'var(--devora-text-sm)',
                  }}
                >
                  <span style={{ color: 'var(--devora-ink-secondary)' }}>{factor.factor}</span>
                  <span
                    style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--devora-ink-muted)' }}
                  >
                    +{factor.points}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
