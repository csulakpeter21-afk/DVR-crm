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

Paste this into a Claude Code session opened in the worktree directory. It points
at the context pack, which is self-contained: a session that reads
`DEV_PLAN.json` as well is paying ~14k tokens for nothing.

```
Read docs/build/context/wt-02-auth-rbac.md and do the work it describes. It is
self-contained: do not read DEV_PLAN.json. Before coding, check the current
official docs of any library or external API you use, and write a short plan
in docs/build/plans/wt-02-auth-rbac.notes.md. Work test first where the pack says so.
Rebase on claude/ecstatic-mendel-abdmov at the start of each session. Use
`turbo run test --filter=<pkg>...` while working and `pnpm verify` once before
merging. When done, write docs/build/reports/wt-02-auth-rbac_report.md and say you are
ready to merge. Stop and ask at any human gate.
```
