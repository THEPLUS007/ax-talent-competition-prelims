import type { Connect } from 'vite';
import { callGeminiJson, GeminiClientError } from './geminiClient';


const NOMINATIM_TIMEOUT_MS = 7000;
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const NOMINATIM_USER_AGENT = 'travel-blocks-ai-hackathon/1.0';
const MAX_BODY_BYTES = 64 * 1024;

type PriceLevel = 'low' | 'medium' | 'high';
type TravelBlockCategory = 'stay' | 'food' | 'cafe' | 'sightseeing' | 'activity' | 'transport';

type JsonRecord = Record<string, unknown>;

interface InternalRequest {
  method?: string;
  url?: string;
  on: (event: string, handler: (chunk?: unknown) => void) => void;
}

interface InternalResponse {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
}

interface TripFormData {
  name: string;
  country: string;
  city: string;
  duration: string;
  budget: string;
  travelers: string;
  style: string;
  description: string;
}

interface TravelBlock {
  id: string;
  title: string;
  category: TravelBlockCategory;
  priceLevel: PriceLevel;
  time?: string;
  location?: string;
  memo?: string;
  estimatedCost?: string;
}

interface TravelDay {
  id: string;
  dayNumber: number;
  title: string;
  city?: string;
  region?: string;
  blocks: TravelBlock[];
}

interface TravelConnection {
  id: string;
  dayId: string;
  sourceBlockId: string;
  targetBlockId: string;
  transportMode?: string;
  duration?: string;
}

interface TravelPlanPayload {
  trip: TripFormData;
  days: TravelDay[];
  connections: TravelConnection[];
}

interface SavedTravelPlan {
  id: string;
  title: string;
  subtitle: string;
  destination: string;
  trip: TripFormData;
  days: TravelDay[];
  connections: TravelConnection[];
  createdAt: string;
  updatedAt: string;
}

function sendJson(response: InternalResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function sendError(response: InternalResponse, statusCode: number, code: string, message: string) {
  sendJson(response, statusCode, { error: { code, message } });
}

function withTimeout<T>(task: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);

    task
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

function readRequestBody(request: InternalRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += String(chunk ?? '');

      if (body.length > MAX_BODY_BYTES) {
        reject(new Error('BODY_TOO_LARGE'));
      }
    });

    request.on('end', () => resolve(body));
    request.on('error', () => reject(new Error('BODY_READ_FAILED')));
  });
}

function parseJsonObject(rawBody: string): JsonRecord {
  const parsed = JSON.parse(rawBody) as unknown;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('INVALID_JSON_OBJECT');
  }

  return parsed as JsonRecord;
}

function getString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeCategory(value: unknown): TravelBlockCategory {
  const category = getString(value);
  const allowed: TravelBlockCategory[] = ['stay', 'food', 'cafe', 'sightseeing', 'activity', 'transport'];
  return allowed.includes(category as TravelBlockCategory) ? (category as TravelBlockCategory) : 'sightseeing';
}

function normalizePriceLevel(value: unknown): PriceLevel {
  const priceLevel = getString(value);
  const allowed: PriceLevel[] = ['low', 'medium', 'high'];
  return allowed.includes(priceLevel as PriceLevel) ? (priceLevel as PriceLevel) : 'medium';
}

function normalizeBlock(rawBlock: unknown, dayNumber: number, blockIndex: number): TravelBlock {
  const record = rawBlock && typeof rawBlock === 'object' ? rawBlock as JsonRecord : {};
  const title = getString(record.title, `일정 ${blockIndex + 1}`);

  return {
    id: getString(record.id, `day-${dayNumber}-block-${blockIndex + 1}`),
    title,
    category: normalizeCategory(record.category),
    priceLevel: normalizePriceLevel(record.priceLevel),
    time: getString(record.time) || undefined,
    location: getString(record.location) || title,
    memo: getString(record.memo) || undefined,
    estimatedCost: getString(record.estimatedCost) || undefined,
  };
}

function normalizeDay(rawDay: unknown, index: number): TravelDay {
  const record = rawDay && typeof rawDay === 'object' ? rawDay as JsonRecord : {};
  const dayNumber = getNumber(record.dayNumber) ?? index + 1;
  const rawBlocks = Array.isArray(record.blocks) ? record.blocks : [];

  return {
    id: getString(record.id, `day-${dayNumber}`),
    dayNumber,
    title: getString(record.title, `Day ${dayNumber}`),
    city: getString(record.city) || undefined,
    region: getString(record.region) || undefined,
    blocks: rawBlocks.map((block, blockIndex) => normalizeBlock(block, dayNumber, blockIndex)),
  };
}

function normalizeTravelDays(parsed: unknown): TravelDay[] {
  if (Array.isArray(parsed)) {
    return parsed.map(normalizeDay);
  }

  if (parsed && typeof parsed === 'object') {
    const record = parsed as JsonRecord;
    const keys = ['days', 'travelDays', 'itinerary', 'schedule', 'result'];

    for (const key of keys) {
      const value = record[key];

      if (Array.isArray(value)) {
        return value.map(normalizeDay);
      }
    }

    const nestedData = record.data;

    if (nestedData && typeof nestedData === 'object') {
      return normalizeTravelDays(nestedData);
    }
  }

  throw new Error('INVALID_TRAVEL_DAYS');
}

function normalizeUserInput(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 6000);
}

function geminiErrorStatus(error: unknown): number {
  if (!(error instanceof GeminiClientError)) {
    return 504;
  }

  if (error.status === 401 || error.status === 403) return error.status;
  if (error.category === 'rate_limit') return 429;
  if (error.category === 'timeout') return 504;
  if (error.category === 'unavailable') return error.status ?? 503;
  if (error.category === 'bad_request' || error.category === 'parse') return 422;
  return error.status ?? 504;
}

function geminiErrorCode(error: unknown): string {
  if (!(error instanceof GeminiClientError)) {
    return 'AI_PROVIDER_FAILED';
  }

  if (error.category === 'rate_limit') return 'AI_RATE_LIMITED';
  if (error.category === 'timeout') return 'AI_TIMEOUT';
  if (error.category === 'auth') return 'AI_AUTH_FAILED';
  if (error.category === 'unavailable') return 'AI_UNAVAILABLE';
  if (error.category === 'bad_request') return 'AI_BAD_REQUEST';
  if (error.category === 'parse') return 'AI_PARSE_FAILED';
  return 'AI_PROVIDER_FAILED';
}

function sendGeminiError(response: InternalResponse, error: unknown, fallbackMessage: string) {
  sendError(response, geminiErrorStatus(error), geminiErrorCode(error), fallbackMessage);
}

function fallbackTrip(prompt: string, days: TravelDay[]): TripFormData {
  const city = days.find((day) => day.city)?.city ?? '여행지';
  const durationMatch = prompt.match(/\d+\s*박\s*\d+\s*일/)?.[0] ?? `${Math.max(days.length, 1)}일`;

  return {
    name: `${city} AI 여행`,
    country: city.includes('제주') ? '대한민국' : '일본',
    city,
    duration: durationMatch,
    budget: '미정',
    travelers: '미정',
    style: 'AI 추천',
    description: prompt,
  };
}

function normalizeTravelPlan(parsed: unknown, prompt: string): TravelPlanPayload {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    const days = normalizeTravelDays(parsed);
    return { trip: fallbackTrip(prompt, days), days, connections: [] };
  }

  const record = parsed as JsonRecord;
  const days = normalizeTravelDays(record);
  const tripRecord = record.trip && typeof record.trip === 'object' ? record.trip as JsonRecord : {};
  const fallback = fallbackTrip(prompt, days);

  return {
    trip: {
      name: getString(tripRecord.name, fallback.name),
      country: getString(tripRecord.country, fallback.country),
      city: getString(tripRecord.city, fallback.city),
      duration: getString(tripRecord.duration, fallback.duration),
      budget: getString(tripRecord.budget, fallback.budget),
      travelers: getString(tripRecord.travelers, fallback.travelers),
      style: getString(tripRecord.style, fallback.style),
      description: getString(tripRecord.description, fallback.description),
    },
    days,
    connections: Array.isArray(record.connections) ? record.connections : [],
  };
}

function buildGeminiAnalyzePrompt(input: JsonRecord): string {
  const sourceType = typeof input.sourceType === 'string' ? input.sourceType : 'text';
  const content = normalizeUserInput(typeof input.content === 'string' ? input.content : '');

  return [
    'You are a travel itinerary parser for a Korean travel planning app.',
    'Return strict JSON only. Do not include markdown or explanations.',
    'The JSON must be an array of TravelDay objects.',
    'TravelDay schema: { "id": string, "dayNumber": number, "title": string, "city"?: string, "region"?: string, "blocks": TravelBlock[] }.',
    'TravelBlock schema: { "id": string, "title": string, "category": "stay"|"food"|"cafe"|"sightseeing"|"activity"|"transport", "priceLevel": "low"|"medium"|"high", "time"?: string, "location"?: string, "memo"?: string, "estimatedCost"?: string }.',
    'Create 2 to 4 practical days with 3 to 5 blocks per day unless the input clearly requests a different duration.',
    'Use short Korean text for titles, locations, and memos.',
    `Input source type: ${sourceType}`,
    `Input content: ${content}`,
  ].join('\n');
}

function buildGeminiTripPrompt(prompt: string): string {
  return [
    'You are a Korean AI travel planner for a MyRealTrip-style block itinerary app.',
    'Return strict JSON only. Do not include markdown or explanations.',
    'The JSON must be one TravelPlanPayload object.',
    'TravelPlanPayload schema: { "trip": TripFormData, "days": TravelDay[], "connections": [] }.',
    'TripFormData schema: { "name": string, "country": string, "city": string, "duration": string, "budget": string, "travelers": string, "style": string, "description": string }.',
    'TravelDay schema: { "id": string, "dayNumber": number, "title": string, "city"?: string, "region"?: string, "blocks": TravelBlock[] }.',
    'TravelBlock schema: { "id": string, "title": string, "category": "stay"|"food"|"cafe"|"sightseeing"|"activity"|"transport", "priceLevel": "low"|"medium"|"high", "time"?: string, "location"?: string, "memo"?: string, "estimatedCost"?: string }.',
    'Create the requested trip duration when possible, with 3 to 6 blocks per day.',
    'Include city and region on every day so recommendations and place search can filter by context.',
    'Use Korean text. Keep block titles concise and useful for editing.',
    `User travel request: ${prompt}`,
  ].join('\n');
}

async function handleAnalyzeLink(request: InternalRequest, response: InternalResponse) {
  if (request.method !== 'POST') {
    sendError(response, 405, 'METHOD_NOT_ALLOWED', '지원하지 않는 요청 방식입니다.');
    return;
  }

  let input: JsonRecord;

  try {
    input = parseJsonObject(await readRequestBody(request));
  } catch {
    sendError(response, 400, 'INVALID_REQUEST', '요청 본문을 확인해주세요.');
    return;
  }

  const content = normalizeUserInput(typeof input.content === 'string' ? input.content : '');

  if (!content) {
    sendError(response, 400, 'EMPTY_INPUT', '분석할 입력이 비어 있습니다.');
    return;
  }

  try {
    const parsedDays = normalizeTravelDays(await callGeminiJson(buildGeminiAnalyzePrompt({ ...input, content }), 'analyze-input'));
    sendJson(response, 200, parsedDays);
  } catch (error) {
    sendGeminiError(response, error, 'AI 분석 결과를 가져오지 못했습니다.');
  }
}

async function handleGenerateTrip(request: InternalRequest, response: InternalResponse) {
  if (request.method !== 'POST') {
    sendError(response, 405, 'METHOD_NOT_ALLOWED', '지원하지 않는 요청 방식입니다.');
    return;
  }

  let input: JsonRecord;

  try {
    input = parseJsonObject(await readRequestBody(request));
  } catch {
    sendError(response, 400, 'INVALID_REQUEST', '요청 본문을 확인해주세요.');
    return;
  }

  const prompt = normalizeUserInput(typeof input.prompt === 'string' ? input.prompt : '');

  if (!prompt) {
    sendError(response, 400, 'EMPTY_INPUT', '여행 요청이 비어 있습니다.');
    return;
  }

  try {
    const plan = normalizeTravelPlan(await callGeminiJson(buildGeminiTripPrompt(prompt), 'generate-trip'), prompt);
    sendJson(response, 200, plan);
  } catch (error) {
    sendGeminiError(response, error, 'AI 여행 일정을 생성하지 못했습니다.');
  }
}

function getStringParam(url: URL, key: string): string {
  return (url.searchParams.get(key) ?? '').trim();
}

function getCategoryParam(url: URL): TravelBlockCategory {
  return normalizeCategory(getStringParam(url, 'category'));
}

function priceLevelForCategory(category: TravelBlockCategory): PriceLevel {
  if (category === 'activity' || category === 'stay') {
    return 'high';
  }

  if (category === 'sightseeing' || category === 'transport') {
    return 'low';
  }

  return 'medium';
}

function buildNominatimQuery(url: URL): string {
  const query = getStringParam(url, 'query');
  const region = getStringParam(url, 'region');
  const city = getStringParam(url, 'city');

  return [query, region, city].filter(Boolean).join(' ').trim();
}

function mapNominatimPlace(item: unknown, index: number, category: TravelBlockCategory, fallbackCity = '', fallbackRegion = '', fallbackQuery = '') {
  const record = item && typeof item === 'object' ? item as JsonRecord : {};
  const address = record.address && typeof record.address === 'object' ? record.address as JsonRecord : {};
  const displayName = getString(record.display_name, fallbackQuery);
  const name = getString(record.name) || displayName.split(',')[0]?.trim() || fallbackQuery;
  const city = getString(address.city) || getString(address.town) || getString(address.village) || fallbackCity;
  const region = getString(address.suburb) || getString(address.county) || getString(address.state) || fallbackRegion;

  return {
    id: `nominatim-${getNumber(record.place_id) ?? index}`,
    name,
    category,
    city: city || fallbackCity || '여행지',
    region: region || fallbackRegion || city || fallbackCity || '검색 지역',
    address: displayName,
    priceLevel: priceLevelForCategory(category),
    estimatedCost: '',
    memo: 'OpenStreetMap 검색 결과',
  };
}

async function handlePlaceSearch(url: URL, response: InternalResponse) {
  const searchQuery = buildNominatimQuery(url);

  if (!searchQuery) {
    sendJson(response, 200, []);
    return;
  }

  const params = new URLSearchParams({
    q: searchQuery,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    'accept-language': 'ko,en',
  });

  try {
    const nominatimResponse = await withTimeout(
      fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': NOMINATIM_USER_AGENT,
        },
      }),
      NOMINATIM_TIMEOUT_MS,
    );

    if (!nominatimResponse.ok) {
      sendJson(response, 200, []);
      return;
    }

    const category = getCategoryParam(url);
    const fallbackCity = getStringParam(url, 'city');
    const fallbackRegion = getStringParam(url, 'region');
    const rawResults = await nominatimResponse.json() as unknown;
    const results = Array.isArray(rawResults) ? rawResults : [];

    sendJson(response, 200, results.slice(0, 5).map((item, index) => mapNominatimPlace(item, index, category, fallbackCity, fallbackRegion, searchQuery)));
  } catch {
    sendJson(response, 200, []);
  }
}

async function handlePlaceCoordinates(url: URL, response: InternalResponse) {
  const searchQuery = buildNominatimQuery(url);

  if (!searchQuery) {
    sendJson(response, 200, []);
    return;
  }

  const params = new URLSearchParams({
    q: searchQuery,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    'accept-language': 'ko,en',
  });

  try {
    const nominatimResponse = await withTimeout(
      fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': NOMINATIM_USER_AGENT,
        },
      }),
      NOMINATIM_TIMEOUT_MS,
    );

    if (!nominatimResponse.ok) {
      sendJson(response, 200, []);
      return;
    }

    const rawResults = await nominatimResponse.json() as unknown;
    const results = Array.isArray(rawResults) ? rawResults : [];

    sendJson(response, 200, results.slice(0, 5).map((item, index) => {
      const record = item && typeof item === 'object' ? item as JsonRecord : {};
      return {
        id: `nominatim-coordinate-${getNumber(record.place_id) ?? index}`,
        name: getString(record.name) || getString(record.display_name, searchQuery).split(',')[0]?.trim() || searchQuery,
        displayName: getString(record.display_name, searchQuery),
        lat: getString(record.lat),
        lon: getString(record.lon),
      };
    }));
  } catch {
    sendJson(response, 200, []);
  }
}

async function handleReverseGeocode(url: URL, response: InternalResponse) {
  const lat = getStringParam(url, 'lat');
  const lon = getStringParam(url, 'lon');

  if (!lat || !lon) {
    sendJson(response, 200, null);
    return;
  }

  const params = new URLSearchParams({
    lat,
    lon,
    format: 'json',
    addressdetails: '1',
    'accept-language': 'ko,en',
  });

  try {
    const nominatimResponse = await withTimeout(
      fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': NOMINATIM_USER_AGENT,
        },
      }),
      NOMINATIM_TIMEOUT_MS,
    );

    if (!nominatimResponse.ok) {
      sendJson(response, 200, null);
      return;
    }

    const record = await nominatimResponse.json() as JsonRecord;
    const address = record.address && typeof record.address === 'object' ? record.address as JsonRecord : {};
    const city = getString(address.city) || getString(address.town) || getString(address.village);
    const region = getString(address.suburb) || getString(address.county) || getString(address.state);

    sendJson(response, 200, {
      id: `nominatim-reverse-${getNumber(record.place_id) ?? 'result'}`,
      name: getString(record.name) || getString(record.display_name, '검색 위치').split(',')[0]?.trim() || '검색 위치',
      displayName: getString(record.display_name),
      city,
      region,
      lat,
      lon,
    });
  } catch {
    sendJson(response, 200, null);
  }
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[\s·・.,!?()[\]{}'"-]/g, '').trim();
}

function isSimilarTitle(left: string, right: string): boolean {
  const normalizedLeft = normalizeTitle(left);
  const normalizedRight = normalizeTitle(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return normalizedLeft === normalizedRight || normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

function normalizeRecommendationCategory(value: unknown): TravelBlockCategory {
  const category = getString(value).trim().toLowerCase();
  const mapped: Record<string, TravelBlockCategory> = {
    stay: 'stay',
    숙소: 'stay',
    hotel: 'stay',
    food: 'food',
    음식점: 'food',
    맛집: 'food',
    restaurant: 'food',
    cafe: 'cafe',
    카페: 'cafe',
    sightseeing: 'sightseeing',
    관광지: 'sightseeing',
    명소: 'sightseeing',
    shopping: 'activity',
    쇼핑: 'activity',
    activity: 'activity',
    체험: 'activity',
    기타: 'activity',
    other: 'activity',
    transport: 'transport',
    이동: 'transport',
  };

  return mapped[category] ?? normalizeCategory(category);
}

function getExistingRecommendationTitles(input: JsonRecord): string[] {
  const titles: string[] = [];
  const day = input.day && typeof input.day === 'object' ? input.day as JsonRecord : undefined;
  const dayBlocks = Array.isArray(day?.blocks) ? day?.blocks : [];
  const existingPlaces = Array.isArray(input.existingPlaces) ? input.existingPlaces : [];

  [...dayBlocks, ...existingPlaces].forEach((item) => {
    if (item && typeof item === 'object') {
      const title = getString((item as JsonRecord).title) || getString((item as JsonRecord).name);

      if (title) {
        titles.push(title);
      }
    }
  });

  return titles;
}

function buildGeminiRecommendationsPrompt(input: JsonRecord): string {
  const trip = input.trip && typeof input.trip === 'object' ? input.trip as JsonRecord : {};
  const day = input.day && typeof input.day === 'object' ? input.day as JsonRecord : {};
  const blocks = Array.isArray(day.blocks) ? day.blocks : [];
  const existingTitles = getExistingRecommendationTitles(input);
  const blockSummary = blocks
    .map((block) => {
      const record = block && typeof block === 'object' ? block as JsonRecord : {};
      return [getString(record.time), getString(record.title), getString(record.category), getString(record.location)].filter(Boolean).join(' / ');
    })
    .filter(Boolean)
    .slice(0, 12)
    .join('\n');

  return [
    'You are a Korean travel recommendation engine for a MyRealTrip-style itinerary editor.',
    'Return strict JSON only. Do not include markdown or explanations.',
    'The JSON schema must be: { "recommendations": Recommendation[] }.',
    'Recommendation schema: { "title": string, "category": "음식점"|"관광지"|"카페"|"쇼핑"|"숙소"|"이동"|"기타", "reason": string, "estimatedDurationMinutes": number, "area": string, "confidence": number }.',
    'Return 3 to 5 recommendations only.',
    'Do not recommend places already present in the existing place list.',
    'If Day region is provided, recommend places inside that region first and do not mix unrelated regions.',
    'If Day region is not provided, use Day city. If Day city is also missing, use Trip city.',
    'Use short Korean text and practical real-place style names.',
    `Trip city: ${getString(trip.city) || getString(day.city) || '여행지'}`,
    `Trip country: ${getString(trip.country)}`,
    `Trip style: ${getString(trip.style)}`,
    `Trip description: ${getString(trip.description)}`,
    `Day number: ${getNumber(day.dayNumber) ?? ''}`,
    `Day title: ${getString(day.title)}`,
    `Day city: ${getString(day.city) || getString(trip.city)}`,
    `Day region: ${getString(day.region)}`,
    `Existing places: ${existingTitles.join(', ') || 'none'}`,
    `Current day blocks:\n${blockSummary || 'none'}`,
  ].join('\n');
}

function normalizeGeminiRecommendations(parsed: unknown, input: JsonRecord): TravelBlock[] {
  const record = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as JsonRecord : {};
  const rawRecommendations = Array.isArray(record.recommendations) ? record.recommendations : Array.isArray(parsed) ? parsed : [];
  const existingTitles = getExistingRecommendationTitles(input);
  const acceptedTitles: string[] = [];
  const normalized: TravelBlock[] = [];

  for (const item of rawRecommendations) {
    const recommendation = item && typeof item === 'object' ? item as JsonRecord : {};
    const title = getString(recommendation.title).trim();

    if (!title) {
      continue;
    }

    const duplicateExisting = existingTitles.some((existingTitle) => isSimilarTitle(existingTitle, title));
    const duplicateAccepted = acceptedTitles.some((acceptedTitle) => isSimilarTitle(acceptedTitle, title));

    if (duplicateExisting || duplicateAccepted) {
      continue;
    }

    const duration = Math.max(15, Math.min(getNumber(recommendation.estimatedDurationMinutes) ?? 60, 480));
    const reason = getString(recommendation.reason, '현재 Day 동선과 여행 분위기에 맞는 추천입니다.');
    const area = getString(recommendation.area) || getString(recommendation.location) || getString((input.day as JsonRecord | undefined)?.region) || getString((input.day as JsonRecord | undefined)?.city);

    acceptedTitles.push(title);
    normalized.push({
      id: `gemini-recommend-${Date.now()}-${normalized.length + 1}`,
      title,
      category: normalizeRecommendationCategory(recommendation.category),
      priceLevel: 'medium',
      location: area || title,
      memo: `${reason} · 예상 소요시간 ${duration}분`,
      estimatedCost: '',
    });

    if (normalized.length >= 5) {
      break;
    }
  }

  if (normalized.length < 3 || normalized.length > 5) {
    throw new Error('INVALID_RECOMMENDATIONS');
  }

  return normalized;
}

async function handleRecommendations(request: InternalRequest, response: InternalResponse) {
  if (request.method !== 'POST') {
    sendError(response, 405, 'METHOD_NOT_ALLOWED', '지원하지 않는 요청 방식입니다.');
    return;
  }

  let input: JsonRecord;

  try {
    input = parseJsonObject(await readRequestBody(request));
  } catch {
    sendError(response, 400, 'INVALID_REQUEST', '요청 본문을 확인해주세요.');
    return;
  }

  try {
    const parsed = await callGeminiJson(buildGeminiRecommendationsPrompt(input), 'recommendations');
    sendJson(response, 200, normalizeGeminiRecommendations(parsed, input));
  } catch (error) {
    sendGeminiError(response, error, '추천 블록을 생성하지 못했습니다.');
  }
}

const serverTrips = new Map<string, SavedTravelPlan>();

function buildTripSubtitle(trip: TripFormData): string {
  return [trip.duration, trip.style].filter(Boolean).join(' · ') || '저장된 여행 일정';
}

function createSavedTravelPlan(payload: TravelPlanPayload, current?: SavedTravelPlan): SavedTravelPlan {
  const now = new Date().toISOString();
  const id = current?.id ?? 'server-trip-' + Date.now();
  const destination = payload.trip.city || payload.trip.country || '여행지';

  return {
    id,
    title: payload.trip.name || '저장된 여행 일정',
    subtitle: buildTripSubtitle(payload.trip),
    destination,
    trip: payload.trip,
    days: payload.days,
    connections: payload.connections ?? [],
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
}

function normalizeTravelPlanPayload(rawPayload: unknown): TravelPlanPayload {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    throw new Error('INVALID_TRAVEL_PLAN');
  }

  const record = rawPayload as JsonRecord;
  const trip = record.trip && typeof record.trip === 'object' ? record.trip as JsonRecord : {};

  return {
    trip: {
      name: getString(trip.name, '저장된 여행 일정'),
      country: getString(trip.country),
      city: getString(trip.city),
      duration: getString(trip.duration),
      budget: getString(trip.budget),
      travelers: getString(trip.travelers),
      style: getString(trip.style),
      description: getString(trip.description),
    },
    days: normalizeTravelDays(record.days),
    connections: Array.isArray(record.connections) ? record.connections as TravelConnection[] : [],
  };
}

async function handleTrips(request: InternalRequest, response: InternalResponse) {
  if (request.method === 'GET') {
    const trips = Array.from(serverTrips.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    if (trips.length === 0) {
      sendError(response, 404, 'TRIPS_EMPTY', '저장된 서버 일정이 없습니다.');
      return;
    }

    sendJson(response, 200, trips);
    return;
  }

  if (request.method !== 'POST') {
    sendError(response, 405, 'METHOD_NOT_ALLOWED', '지원하지 않는 요청 방식입니다.');
    return;
  }

  try {
    const rawBody = parseJsonObject(await readRequestBody(request));
    const payload = normalizeTravelPlanPayload(rawBody);
    const existingId = getString(rawBody.id);
    const current = existingId ? serverTrips.get(existingId) : undefined;
    const savedPlan = createSavedTravelPlan(payload, current);
    serverTrips.set(savedPlan.id, savedPlan);
    sendJson(response, 200, savedPlan);
  } catch {
    sendError(response, 422, 'TRIP_SAVE_FAILED', '여행 일정을 저장하지 못했습니다.');
  }
}

function handleTripById(id: string, response: InternalResponse) {
  const savedPlan = serverTrips.get(id);

  if (!savedPlan) {
    sendError(response, 404, 'TRIP_NOT_FOUND', '저장된 여행 일정을 찾을 수 없습니다.');
    return;
  }

  sendJson(response, 200, savedPlan);
}

export function createInternalApiMiddleware(): Connect.NextHandleFunction {
  return (request, response, next) => {
    const apiRequest = request as InternalRequest;
    const url = new URL(apiRequest.url ?? '/', 'http://internal.local');

    if (url.pathname === '/api/analyze-link') {
      void handleAnalyzeLink(apiRequest, response as InternalResponse);
      return;
    }

    if (url.pathname === '/api/generate-trip') {
      void handleGenerateTrip(apiRequest, response as InternalResponse);
      return;
    }

    if (url.pathname === '/api/recommendations') {
      void handleRecommendations(apiRequest, response as InternalResponse);
      return;
    }

    if (url.pathname === '/api/trips') {
      void handleTrips(apiRequest, response as InternalResponse);
      return;
    }

    if (url.pathname.startsWith('/api/trips/')) {
      handleTripById(decodeURIComponent(url.pathname.replace('/api/trips/', '')), response as InternalResponse);
      return;
    }

    if (url.pathname === '/api/places/search') {
      void handlePlaceSearch(url, response as InternalResponse);
      return;
    }

    if (url.pathname === '/api/places/coordinates') {
      void handlePlaceCoordinates(url, response as InternalResponse);
      return;
    }

    if (url.pathname === '/api/places/reverse') {
      void handleReverseGeocode(url, response as InternalResponse);
      return;
    }

    next();
  };
}
