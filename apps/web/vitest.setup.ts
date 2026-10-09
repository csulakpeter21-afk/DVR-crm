/**
 * Testing Library does not auto-clean when Vitest globals are off, so renders
 * would accumulate across tests in the same file and ambiguous-match queries
 * would fail. Unmounting after each test keeps every test isolated.
 */
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
