import { API_TIMEOUT_MS, INTERNAL_ANALYSIS_ENDPOINT, INTERNAL_GENERATE_TRIP_ENDPOINT, INTERNAL_RECOMMENDATIONS_ENDPOINT, INTERNAL_TRIPS_ENDPOINT } from './config';
import * as mockTravelApi from './mockTravelApi';
import { inferTravelSourceType } from './sourceTypeService';
import type { TravelPlanPayload } from './mockTravelApi';
import type { SavedTravelPlan, TravelAnalysisInput, TravelBlock, TravelDay, TripFormData } from '../types/travel';

async function withTimeout<T>(task: Promise<T>, timeoutMs = API_TIMEOUT_MS): Promise<T> {
  let timeoutId: number | undefined;

  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error('API 요청 시간이 초과되었습니다.')), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
}

async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  if (!endpoint) {
    throw new Error('실제 API endpoint가 설정되지 않았습니다.');
  }

  const response = await withTimeout(fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));

  if (!response.ok) {
    throw new Error();
  }

  return response.json() as Promise<T>;
}

async function getJson<T>(endpoint: string): Promise<T> {
  if (!endpoint) {
    throw new Error('실제 API endpoint가 설정되지 않았습니다.');
  }

  const response = await withTimeout(fetch(endpoint));

  if (!response.ok) {
    throw new Error();
  }

  return response.json() as Promise<T>;
}

export async function createTripFromForm(input: TripFormData): Promise<TravelPlanPayload> {
  return mockTravelApi.createTripFromForm(input);
}

export async function generateTripWithAI(prompt: string): Promise<TravelPlanPayload> {
  return postJson<TravelPlanPayload>(INTERNAL_GENERATE_TRIP_ENDPOINT, { prompt });
}

export async function analyzeLinkOrText(input: TravelAnalysisInput): Promise<TravelDay[]> {
  return postJson<TravelDay[]>(INTERNAL_ANALYSIS_ENDPOINT, input);
}

export async function createTripFromSource(content: string): Promise<TravelPlanPayload> {
  const days = await analyzeLinkOrText({ sourceType: inferTravelSourceType(content), content });
  return {
    ...(await mockTravelApi.createTripFromSource(content)),
    days,
  };
}

export async function getRecommendations(trip?: TripFormData, day?: TravelDay): Promise<TravelBlock[]> {
  return postJson<TravelBlock[]>(INTERNAL_RECOMMENDATIONS_ENDPOINT, {
    trip,
    day,
    existingPlaces: day?.blocks ?? [],
  });
}

export async function saveTrip(payload: TravelPlanPayload): Promise<{ ok: true }> {
  await postJson<SavedTravelPlan>(INTERNAL_TRIPS_ENDPOINT, payload);
  return { ok: true };
}

export async function loadTrips(userId?: string): Promise<SavedTravelPlan[]> {
  void userId;
  const trips = await getJson<SavedTravelPlan[]>(INTERNAL_TRIPS_ENDPOINT);

  if (trips.length === 0) {
    throw new Error('저장된 서버 일정이 없습니다.');
  }

  return trips;
}

export async function loadTrip(tripId: string): Promise<SavedTravelPlan | null> {
  return getJson<SavedTravelPlan>(INTERNAL_TRIPS_ENDPOINT + '/' + encodeURIComponent(tripId));
}
