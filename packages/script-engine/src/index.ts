/**
 * @devora/script-engine: the branching script model and its runtime (P1-06).
 *
 * The hard constraint shapes the whole design: when a rep clicks the prospect's
 * answer, the next line must appear in under 100 ms with no network round trip.
 * So a published version is loaded whole before the call starts and resolved in
 * memory. Nothing here does I/O.
 */

/** Milliseconds a rep may wait for the next line to appear. */
export const NEXT_NODE_BUDGET_MS = 100;

export interface ScriptAnswerView {
  readonly id: string;
  readonly label: string;
  readonly nextNodeId: string | null;
  readonly outcomeTag: string | null;
}

export interface ScriptNodeView {
  readonly id: string;
  readonly key: string;
  readonly line: string;
  readonly fallbackLine: string | null;
  readonly intent: string | null;
  readonly outcome: string | null;
  readonly isBooking: boolean;
  readonly answers: readonly ScriptAnswerView[];
}

export interface ScriptVersionView {
  readonly id: string;
  readonly version: number;
  readonly rootNodeId: string;
  readonly nodes: readonly ScriptNodeView[];
}

/**
 * Values a script line may interpolate. Only sourced fields belong here: a
 * variable with no source must fall back rather than invent.
 */
export interface ScriptVariables {
  readonly first_name?: string;
  readonly company?: string;
  /** The one line from a sourced signal that explains why the rep called. */
  readonly signal_hook?: string;
}

const PLACEHOLDER = /\{([a-z_]+)\}/gu;

/** The variables a line needs. Used to decide whether the fallback applies. */
export const requiredVariables = (line: string): string[] => [
  ...new Set([...line.matchAll(PLACEHOLDER)].map((match) => match[1] ?? '')),
];

/**
 * Fills a line, or returns the fallback when any variable has no sourced value.
 *
 * It is all or nothing on purpose. A half-filled line ("They raised and the
 * story went nowhere") is worse than a general one, because the rep reads it
 * out loud before they notice.
 */
export const renderLine = (
  node: Pick<ScriptNodeView, 'line' | 'fallbackLine'>,
  variables: ScriptVariables,
): { readonly text: string; readonly usedFallback: boolean } => {
  const needed = requiredVariables(node.line);
  const missing = needed.filter((name) => {
    const value = variables[name as keyof ScriptVariables];
    return value === undefined || value.trim() === '';
  });

  if (missing.length > 0 && node.fallbackLine) {
    return { text: node.fallbackLine, usedFallback: true };
  }

  const text = node.line.replace(PLACEHOLDER, (whole, name: string) => {
    const value = variables[name as keyof ScriptVariables];
    return value === undefined || value.trim() === '' ? whole : value;
  });

  return { text, usedFallback: false };
};

/** An index for in-memory resolution, built once when the call starts. */
export class ScriptRuntime {
  readonly #nodes: ReadonlyMap<string, ScriptNodeView>;
  readonly #answers: ReadonlyMap<string, ScriptAnswerView>;
  readonly version: ScriptVersionView;

  constructor(version: ScriptVersionView) {
    this.version = version;
    this.#nodes = new Map(version.nodes.map((node) => [node.id, node]));
    this.#answers = new Map(
      version.nodes.flatMap((node) => node.answers.map((answer) => [answer.id, answer])),
    );
  }

  get root(): ScriptNodeView {
    return this.node(this.version.rootNodeId);
  }

  node(id: string): ScriptNodeView {
    const node = this.#nodes.get(id);
    if (!node) throw new Error(`Script node ${id} is not in version ${this.version.version}.`);
    return node;
  }

  /** The whole point: answer in, next node out, no await. */
  next(answerId: string): ScriptNodeView | null {
    const answer = this.#answers.get(answerId);
    if (!answer) throw new Error(`Script answer ${answerId} is not in this version.`);
    return answer.nextNodeId === null ? null : this.node(answer.nextNodeId);
  }

  answer(answerId: string): ScriptAnswerView {
    const answer = this.#answers.get(answerId);
    if (!answer) throw new Error(`Script answer ${answerId} is not in this version.`);
    return answer;
  }
}

export interface ValidationIssue {
  readonly nodeKey: string;
  readonly problem: string;
}

/**
 * A published version must have no orphans and no dead ends without an outcome
 * (P1-06-T1). A rep who reaches a node with nothing to click is stranded on a
 * live call, so this runs before publish, not after.
 */
export const validateVersion = (version: ScriptVersionView): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const byId = new Map(version.nodes.map((node) => [node.id, node]));

  const reachable = new Set<string>();
  const walk = (id: string): void => {
    if (reachable.has(id)) return;
    reachable.add(id);
    for (const answer of byId.get(id)?.answers ?? []) {
      if (answer.nextNodeId) walk(answer.nextNodeId);
    }
  };
  if (byId.has(version.rootNodeId)) walk(version.rootNodeId);

  for (const node of version.nodes) {
    if (!reachable.has(node.id)) {
      issues.push({ nodeKey: node.key, problem: 'Orphan: no answer leads here.' });
    }
    if (node.answers.length === 0 && !node.outcome) {
      issues.push({
        nodeKey: node.key,
        problem: 'Dead end: no answers and no outcome, so the rep would be stranded.',
      });
    }
    for (const answer of node.answers) {
      if (answer.nextNodeId && !byId.has(answer.nextNodeId)) {
        issues.push({
          nodeKey: node.key,
          problem: `Answer "${answer.label}" points at a node outside this version.`,
        });
      }
      if (!answer.nextNodeId && !node.outcome) {
        issues.push({
          nodeKey: node.key,
          problem: `Answer "${answer.label}" leads nowhere and the node has no outcome.`,
        });
      }
    }
  }

  return issues;
};
