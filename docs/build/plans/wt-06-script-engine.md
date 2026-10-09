# wt-06-script-engine

- **Branch:** `feat/script-engine`
- **Worktree:** `/home/user/devora-wt/wt-06-script-engine`
- **Phase:** P1
- **Depends on:** P0
- **Test first:** yes
- **Status:** READY

The 100 ms next-node budget is the constraint that shapes the design: load a whole published version client side before the call starts.

## Goal

Interactive script engine: versioned branching trees, a runtime that shows the next line instantly when the rep clicks the prospect's answer, and full path logging.

## Paths this worktree owns

Edit nothing outside these. Two worktrees never touch one file.

- `packages/script-engine`
- `apps/web/src/components/script-player`
- `apps/api/src/scripts`

## Consumes without editing

- `packages/contracts`
- `packages/ui`

**`packages/contracts` is law here.** Needing a change means writing `docs/change-requests/CR-xxx.md`, not editing it. The orchestrator applies approved changes in wt-01 and tells dependants to rebase.

## Spec inputs

- `docs/specs/M6_*`

None of these spec files exist yet. Work from `DEV_PLAN.json` defaults, label each
one ASSUMPTION in the code where it is used, and add it to
`docs/02_ASSUMPTION_REGISTER.md`. Keep it behind an interface so it can be
replaced when the spec lands.

## Tasks, in order

1. **P1-06-T1 Tree model and versioning** — ScriptTree, ScriptVersion (immutable once published), ScriptNode (line, intent, variables such as {first_name}, {signal_hook}), ScriptAnswer (label, next node, outcome tag). Validation: no orphans, no dead ends without an outcome.
2. **P1-06-T2 Runtime** — Resolve next node from answer client side with prefetch; variable filling from lead and dossier (only sourced fields); fallback lines when a variable is missing.
3. **P1-06-T3 Script player UI** — Current line large, answer buttons, back step, objection shortcut, booking node that opens the booking panel; works with keyboard only.
4. **P1-06-T4 Path logging** — CallPath with timestamps per node; script.node_answered events; supports experiment variant id.
5. **P1-06-T5 Seed script** — A synthetic placeholder tree for testing only, clearly marked as not for live use, written to the copy rules.

## Acceptance criteria

- Given a published version, When an editor changes it, Then a new version is created and live calls keep the version they started with.
- Given a rep clicks an answer, When the next node renders, Then it appears in under 100 ms on a standard laptop (no network round trip).
- Given a node needs {signal_hook} and the dossier has no sourced signal, When rendered, Then the fallback line is shown.

## Before merging

- `pnpm verify` green: format, lint, typecheck, copy-lint, tests
- Migrations reversible
- `docs/build/reports/wt-06-script-engine_report.md` written: what was built, library and API
  versions, decisions, deviations, known issues, handoffs
- No secrets, no real personal data
- Rebased on `claude/ecstatic-mendel-abdmov`

## Session prompt

Paste this into a Claude Code session opened in the worktree directory:

```
You are working in worktree wt-06-script-engine on branch feat/script-engine of the Devora Sales Engine (a CRM that runs Devora's whole outbound sales process; Devora is a PR firm, never call it an agency). Read DEV_PLAN.json (sections product, company_rules, stack, domain_frame, global_engineering_rules, human_gates), docs/04_ARCHITECTURE.md, the specs listed in this worktree's spec_inputs, and the ADRs. Your goal: Interactive script engine: versioned branching trees, a runtime that shows the next line instantly when the rep clicks the prospect's answer, and full path logging.. You may only edit these paths: packages/script-engine, apps/web/src/components/script-player, apps/api/src/scripts. You consume these contracts without editing them: packages/contracts, packages/ui. Tasks, in order: P1-06-T1 Tree model and versioning; P1-06-T2 Runtime; P1-06-T3 Script player UI; P1-06-T4 Path logging; P1-06-T5 Seed script. Acceptance criteria: Given a published version, When an editor changes it, Then a new version is created and live calls keep the version they started with. | Given a rep clicks an answer, When the next node renders, Then it appears in under 100 ms on a standard laptop (no network round trip). | Given a node needs {signal_hook} and the dossier has no sourced signal, When rendered, Then the fallback line is shown.. Before coding: check current official docs for every library and API you use, then write a short plan in docs/build/plans/wt-06-script-engine.md. Work test first where the plan says so. Rebase on integration at the start of each session. When done: all tests, lint, typecheck and copy-lint green; write docs/build/reports/wt-06-script-engine_report.md (what was built, decisions, deviations, known issues, handoffs); then tell the orchestrator you are ready to merge. Stop and ask at any human gate.
```
