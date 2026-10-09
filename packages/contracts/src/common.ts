/**
 * Primitives shared by every contract in this package.
 *
 * ASSUMPTION (DEV_PLAN spec_sources.rule_when_missing): docs/04_ARCHITECTURE.md
 * does not exist yet, so these shapes come from DEV_PLAN.domain_frame defaults.
 * They are recorded in docs/02_ASSUMPTION_REGISTER.md and change only through a
 * change request plus an ADR (DEV_PLAN.human_gates).
 */
import { z } from 'zod';

/** Every entity id is a UUID. Branding stops a CompanyId reaching a ContactId slot. */
export const idSchema = z.uuid();
export type Id = z.infer<typeof idSchema>;

/**
 * Builds a branded id schema, for example `brandedId<'CompanyId'>()`.
 * The brand exists only in the type system, so it carries no runtime cost and
 * takes no argument.
 */
export const brandedId = <B extends string>() => idSchema.brand<B>();

/** ISO 8601 instant, always UTC, always serialised as a string on the wire. */
export const timestampSchema = z.iso.datetime({ offset: false });
export type Timestamp = z.infer<typeof timestampSchema>;

/** ISO 3166-1 alpha-2. Drives CountryRule lookup, so it is normalised upper case. */
export const countryCodeSchema = z
  .string()
  .regex(/^[A-Z]{2}$/u, 'Country must be an ISO 3166-1 alpha-2 code, upper case');
export type CountryCode = z.infer<typeof countryCodeSchema>;

/** E.164. Suppression matches on this exact normalised form. */
export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/u, 'Phone must be E.164, for example +33123456789');
export type Phone = z.infer<typeof phoneSchema>;

export const emailSchema = z.email().toLowerCase();
export type Email = z.infer<typeof emailSchema>;

export const urlSchema = z.url();
export type Url = z.infer<typeof urlSchema>;

/**
 * A registrable domain, lower case, no scheme and no path.
 * This is the dedupe key for Company (DEV_PLAN P1-01-T1).
 */
export const companyDomainSchema = z
  .string()
  .toLowerCase()
  .regex(
    /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/u,
    'Domain must be a bare hostname, for example devora.io',
  );
export type CompanyDomain = z.infer<typeof companyDomainSchema>;

/**
 * Why the platform did something, or refused to.
 * Reason codes are machine readable: dashboards group on them and the rep UI
 * maps them to an explanation. Free text goes in `reasonDetail`.
 */
export const reasonCodeSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/u, 'Reason codes are lower snake_case');
export type ReasonCode = z.infer<typeof reasonCodeSchema>;

/** Cursor pagination. Offset pagination drifts while a queue is being worked. */
export const paginationSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(200).default(50),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const pageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().min(1).nullable(),
    totalEstimate: z.number().int().min(0).optional(),
  });

/** Money is integer minor units plus a currency. Never a float. */
export const moneySchema = z.object({
  amountMinor: z.number().int(),
  currency: z.string().regex(/^[A-Z]{3}$/u, 'Currency must be ISO 4217, upper case'),
});
export type Money = z.infer<typeof moneySchema>;

/**
 * Where a fact came from. DEV_PLAN product.principles: no unsourced claim ever
 * reaches a rep, a qualifier or a prospect, so every automated assertion about
 * a lead carries this.
 */
export const provenanceSchema = z.object({
  sourceUrl: urlSchema,
  retrievedAt: timestampSchema,
  confidence: z.number().min(0).max(1),
});
export type Provenance = z.infer<typeof provenanceSchema>;
