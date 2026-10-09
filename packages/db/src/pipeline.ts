/**
 * Commits a pipeline transition (P1-01-T2, T3, T4).
 *
 * @devora/domain decides, this commits. The split keeps the rule set pure and
 * testable without a database, and keeps Prisma out of the domain package.
 *
 * Everything happens in one transaction: the stage change, the audit entry and
 * the outbox event. If any of the three fails, none of them happened. That is
 * what wt-01's second acceptance criterion asks for.
 */
import { randomUUID } from 'node:crypto';

import { type LeadState, type ReasonCode, type Role } from '@devora/contracts';
import { planTransition, type GuardContext, type TransitionPlan } from '@devora/domain';

import { db } from './index.ts';

export interface TransitionRequest {
  readonly leadId: string;
  readonly to: LeadState;
  readonly reasonCode?: ReasonCode;
  readonly reasonDetail?: string;
  readonly reEntryAt?: Date;
  readonly actorUserId: string | null;
  readonly actorRole: Role | null;
  /** Supplied by the caller that knows, for example the dialler after a call. */
  readonly decisionMakerReached?: boolean;
  readonly callDurationSeconds?: number;
}

export type TransitionOutcome =
  | { readonly ok: true; readonly from: LeadState; readonly to: LeadState }
  | { readonly ok: false; readonly reasonCode: ReasonCode; readonly message: string };

/**
 * Builds the guard context from what is actually stored, so the entry criteria
 * are checked against the database rather than against the caller's claims.
 */
const loadGuardContext = async (
  leadId: string,
  over: Pick<TransitionRequest, 'decisionMakerReached' | 'callDurationSeconds'>,
): Promise<Omit<GuardContext, 'from' | 'to'>> => {
  const prisma = db();
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    include: {
      contact: { include: { legalBasisRecords: true } },
      company: true,
      campaign: true,
      dossier: true,
      calls: { orderBy: { startedAt: 'desc' }, take: 1 },
    },
  });

  const suppression = await prisma.suppressionEntry.findFirst({
    where: {
      OR: [
        ...(lead.contact.phone ? [{ phone: lead.contact.phone }] : []),
        ...(lead.contact.email ? [{ email: lead.contact.email }] : []),
        { domain: lead.company.domain },
      ],
    },
  });

  const lastCall = lead.calls[0];

  return {
    leadId,
    hasVerifiedPhone: lead.contact.phoneVerified,
    hasVerifiedEmail: lead.contact.emailVerified,
    dossierReady: lead.dossier?.status === 'ready',
    icpScore: lead.icpScore,
    icpThreshold: lead.campaign.icpThreshold,
    compliancePassed: suppression === null,
    ...(suppression ? { complianceReason: 'suppressed_contact' } : {}),
    assigned: lead.assignedToUserId !== null,
    hasLegalBasis: lead.contact.legalBasisRecords.length > 0,
    decisionMakerReached:
      over.decisionMakerReached ?? lastCall?.decisionMakerReached ?? lead.contact.decisionMaker,
    callDurationSeconds: over.callDurationSeconds ?? lastCall?.durationSeconds ?? 0,
  };
};

/** Writes the audit entry for a refusal. A block nobody can see is not a control. */
const recordRefusal = async (
  leadId: string,
  plan: Extract<TransitionPlan, { outcome: 'rejected' }>,
  actorUserId: string | null,
): Promise<void> => {
  const prisma = db();
  await prisma.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: `lead.stage.refused_${plan.from}_to_${plan.to}`,
        entityType: 'Lead',
        entityId: leadId,
        fromValue: plan.from,
        toValue: plan.to,
        reasonCode: plan.reasonCode,
        detail: plan.message,
      },
    });

    if (plan.event) {
      await tx.outboxEvent.create({
        data: {
          name: plan.event,
          subjectId: leadId,
          correlationId: randomUUID(),
          idempotencyKey: `${plan.event}:${leadId}:${Date.now()}:${randomUUID()}`,
          actorUserId,
          payload: { from: plan.from, to: plan.to, reasonCode: plan.reasonCode },
        },
      });
    }
  });
};

/**
 * The only way a lead's stage changes.
 *
 * `set_config('devora.transition_ok', 'on', true)` is what satisfies the
 * database trigger. It is transaction-local, so it cannot leak to another
 * statement or another connection.
 */
export const transitionLead = async (request: TransitionRequest): Promise<TransitionOutcome> => {
  const prisma = db();
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: request.leadId },
    select: { stage: true },
  });

  const guardContext = await loadGuardContext(request.leadId, request);
  const plan = planTransition({
    current: lead.stage,
    intent: {
      to: request.to,
      ...(request.reasonCode === undefined ? {} : { reasonCode: request.reasonCode }),
      ...(request.reasonDetail === undefined ? {} : { reasonDetail: request.reasonDetail }),
      ...(request.reEntryAt === undefined ? {} : { reEntryAt: request.reEntryAt }),
      actorUserId: request.actorUserId,
      actorRole: request.actorRole,
    },
    guardContext,
  });

  if (plan.outcome === 'rejected') {
    await recordRefusal(request.leadId, plan, request.actorUserId);
    return { ok: false, reasonCode: plan.reasonCode, message: plan.message };
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT set_config('devora.transition_ok', 'on', true)`);

    await tx.lead.update({
      where: { id: request.leadId },
      data: {
        stage: plan.to,
        stageEnteredAt: new Date(),
        reasonCode: plan.reasonCode ?? null,
        reasonDetail: plan.reasonDetail ?? null,
        reEntryAt: plan.reEntryAt ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: request.actorUserId,
        action: plan.auditAction,
        entityType: 'Lead',
        entityId: request.leadId,
        fromValue: plan.from,
        toValue: plan.to,
        reasonCode: plan.reasonCode ?? null,
        detail: plan.reasonDetail ?? null,
      },
    });

    // A state with no event of its own writes no outbox row; the audit entry
    // above is the record. Only states the catalogue names emit.
    if (plan.event) {
      await tx.outboxEvent.create({
        data: {
          name: plan.event,
          subjectId: request.leadId,
          correlationId: randomUUID(),
          // One transition, one key. A retry of the same transition is a new one.
          idempotencyKey: `${plan.event}:${request.leadId}:${plan.from}:${plan.to}:${Date.now()}`,
          actorUserId: request.actorUserId,
          payload: { from: plan.from, to: plan.to },
        },
      });
    }
  });

  return { ok: true, from: plan.from, to: plan.to };
};
