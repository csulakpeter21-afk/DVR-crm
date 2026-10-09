// Flat ESLint config for the whole monorepo.
// Type-aware linting is on: this codebase enforces invariants (state machine
// transitions, compliance guards) that are only checkable with type information.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/generated/**',
      '**/*.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.mjs', '*.js', 'scripts/*.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.node },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      // Unused code is a defect, not a warning.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // `any` erodes the contracts package guarantees.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Floating promises in a worker silently drop jobs.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/require-await': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-syntax': [
        'error',
        {
          // DEV_PLAN domain_frame.transition_rules: stage changes only go
          // through the state machine in packages/domain.
          selector: "AssignmentExpression > MemberExpression[property.name='stage']",
          message:
            'Never assign Lead.stage directly. Use the pipeline state machine in @devora/domain (DEV_PLAN domain_frame.transition_rules).',
        },
      ],
    },
  },

  // Tests may reach for shortcuts the production code may not.
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/tests/**', 'e2e/**', 'tools/mocks/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      'no-console': 'off',
    },
  },

  // Config and script files run outside the TS program.
  {
    files: ['**/*.mjs', '**/*.js', 'scripts/**'],
    ...tseslint.configs.disableTypeChecked,
    rules: { 'no-console': 'off' },
  },
);
