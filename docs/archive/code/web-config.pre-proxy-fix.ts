export const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true';
export const AUTO_FALLBACK = false;
export const API_TIMEOUT_MS = 120000;
export const PLACE_SEARCH_DEBOUNCE_MS = 350;
export const INTERNAL_ANALYSIS_ENDPOINT='/api/v1/ai/analyze-text';
export const INTERNAL_GENERATE_TRIP_ENDPOINT='/api/v1/ai/generate-trip';
export const INTERNAL_RECOMMENDATIONS_ENDPOINT='/api/v1/ai/recommendations';
export const INTERNAL_PLACE_SEARCH_ENDPOINT='/api/v1/places/search';
export const INTERNAL_TRIPS_ENDPOINT='/api/v1/trips';
