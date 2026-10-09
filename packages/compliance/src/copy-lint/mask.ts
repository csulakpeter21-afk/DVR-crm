/**
 * In a code file the prospect-facing copy lives in string literals, not in the
 * code around them. Linting the whole file flags things like indented method
 * chains as "space before punctuation", so code is masked down to its string
 * literals first.
 *
 * Masking replaces every other character with a space and keeps newlines, so
 * the line and column numbers a violation reports still point at the real
 * source position.
 */

/** Extensions whose entire content is prose a prospect could read. */
const PROSE_EXTENSIONS = /\.(md|mdx|txt|html|hbs)$/u;

export const isProseFile = (path: string): boolean => PROSE_EXTENSIONS.test(path);

type State = 'code' | 'single' | 'double' | 'template' | 'line-comment' | 'block-comment';

/**
 * Blanks everything outside string literals. Comments are blanked too: a code
 * comment is not copy a prospect sees, and comments inside prose files are
 * covered because those files are linted whole.
 */
export const maskToStringLiterals = (source: string): string => {
  const out: string[] = [];
  let state: State = 'code';

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i] ?? '';
    const next = source[i + 1] ?? '';
    const keepNewline = char === '\n' || char === '\r';

    switch (state) {
      case 'code':
        if (char === '/' && next === '/') {
          state = 'line-comment';
          out.push(' ');
        } else if (char === '/' && next === '*') {
          state = 'block-comment';
          out.push(' ');
        } else if (char === "'") {
          state = 'single';
          out.push(' ');
        } else if (char === '"') {
          state = 'double';
          out.push(' ');
        } else if (char === '`') {
          state = 'template';
          out.push(' ');
        } else {
          out.push(keepNewline ? char : ' ');
        }
        break;

      case 'line-comment':
        if (keepNewline) state = 'code';
        out.push(keepNewline ? char : ' ');
        break;

      case 'block-comment':
        if (char === '*' && next === '/') {
          state = 'code';
          out.push(' ', ' ');
          i += 1;
        } else {
          out.push(keepNewline ? char : ' ');
        }
        break;

      case 'single':
      case 'double':
      case 'template': {
        const quote = state === 'single' ? "'" : state === 'double' ? '"' : '`';
        if (char === '\\') {
          // Keep the escape and its target so column numbers stay aligned.
          out.push(' ', ' ');
          i += 1;
        } else if (char === quote) {
          state = 'code';
          out.push(' ');
        } else {
          out.push(char);
        }
        break;
      }
    }
  }

  return out.join('');
};
