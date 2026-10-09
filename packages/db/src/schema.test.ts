/**
 * The Prisma enums must mirror @devora/contracts exactly, or the database and
 * the application would disagree about what a lead state is.
 * This closes the single-source-of-truth loop for SQL
 * (DEV_PLAN P0 acceptance criterion 3 extends to the schema, not just TypeScript).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { LEAD_STATES, ROLES } from '@devora/contracts';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(
  fileURLToPath(new URL('../prisma/schema.prisma', import.meta.url)),
  'utf8',
);

const enumValues = (name: string): string[] => {
  const block = new RegExp(`enum\\s+${name}\\s*\\{([^}]*)\\}`, 'u').exec(schema);
  if (!block?.[1]) throw new Error(`enum ${name} not found in schema.prisma`);
  return block[1]
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/u, '').trim())
    .filter((line) => line.length > 0);
};

describe('schema.prisma mirrors @devora/contracts', () => {
  it('LeadState matches LEAD_STATES, in order', () => {
    expect(enumValues('LeadState')).toEqual([...LEAD_STATES]);
  });

  it('Role matches ROLES, in order', () => {
    expect(enumValues('Role')).toEqual([...ROLES]);
  });
});
