/**
 * @devora/contracts is law (DEV_PLAN.global_engineering_rules).
 *
 * Every entity schema, pipeline state, role, event name and API DTO in the
 * Devora Sales Engine is declared here and nowhere else. Changing this package
 * is a human gate: it needs a change request in docs/change-requests/ and an
 * ADR before the code moves (DEV_PLAN.human_gates).
 *
 * Status: SEEDED BY P0-T6 from DEV_PLAN.domain_frame defaults, marked
 * ASSUMPTION until docs/04_ARCHITECTURE.md exists and is approved. The entity
 * schemas themselves land in P1-01-T1 (wt-01-core-domain).
 */
export * from './common.ts';
export * from './pipeline.ts';
export * from './roles.ts';
export * from './events.ts';
