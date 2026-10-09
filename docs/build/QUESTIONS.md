# Questions for Peter

Human gates and clarifications, newest first. Each carries a recommended answer so
a decision needs a yes or a no, not an essay.

Nothing in this file blocks P0. Q-002 and Q-003 block part of P1; Q-004 blocks P2.

---

## Q-001 French punctuation versus the copy rule (blocks French templates, P3)

`company_rules.outbound_copy_rules` says "no space before punctuation", and also
says French messages sign off `Bien à vous,` then `Péter`. French typography
normally puts a space before `!`, `?`, `:` and `;` ("Bonjour !"). As written, the
copy linter flags correct French.

**Recommended answer:** keep the rule for `,` and `.` in all languages, and allow
the space before `! ? : ;` in French templates only. The linter already supports a
per-file exception, so this is a one-line change.

**Status:** open. Not urgent: no French template exists yet.

---

## Q-002 Telephony vendor (human gate, blocks wt-07 beyond the mock)

`DEV_PLAN.stack.telephony` requires EU data residency, browser calling, recording,
recording-notice playback, webhooks and CRM-side call logging. Choosing one is a
paid-vendor human gate.

**Recommended answer:** build P1 entirely against the mock provider, which is what
wt-07 does, and decide after the P1 acceptance demo, when the call flow is visible
and the shortlist can be judged against something real. A comparison goes in
ADR-002 before any account is opened.

**Status:** open, not blocking. wt-07 ships a mock provider.

---

## Q-003 Transcription vendor (human gate, blocks wt-11)

Needs the languages of the target markets, diarisation and an EU processing option.

**Recommended answer:** same as Q-002. Decide in ADR-003 once there are real call
recordings from the pilot to test accuracy against. Target markets need confirming
first: the plan mentions French; which others?

**Status:** open. Blocks P2 wt-11, which is already behind a spec gate.

---

## Q-004 The missing specs (blocks P2, P3, P4)

P2 to P4 are `blocked_until_spec_gate`. None of the required files exist:

- P2 needs `docs/specs/M1` through `M7` and `M10`
- P3 needs `M8`, `M9`, `M11`
- P4 needs the wave 1 pilot plan
- wt-03 compliance wants `M12`

**Recommended answer:** P1 needs none of them, so the build is not blocked today.
The one worth writing first is **M6 (the call script)**, because the script tree is
the heart of the product and wt-06 is currently building the engine against a
synthetic placeholder tree. M12 (compliance) is second, and should be reviewed by
counsel, since the default country rules are assumptions.

**Status:** open.

---

## Q-005 Branching, this session only (resolved by constraint)

`DEV_PLAN.git_strategy` asks for `main` plus `integration` plus one branch per
worktree. This session is constrained to push only to
`claude/ecstatic-mendel-abdmov`.

**What was done:** that branch plays the role of `integration`. Worktrees are real
`git worktree` checkouts on their own `feat/*` branches, created from it and merged
back into it locally. Recorded in the P0 report as a deviation.

**Status:** resolved for now; tell me if you want the full three-tier branch
layout on the remote instead.
