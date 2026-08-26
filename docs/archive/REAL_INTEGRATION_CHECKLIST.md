# 실제 연동 체크리스트

Travel Blocks AI 웹 UI는 현재 `VITE_USE_MOCK=false`를 기본값으로 사용하며, Gemini/Nominatim은 내부 서버 proxy를 통해 호출합니다. 심사 환경에서 외부 API가 실패하거나 키가 없을 때는 `VITE_AUTO_FALLBACK=true`로 Mock/safe fallback을 사용합니다. MCP 도구는 자격 증명 없이 재현 가능하도록 입력 기반 deterministic fallback을 기본 동작으로 유지합니다.

## 1. 현재 Real/Fallback 동작

- AI 여행 생성: `travelApi.generateTripWithAI()` -> Real mode에서 `/api/generate-trip` Gemini proxy 호출, 실패 시 Mock fallback
- 링크/텍스트 분석: `travelApi.analyzeLinkOrText()` -> Real mode에서 `/api/analyze-link` Gemini proxy 호출, 실패 시 Mock fallback
- AI 추천 블록: `travelApi.getRecommendations()` -> Real mode에서 `/api/recommendations` Gemini proxy 호출, 실패 시 도시/지역 Mock fallback
- 장소 검색/좌표/역지오코딩: `placeSearchService` -> Nominatim proxy 호출, 실패 시 Mock/safe fallback
- 여행 저장/불러오기: `/api/trips` 임시 in-memory persistence 사용, 실패 또는 비어 있음 시 localStorage-backed Mock fallback
- MCP 도구: `src/mcp/server.mjs` -> 도시, 일수, 테마를 추출하는 입력 기반 deterministic fallback; Real MCP provider is not implemented

## 2. 아직 고도화가 필요한 기능

- 영상 자막 전체 추출
- 모든 블로그 본문 완전 크롤링 및 요약
- 영구 DB 기반 저장/불러오기
- 추천 품질 랭킹 및 장소 검증
- Real MCP provider 연동이 필요하다면 별도 구현

## 3. 필요한 API 키/환경변수

`.env.example` 기준으로 설정합니다.

```env
VITE_USE_MOCK=false
VITE_AUTO_FALLBACK=true

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

주의: 브라우저 프론트엔드에서 Gemini API 키를 직접 사용하면 키가 노출됩니다. 현재 구조는 `GEMINI_API_KEY`를 서버 프로세스에서만 읽고, 프론트엔드는 내부 API proxy만 호출합니다.

## 4. 실제 API 연결 위치

- 설정: `src/src/services/config.ts`
- API 선택/fallback: `src/src/services/travelApi.ts`
- Mock 구현: `src/src/services/mockTravelApi.ts`
- Real API 호출: `src/src/services/realTravelApi.ts`
- Gemini server-only client: `src/server/geminiClient.ts`
- Internal API routes: `src/server/internalApi.ts`

API 키는 `src/.env.local` 또는 서버 환경변수에만 둡니다. UI 컴포넌트와 hook은 `travelApi.ts`만 바라보도록 유지합니다.

## 5. 저장소를 localStorage에서 DB로 바꿀 경우

- `realTravelApi.saveTrip(payload)`에서 DB 저장 API를 호출합니다.
- `realTravelApi.loadTrips(userId)`에서 사용자별 여행 목록 API를 호출합니다.
- `realTravelApi.loadTrip(tripId)`에서 상세 여행 데이터를 호출합니다.
- 반환 타입은 `SavedTravelPlan` 또는 `TravelPlanPayload`와 동일하게 맞춥니다.

## 6. 링크 분석 실제 구현 방식

권장 흐름:

1. 클라이언트가 링크/텍스트를 서버 endpoint로 전달
2. 서버가 URL fetch, 본문 추출, 요약, 장소 후보 추출 수행
3. 서버가 AI 모델로 Day/Block JSON을 생성
4. 클라이언트는 `TravelDay[]`만 수신

클라이언트에서 외부 링크를 직접 fetch하면 CORS와 보안 제약이 생기므로 서버/API proxy를 권장합니다.

## 7. AI 여행 생성 프롬프트 입력/출력 JSON 구조

입력 예시:

```json
{
  "prompt": "제주 2박 3일 카페와 바다 중심 여행",
  "model": "gemini-2.5-flash"
}
```

출력 예시:

```json
{
  "trip": {
    "name": "제주 감성 3일 여행",
    "country": "대한민국",
    "city": "제주",
    "duration": "2박 3일",
    "budget": "80만원",
    "travelers": "2명",
    "style": "카페, 바다",
    "description": "여유로운 이동 중심"
  },
  "days": [
    {
      "id": "day-1",
      "dayNumber": 1,
      "title": "도착과 시내 적응",
      "blocks": []
    }
  ],
  "connections": []
}
```

## 8. 추천 블록 생성 입력/출력 JSON 구조

입력 예시:

```json
{
  "trip": {},
  "selectedDay": {},
  "existingBlocks": []
}
```

출력은 `TravelBlock[]` 형태입니다.

```json
[
  {
    "id": "recommend-1",
    "title": "오션뷰 카페",
    "category": "cafe",
    "priceLevel": "medium",
    "location": "월정리",
    "memo": "휴식에 적합",
    "estimatedCost": "18,000원"
  }
]
```

## 9. API 키를 전달받으면 수정할 파일

1. 로컬에서는 `src/.env.local`, 배포에서는 서버 환경변수에 값을 입력합니다.
2. `VITE_USE_MOCK=false` 또는 미설정 상태를 유지합니다.
3. 브라우저에 직접 비밀키를 넣지 말고, 서버/API proxy에서만 `process.env`로 읽습니다.
4. MCP 도구는 별도 Real provider가 구현되기 전까지 입력 기반 deterministic fallback으로 유지합니다.

## 10. 보안 주의사항

- 실제 Gemini API 키는 프론트엔드 번들에 포함하지 않습니다.
- `.env`는 커밋하지 않습니다.
- `.env.example`에는 빈 값만 둡니다.
- 링크 분석 서버는 SSRF 방어, URL allowlist/denylist, timeout, 파일 크기 제한을 적용해야 합니다.
- 저장 API에는 사용자 인증과 권한 검사가 필요합니다.
