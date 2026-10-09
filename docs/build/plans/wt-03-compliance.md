# wt-03-compliance

- **Branch:** `feat/compliance-engine`
- **Worktree:** `/home/user/devora-wt/wt-03-compliance`
- **Phase:** P1
- **Depends on:** P0
- **Test first:** yes
- **Status:** READY

Copy linter already delivered in P0. Default country rules stay ASSUMPTIONS until M12 is approved and reviewed by counsel.

## Goal

Compliance by design: a rules engine the state machine and dialler must pass before acting.

## Paths this worktree owns

Edit nothing outside these. Two worktrees never touch one file.

- `packages/compliance`
- `apps/api/src/compliance`
- `apps/web/src/app/(admin)/compliance`

## Consumes without editing

- `packages/contracts`
- `packages/domain (hooks only)`

**`packages/contracts` is law here.** Needing a change means writing `docs/change-requests/CR-xxx.md`, not editing it. The orchestrator applies approved changes in wt-01 and tells dependants to rebase.

## Spec inputs

- `docs/specs/M12_*`

None of these spec files exist yet. Work from `DEV_PLAN.json` defaults, label each
one ASSUMPTION in the code where it is used, and add it to
`docs/02_ASSUMPTION_REGISTER.md`. Keep it behind an interface so it can be
replaced when the spec lands.

## Tasks, in order

1. **P1-03-T1 Rules engine** — CountryRule model: allowed calling windows, recording notice requirement, registry check requirement, retention period. Rules are data, editable by compliance role, versioned.
2. **P1-03-T2 Suppression** — SuppressionEntry by phone, email, contact, company domain; checked on queue, dial, email send; objection to processing moves lead to suppressed.
3. **P1-03-T3 Legal basis records** — LegalBasisRecord per contact (basis, source of data, date, assessment reference); required before queueing.
4. **P1-03-T4 Retention jobs** — Scheduled deletion or anonymisation per rule; recordings and transcripts included; audit entries kept.
5. **P1-03-T5 Copy linter** — Implements company_rules.outbound_copy_rules as a CI check for templates and seeded copy.

## Acceptance criteria

- Given a contact outside the allowed calling window for their country, When a rep tries to dial, Then the dial button is disabled and the reason is shown.
- Given a suppressed phone number, When any lead with that number is queued, Then the transition is blocked.
- Given a template containing the word 'agency' or a dash, When CI runs, Then copy-lint fails with the line reference.

## Before merging

- `pnpm verify` green: format, lint, typecheck, copy-lint, tests
- Migrations reversible
- `docs/build/reports/wt-03-compliance_report.md` written: what was built, library and API
  versions, decisions, deviations, known issues, handoffs
- No secrets, no real personal data
- Rebased on `claude/ecstatic-mendel-abdmov`

## Session prompt

Paste this into a Claude Code session opened in the worktree directory:

```
You are working in worktree wt-03-compliance on branch feat/compliance-engine of the Devora Sales Engine (a CRM that runs Devora's whole outbound sales process; Devora is a PR firm, never call it an agency). Read DEV_PLAN.json (sections product, company_rules, stack, domain_frame, global_engineering_rules, human_gates), docs/04_ARCHITECTURE.md, the specs listed in this worktree's spec_inputs, and the ADRs. Your goal: Compliance by design: a rules engine the state machine and dialler must pass before acting.. You may only edit these paths: packages/compliance, apps/api/src/compliance, apps/web/src/app/(admin)/compliance. You consume these contracts without editing them: packages/contracts, packages/domain (hooks only). Tasks, in order: P1-03-T1 Rules engine; P1-03-T2 Suppression; P1-03-T3 Legal basis records; P1-03-T4 Retention jobs; P1-03-T5 Copy linter. Acceptance criteria: Given a contact outside the allowed calling window for their country, When a rep tries to dial, Then the dial button is disabled and the reason is shown. | Given a suppressed phone number, When any lead with that number is queued, Then the transition is blocked. | Given a template containing the word 'agency' or a dash, When CI runs, Then copy-lint fails with the line reference.. Before coding: check current official docs for every library and API you use, then write a short plan in docs/build/plans/wt-03-compliance.md. Work test first where the plan says so. Rebase on integration at the start of each session. When done: all tests, lint, typecheck and copy-lint green; write docs/build/reports/wt-03-compliance_report.md (what was built, decisions, deviations, known issues, handoffs); then tell the orchestrator you are ready to merge. Stop and ask at any human gate.
```
