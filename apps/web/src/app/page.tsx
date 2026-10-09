import { PIPELINE_STAGES, SIDE_STATES } from '@devora/contracts';

/**
 * P0 SHELL: proves the web app compiles against @devora/contracts and renders
 * the pipeline the platform is built around. The rep workspace replaces this
 * page in P1-05-T3 (wt-05-design-system-workspace).
 */
export default function Home() {
  return (
    <main style={{ maxWidth: '60rem', margin: '0 auto', padding: '3rem 1rem' }}>
      <p style={{ color: 'var(--devora-ink-muted)', margin: 0, fontSize: '0.875rem' }}>
        Devora, a PR firm
      </p>
      <h1 style={{ fontSize: '2rem', margin: '0.25rem 0 0.5rem', letterSpacing: '-0.02em' }}>
        Devora Sales Engine
      </h1>
      <p style={{ color: 'var(--devora-ink-muted)', maxWidth: '40rem' }}>
        Foundation skeleton. The rep workspace, the script player and the dialler arrive with phase
        P1.
      </p>

      <section aria-labelledby="pipeline" style={{ marginTop: '2.5rem' }}>
        <h2
          id="pipeline"
          style={{
            fontSize: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--devora-ink-muted)',
          }}
        >
          Pipeline
        </h2>
        <ol
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            listStyle: 'none',
            padding: 0,
          }}
        >
          {PIPELINE_STAGES.map((stage, index) => (
            <li
              key={stage}
              style={{
                border: '1px solid var(--devora-border)',
                borderRadius: 'var(--devora-radius)',
                padding: '0.375rem 0.75rem',
                fontSize: '0.875rem',
              }}
            >
              <span style={{ color: 'var(--devora-ink-muted)' }}>{index + 1}.</span> {stage}
            </li>
          ))}
        </ol>

        <h2
          style={{
            fontSize: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--devora-ink-muted)',
            marginTop: '2rem',
          }}
        >
          Side states
        </h2>
        <ul
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            listStyle: 'none',
            padding: 0,
          }}
        >
          {SIDE_STATES.map((state) => (
            <li
              key={state}
              style={{
                border: '1px dashed var(--devora-border)',
                borderRadius: 'var(--devora-radius)',
                padding: '0.375rem 0.75rem',
                fontSize: '0.875rem',
                color: 'var(--devora-ink-muted)',
              }}
            >
              {state}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
