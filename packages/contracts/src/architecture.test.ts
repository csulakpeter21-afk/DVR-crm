/**
 * Guards the contract that makes this package law.
 *
 * Two things are checked:
 *  1. The vocabulary in this package still matches DEV_PLAN.json. If someone
 *     edits a stage, role or event name here without going through the change
 *     request plus ADR gate, this fails.
 *  2. No other package redeclares that vocabulary
 *     (DEV_PLAN P0 acceptance criterion 3).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { EVENT_NAMES } from './events.ts';
import { PIPELINE_STAGES, SIDE_STATES } from './pipeline.ts';
import { ROLES } from './roles.ts';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..');

interface DevPlan {
  domain_frame: {
    pipeline_stages: { id: string }[];
    side_states: { id: string }[];
    roles: { id: string }[];
    event_catalogue: string[];
  };
}

const devPlan = JSON.parse(readFileSync(join(REPO_ROOT, 'DEV_PLAN.json'), 'utf8')) as DevPlan;

/** Files allowed to enumerate the vocabulary. */
const VOCABULARY_OWNERS = [
  'packages/contracts/src/pipeline.ts',
  // A transition table cannot be written without naming states. It does not
  // redefine the enum: every key and value is typed LeadState, so an invented
  // state will not compile, and its own test proves every state has an entry.
  'packages/domain/src/pipeline/transitions.ts',
  // Seed data must name the states it places demo leads in. It is not a source
  // of truth: nothing in production reads it, and the LeadState type rejects an
  // invented state.
  'packages/db/src/seed/index.ts',
  'packages/contracts/src/roles.ts',
  'packages/contracts/src/events.ts',
  'packages/contracts/src/architecture.test.ts',
];

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'coverage',
  'generated',
  'playwright-report',
  'test-results',
]);

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) sourceFiles(join(dir, entry.name), acc);
    } else if (/\.(ts|tsx)$/u.test(entry.name)) {
      acc.push(join(dir, entry.name));
    }
  }
  return acc;
}

/**
 * Production code may name one or two states in a guard, but an array literal
 * holding three is a second copy of the enum.
 *
 * Tests get a higher threshold: a table-driven test legitimately lists a few
 * states as fixtures, and a test cannot cause production drift. Copying a whole
 * enum is still caught, because every vocabulary in this package is far longer
 * than the test threshold.
 */
const PRODUCTION_THRESHOLD = 3;
const TEST_THRESHOLD = 6;

function redeclarations(
  source: string,
  vocabulary: readonly string[],
  threshold: number,
): string[] {
  const found: string[] = [];
  for (const span of source.match(/\[[^[\]]*\]/gu) ?? []) {
    const hits = vocabulary.filter((term) => new RegExp(`['"\`]${term}['"\`]`, 'u').test(span));
    if (hits.length >= threshold) found.push(hits.join(', '));
  }
  return found;
}

const thresholdFor = (file: string): number =>
  /\.test\.(ts|tsx)$|\/tests\//u.test(file) ? TEST_THRESHOLD : PRODUCTION_THRESHOLD;

describe('contracts stay in step with DEV_PLAN.json', () => {
  it('declares exactly the pipeline stages the plan lists, in order', () => {
    expect([...PIPELINE_STAGES]).toEqual(devPlan.domain_frame.pipeline_stages.map((s) => s.id));
  });

  it('declares exactly the side states the plan lists', () => {
    expect([...SIDE_STATES]).toEqual(devPlan.domain_frame.side_states.map((s) => s.id));
  });

  it('declares exactly the roles the plan lists', () => {
    expect([...ROLES]).toEqual(devPlan.domain_frame.roles.map((r) => r.id));
  });

  it('declares exactly the events the plan catalogues', () => {
    expect([...EVENT_NAMES]).toEqual(devPlan.domain_frame.event_catalogue);
  });
});

describe('no package other than @devora/contracts declares the vocabulary', () => {
  const files = sourceFiles(REPO_ROOT)
    .map((file) => relative(REPO_ROOT, file).split('\\').join('/'))
    .filter((file) => !VOCABULARY_OWNERS.includes(file));

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each([
    ['pipeline stages', [...PIPELINE_STAGES, ...SIDE_STATES]],
    ['roles', [...ROLES]],
    ['event names', [...EVENT_NAMES]],
  ])('no file redeclares %s', (label, vocabulary) => {
    const offenders = files
      .map((file) => ({
        file,
        hits: redeclarations(
          readFileSync(join(REPO_ROOT, file), 'utf8'),
          vocabulary,
          thresholdFor(file),
        ),
      }))
      .filter(({ hits }) => hits.length > 0);

    expect(
      offenders,
      `${label} may only be enumerated in @devora/contracts. Import from there instead ` +
        `(DEV_PLAN P0 acceptance criterion 3). Offenders: ` +
        offenders.map((o) => `${o.file} -> [${o.hits.join('] [')}]`).join('; '),
    ).toEqual([]);
  });
});
