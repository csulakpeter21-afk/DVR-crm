import { PIPELINE_STAGES, SIDE_STATES } from '@devora/contracts';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Home from './page.tsx';

/**
 * The web app's one P0 assertion: it renders the pipeline it imports from
 * @devora/contracts, and it never calls Devora an agency
 * (DEV_PLAN.company_rules).
 *
 * The states are compared as whole list entries rather than by substring,
 * because "qualified" is a substring of "disqualified".
 */
const entries = (regionName: string): string[] => {
  const region = screen.getByRole('region', { name: regionName });
  return Array.from(region.querySelectorAll('li'), (item) =>
    (item.textContent ?? '').replace(/^\d+\.\s*/u, '').trim(),
  );
};

describe('home page', () => {
  it('renders every pipeline stage, in the order the plan defines', () => {
    render(<Home />);
    const rendered = entries('Pipeline');
    expect(rendered.slice(0, PIPELINE_STAGES.length)).toEqual([...PIPELINE_STAGES]);
  });

  it('renders every side state', () => {
    render(<Home />);
    const rendered = entries('Pipeline');
    for (const state of SIDE_STATES) {
      expect(rendered, state).toContain(state);
    }
  });

  it('describes Devora as a PR firm, never an agency', () => {
    const { container } = render(<Home />);
    expect(container.textContent).toContain('PR firm');
    expect(container.textContent).not.toMatch(/agenc(y|ies)/iu);
  });
});
