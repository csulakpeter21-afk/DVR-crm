/**
 * CI entry point for the copy linter.
 * Usage: tsx src/copy-lint/cli.ts [root]   (default root: the repository root)
 * Exits 1 with file:line references when any outbound copy rule is broken.
 */
import { fileURLToPath } from 'node:url';

import { COPY_RULES, formatReports, lintCopyTree } from './index.ts';

const root = process.argv[2] ?? fileURLToPath(new URL('../../../..', import.meta.url));
const reports = lintCopyTree(root);
const total = reports.reduce((sum, report) => sum + report.violations.length, 0);

if (total === 0) {
  console.warn(`copy-lint: clean. ${COPY_RULES.length} outbound copy rules checked under ${root}`);
  process.exit(0);
}

console.error(formatReports(reports));
console.error(
  `\ncopy-lint: ${total} violation${total === 1 ? '' : 's'} in ${reports.length} file${
    reports.length === 1 ? '' : 's'
  }. See DEV_PLAN.company_rules.`,
);
process.exit(1);
