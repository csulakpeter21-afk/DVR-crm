# wt-07-telephony-adapter

- **Branch:** `feat/telephony-adapter`
- **Worktree:** `/home/user/devora-wt/wt-07-telephony-adapter`
- **Phase:** P1
- **Depends on:** P0, wt-04-integrations-framework
- **Test first:** yes
- **Status:** BLOCKED on wt-04

Needs the adapter framework (P1-04-T1) merged. Mock provider only: the vendor is a human gate, Q-002.

## Goal

Calling inside the CRM through a provider adapter (mock now, vendor after ADR): dial, call state, recording with notice, call logging synced to the lead.

## Paths this worktree owns

Edit nothing outside these. Two worktrees never touch one file.

- `packages/integrations/src/telephony`
- `apps/web/src/components/dialler`
- `apps/api/src/calls`

## Consumes without editing

- `packages/contracts`
- `packages/compliance`
- `packages/integrations (framework)`

**`packages/contracts` is law here.** Needing a change means writing `docs/change-requests/CR-xxx.md`, not editing it. The orchestrator applies approved changes in wt-01 and tells dependants to rebase.

## Spec inputs

- `docs/specs/M7_*`
- `docs/adr/*telephony*`

None of these spec files exist yet. Work from `DEV_PLAN.json` defaults, label each
one ASSUMPTION in the code where it is used, and add it to
`docs/02_ASSUMPTION_REGISTER.md`. Keep it behind an interface so it can be
replaced when the spec lands.

## Tasks, in order

1. **P1-07-T1 Call model and lifecycle** — Call, Recording, CallTag; states started, ringing, connected, ended; maps to pipeline transitions dialled, connected, conversation.
2. **P1-07-T2 Dialler component** — Click to call from lead screen, mute, hold, hang up, disposition picker; compliance pre-check before dial.
3. **P1-07-T3 Recording notice** — If CountryRule requires notice, the platform plays or prompts the notice and records that it happened; recording does not start before the notice step completes.
4. **P1-07-T4 Mock provider** — Simulates answer, no answer, voicemail, busy, failed, with webhooks.

## Acceptance criteria

- Given a country rule requiring recording notice, When a call connects, Then no recording exists before the notice event is logged.
- Given a call ends after 75 seconds with decision maker tagged, When the disposition is saved, Then the lead moves to conversation through the state machine.

## Before merging

- `pnpm verify` green: format, lint, typecheck, copy-lint, tests
- Migrations reversible
- `docs/build/reports/wt-07-telephony-adapter_report.md` written: what was built, library and API
  versions, decisions, deviations, known issues, handoffs
- No secrets, no real personal data
- Rebased on `claude/ecstatic-mendel-abdmov`

## Session prompt

Paste this into a Claude Code session opened in the worktree directory. It points
at the context pack, which is self-contained: a session that reads
`DEV_PLAN.json` as well is paying ~14k tokens for nothing.

```
Read docs/build/context/wt-07-telephony-adapter.md and do the work it describes. It is
self-contained: do not read DEV_PLAN.json. Before coding, check the current
official docs of any library or external API you use, and write a short plan
in docs/build/plans/wt-07-telephony-adapter.notes.md. Work test first where the pack says so.
Rebase on claude/ecstatic-mendel-abdmov at the start of each session. Use
`turbo run test --filter=<pkg>...` while working and `pnpm verify` once before
merging. When done, write docs/build/reports/wt-07-telephony-adapter_report.md and say you are
ready to merge. Stop and ask at any human gate.
```
