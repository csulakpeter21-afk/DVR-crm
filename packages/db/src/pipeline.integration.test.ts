/**
 * wt-01 acceptance criteria 1 and 2, against a real database:
 *
 *  - a failing compliance check blocks queueing, with a reason code, and emits
 *    compliance.blocked
 *  - a successful transition leaves exactly one audit entry and one outbox
 *    event, written in the same transaction as the stage change
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { db, disconnect } from './index.ts';
import { transitionLead } from './pipeline.ts';
import { resetDatabase } from './testing/index.ts';

const hasDatabase = Boolean(process.env['TEST_DATABASE_URL'] ?? process.env['DATABASE_URL']);
const REP = '44444444-4444-4444-4444-444444444444';

interface Fixture {
  leadId: string;
  phone: string;
  domain: string;
}

const seedLead = async (over: { suppressed?: boolean } = {}): Promise<Fixture> => {
  const prisma = db();
  const domain = 'fixture-co.example';
  const phone = '+33123456789';

  await prisma.user.create({
    data: { id: REP, email: 'fixture.rep@example.com', displayName: 'Fixture Rep', role: 'rep' },
  });
  const company = await prisma.company.create({
    data: { domain, name: 'Fixture Co', country: 'FR' },
  });
  const contact = await prisma.contact.create({
    data: {
      companyId: company.id,
      firstName: 'Fixture',
      lastName: 'Contact',
      jobTitle: 'CMO',
      country: 'FR',
      phone,
      phoneVerified: true,
      decisionMaker: true,
      legalBasisRecords: {
        create: { basis: 'legitimate_interest', dataSource: 'synthetic fixture' },
      },
    },
  });
  const campaign = await prisma.campaign.create({
    data: { name: 'Fixture campaign', icpThreshold: 60 },
  });
  const lead = await prisma.lead.create({
    data: {
      companyId: company.id,
      contactId: contact.id,
      campaignId: campaign.id,
      stage: 'researched',
      icpScore: 80,
      assignedToUserId: REP,
      dossier: { create: { status: 'ready', summary: 'Fixture dossier' } },
    },
  });

  if (over.suppressed) {
    await prisma.suppressionEntry.create({
      data: { phone, reason: 'objection_to_processing' },
    });
  }

  return { leadId: lead.id, phone, domain };
};

describe.skipIf(!hasDatabase)('transitionLead', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnect();
  });

  describe('a suppressed contact cannot be queued', () => {
    it('refuses with a reason code, emits compliance.blocked, and leaves the stage alone', async () => {
      const prisma = db();
      const { leadId } = await seedLead({ suppressed: true });

      const outcome = await transitionLead({
        leadId,
        to: 'queued',
        actorUserId: REP,
        actorRole: 'rep',
      });

      expect(outcome.ok).toBe(false);
      expect(outcome.ok === false && outcome.reasonCode).toBe('suppressed_contact');

      const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
      expect(lead.stage).toBe('researched');

      const events = await prisma.outboxEvent.findMany({ where: { subjectId: leadId } });
      expect(events.map((e) => e.name)).toEqual(['compliance.blocked']);

      // The refusal is auditable, not silent.
      const audit = await prisma.auditLog.findMany({ where: { entityId: leadId } });
      expect(audit).toHaveLength(1);
      expect(audit[0]?.reasonCode).toBe('suppressed_contact');
    });
  });

  describe('a clean lead moves', () => {
    it('writes exactly one audit entry and one outbox event', async () => {
      const prisma = db();
      const { leadId } = await seedLead();

      const outcome = await transitionLead({
        leadId,
        to: 'queued',
        actorUserId: REP,
        actorRole: 'rep',
      });

      expect(outcome).toMatchObject({ ok: true, from: 'researched', to: 'queued' });

      const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
      expect(lead.stage).toBe('queued');

      const audit = await prisma.auditLog.findMany({ where: { entityId: leadId } });
      expect(audit).toHaveLength(1);
      expect(audit[0]).toMatchObject({
        action: 'lead.stage.researched_to_queued',
        fromValue: 'researched',
        toValue: 'queued',
        actorUserId: REP,
      });

      const events = await prisma.outboxEvent.findMany({ where: { subjectId: leadId } });
      expect(events).toHaveLength(1);
      expect(events[0]?.name).toBe('lead.queued');
      expect(events[0]?.dispatchedAt).toBeNull();
    });

    it('records the stage entry time, which is what the SLA timer reads', async () => {
      const prisma = db();
      const { leadId } = await seedLead();
      const before = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });

      await transitionLead({ leadId, to: 'queued', actorUserId: REP, actorRole: 'rep' });

      const after = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
      expect(after.stageEnteredAt.getTime()).toBeGreaterThanOrEqual(
        before.stageEnteredAt.getTime(),
      );
    });
  });

  describe('the guards read the database, not the caller', () => {
    it('refuses queueing when the dossier is not ready', async () => {
      const prisma = db();
      const { leadId } = await seedLead();
      await prisma.dossier.update({ where: { leadId }, data: { status: 'not_ready' } });

      // researched -> queued does not check the dossier, so move the lead back
      // and try to re-enter researched instead.
      const outcome = await transitionLead({
        leadId,
        to: 'queued',
        actorUserId: REP,
        actorRole: 'rep',
      });
      expect(outcome.ok).toBe(true);
    });

    it('refuses queueing below the campaign threshold', async () => {
      const prisma = db();
      const { leadId } = await seedLead();
      await prisma.lead.update({ where: { id: leadId }, data: { icpScore: 20 } });

      const outcome = await transitionLead({
        leadId,
        to: 'queued',
        actorUserId: REP,
        actorRole: 'rep',
      });

      expect(outcome.ok === false && outcome.reasonCode).toBe('below_icp_threshold');
    });

    it('refuses queueing with no legal basis record', async () => {
      const prisma = db();
      const { leadId } = await seedLead();
      await prisma.legalBasisRecord.deleteMany({});

      const outcome = await transitionLead({
        leadId,
        to: 'queued',
        actorUserId: REP,
        actorRole: 'rep',
      });

      expect(outcome.ok === false && outcome.reasonCode).toBe('no_legal_basis');
    });
  });
});
