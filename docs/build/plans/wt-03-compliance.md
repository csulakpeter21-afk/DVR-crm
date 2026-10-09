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

Paste this into a Claude Code session opened in the worktree directory. It points
at the context pack, which is self-contained: a session that reads
`DEV_PLAN.json` as well is paying ~14k tokens for nothing.

```
Read docs/build/context/wt-03-compliance.md and do the work it describes. It is
self-contained: do not read DEV_PLAN.json. Before coding, check the current
official docs of any library or external API you use, and write a short plan
in docs/build/plans/wt-03-compliance.notes.md. Work test first where the pack says so.
Rebase on claude/ecstatic-mendel-abdmov at the start of each session. Use
`turbo run test --filter=<pkg>...` while working and `pnpm verify` once before
merging. When done, write docs/build/reports/wt-03-compliance_report.md and say you are
ready to merge. Stop and ask at any human gate.
```
