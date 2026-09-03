const configuredApiUrl =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const API_BASE_URL =
  configuredApiUrl?.replace(/\/+$/, '') ||
  'https://vku-field-survey-api.phamthaogianghl05.workers.dev';

export const API_CONFIGURATION_ERROR = undefined;