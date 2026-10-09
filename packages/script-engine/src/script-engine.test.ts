import { describe, expect, it } from 'vitest';

import {
  NEXT_NODE_BUDGET_MS,
  ScriptRuntime,
  renderLine,
  requiredVariables,
  validateVersion,
  type ScriptVersionView,
} from './index.ts';

const version = (over: Partial<ScriptVersionView> = {}): ScriptVersionView => ({
  id: 'v1',
  version: 1,
  rootNodeId: 'n1',
  nodes: [
    {
      id: 'n1',
      key: 'opener',
      line: 'Hi {first_name}, this is Péter from Devora.',
      fallbackLine: 'Hi, this is Péter from Devora.',
      intent: 'open',
      outcome: null,
      isBooking: false,
      answers: [
        { id: 'a1', label: 'Go on', nextNodeId: 'n2', outcomeTag: null },
        { id: 'a2', label: 'No thanks', nextNodeId: 'n3', outcomeTag: 'brushoff' },
      ],
    },
    {
      id: 'n2',
      key: 'hook',
      line: '{signal_hook} That is usually the moment coverage is easiest to win.',
      fallbackLine: 'Most firms your size have a story and no one placing it.',
      intent: 'hook',
      outcome: null,
      isBooking: false,
      answers: [{ id: 'a3', label: 'True', nextNodeId: 'n4', outcomeTag: null }],
    },
    {
      id: 'n3',
      key: 'end_no',
      line: 'Understood.',
      fallbackLine: null,
      intent: null,
      outcome: 'not_interested',
      isBooking: false,
      answers: [],
    },
    {
      id: 'n4',
      key: 'book',
      line: 'Shall we find thirty minutes?',
      fallbackLine: null,
      intent: null,
      outcome: 'meeting_booked',
      isBooking: true,
      answers: [],
    },
  ],
  ...over,
});

describe('variable filling', () => {
  it('finds the variables a line needs', () => {
    expect(requiredVariables('Hi {first_name} at {company}')).toEqual(['first_name', 'company']);
  });

  it('fills a line when every variable has a sourced value', () => {
    const result = renderLine(version().nodes[0]!, { first_name: 'Camille' });
    expect(result.text).toBe('Hi Camille, this is Péter from Devora.');
    expect(result.usedFallback).toBe(false);
  });

  it('uses the fallback when a variable is missing, rather than reading a gap aloud', () => {
    const result = renderLine(version().nodes[1]!, {});
    expect(result.usedFallback).toBe(true);
    expect(result.text).toBe('Most firms your size have a story and no one placing it.');
  });

  it('treats an empty string as missing', () => {
    expect(renderLine(version().nodes[1]!, { signal_hook: '   ' }).usedFallback).toBe(true);
  });

  it('falls back all or nothing, never half a sentence', () => {
    const node = { line: 'A {first_name} B {company} C', fallbackLine: 'Fallback.' };
    expect(renderLine(node, { first_name: 'Camille' }).text).toBe('Fallback.');
  });

  it('leaves the placeholder visible when there is no fallback to use', () => {
    const node = { line: 'Hi {first_name}.', fallbackLine: null };
    expect(renderLine(node, {}).text).toBe('Hi {first_name}.');
  });
});

describe('runtime resolution', () => {
  const runtime = new ScriptRuntime(version());

  it('starts at the root', () => {
    expect(runtime.root.key).toBe('opener');
  });

  it('resolves the next node from an answer', () => {
    expect(runtime.next('a1')?.key).toBe('hook');
    expect(runtime.next('a2')?.key).toBe('end_no');
  });

  it('throws on an answer from another version rather than guessing', () => {
    expect(() => runtime.next('nope')).toThrow(/not in this version/u);
  });

  it('resolves well inside the 100 ms budget, because it never touches the network', () => {
    const started = performance.now();
    for (let i = 0; i < 1000; i += 1) runtime.next('a1');
    const perCall = (performance.now() - started) / 1000;
    expect(perCall).toBeLessThan(NEXT_NODE_BUDGET_MS);
    expect(perCall).toBeLessThan(1);
  });
});

describe('a published version must not strand a rep', () => {
  it('accepts a sound tree', () => {
    expect(validateVersion(version())).toEqual([]);
  });

  it('rejects an orphan node', () => {
    const broken = version();
    const withOrphan: ScriptVersionView = {
      ...broken,
      nodes: [
        ...broken.nodes,
        {
          id: 'n9',
          key: 'orphan',
          line: 'Nobody gets here.',
          fallbackLine: null,
          intent: null,
          outcome: 'x',
          isBooking: false,
          answers: [],
        },
      ],
    };
    expect(validateVersion(withOrphan).map((i) => i.nodeKey)).toContain('orphan');
  });

  it('rejects a dead end with no outcome', () => {
    const broken = version({
      nodes: version().nodes.map((n) => (n.key === 'end_no' ? { ...n, outcome: null } : n)),
    });
    expect(validateVersion(broken).some((i) => i.problem.includes('Dead end'))).toBe(true);
  });

  it('rejects an answer pointing outside the version', () => {
    const broken = version({
      nodes: version().nodes.map((n) =>
        n.key === 'opener'
          ? {
              ...n,
              answers: [{ id: 'a1', label: 'Go on', nextNodeId: 'missing', outcomeTag: null }],
            }
          : n,
      ),
    });
    expect(validateVersion(broken).some((i) => i.problem.includes('outside this version'))).toBe(
      true,
    );
  });
});
