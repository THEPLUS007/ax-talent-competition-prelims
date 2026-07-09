import { AUTO_FALLBACK, INTERNAL_PLACE_SEARCH_ENDPOINT, PLACE_SEARCH_DEBOUNCE_MS, USE_MOCK } from './config';
import type { TravelBlockCategory, TravelDay } from '../types/travel';

export interface PlaceSearchInput {
  query: string;
  category: TravelBlockCategory;
  city?: string;
  region?: string;
}

export interface PlaceSearchResult {
  id: string;
  name: string;
  category: TravelBlockCategory;
  city: string;
  region: string;
  address: string;
  priceLevel: 'low' | 'medium' | 'high';
  estimatedCost: string;
  memo: string;
}

const mockPlaces: PlaceSearchResult[] = [
  { id: 'place-osaka-ichiran-dotonbori', name: '도톤보리 이치란', category: 'food', city: '오사카', region: '난바', address: '도톤보리', priceLevel: 'medium', estimatedCost: '18,000원', memo: '난바와 도톤보리 동선에서 찾기 쉬운 라멘 맛집' },
  { id: 'place-osaka-donki-dotonbori', name: '돈키호테 도톤보리점', category: 'activity', city: '오사카', region: '난바', address: '도톤보리', priceLevel: 'medium', estimatedCost: '70,000원', memo: '면세 쇼핑과 기념품 구매에 좋은 도톤보리 대표 쇼핑 장소' },
  { id: 'place-osaka-glico-sign', name: '도톤보리 글리코사인', category: 'sightseeing', city: '오사카', region: '난바', address: '도톤보리', priceLevel: 'low', estimatedCost: '0원', memo: '오사카 첫 여행에서 빠지기 어려운 대표 포토 스팟' },
  { id: 'place-osaka-kuromon-market', name: '구로몬시장', category: 'food', city: '오사카', region: '난바', address: '닛폰바시', priceLevel: 'medium', estimatedCost: '35,000원', memo: '해산물과 길거리 음식을 한 번에 테스트하기 좋은 장소' },
  { id: 'place-osaka-shinsaibashi', name: '신사이바시스지 상점가', category: 'activity', city: '오사카', region: '난바', address: '신사이바시', priceLevel: 'high', estimatedCost: '100,000원', memo: '쇼핑 중심 여행에 맞는 대표 상점가' },
  { id: 'place-osaka-umeda-sky', name: '우메다 스카이빌딩', category: 'sightseeing', city: '오사카', region: '우메다', address: '우메다', priceLevel: 'medium', estimatedCost: '18,000원', memo: '우메다 일정에 어울리는 야경 명소' },
  { id: 'place-kyoto-gion-cafe', name: '기온 말차 카페', category: 'cafe', city: '교토', region: '기온', address: '기온', priceLevel: 'medium', estimatedCost: '20,000원', memo: '교토 전통거리 일정에 어울리는 말차 디저트 카페' },
  { id: 'place-kyoto-kiyomizu', name: '기요미즈데라', category: 'sightseeing', city: '교토', region: '기온', address: '히가시야마', priceLevel: 'medium', estimatedCost: '5,000원', memo: '교토 사찰/전통거리 추천 장소' },
  { id: 'place-kyoto-ninenzaka', name: '니넨자카 산넨자카', category: 'sightseeing', city: '교토', region: '기온', address: '히가시야마', priceLevel: 'low', estimatedCost: '0원', memo: '기온과 청수사 사이를 잇는 전통거리' },
  { id: 'place-jeju-umu', name: '우무', category: 'cafe', city: '제주', region: '한림/협재', address: '한림', priceLevel: 'medium', estimatedCost: '12,000원', memo: '제주 감성 디저트와 카페 테스트에 적합' },
  { id: 'place-jeju-randys', name: '랜디스도넛 제주', category: 'cafe', city: '제주', region: '애월', address: '애월', priceLevel: 'medium', estimatedCost: '15,000원', memo: '애월 해안도로 동선에 넣기 좋은 카페/디저트 장소' },
  { id: 'place-jeju-hyeopjae', name: '협재해수욕장', category: 'sightseeing', city: '제주', region: '한림/협재', address: '협재', priceLevel: 'low', estimatedCost: '0원', memo: '서쪽 바다 중심 일정의 대표 장소' },
  { id: 'place-fukuoka-motsunabe', name: '하카타 모츠나베', category: 'food', city: '후쿠오카', region: '하카타', address: '하카타', priceLevel: 'medium', estimatedCost: '45,000원', memo: '부모님 동행 식사에 맞는 후쿠오카 대표 메뉴' },
  { id: 'place-dazaifu-tenmangu', name: '다자이후 텐만구', category: 'sightseeing', city: '다자이후', region: '다자이후', address: '다자이후', priceLevel: 'low', estimatedCost: '0원', memo: '이동이 적고 산책하기 좋은 대표 명소' },
  { id: 'place-tokyo-animate-ikebukuro', name: '애니메이트 이케부쿠로', category: 'activity', city: '도쿄', region: '이케부쿠로', address: '이케부쿠로', priceLevel: 'high', estimatedCost: '80,000원', memo: '애니 성지순례와 굿즈 쇼핑 핵심 장소' },
  { id: 'place-tokyo-akiba-radio', name: '아키하바라 라디오회관', category: 'activity', city: '도쿄', region: '아키하바라', address: '아키하바라', priceLevel: 'high', estimatedCost: '80,000원', memo: '피규어와 굿즈 쇼핑에 적합한 장소' },
  { id: 'place-tokyo-akiba-cafe', name: '아키하바라 콜라보 카페', category: 'cafe', city: '도쿄', region: '아키하바라', address: '아키하바라', priceLevel: 'medium', estimatedCost: '28,000원', memo: '애니 테마 카페 일정 테스트 장소' },
];

const searchCache = new Map<string, PlaceSearchResult[]>();
let lastSearchStartedAt = 0;

function normalize(value?: string): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

function matchesScope(place: PlaceSearchResult, city?: string, region?: string): boolean {
  const normalizedCity = normalize(city);
  const normalizedRegion = normalize(region);
  const placeCity = normalize(place.city);
  const placeRegion = normalize(place.region);

  if (normalizedRegion && (placeRegion.includes(normalizedRegion) || normalizedRegion.includes(placeRegion))) {
    return true;
  }

  if (normalizedCity && (placeCity.includes(normalizedCity) || normalizedCity.includes(placeCity))) {
    return true;
  }

  return !normalizedCity && !normalizedRegion;
}

function buildCacheKey(input: PlaceSearchInput): string {
  return [input.category, normalize(input.query), normalize(input.city), normalize(input.region)].join('|');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isPlaceSearchResult(value: unknown): value is PlaceSearchResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && typeof record.name === 'string' && typeof record.category === 'string';
}

export function searchTravelPlaces(input: PlaceSearchInput): PlaceSearchResult[] {
  const normalizedQuery = normalize(input.query);
  const scopedPlaces = mockPlaces.filter((place) => matchesScope(place, input.city, input.region));
  const fallbackPlaces = scopedPlaces.length > 0 ? scopedPlaces : mockPlaces;

  return fallbackPlaces
    .map((place) => {
      const name = normalize(place.name);
      const searchTarget = normalize(`${place.name} ${place.address} ${place.city} ${place.region} ${place.memo}`);
      const queryMatches = !normalizedQuery || searchTarget.includes(normalizedQuery);
      const prefixScore = normalizedQuery && name.startsWith(normalizedQuery) ? 0 : 1;
      const categoryScore = place.category === input.category ? 0 : 1;

      return { place, queryMatches, prefixScore, categoryScore };
    })
    .filter(({ queryMatches, categoryScore }) => {
      if (normalizedQuery) {
        return queryMatches;
      }

      return categoryScore === 0;
    })
    .sort((left, right) => left.prefixScore - right.prefixScore || left.categoryScore - right.categoryScore)
    .map(({ place }) => place)
    .slice(0, 6);
}

async function searchNominatimPlaces(input: PlaceSearchInput): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({
    query: input.query,
    category: input.category,
  });

  if (input.city) {
    params.set('city', input.city);
  }

  if (input.region) {
    params.set('region', input.region);
  }

  const response = await fetch(`${INTERNAL_PLACE_SEARCH_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('PLACE_SEARCH_FAILED');
  }

  const results = (await response.json()) as unknown;

  if (!Array.isArray(results)) {
    throw new Error('INVALID_PLACE_SEARCH_RESPONSE');
  }

  return results.filter(isPlaceSearchResult).slice(0, 5);
}

export async function searchTravelPlacesWithFallback(input: PlaceSearchInput): Promise<PlaceSearchResult[]> {
  const fallbackResults = searchTravelPlaces(input);

  if (USE_MOCK) {
    return fallbackResults;
  }

  const cacheKey = buildCacheKey(input);
  const cached = searchCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const elapsed = Date.now() - lastSearchStartedAt;

  if (elapsed < PLACE_SEARCH_DEBOUNCE_MS) {
    await delay(PLACE_SEARCH_DEBOUNCE_MS - elapsed);
  }

  lastSearchStartedAt = Date.now();

  try {
    const realResults = await searchNominatimPlaces(input);
    const nextResults = realResults.length > 0 ? realResults : fallbackResults;
    searchCache.set(cacheKey, nextResults);
    return nextResults;
  } catch {
    if (AUTO_FALLBACK) {
      searchCache.set(cacheKey, fallbackResults);
      return fallbackResults;
    }

    throw new Error('장소 검색 중 오류가 발생했습니다.');
  }
}

export function getDayPlaceScope(day?: TravelDay): Pick<PlaceSearchInput, 'city' | 'region'> {
  return {
    city: day?.city,
    region: day?.region,
  };
}

export interface PlaceCoordinateResult {
  id: string;
  name: string;
  displayName: string;
  lat: string;
  lon: string;
}

export interface ReverseGeocodeResult {
  id: string;
  name: string;
  displayName: string;
  city: string;
  region: string;
  lat: string;
  lon: string;
}

async function fetchJsonWithFallback<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      return fallback;
    }

    return await response.json() as T;
  } catch {
    return fallback;
  }
}

export async function searchPlaceCoordinatesWithFallback(input: Pick<PlaceSearchInput, 'query' | 'city' | 'region'>): Promise<PlaceCoordinateResult[]> {
  const fallbackPlace = searchTravelPlaces({
    query: input.query,
    category: 'sightseeing',
    city: input.city,
    region: input.region,
  })[0];
  const fallbackResults = fallbackPlace
    ? [{
        id: `${fallbackPlace.id}-coordinate-fallback`,
        name: fallbackPlace.name,
        displayName: fallbackPlace.address,
        lat: '',
        lon: '',
      }]
    : [];

  if (USE_MOCK) {
    return fallbackResults;
  }

  const params = new URLSearchParams({ query: input.query });

  if (input.city) {
    params.set('city', input.city);
  }

  if (input.region) {
    params.set('region', input.region);
  }

  const results = await fetchJsonWithFallback<PlaceCoordinateResult[]>(`/api/places/coordinates?${params.toString()}`, fallbackResults);
  return results.length > 0 ? results : fallbackResults;
}

export async function reverseGeocodeWithFallback(lat: string, lon: string): Promise<ReverseGeocodeResult | null> {
  if (!lat || !lon) {
    return null;
  }

  if (USE_MOCK) {
    return {
      id: 'reverse-geocode-mock',
      name: 'Mock 위치',
      displayName: 'Mock 위치',
      city: '여행지',
      region: '검색 지역',
      lat,
      lon,
    };
  }

  const params = new URLSearchParams({ lat, lon });
  return fetchJsonWithFallback<ReverseGeocodeResult | null>(`/api/places/reverse?${params.toString()}`, null);
}
