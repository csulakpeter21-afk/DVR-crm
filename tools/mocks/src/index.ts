/**
 * Mock provider servers.
 *
 * P0 PLACEHOLDER (DEV_PLAN P0-T2: "placeholder mock servers"). Every provider
 * gets a real mock in P1-04-T3 and P1-04-T4 (wt-04-integrations-framework),
 * reproducing success, partial, not found and error cases so adapters can be
 * contract tested without touching a paid vendor.
 *
 * No real credentials and no real personal data ever reach these servers.
 */
export const MOCK_PROVIDERS = [
  'fullenrich',
  'telephony',
  'transcription',
  'email',
  'calendar',
] as const;

export type MockProvider = (typeof MOCK_PROVIDERS)[number];

/** Default port for the combined mock server. */
export const MOCK_SERVER_PORT = 4010;
