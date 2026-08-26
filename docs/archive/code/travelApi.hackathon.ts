import { AUTO_FALLBACK, USE_MOCK } from './config';
import * as mockTravelApi from './mockTravelApi';
import * as realTravelApi from './realTravelApi';
import type { TravelPlanPayload } from './mockTravelApi';
import type { SavedTravelPlan, TravelAnalysisInput, TravelBlock, TravelDay, TripFormData } from '../types/travel';

type ApiCall<T> = () => Promise<T>;

async function callWithFallback<T>(realCall: ApiCall<T>, mockCall: ApiCall<T>, label: string): Promise<T> {
  if (USE_MOCK) {
    return mockCall();
  }

  try {
    return await realCall();
  } catch (error) {
    console.warn('[travelApi] ' + label + ' 실패. Mock fallback 정책을 확인합니다.');

    if (AUTO_FALLBACK) {
      return mockCall();
    }

    throw error instanceof Error ? error : new Error(`${label} 처리 중 오류가 발생했습니다.`);
  }
}

export function createTripFromForm(input: TripFormData): Promise<TravelPlanPayload> {
  return callWithFallback(
    () => realTravelApi.createTripFromForm(input),
    () => mockTravelApi.createTripFromForm(input),
    '여행 생성',
  );
}

export function generateTripWithAI(prompt: string): Promise<TravelPlanPayload> {
  return callWithFallback(
    () => realTravelApi.generateTripWithAI(prompt),
    () => mockTravelApi.generateTripWithAI(prompt),
    'AI 여행 생성',
  );
}

export function analyzeLinkOrText(input: TravelAnalysisInput): Promise<TravelDay[]> {
  return callWithFallback(
    () => realTravelApi.analyzeLinkOrText(input),
    () => mockTravelApi.analyzeLinkOrText(input),
    '링크/텍스트 분석',
  );
}

export function createTripFromSource(content: string): Promise<TravelPlanPayload> {
  return callWithFallback(
    () => realTravelApi.createTripFromSource(content),
    () => mockTravelApi.createTripFromSource(content),
    '소스 기반 여행 생성',
  );
}

export function getRecommendations(trip?: TripFormData, day?: TravelDay): Promise<TravelBlock[]> {
  return callWithFallback(
    () => realTravelApi.getRecommendations(trip, day),
    () => mockTravelApi.getRecommendations(trip, day),
    '추천 블록 조회',
  );
}

export function saveTrip(payload: TravelPlanPayload): Promise<{ ok: true }> {
  return callWithFallback(
    () => realTravelApi.saveTrip(payload),
    () => mockTravelApi.saveTrip(payload),
    '여행 저장',
  );
}

export function loadTrips(userId?: string): Promise<SavedTravelPlan[]> {
  return callWithFallback(
    () => realTravelApi.loadTrips(),
    () => mockTravelApi.loadTrips(userId),
    '여행 목록 조회',
  );
}

export function loadTrip(tripId: string): Promise<SavedTravelPlan | null> {
  return callWithFallback(
    () => realTravelApi.loadTrip(tripId),
    () => mockTravelApi.loadTrip(tripId),
    '여행 상세 조회',
  );
}
