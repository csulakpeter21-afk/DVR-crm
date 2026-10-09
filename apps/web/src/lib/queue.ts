/**
 * Reads for the rep workspace.
 *
 * These run on the server inside React Server Components, so the browser never
 * sees a database connection and the queue arrives as HTML. The ordering here is
 * P2-12-T1's job properly; this is the explainable version of it that the demo
 * needs: score, then signal freshness, then priority.
 */
import { REP_ACTIVE_STAGES } from '@devora/contracts';
import { db } from '@devora/db';

import { callWindow, type CallWindow } from './compliance.ts';

export interface QueueRow {
  readonly id: string;
  readonly companyName: string;
  readonly companyDomain: string;
  readonly industry: string | null;
  readonly contactName: string;
  readonly jobTitle: string;
  readonly country: string;
  readonly timezone: string;
  readonly icpScore: number;
  readonly stage: string;
  readonly priority: number;
  readonly hook: string | null;
  readonly signalCount: number;
  readonly freshestSignalDays: number | null;
  readonly attemptCount: number;
  readonly localTimeLabel: string;
  readonly window: CallWindow;
}

const daysSince = (date: Date): number =>
  Math.max(0, Math.round((Date.now() - date.getTime()) / 86_400_000));

export const repQueue = async (userId: string): Promise<QueueRow[]> => {
  const leads = await db().lead.findMany({
    where: { assignedToUserId: userId, stage: { in: [...REP_ACTIVE_STAGES] } },
    include: {
      company: true,
      contact: true,
      dossier: true,
      signals: { orderBy: { observedAt: 'desc' } },
    },
    orderBy: [{ priority: 'desc' }, { icpScore: 'desc' }],
  });

  const rules = await db().countryRule.findMany();
  const ruleFor = new Map(rules.map((rule) => [rule.country, rule]));

  return leads.map((lead) => {
    const freshest = lead.signals[0];
    const window = callWindow(lead.contact.timezone, ruleFor.get(lead.contact.country) ?? null);
    return {
      id: lead.id,
      companyName: lead.company.name,
      companyDomain: lead.company.domain,
      industry: lead.company.industry,
      contactName: `${lead.contact.firstName} ${lead.contact.lastName}`,
      jobTitle: lead.contact.jobTitle,
      country: lead.contact.country,
      timezone: lead.contact.timezone,
      icpScore: lead.icpScore,
      stage: lead.stage,
      priority: lead.priority,
      hook: lead.dossier?.hook ?? null,
      signalCount: lead.signals.length,
      freshestSignalDays: freshest ? daysSince(freshest.observedAt) : null,
      attemptCount: lead.attemptCount,
      localTimeLabel: `${window.localTime} local`,
      window,
    };
  });
};

/** Counts for the day tracker. Real targets and quality scores are P2-12-T2. */
export const repProgress = async (userId: string) => {
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const [queued, dials, conversations, booked] = await Promise.all([
    db().lead.count({ where: { assignedToUserId: userId, stage: 'queued' } }),
    db().call.count({ where: { userId, startedAt: { gte: since } } }),
    db().call.count({
      where: { userId, startedAt: { gte: since }, decisionMakerReached: true },
    }),
    db().meeting.count({ where: { bookedByUserId: userId, createdAt: { gte: since } } }),
  ]);

  return { queued, dials, conversations, booked };
};
