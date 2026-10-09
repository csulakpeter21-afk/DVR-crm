/**
 * @devora/script-engine holds the branching script tree model, its versioning
 * rules and the runtime that shows a rep the next line the instant they click
 * the prospect's answer.
 *
 * P0 SHELL. Tree model, runtime, path logging and the seed tree are P1-06
 * (wt-06-script-engine).
 *
 * The runtime budget is the hard constraint that shapes the design: the next
 * node must render in under 100 ms with no network round trip
 * (DEV_PLAN wt-06 acceptance criteria), so a whole published version is loaded
 * into the client before the call starts.
 */

/** Milliseconds a rep may wait for the next line to appear. */
export const NEXT_NODE_BUDGET_MS = 100;
