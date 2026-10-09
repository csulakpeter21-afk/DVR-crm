/** Server-side reads for the lead workspace. */
import { db } from '@devora/db';
import type { ScriptVersionView } from '@devora/script-engine';

import { callWindow, type CallWindow } from './compliance.ts';

export interface LeadDetail {
  readonly id: string;
  readonly stage: string;
  readonly icpScore: number;
  readonly icpFactors: readonly { readonly factor: string; readonly points: number }[];
  readonly company: {
    readonly name: string;
    readonly domain: string;
    readonly industry: string | null;
    readonly sizeBand: string | null;
    readonly country: string;
  };
  readonly contact: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly jobTitle: string;
    readonly phone: string | null;
    readonly email: string | null;
    readonly decisionMaker: boolean;
    readonly timezone: string;
  };
  readonly dossier: {
    readonly status: string;
    readonly hook: string | null;
    readonly summary: string | null;
    readonly risks: string | null;
    readonly claims: readonly {
      readonly claim: string;
      readonly sourceUrl: string;
      readonly retrievedAt: string;
    }[];
  } | null;
  readonly signals: readonly {
    readonly kind: string;
    readonly headline: string;
    readonly detail: string | null;
    readonly sourceUrl: string;
    readonly retrievedAt: string;
  }[];
  readonly window: CallWindow;
  readonly suppressed: { readonly reason: string } | null;
}

export const leadDetail = async (leadId: string): Promise<LeadDetail | null> => {
  const prisma = db();
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      company: true,
      contact: true,
      dossier: { include: { claims: true } },
      signals: { orderBy: { observedAt: 'desc' } },
    },
  });
  if (!lead) return null;

  const rule = await prisma.countryRule.findUnique({ where: { country: lead.contact.country } });
  const suppression = await prisma.suppressionEntry.findFirst({
    where: {
      OR: [
        ...(lead.contact.phone ? [{ phone: lead.contact.phone }] : []),
        ...(lead.contact.email ? [{ email: lead.contact.email }] : []),
        { domain: lead.company.domain },
      ],
    },
  });

  return {
    id: lead.id,
    stage: lead.stage,
    icpScore: lead.icpScore,
    icpFactors: (lead.icpFactors as { factor: string; points: number }[]) ?? [],
    company: {
      name: lead.company.name,
      domain: lead.company.domain,
      industry: lead.company.industry,
      sizeBand: lead.company.sizeBand,
      country: lead.company.country,
    },
    contact: {
      id: lead.contact.id,
      firstName: lead.contact.firstName,
      lastName: lead.contact.lastName,
      jobTitle: lead.contact.jobTitle,
      phone: lead.contact.phone,
      email: lead.contact.email,
      decisionMaker: lead.contact.decisionMaker,
      timezone: lead.contact.timezone,
    },
    dossier: lead.dossier
      ? {
          status: lead.dossier.status,
          hook: lead.dossier.hook,
          summary: lead.dossier.summary,
          risks: lead.dossier.risks,
          claims: lead.dossier.claims.map((claim) => ({
            claim: claim.claim,
            sourceUrl: claim.sourceUrl,
            retrievedAt: claim.retrievedAt.toISOString().slice(0, 10),
          })),
        }
      : null,
    signals: lead.signals.map((signal) => ({
      kind: signal.kind,
      headline: signal.headline,
      detail: signal.detail,
      sourceUrl: signal.sourceUrl,
      retrievedAt: signal.retrievedAt.toISOString().slice(0, 10),
    })),
    window: callWindow(lead.contact.timezone, rule),
    suppressed: suppression ? { reason: suppression.reason } : null,
  };
};

/**
 * Loads the published script version whole, so the player can resolve the next
 * node in memory and meet the 100 ms budget with no network round trip.
 */
export const publishedScript = async (): Promise<ScriptVersionView | null> => {
  const version = await db().scriptVersion.findFirst({
    where: { publishedAt: { not: null } },
    orderBy: { version: 'desc' },
    include: { nodes: { include: { answers: { orderBy: { sortOrder: 'asc' } } } } },
  });
  if (!version?.rootNodeId) return null;

  return {
    id: version.id,
    version: version.version,
    rootNodeId: version.rootNodeId,
    nodes: version.nodes.map((node) => ({
      id: node.id,
      key: node.key,
      line: node.line,
      fallbackLine: node.fallbackLine,
      intent: node.intent,
      outcome: node.outcome,
      isBooking: node.isBooking,
      answers: node.answers.map((answer) => ({
        id: answer.id,
        label: answer.label,
        nextNodeId: answer.nextNodeId,
        outcomeTag: answer.outcomeTag,
      })),
    })),
  };
};
