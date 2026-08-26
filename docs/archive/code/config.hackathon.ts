export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const AUTO_FALLBACK = import.meta.env.VITE_AUTO_FALLBACK !== 'false';
export const API_TIMEOUT_MS = 120000;
export const PLACE_SEARCH_DEBOUNCE_MS = 350;

export const INTERNAL_ANALYSIS_ENDPOINT = '/api/analyze-link';
export const INTERNAL_GENERATE_TRIP_ENDPOINT = '/api/generate-trip';
export const INTERNAL_RECOMMENDATIONS_ENDPOINT = '/api/recommendations';
export const INTERNAL_PLACE_SEARCH_ENDPOINT = '/api/places/search';
export const INTERNAL_TRIPS_ENDPOINT = '/api/trips';
