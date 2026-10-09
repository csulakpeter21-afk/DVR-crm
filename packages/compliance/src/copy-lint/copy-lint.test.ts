/**
 * DEV_PLAN.global_engineering_rules: "Every compliance rule has a test that
 * proves the platform blocks the forbidden action."
 *
 * One blocking test per outbound copy rule, plus the allowed counter-example so
 * the rules cannot quietly become unusable.
 */
import { describe, expect, it } from 'vitest';

import { COPY_RULES, isCopyFile, lintCopy, maskToStringLiterals } from './index.ts';

const rulesHit = (text: string): string[] => [...new Set(lintCopy(text).map((v) => v.rule))];

describe('no-agency', () => {
  it('blocks "agency"', () => {
    expect(rulesHit('We are a PR agency that gets you covered.')).toContain('no-agency');
  });

  it('blocks "agencies" and ignores case', () => {
    expect(rulesHit('Most Agencies promise coverage.')).toContain('no-agency');
  });

  it('allows "PR firm"', () => {
    expect(rulesHit('We are a PR firm that gets you covered.')).not.toContain('no-agency');
  });
});

describe('no-dashes', () => {
  it.each([
    ['em dash', 'Coverage in weeks — not months.'],
    ['en dash', 'Coverage in 2–14 weeks.'],
    ['double hyphen', 'Coverage in weeks -- not months.'],
    ['standalone hyphen', 'Coverage in weeks - not months.'],
  ])('blocks a %s', (_label, text) => {
    expect(rulesHit(text)).toContain('no-dashes');
  });

  it('allows hyphenated compounds, which Devora’s own service copy uses', () => {
    expect(rulesHit('Editorial coverage across 500+ top-tier media outlets.')).not.toContain(
      'no-dashes',
    );
  });
});

describe('no-space-before-punctuation', () => {
  it('blocks a space before a comma', () => {
    expect(rulesHit('Forbes , Financial Times and Bloomberg.')).toContain(
      'no-space-before-punctuation',
    );
  });

  it('allows normal punctuation', () => {
    expect(rulesHit('Forbes, Financial Times and Bloomberg.')).not.toContain(
      'no-space-before-punctuation',
    );
  });
});

describe('financial-times-in-full', () => {
  it('blocks the abbreviation', () => {
    expect(rulesHit('Seen in Forbes and the FT last month.')).toContain('financial-times-in-full');
  });

  it('allows the full name', () => {
    expect(rulesHit('Seen in Forbes and the Financial Times last month.')).not.toContain(
      'financial-times-in-full',
    );
  });
});

describe('forbes-first', () => {
  it('blocks an outlet list that does not start with Forbes', () => {
    expect(rulesHit('Coverage in Bloomberg, Forbes and the Financial Times.')).toContain(
      'forbes-first',
    );
  });

  it('allows a list led by Forbes', () => {
    expect(rulesHit('Coverage in Forbes, the Financial Times and Bloomberg.')).not.toContain(
      'forbes-first',
    );
  });

  it('ignores a single outlet, which has no order to get wrong', () => {
    expect(rulesHit('Coverage in Bloomberg last month.')).not.toContain('forbes-first');
  });
});

describe('no-english-signature', () => {
  it('blocks an English sign off', () => {
    expect(rulesHit('Happy to share the detail.\nBest regards,\n')).toContain(
      'no-english-signature',
    );
  });

  it('allows the French sign off the plan prescribes', () => {
    expect(rulesHit('Au plaisir d’échanger.\nBien à vous,\nPéter\n')).not.toContain(
      'no-english-signature',
    );
  });
});

describe('reporting', () => {
  it('reports the line and column so CI output is actionable', () => {
    const [violation] = lintCopy('Line one is fine.\nWe are an agency.');
    expect(violation).toMatchObject({ rule: 'no-agency', line: 2 });
    expect(violation?.column).toBeGreaterThan(0);
  });

  it('honours the disable marker for a deliberate exception', () => {
    const text = '<!-- devora-copy-lint-disable-next-line quoting a prospect -->\n"your agency"';
    expect(rulesHit(text)).toHaveLength(0);
  });

  it('covers every declared rule', () => {
    expect(COPY_RULES.map((rule) => rule.id)).toEqual([
      'no-agency',
      'no-dashes',
      'no-space-before-punctuation',
      'financial-times-in-full',
      'forbes-first',
      'no-english-signature',
    ]);
  });
});

describe('file selection', () => {
  it.each([
    'apps/worker/src/collateral/templates/one-pager.ts',
    'packages/db/src/seed/leads.ts',
    'apps/api/src/meetings/confirmation.email.ts',
  ])('lints %s', (path) => {
    expect(isCopyFile(path)).toBe(true);
  });

  it.each(['packages/domain/src/index.ts', 'apps/web/next.config.ts'])(
    'leaves %s to ESLint',
    (path) => {
      expect(isCopyFile(path)).toBe(false);
    },
  );
});

describe('code files are linted inside their string literals only', () => {
  const template = [
    "export const subject = 'We are a PR agency';",
    '// a comment mentioning an agency is not prospect-facing copy',
    'const indented = value',
    "  .split('_')",
    "  .join(' ');",
  ].join('\n');

  it('still catches a breach inside a string literal', () => {
    const violations = lintCopy(template, 'apps/api/src/x.email.ts');
    expect(violations.map((v) => v.rule)).toContain('no-agency');
    expect(violations.find((v) => v.rule === 'no-agency')?.line).toBe(1);
  });

  it('does not mistake an indented method chain for prose punctuation', () => {
    const violations = lintCopy(template, 'apps/api/src/x.email.ts');
    expect(violations.map((v) => v.rule)).not.toContain('no-space-before-punctuation');
  });

  it('ignores code comments, which no prospect reads', () => {
    const violations = lintCopy(template, 'apps/api/src/x.email.ts');
    expect(violations.every((v) => v.line !== 2)).toBe(true);
  });

  it('lints a prose file whole, including its HTML comments', () => {
    const html = '<!-- our agency -->\n<p>Hello</p>';
    expect(lintCopy(html, 'templates/mail.html').map((v) => v.rule)).toContain('no-agency');
  });

  it('keeps line and column positions aligned when masking', () => {
    const masked = maskToStringLiterals("const a = 'agency';\nconst b = 1;");
    expect(masked.split('\n')).toHaveLength(2);
    expect(masked.indexOf('agency')).toBe("const a = '".length);
  });
});
