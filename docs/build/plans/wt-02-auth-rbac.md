# wt-02-auth-rbac

- **Branch:** `feat/auth-rbac`
- **Worktree:** `/home/user/devora-wt/wt-02-auth-rbac`
- **Phase:** P1
- **Depends on:** P0
- **Test first:** yes
- **Status:** READY

Starts against the P0 contracts seed; rebase after wt-01 merges.

## Goal

Authentication, sessions and role-based access control for all roles in domain_frame.roles.

## Paths this worktree owns

Edit nothing outside these. Two worktrees never touch one file.

- `apps/api/src/auth`
- `apps/web/src/auth`
- `packages/domain/src/permissions`

## Consumes without editing

- `packages/contracts`

**`packages/contracts` is law here.** Needing a change means writing `docs/change-requests/CR-xxx.md`, not editing it. The orchestrator applies approved changes in wt-01 and tells dependants to rebase.

## Spec inputs

- `docs/04_ARCHITECTURE.md`

None of these spec files exist yet. Work from `DEV_PLAN.json` defaults, label each
one ASSUMPTION in the code where it is used, and add it to
`docs/02_ASSUMPTION_REGISTER.md`. Keep it behind an interface so it can be
replaced when the spec lands.

## Tasks, in order

1. **P1-02-T1 Auth** — Login, logout, sessions, password reset, rate limiting, secure cookies.
2. **P1-02-T2 RBAC** — Permission matrix per role; API middleware; UI route guards; row-level rules (reps see own queue, team leads see their team).
3. **P1-02-T3 Admin user management** — Invite users, assign roles and teams, deactivate users (keeps audit history).

## Acceptance criteria

- Given a rep, When requesting another rep's lead, Then the API returns 403 and the attempt is audit logged.
- Given a deactivated user, When they try to log in, Then access is denied and existing sessions are revoked.

## Before merging

- `pnpm verify` green: format, lint, typecheck, copy-lint, tests
- Migrations reversible
- `docs/build/reports/wt-02-auth-rbac_report.md` written: what was built, library and API
  versions, decisions, deviations, known issues, handoffs
- No secrets, no real personal data
- Rebased on `claude/ecstatic-mendel-abdmov`

## Session prompt

Paste this into a Claude Code session opened in the worktree directory:

```
You are working in worktree wt-02-auth-rbac on branch feat/auth-rbac of the Devora Sales Engine (a CRM that runs Devora's whole outbound sales process; Devora is a PR firm, never call it an agency). Read DEV_PLAN.json (sections product, company_rules, stack, domain_frame, global_engineering_rules, human_gates), docs/04_ARCHITECTURE.md, the specs listed in this worktree's spec_inputs, and the ADRs. Your goal: Authentication, sessions and role-based access control for all roles in domain_frame.roles.. You may only edit these paths: apps/api/src/auth, apps/web/src/auth, packages/domain/src/permissions. You consume these contracts without editing them: packages/contracts. Tasks, in order: P1-02-T1 Auth; P1-02-T2 RBAC; P1-02-T3 Admin user management. Acceptance criteria: Given a rep, When requesting another rep's lead, Then the API returns 403 and the attempt is audit logged. | Given a deactivated user, When they try to log in, Then access is denied and existing sessions are revoked.. Before coding: check current official docs for every library and API you use, then write a short plan in docs/build/plans/wt-02-auth-rbac.md. Work test first where the plan says so. Rebase on integration at the start of each session. When done: all tests, lint, typecheck and copy-lint green; write docs/build/reports/wt-02-auth-rbac_report.md (what was built, decisions, deviations, known issues, handoffs); then tell the orchestrator you are ready to merge. Stop and ask at any human gate.
```
