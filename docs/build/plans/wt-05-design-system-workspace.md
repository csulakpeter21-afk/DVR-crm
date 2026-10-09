# wt-05-design-system-workspace

- **Branch:** `feat/design-system-workspace`
- **Worktree:** `/home/user/devora-wt/wt-05-design-system-workspace`
- **Phase:** P1
- **Depends on:** P0
- **Test first:** no
- **Status:** READY, merges last

Merges after the others so the UI is built on settled contracts. Also wire eslint-config-next, which P0 left out.

## Goal

Premium design system and the rep workspace shell: one screen, one next action.

## Paths this worktree owns

Edit nothing outside these. Two worktrees never touch one file.

- `packages/ui`
- `apps/web/src/app/(rep)`
- `apps/web/src/app/(shell)`

## Consumes without editing

- `packages/contracts`
- `apps/api (via typed client)`

**`packages/contracts` is law here.** Needing a change means writing `docs/change-requests/CR-xxx.md`, not editing it. The orchestrator applies approved changes in wt-01 and tells dependants to rebase.

## Spec inputs

- `docs/specs/*design_system*`
- `docs/specs/M10_*`

None of these spec files exist yet. Work from `DEV_PLAN.json` defaults, label each
one ASSUMPTION in the code where it is used, and add it to
`docs/02_ASSUMPTION_REGISTER.md`. Keep it behind an interface so it can be
replaced when the spec lands.

## Tasks, in order

1. **P1-05-T1 Design tokens and components** — Colour, type, spacing tokens (light and dark), buttons, inputs, tables, cards, dialogs, toasts, empty states; premium, restrained visual language; WCAG 2.2 AA.
2. **P1-05-T2 App shell per role** — Navigation and layouts for rep, team lead, qualifier, closer, growth lead, admin.
3. **P1-05-T3 Rep queue and lead screen** — Prioritised queue, lead card with dossier panel placeholder, single primary action button, keyboard shortcuts, progress tracker for the day.

## Acceptance criteria

- Given a rep opens the workspace, When the queue loads, Then exactly one primary action is visible for the top lead.
- Given axe accessibility checks, When run on every rep screen, Then there are no serious or critical violations.

## Before merging

- `pnpm verify` green: format, lint, typecheck, copy-lint, tests
- Migrations reversible
- `docs/build/reports/wt-05-design-system-workspace_report.md` written: what was built, library and API
  versions, decisions, deviations, known issues, handoffs
- No secrets, no real personal data
- Rebased on `claude/ecstatic-mendel-abdmov`

## Session prompt

Paste this into a Claude Code session opened in the worktree directory:

```
You are working in worktree wt-05-design-system-workspace on branch feat/design-system-workspace of the Devora Sales Engine (a CRM that runs Devora's whole outbound sales process; Devora is a PR firm, never call it an agency). Read DEV_PLAN.json (sections product, company_rules, stack, domain_frame, global_engineering_rules, human_gates), docs/04_ARCHITECTURE.md, the specs listed in this worktree's spec_inputs, and the ADRs. Your goal: Premium design system and the rep workspace shell: one screen, one next action.. You may only edit these paths: packages/ui, apps/web/src/app/(rep), apps/web/src/app/(shell). You consume these contracts without editing them: packages/contracts, apps/api (via typed client). Tasks, in order: P1-05-T1 Design tokens and components; P1-05-T2 App shell per role; P1-05-T3 Rep queue and lead screen. Acceptance criteria: Given a rep opens the workspace, When the queue loads, Then exactly one primary action is visible for the top lead. | Given axe accessibility checks, When run on every rep screen, Then there are no serious or critical violations.. Before coding: check current official docs for every library and API you use, then write a short plan in docs/build/plans/wt-05-design-system-workspace.md. Work test first where the plan says so. Rebase on integration at the start of each session. When done: all tests, lint, typecheck and copy-lint green; write docs/build/reports/wt-05-design-system-workspace_report.md (what was built, decisions, deviations, known issues, handoffs); then tell the orchestrator you are ready to merge. Stop and ask at any human gate.
```
