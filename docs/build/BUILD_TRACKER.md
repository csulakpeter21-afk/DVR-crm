# Build tracker

Every task in `DEV_PLAN.json`, with its worktree and current state. Updated by the
orchestrator as worktrees land (DEV_PLAN orchestrator step 6).

States: `not_started`, `in_progress`, `blocked`, `review`, `merged`.

See `ROADMAP.md` for the ordering and the finished-UI screen inventory, and
`QUESTIONS.md` for what needs Peter.

## Summary

| Phase | Tasks | Merged | Not started | Blocked |
| ----- | ----- | ------ | ----------- | ------- |
| P0    | 6     | 6      | 0           | 0       |
| P1    | 30    | 1      | 29          | 0       |
| P2    | 16    | 0      | 0           | 16      |
| P3    | 11    | 0      | 0           | 11      |
| P4    | 4     | 0      | 0           | 4       |

## Tasks

| Task     | Worktree                      | Status        | Blocker                                 | Report                                  |
| -------- | ----------------------------- | ------------- | --------------------------------------- | --------------------------------------- |
| P0-T1    | (P0, no worktree)             | `merged`      |                                         | [P0 report](reports/PHASE_P0_report.md) |
| P0-T2    | (P0, no worktree)             | `merged`      |                                         | [P0 report](reports/PHASE_P0_report.md) |
| P0-T3    | (P0, no worktree)             | `merged`      |                                         | [P0 report](reports/PHASE_P0_report.md) |
| P0-T4    | (P0, no worktree)             | `merged`      |                                         | [P0 report](reports/PHASE_P0_report.md) |
| P0-T5    | (P0, no worktree)             | `merged`      |                                         | [P0 report](reports/PHASE_P0_report.md) |
| P0-T6    | (P0, no worktree)             | `merged`      |                                         | [P0 report](reports/PHASE_P0_report.md) |
| P1-01-T1 | wt-01-core-domain             | `not_started` |                                         |                                         |
| P1-01-T2 | wt-01-core-domain             | `not_started` |                                         |                                         |
| P1-01-T3 | wt-01-core-domain             | `not_started` |                                         |                                         |
| P1-01-T4 | wt-01-core-domain             | `not_started` |                                         |                                         |
| P1-01-T5 | wt-01-core-domain             | `not_started` |                                         |                                         |
| P1-01-T6 | wt-01-core-domain             | `not_started` |                                         |                                         |
| P1-02-T1 | wt-02-auth-rbac               | `not_started` |                                         |                                         |
| P1-02-T2 | wt-02-auth-rbac               | `not_started` |                                         |                                         |
| P1-02-T3 | wt-02-auth-rbac               | `not_started` |                                         |                                         |
| P1-03-T1 | wt-03-compliance              | `not_started` |                                         |                                         |
| P1-03-T2 | wt-03-compliance              | `not_started` |                                         |                                         |
| P1-03-T3 | wt-03-compliance              | `not_started` |                                         |                                         |
| P1-03-T4 | wt-03-compliance              | `not_started` |                                         |                                         |
| P1-03-T5 | wt-03-compliance              | `merged`      | delivered early in P0: CI depends on it |                                         |
| P1-04-T1 | wt-04-integrations-framework  | `not_started` |                                         |                                         |
| P1-04-T2 | wt-04-integrations-framework  | `not_started` |                                         |                                         |
| P1-04-T3 | wt-04-integrations-framework  | `not_started` |                                         |                                         |
| P1-04-T4 | wt-04-integrations-framework  | `not_started` |                                         |                                         |
| P1-05-T1 | wt-05-design-system-workspace | `not_started` |                                         |                                         |
| P1-05-T2 | wt-05-design-system-workspace | `not_started` |                                         |                                         |
| P1-05-T3 | wt-05-design-system-workspace | `not_started` |                                         |                                         |
| P1-06-T1 | wt-06-script-engine           | `not_started` |                                         |                                         |
| P1-06-T2 | wt-06-script-engine           | `not_started` |                                         |                                         |
| P1-06-T3 | wt-06-script-engine           | `not_started` |                                         |                                         |
| P1-06-T4 | wt-06-script-engine           | `not_started` |                                         |                                         |
| P1-06-T5 | wt-06-script-engine           | `not_started` |                                         |                                         |
| P1-07-T1 | wt-07-telephony-adapter       | `not_started` |                                         |                                         |
| P1-07-T2 | wt-07-telephony-adapter       | `not_started` |                                         |                                         |
| P1-07-T3 | wt-07-telephony-adapter       | `not_started` |                                         |                                         |
| P1-07-T4 | wt-07-telephony-adapter       | `not_started` |                                         |                                         |
| P2-08-T1 | wt-08-offer-icp-signals       | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-08-T2 | wt-08-offer-icp-signals       | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-08-T3 | wt-08-offer-icp-signals       | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-09-T1 | wt-09-sourcing-enrichment     | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-09-T2 | wt-09-sourcing-enrichment     | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-09-T3 | wt-09-sourcing-enrichment     | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-10-T1 | wt-10-dossier                 | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-10-T2 | wt-10-dossier                 | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-10-T3 | wt-10-dossier                 | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-11-T1 | wt-11-calling-live            | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-11-T2 | wt-11-calling-live            | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-11-T3 | wt-11-calling-live            | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-12-T1 | wt-12-rep-ops                 | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-12-T2 | wt-12-rep-ops                 | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-12-T3 | wt-12-rep-ops                 | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P2-12-T4 | wt-12-rep-ops                 | `blocked`     | specs M1-M7, M10 missing                |                                         |
| P3-13-T1 | wt-13-booking-handoff         | `blocked`     | specs M8, M9, M11 missing               |                                         |
| P3-13-T2 | wt-13-booking-handoff         | `blocked`     | specs M8, M9, M11 missing               |                                         |
| P3-13-T3 | wt-13-booking-handoff         | `blocked`     | specs M8, M9, M11 missing               |                                         |
| P3-13-T4 | wt-13-booking-handoff         | `blocked`     | specs M8, M9, M11 missing               |                                         |
| P3-14-T1 | wt-14-collateral              | `blocked`     | specs M8, M9, M11 missing               |                                         |
| P3-14-T2 | wt-14-collateral              | `blocked`     | specs M8, M9, M11 missing               |                                         |
| P3-15-T1 | wt-15-experimentation         | `blocked`     | specs M8, M9, M11 missing               |                                         |
| P3-15-T2 | wt-15-experimentation         | `blocked`     | specs M8, M9, M11 missing               |                                         |
| P3-15-T3 | wt-15-experimentation         | `blocked`     | specs M8, M9, M11 missing               |                                         |
| P3-16-T1 | wt-16-dashboards              | `blocked`     | specs M8, M9, M11 missing               |                                         |
| P3-16-T2 | wt-16-dashboards              | `blocked`     | specs M8, M9, M11 missing               |                                         |
| P4-17-T1 | wt-17-system-acceptance       | `blocked`     | wave 1 pilot plan missing               |                                         |
| P4-17-T2 | wt-17-system-acceptance       | `blocked`     | wave 1 pilot plan missing               |                                         |
| P4-17-T3 | wt-17-system-acceptance       | `blocked`     | wave 1 pilot plan missing               |                                         |
| P4-17-T4 | wt-17-system-acceptance       | `blocked`     | wave 1 pilot plan missing               |                                         |

## Worktree state

All 17 worktrees are checked out with dependencies installed: see
[WORKTREES.md](WORKTREES.md). Waves and model tiers are in
[EXECUTION_PLAN.md](EXECUTION_PLAN.md).

| Worktree                                    | Branch                         | Wave | Tasks | Checked out | Gate                          |
| ------------------------------------------- | ------------------------------ | ---- | ----- | ----------- | ----------------------------- |
| wt-01-core-domain (merges first)            | `feat/core-domain`             | 1    | 6     | yes         | open now                      |
| wt-03-compliance                            | `feat/compliance-engine`       | 1    | 5     | yes         | open now                      |
| wt-04-integrations-framework                | `feat/integrations-framework`  | 1    | 4     | yes         | open now                      |
| wt-06-script-engine                         | `feat/script-engine`           | 1    | 5     | yes         | open now                      |
| wt-02-auth-rbac                             | `feat/auth-rbac`               | 2    | 3     | yes         | wave 1 merged                 |
| wt-07-telephony-adapter                     | `feat/telephony-adapter`       | 2    | 4     | yes         | wave 1 merged                 |
| wt-05-design-system-workspace (merges last) | `feat/design-system-workspace` | 3    | 3     | yes         | wave 2 merged                 |
| wt-08-offer-icp-signals                     | `feat/offer-icp-signals`       | 4    | 3     | yes         | specs M1, M2, M3, M6, M7, M10 |
| wt-11-calling-live                          | `feat/calling-live`            | 4    | 3     | yes         | specs M1, M2, M3, M6, M7, M10 |
| wt-12-rep-ops                               | `feat/rep-ops`                 | 4    | 4     | yes         | specs M1, M2, M3, M6, M7, M10 |
| wt-09-sourcing-enrichment                   | `feat/sourcing-enrichment`     | 5    | 3     | yes         | wave 4 merged + specs M4, M5  |
| wt-10-dossier                               | `feat/dossier`                 | 5    | 3     | yes         | wave 4 merged + specs M4, M5  |
| wt-13-booking-handoff                       | `feat/booking-handoff`         | 6    | 4     | yes         | specs M8, M9, M11             |
| wt-14-collateral                            | `feat/collateral`              | 6    | 2     | yes         | specs M8, M9, M11             |
| wt-15-experimentation                       | `feat/experimentation`         | 6    | 3     | yes         | specs M8, M9, M11             |
| wt-16-dashboards                            | `feat/dashboards`              | 6    | 2     | yes         | specs M8, M9, M11             |
| wt-17-system-acceptance                     | `feat/system-acceptance`       | 7    | 4     | yes         | wave 1 pilot plan             |
