/**
 * The outbound copy rules, from DEV_PLAN.company_rules.
 *
 * Devora is a PR firm. Every one of these rules exists because a prospect or a
 * journalist reads the output, so a breach is a brand defect, not a style nit.
 * Each rule below maps to one line of
 * company_rules.outbound_copy_rules_for_templates_and_ui.
 */

export interface CopyViolation {
  readonly rule: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
  readonly excerpt: string;
}

export interface CopyRule {
  readonly id: string;
  /** The plan line this enforces. */
  readonly source: string;
  readonly check: (line: string, lineNumber: number) => CopyViolation[];
}

const violation = (
  rule: string,
  lineNumber: number,
  index: number,
  message: string,
  line: string,
): CopyViolation => ({
  rule,
  line: lineNumber,
  column: index + 1,
  message,
  excerpt: line.trim().slice(0, 120),
});

/** Matches every occurrence of a pattern and reports each one. */
const eachMatch =
  (rule: string, pattern: RegExp, message: string): CopyRule['check'] =>
  (line, lineNumber) => {
    const found: CopyViolation[] = [];
    const re = new RegExp(
      pattern.source,
      pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
    );
    let match: RegExpExecArray | null;
    while ((match = re.exec(line)) !== null) {
      found.push(violation(rule, lineNumber, match.index, message, line));
      if (match[0] === '') re.lastIndex += 1;
    }
    return found;
  };

export const COPY_RULES: readonly CopyRule[] = [
  {
    id: 'no-agency',
    source: "never 'agency'",
    check: eachMatch(
      'no-agency',
      /\bagenc(y|ies)\b/iu,
      'Devora is a PR firm. Write "PR firm" or "firm", never "agency".',
    ),
  },
  {
    id: 'no-dashes',
    source: 'no dashes in outbound copy',
    /**
     * ASSUMPTION A-001: "dashes" is read as dashes used as punctuation, that is
     * em dash, en dash, a double hyphen, and a hyphen standing alone between
     * spaces. Hyphens inside compound words are not flagged, because Devora's
     * own approved service copy uses them ("top-tier media outlets").
     */
    check: eachMatch(
      'no-dashes',
      /—|–|--+|(?<=\s)-(?=\s)/u,
      'No dashes in outbound copy. Use a comma, a full stop or a separate sentence.',
    ),
  },
  {
    id: 'no-space-before-punctuation',
    source: 'no space before punctuation',
    check: eachMatch(
      'no-space-before-punctuation',
      // Requires real text before the space, so code indentation and a
      // wrapped method chain are not mistaken for prose.
      /(?<=\S)[ \t]+(?=[,.;:!?])/u,
      'No space before punctuation.',
    ),
  },
  {
    id: 'financial-times-in-full',
    source: "when listing outlets: Forbes first, and write 'Financial Times'",
    check: eachMatch(
      'financial-times-in-full',
      /\bFT\b/u,
      'Write "Financial Times" in full, never "FT".',
    ),
  },
  {
    id: 'forbes-first',
    source: "when listing outlets: Forbes first, and write 'Financial Times'",
    check: (line, lineNumber) => {
      const outlets = [
        'Forbes',
        'Financial Times',
        'Bloomberg',
        'Reuters',
        'TechCrunch',
        'Wired',
        'The Wall Street Journal',
        'Business Insider',
        'Fortune',
      ];
      const positions = outlets
        .map((outlet) => ({ outlet, at: line.indexOf(outlet) }))
        .filter(({ at }) => at >= 0)
        .sort((a, b) => a.at - b.at);

      // Only a list of two or more outlets has an order to get wrong.
      if (positions.length < 2) return [];
      const forbes = positions.find(({ outlet }) => outlet === 'Forbes');
      if (!forbes || positions[0]?.outlet === 'Forbes') return [];

      return [
        violation(
          'forbes-first',
          lineNumber,
          forbes.at,
          `When outlets are listed, Forbes comes first. Found "${positions[0]?.outlet ?? ''}" ahead of it.`,
          line,
        ),
      ];
    },
  },
  {
    id: 'no-english-signature',
    source: 'no signature in English emails',
    check: eachMatch(
      'no-english-signature',
      /^\s*(best regards|kind regards|warm regards|sincerely|yours (sincerely|faithfully|truly)|regards|best|cheers|thanks and regards)\s*,?\s*$/iu,
      'English emails carry no signature. Remove the sign off.',
    ),
  },
];

/** Lines carrying this marker are skipped, with the reason recorded in the file. */
export const DISABLE_MARKER = 'devora-copy-lint-disable-next-line';
