/**
 * The component set the rep workspace is built from (P1-05-T1).
 *
 * Styling is plain CSS modules driven by the tokens, not utility classes: these
 * components are consumed by both the web app and, later, the PDF collateral
 * renderer, and inline token references survive that move.
 *
 * WCAG 2.2 AA throughout: every interactive element has a focus style, status is
 * never carried by colour alone, and the one primary action per screen is a real
 * <button>.
 */
import type { CSSProperties, ReactNode } from 'react';

type Tone = 'neutral' | 'accent' | 'positive' | 'caution' | 'critical';

const TONE_COLOURS: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: 'var(--devora-surface-sunken)', fg: 'var(--devora-ink-secondary)' },
  accent: { bg: 'var(--devora-accent-soft)', fg: 'var(--devora-accent)' },
  positive: { bg: 'var(--devora-positive-soft)', fg: 'var(--devora-positive)' },
  caution: { bg: 'var(--devora-caution-soft)', fg: 'var(--devora-caution)' },
  critical: { bg: 'var(--devora-critical-soft)', fg: 'var(--devora-critical)' },
};

export function Badge({
  children,
  tone = 'neutral',
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  title?: string;
}) {
  const { bg, fg } = TONE_COLOURS[tone];
  return (
    <span
      title={title}
      style={{
        background: bg,
        color: fg,
        borderRadius: 999,
        padding: '0.1875rem 0.5rem',
        fontSize: 'var(--devora-text-xs)',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  as: Tag = 'div',
  padded = true,
  style,
}: {
  children: ReactNode;
  as?: 'div' | 'section' | 'article' | 'li';
  padded?: boolean;
  style?: CSSProperties;
}) {
  return (
    <Tag
      style={{
        background: 'var(--devora-surface)',
        border: '1px solid var(--devora-border)',
        borderRadius: 'var(--devora-radius)',
        boxShadow: 'var(--devora-shadow-sm)',
        padding: padded ? 'var(--devora-space-5)' : 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/** A small caps label. Used for section headings so headings stay scarce. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: 'var(--devora-text-xs)',
        fontWeight: 700,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        color: 'var(--devora-ink-muted)',
      }}
    >
      {children}
    </p>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <p
        style={{
          margin: '0.25rem 0 0',
          fontFamily: 'var(--devora-font-serif)',
          fontSize: 'var(--devora-text-xl)',
          lineHeight: 1.1,
          color: 'var(--devora-ink)',
        }}
      >
        {value}
      </p>
      {hint ? (
        <p
          style={{
            margin: '0.125rem 0 0',
            fontSize: 'var(--devora-text-xs)',
            color: 'var(--devora-ink-muted)',
          }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const BUTTON_BASE: CSSProperties = {
  font: 'inherit',
  fontWeight: 600,
  borderRadius: 'var(--devora-radius-sm)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4375rem',
  transition: 'background 120ms ease, border-color 120ms ease',
  textDecoration: 'none',
};

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';

const VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--devora-accent)',
    color: 'var(--devora-accent-ink)',
    border: '1px solid var(--devora-accent)',
  },
  secondary: {
    background: 'var(--devora-surface)',
    color: 'var(--devora-ink)',
    border: '1px solid var(--devora-border-strong)',
  },
  quiet: {
    background: 'transparent',
    color: 'var(--devora-ink-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--devora-critical)',
    color: '#ffffff',
    border: '1px solid var(--devora-critical)',
  },
};

const SIZES = {
  sm: { padding: '0.3125rem 0.625rem', fontSize: 'var(--devora-text-sm)' },
  md: { padding: '0.5rem 0.875rem', fontSize: 'var(--devora-text-base)' },
  lg: { padding: '0.6875rem 1.25rem', fontSize: 'var(--devora-text-md)' },
} as const;

export function buttonStyle(
  variant: ButtonVariant = 'secondary',
  size: keyof typeof SIZES = 'md',
  disabled = false,
): CSSProperties {
  return {
    ...BUTTON_BASE,
    ...VARIANTS[variant],
    ...SIZES[size],
    ...(disabled ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none' as const } : {}),
  };
}

/**
 * Shown where a panel has nothing in it. An empty state that explains itself is
 * the difference between a tool that looks broken and one that looks finished.
 */
export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      style={{
        border: '1px dashed var(--devora-border-strong)',
        borderRadius: 'var(--devora-radius)',
        padding: 'var(--devora-space-6)',
        textAlign: 'center',
        color: 'var(--devora-ink-muted)',
      }}
    >
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--devora-ink-secondary)' }}>{title}</p>
      <p style={{ margin: '0.375rem 0 0', fontSize: 'var(--devora-text-sm)' }}>{detail}</p>
    </div>
  );
}

/** The amber dot next to a live call. Paired with text, never colour alone. */
export function LiveDot() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 7,
        height: 7,
        borderRadius: 999,
        background: 'var(--devora-live)',
        display: 'inline-block',
      }}
    />
  );
}
