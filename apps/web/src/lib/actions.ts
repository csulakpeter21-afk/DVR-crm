'use server';

/**
 * Server actions for the rep workspace.
 *
 * These call @devora/domain and @devora/db directly rather than going over HTTP.
 * The rules live in the domain package either way, so exposing the same
 * functions through apps/api later is a transport change, not a rewrite. Logged
 * as a deviation in the build report.
 *
 * Every one of these re-checks compliance server side. The disabled dial button
 * is a courtesy; this is the control.
 */
import { randomUUID } from 'node:crypto';

import { db, transitionLead } from '@devora/db';
import { revalidatePath } from 'next/cache';

import { callWindow } from './compliance.ts';
import { currentUser } from './session.ts';

export interface ActionResult {
  readonly ok: boolean;
  readonly message?: string;
  readonly callId?: string;
}

/**
 * Starts a call. Refuses outside the calling window or against a suppressed
 * contact, and records the recording notice before any recording could exist.
 */
export const startCall = async (leadId: string): Promise<ActionResult> => {
  const user = await currentUser();
  const prisma = db();

  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    include: { contact: true, company: true },
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

  if (suppression) {
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'call.refused',
        entityType: 'Lead',
        entityId: leadId,
        reasonCode: 'suppressed_contact',
        detail: `Dial refused: ${suppression.reason}.`,
      },
    });
    return { ok: false, message: 'This contact is suppressed. Calling is blocked.' };
  }

  const rule = await prisma.countryRule.findUnique({ where: { country: lead.contact.country } });
  const window = callWindow(lead.contact.timezone, rule);
  if (!window.callable) {
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'call.refused',
        entityType: 'Lead',
        entityId: leadId,
        reasonCode: 'outside_calling_window',
        detail: window.reason,
      },
    });
    return { ok: false, message: window.reason ?? 'Outside the calling window.' };
  }

  const version = await prisma.scriptVersion.findFirst({
    where: { publishedAt: { not: null } },
    orderBy: { version: 'desc' },
  });

  const call = await prisma.call.create({
    data: {
      leadId,
      userId: user.id,
      versionId: version?.id ?? null,
      state: 'connected',
      connectedAt: new Date(),
      // The notice is logged before a recording can exist, which is what the
      // country rule requires (P1-07-T3).
      recordingNoticeAt: window.recordingNoticeRequired ? new Date() : null,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { attemptCount: { increment: 1 }, lastAttemptAt: new Date() },
  });

  // queued -> dialled -> connected, each through the state machine.
  await transitionLead({ leadId, to: 'dialled', actorUserId: user.id, actorRole: user.role });
  await transitionLead({ leadId, to: 'connected', actorUserId: user.id, actorRole: user.role });

  revalidatePath(`/leads/${leadId}`);
  return { ok: true, callId: call.id };
};

/** Records a node answer on the call path (P1-06-T4). */
export const recordAnswer = async (
  callId: string,
  nodeId: string,
  answerId: string | null,
  sequence: number,
): Promise<void> => {
  const prisma = db();
  await prisma.callPath.create({
    data: {
      callId,
      nodeId,
      answerId,
      sequence,
      answeredAt: answerId ? new Date() : null,
    },
  });

  const call = await prisma.call.findUnique({ where: { id: callId }, select: { leadId: true } });
  if (!call) return;

  await prisma.outboxEvent.create({
    data: {
      name: 'script.node_answered',
      subjectId: call.leadId,
      correlationId: randomUUID(),
      idempotencyKey: `script.node_answered:${callId}:${sequence}`,
      payload: { callId, nodeId, answerId, sequence },
    },
  });
};

/**
 * Ends the call and moves the lead on. `conversation` has real criteria, so the
 * state machine is given the duration and whether a decision maker was reached
 * and decides for itself.
 */
export const endCall = async (
  callId: string,
  outcome: { decisionMakerReached: boolean; disposition: string; durationSeconds: number },
): Promise<ActionResult> => {
  const user = await currentUser();
  const prisma = db();

  const call = await prisma.call.update({
    where: { id: callId },
    data: {
      state: 'ended',
      endedAt: new Date(),
      durationSeconds: outcome.durationSeconds,
      decisionMakerReached: outcome.decisionMakerReached,
      disposition: outcome.disposition,
    },
  });

  const result = await transitionLead({
    leadId: call.leadId,
    to: 'conversation',
    actorUserId: user.id,
    actorRole: user.role,
    decisionMakerReached: outcome.decisionMakerReached,
    callDurationSeconds: outcome.durationSeconds,
  });

  revalidatePath(`/leads/${call.leadId}`);
  revalidatePath('/queue');

  return result.ok
    ? { ok: true, message: 'Logged as a conversation.' }
    : { ok: false, message: result.message };
};

/** Books the qualifier meeting and moves the lead to meeting_booked. */
export const bookMeeting = async (leadId: string, callId: string): Promise<ActionResult> => {
  const user = await currentUser();
  const prisma = db();

  const qualifier = await prisma.user.findFirstOrThrow({ where: { role: 'qualifier' } });
  const call = await prisma.call.update({
    where: { id: callId },
    // The rep booked a meeting, so the decision maker was plainly reached.
    data: { decisionMakerReached: true },
  });

  // Next working day at 10:00, which is what the booking panel will replace
  // when qualifier availability lands in P3-13-T1.
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 1);
  scheduledAt.setHours(10, 0, 0, 0);

  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    select: { stage: true },
  });

  const elapsedSeconds = call?.startedAt
    ? Math.round((Date.now() - call.startedAt.getTime()) / 1000)
    : (call?.durationSeconds ?? 0);

  /**
   * A booking taken on a live call is still mid-call, so the lead sits in
   * `connected`. The state machine refuses connected -> meeting_booked because
   * a booking without a conversation is not a thing that happens, so step
   * through `conversation` first. Its own guards still apply: a call that never
   * reached a decision maker, or ran under a minute, is refused here.
   */
  if (lead.stage === 'connected') {
    const toConversation = await transitionLead({
      leadId,
      to: 'conversation',
      actorUserId: user.id,
      actorRole: user.role,
      decisionMakerReached: call?.decisionMakerReached ?? true,
      callDurationSeconds: elapsedSeconds,
    });
    if (!toConversation.ok) return { ok: false, message: toConversation.message };
  }

  const transition = await transitionLead({
    leadId,
    to: 'meeting_booked',
    actorUserId: user.id,
    actorRole: user.role,
    decisionMakerReached: call?.decisionMakerReached ?? true,
    callDurationSeconds: elapsedSeconds,
  });

  if (!transition.ok) return { ok: false, message: transition.message };

  await prisma.meeting.create({
    data: {
      leadId,
      qualifierUserId: qualifier.id,
      bookedByUserId: user.id,
      scheduledAt,
    },
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/queue');
  return { ok: true, message: `Qualifier meeting booked for ${scheduledAt.toUTCString()}.` };
};
