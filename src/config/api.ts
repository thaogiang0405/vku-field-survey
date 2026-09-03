const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

/**
 * API origin configured at build time, without a trailing slash.
 * It must be set for both local and production builds; the frontend Worker is
 * deliberately never used as a fallback API endpoint.
 */
export const API_BASE_URL = configuredApiUrl?.replace(/\/+$/, '') || '';
export const API_CONFIGURATION_ERROR = API_BASE_URL
  ? undefined
  : 'Chưa cấu hình VITE_API_URL cho API backend.';
