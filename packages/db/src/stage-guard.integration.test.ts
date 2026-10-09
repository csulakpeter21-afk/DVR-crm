/**
 * Proves the database refuses a direct write to `leads.stage`.
 *
 * DEV_PLAN.domain_frame.transition_rules requires this to be blocked "by a
 * database constraint or service guard". A lint rule catches direct assignment
 * in TypeScript, but raw SQL, a migration or a future service would walk past
 * it, so the guarantee lives in a trigger. This test is what makes that claim
 * checkable rather than aspirational.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { db, disconnect } from './index.ts';
import { resetDatabase } from './testing/index.ts';

const hasDatabase = Boolean(process.env['TEST_DATABASE_URL'] ?? process.env['DATABASE_URL']);

describe.skipIf(!hasDatabase)('leads.stage write guard', () => {
  let leadId: string;

  beforeAll(async () => {
    await resetDatabase();
    const prisma = db();
    const company = await prisma.company.create({
      data: { domain: 'guard-probe.example', name: 'Guard Probe', country: 'FR' },
    });
    const contact = await prisma.contact.create({
      data: {
        companyId: company.id,
        firstName: 'Probe',
        lastName: 'Contact',
        jobTitle: 'CMO',
        country: 'FR',
      },
    });
    const campaign = await prisma.campaign.create({ data: { name: 'Guard probe' } });
    const lead = await prisma.lead.create({
      data: { companyId: company.id, contactId: contact.id, campaignId: campaign.id },
    });
    leadId = lead.id;
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnect();
  });

  it('refuses a direct SQL update of stage', async () => {
    const prisma = db();
    await expect(
      prisma.$executeRawUnsafe(`UPDATE leads SET stage = 'queued' WHERE id = '${leadId}'`),
    ).rejects.toThrow(/state machine/iu);
  });

  it('refuses a direct update through the ORM too', async () => {
    const prisma = db();
    await expect(
      prisma.lead.update({ where: { id: leadId }, data: { stage: 'queued' } }),
    ).rejects.toThrow(/state machine/iu);
  });

  it('leaves the stage untouched after a refused write', async () => {
    const prisma = db();
    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    expect(lead.stage).toBe('sourced');
  });

  it('allows the update when the state machine sets its transaction flag', async () => {
    const prisma = db();
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('devora.transition_ok', 'on', true)`);
      await tx.$executeRawUnsafe(`UPDATE leads SET stage = 'queued' WHERE id = '${leadId}'`);
    });

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    expect(lead.stage).toBe('queued');
  });

  it('does not leak the flag past the transaction that set it', async () => {
    const prisma = db();
    await expect(
      prisma.$executeRawUnsafe(`UPDATE leads SET stage = 'won' WHERE id = '${leadId}'`),
    ).rejects.toThrow(/state machine/iu);
  });
});
