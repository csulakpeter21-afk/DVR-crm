/**
 * Copy linter: fails CI when a template or any seeded copy breaks
 * DEV_PLAN.company_rules (P1-03-T5, live from P0 because CI depends on it).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';

import { isProseFile, maskToStringLiterals } from './mask.ts';
import { COPY_RULES, DISABLE_MARKER, type CopyViolation } from './rules.ts';

export { isProseFile, maskToStringLiterals } from './mask.ts';
export { COPY_RULES, DISABLE_MARKER } from './rules.ts';
export type { CopyRule, CopyViolation } from './rules.ts';

export interface FileReport {
  readonly file: string;
  readonly violations: readonly CopyViolation[];
}

/**
 * Directories whose contents are prospect-facing copy. A file anywhere under
 * one of these is linted.
 */
const COPY_DIRECTORIES = ['templates', 'copy', 'seed', 'collateral', 'scripts-content'];

/** Suffixes that mark a single file as copy wherever it sits. */
const COPY_FILE_PATTERN = /\.(copy|template|email|script)\.(ts|tsx|json|md|html|txt)$/u;

const LINTABLE_EXTENSION = /\.(ts|tsx|json|md|mdx|html|txt|hbs)$/u;

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

/** True when this path holds copy a prospect could read. */
export const isCopyFile = (relativePath: string): boolean => {
  const segments = relativePath.split(/[\\/]/u);
  if (!LINTABLE_EXTENSION.test(relativePath)) return false;
  // Tests about the linter contain deliberate breaches.
  if (/\.test\.(ts|tsx)$/u.test(relativePath)) return false;
  if (segments.some((segment) => COPY_DIRECTORIES.includes(segment))) return true;
  return COPY_FILE_PATTERN.test(basename(relativePath));
};

/**
 * Runs every rule over one file's text.
 *
 * `path` decides how much of the file counts as copy: prose files are linted
 * whole, code files only inside their string literals.
 */
export const lintCopy = (text: string, path = 'inline.md'): CopyViolation[] => {
  const subject = isProseFile(path) ? text : maskToStringLiterals(text);
  const lines = subject.split(/\r?\n/u);
  const rawLines = text.split(/\r?\n/u);
  const violations: CopyViolation[] = [];

  lines.forEach((line, index) => {
    // The marker is read from the raw source: in a code file it usually sits in
    // a comment, which masking has already blanked.
    if (rawLines[index - 1]?.includes(DISABLE_MARKER)) return;
    if (rawLines[index]?.includes(DISABLE_MARKER)) return;
    for (const rule of COPY_RULES) violations.push(...rule.check(line, index + 1));
  });

  return violations.sort((a, b) => a.line - b.line || a.column - b.column);
};

function walk(dir: string, acc: string[]): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name), acc);
    } else {
      acc.push(join(dir, entry.name));
    }
  }
  return acc;
}

/** Lints every copy file under `root`. */
export const lintCopyTree = (root: string): FileReport[] => {
  const files = statSync(root).isDirectory() ? walk(root, []) : [root];
  return files
    .map((file) => ({ file: relative(root, file).split(sep).join('/'), absolute: file }))
    .filter(({ file }) => isCopyFile(file))
    .map(({ file, absolute }) => ({
      file,
      violations: lintCopy(readFileSync(absolute, 'utf8'), file),
    }))
    .filter(({ violations }) => violations.length > 0);
};

/** Renders reports as `file:line:column  rule  message`, the form CI quotes. */
export const formatReports = (reports: readonly FileReport[]): string =>
  reports
    .flatMap(({ file, violations }) =>
      violations.map(
        (v) => `${file}:${v.line}:${v.column}  ${v.rule}  ${v.message}\n    ${v.excerpt}`,
      ),
    )
    .join('\n');
