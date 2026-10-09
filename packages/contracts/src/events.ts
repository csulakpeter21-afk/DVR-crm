/**
 * The event catalogue, straight from DEV_PLAN.domain_frame.event_catalogue.
 *
 * Event names and payloads are defined ONLY here (DEV_PLAN.stack.events).
 * Nothing else in the monorepo may declare an event name string literal: the
 * architecture test in src/architecture.test.ts fails the build if it does.
 */
import { z } from 'zod';

export const EVENT_NAMES = [
  'lead.sourced',
  'lead.enriched',
  'lead.enrichment_failed',
  'dossier.ready',
  'lead.queued',
  'call.started',
  'call.connected',
  'call.ended',
  'call.recording_available',
  'transcript.ready',
  'script.node_answered',
  'meeting.booked',
  'meeting.reminder_sent',
  'meeting.held',
  'meeting.no_show',
  'lead.qualified',
  'lead.disqualified',
  'lead.suppressed',
  'lead.recycled',
  'sla.breached',
  'experiment.assigned',
  'compliance.blocked',
  'cost.recorded',
] as const;

export const eventNameSchema = z.enum(EVENT_NAMES);
export type EventName = z.infer<typeof eventNameSchema>;

/**
 * The envelope every outbox row carries.
 *
 * `idempotencyKey` is what makes consumers safe to retry: a consumer that has
 * already processed a key must no-op (DEV_PLAN P1-01-T3, P1-04-T2).
 * Payload shapes are added per event by wt-01-core-domain; until then the
 * payload is an opaque record and consumers validate their own slice.
 */
export const eventEnvelopeSchema = z.object({
  id: z.uuid(),
  name: eventNameSchema,
  occurredAt: z.iso.datetime({ offset: false }),
  /** Correlates every event emitted by one request or job run. */
  correlationId: z.uuid(),
  /** Stable key for exactly-once consumption. */
  idempotencyKey: z.string().min(1).max(255),
  /** The user, or null when the platform acted on its own. */
  actorUserId: z.uuid().nullable(),
  /** Entity the event is about, for example a lead id. */
  subjectId: z.uuid(),
  payload: z.record(z.string(), z.unknown()),
});
export type EventEnvelope = z.infer<typeof eventEnvelopeSchema>;

export const isEventName = (value: unknown): value is EventName =>
  eventNameSchema.safeParse(value).success;
