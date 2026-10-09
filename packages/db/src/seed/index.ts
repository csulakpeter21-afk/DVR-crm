/**
 * Synthetic seed (DEV_PLAN P0-T4, extended for the P1 rep workspace demo).
 *
 * SYNTHETIC ONLY. Real lead data never enters this repository. Emails use
 * example.com and domains use .example, both reserved, so nothing here can
 * reach a real person.
 *
 * Leads are seeded across the funnel so the queue, the stage filters and the
 * audit log all have something true to show. The suppressed lead is deliberate:
 * it makes the compliance refusal demonstrable rather than theoretical.
 */
import { ROLES, type Role } from '@devora/contracts';

import { db, disconnect } from '../index.ts';
import { SEED_COMPANIES, SUPPRESSED_COMPANY, type SeedCompany } from './companies.ts';
import { ROOT_NODE_KEY, SCRIPT_NODES, SCRIPT_TREE_NAME } from './script.ts';

const emailFor = (role: Role): string => `${role.replace(/_/gu, '.')}@example.com`;

const displayNameFor = (role: Role): string =>
  `${role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')} (demo)`;

const daysAgo = (days: number): Date => new Date(Date.now() - days * 86_400_000);

/** Country rules. ASSUMPTION: defaults until the M12 spec and counsel review. */
const COUNTRY_RULES = [
  {
    country: 'FR',
    callWindowStartMinutes: 9 * 60,
    callWindowEndMinutes: 19 * 60,
    recordingNoticeRequired: true,
    retentionDays: 365,
    notes: 'Default window, pending counsel review.',
  },
  {
    country: 'GB',
    callWindowStartMinutes: 8 * 60,
    callWindowEndMinutes: 20 * 60,
    recordingNoticeRequired: true,
    retentionDays: 365,
    registryCheckRequired: true,
    notes: 'Registry check assumed required, pending counsel review.',
  },
  {
    country: 'DE',
    callWindowStartMinutes: 9 * 60,
    callWindowEndMinutes: 18 * 60,
    recordingNoticeRequired: true,
    retentionDays: 365,
    notes: 'Default window, pending counsel review.',
  },
] as const;

/** Where each seeded lead sits, so the demo has a populated funnel. */
const STAGE_PLAN = [
  { stage: 'queued', priority: 90 },
  { stage: 'queued', priority: 80 },
  { stage: 'queued', priority: 70 },
  { stage: 'queued', priority: 55 },
  { stage: 'researched', priority: 40 },
  { stage: 'enriched', priority: 20 },
] as const;

export const seed = async (): Promise<void> => {
  const prisma = db();

  // Users: one per role, so RBAC work has something to log in as.
  for (const role of ROLES) {
    await prisma.user.upsert({
      where: { email: emailFor(role) },
      update: { role, displayName: displayNameFor(role) },
      create: { email: emailFor(role), role, displayName: displayNameFor(role) },
    });
  }
  const rep = await prisma.user.findUniqueOrThrow({ where: { email: emailFor('rep') } });

  for (const rule of COUNTRY_RULES) {
    await prisma.countryRule.upsert({
      where: { country: rule.country },
      update: rule,
      create: rule,
    });
  }

  const campaign = await prisma.campaign.upsert({
    where: { id: '00000000-0000-0000-0000-0000000000c1' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-0000000000c1',
      name: 'Visibility gap, Q4',
      icpThreshold: 60,
    },
  });

  const createLead = async (
    seedCompany: SeedCompany,
    stage: (typeof STAGE_PLAN)[number]['stage'] | 'suppressed',
    priority: number,
  ): Promise<void> => {
    const company = await prisma.company.upsert({
      where: { domain: seedCompany.domain },
      update: {},
      create: {
        domain: seedCompany.domain,
        name: seedCompany.name,
        industry: seedCompany.industry,
        sizeBand: seedCompany.sizeBand,
        country: seedCompany.country,
      },
    });

    const contact = await prisma.contact.upsert({
      where: { email: seedCompany.contact.email },
      update: {},
      create: {
        companyId: company.id,
        firstName: seedCompany.contact.firstName,
        lastName: seedCompany.contact.lastName,
        jobTitle: seedCompany.contact.jobTitle,
        email: seedCompany.contact.email,
        phone: seedCompany.contact.phone,
        emailVerified: seedCompany.contact.emailVerified,
        phoneVerified: seedCompany.contact.phoneVerified,
        // The contact is based where the company is, which is what decides
        // their calling window.
        country: seedCompany.country,
        timezone: seedCompany.contact.timezone,
        decisionMaker: seedCompany.contact.decisionMaker,
        // Required before a lead may be queued (P1-03-T3).
        legalBasisRecords: {
          create: {
            basis: 'legitimate_interest',
            dataSource: 'synthetic seed, public sources only',
            assessmentRef: 'LIA-demo-001',
          },
        },
      },
    });

    for (const signal of seedCompany.signals) {
      await prisma.signal.create({
        data: {
          companyId: company.id,
          kind: signal.kind,
          headline: signal.headline,
          detail: signal.detail,
          sourceUrl: signal.sourceUrl,
          retrievedAt: daysAgo(signal.daysAgo),
          observedAt: daysAgo(signal.daysAgo),
          confidence: signal.confidence,
        },
      });
    }

    const lead = await prisma.lead.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        campaignId: campaign.id,
        // Seeding the stage directly is legitimate: there is no prior state to
        // transition from, and the trigger only guards *changes* to stage.
        stage,
        icpScore: seedCompany.icpScore,
        icpFactors: seedCompany.icpFactors,
        priority,
        assignedToUserId: rep.id,
        stageEnteredAt: daysAgo(2),
        dossier: {
          create: {
            status: seedCompany.dossier.claims.length > 0 ? 'ready' : 'not_ready',
            hook: seedCompany.dossier.hook,
            summary: seedCompany.dossier.summary,
            risks: seedCompany.dossier.risks,
            claims: {
              create: seedCompany.dossier.claims.map((claim) => ({
                claim: claim.claim,
                sourceUrl: claim.sourceUrl,
                retrievedAt: daysAgo(3),
                confidence: 0.9,
              })),
            },
          },
        },
      },
    });

    // Attach the company signals to the lead so the script can fill {signal_hook}.
    await prisma.signal.updateMany({
      where: { companyId: company.id, leadId: null },
      data: { leadId: lead.id },
    });
  };

  for (const [index, plan] of STAGE_PLAN.entries()) {
    const seedCompany = SEED_COMPANIES[index];
    if (!seedCompany) continue;
    await createLead(seedCompany, plan.stage, plan.priority);
  }

  // The suppressed lead, plus the suppression entry that blocks it.
  await createLead(SUPPRESSED_COMPANY, 'suppressed', 10);
  await prisma.suppressionEntry.upsert({
    where: { phone: SUPPRESSED_COMPANY.contact.phone },
    update: {},
    create: {
      phone: SUPPRESSED_COMPANY.contact.phone,
      reason: 'objection_to_processing',
    },
  });

  // The script tree. A published version is immutable, so seeding creates
  // version 1 and publishes it.
  const tree = await prisma.scriptTree.upsert({
    where: { id: '00000000-0000-0000-0000-0000000000s1'.replace('s', 'a') },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-0000000000a1',
      name: SCRIPT_TREE_NAME,
    },
  });

  const existing = await prisma.scriptVersion.findFirst({
    where: { treeId: tree.id, version: 1 },
  });

  if (!existing) {
    const version = await prisma.scriptVersion.create({
      data: { treeId: tree.id, version: 1, publishedAt: new Date() },
    });

    // Nodes first, so answers can point at them.
    const nodeIds = new Map<string, string>();
    for (const node of SCRIPT_NODES) {
      const created = await prisma.scriptNode.create({
        data: {
          versionId: version.id,
          key: node.key,
          line: node.line,
          fallbackLine: node.fallbackLine ?? null,
          intent: node.intent ?? null,
          outcome: node.outcome ?? null,
          isBooking: node.isBooking ?? false,
        },
      });
      nodeIds.set(node.key, created.id);
    }

    for (const node of SCRIPT_NODES) {
      const nodeId = nodeIds.get(node.key);
      if (!nodeId || !node.answers) continue;
      for (const [order, answer] of node.answers.entries()) {
        await prisma.scriptAnswer.create({
          data: {
            nodeId,
            label: answer.label,
            nextNodeId: answer.next ? (nodeIds.get(answer.next) ?? null) : null,
            outcomeTag: answer.outcomeTag ?? null,
            sortOrder: order,
          },
        });
      }
    }

    await prisma.scriptVersion.update({
      where: { id: version.id },
      data: { rootNodeId: nodeIds.get(ROOT_NODE_KEY) ?? null },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    companies: await prisma.company.count(),
    leads: await prisma.lead.count(),
    signals: await prisma.signal.count(),
    claims: await prisma.dossierClaim.count(),
    scriptNodes: await prisma.scriptNode.count(),
    suppressed: await prisma.suppressionEntry.count(),
  };
  console.warn('seed complete, synthetic data only:', counts);
};

await seed();
await disconnect();
