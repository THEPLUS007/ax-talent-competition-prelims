# 06_REAL_API_SPEC.md

# Travel Blocks AI Real API Specification

이 문서는 Mock MVP를 실제 API로 전환하기 위한 서버/API proxy 계약이다. 현재 프론트엔드는 `src/src/services/travelApi.ts`만 바라보며, 실제 연결 시 `src/src/services/realTravelApi.ts` 내부 구현을 이 명세에 맞게 교체한다.

## 공통 원칙

- 기본 Mock 모드: `VITE_USE_MOCK=true`
- Real 모드: `VITE_USE_MOCK=false`
- Real 실패 시 Mock fallback: `VITE_AUTO_FALLBACK=true`
- 기본 timeout: `API_TIMEOUT_MS = 8000ms`
- 브라우저 클라이언트는 Gemini/Places 비밀키를 직접 보관하지 않는다.
- 모든 AI/크롤링/외부 장소 검색은 서버/API proxy에서 수행한다.
- Real API 응답은 현재 TypeScript 모델과 호환되어야 한다.

## 공통 타입

### PriceLevel

```ts
type PriceLevel = 'low' | 'medium' | 'high';
```

### TravelBlockCategory

```ts
type TravelBlockCategory = 'stay' | 'food' | 'cafe' | 'sightseeing' | 'activity' | 'transport';
```

### TravelSourceType

```ts
type TravelSourceType = 'youtube' | 'blog' | 'text';
```

프론트엔드는 `sourceTypeService.inferTravelSourceType(content)`로 자동 판별한다.

### TripFormData

```json
{
  "name": "오사카 맛집 쇼핑 4일",
  "country": "일본",
  "city": "오사카",
  "duration": "3박 4일",
  "budget": "120만원",
  "travelers": "2명",
  "style": "맛집, 쇼핑",
  "description": "첫 해외여행자 중심 일정"
}
```

### TravelBlock

```json
{
  "id": "block-1",
  "title": "도톤보리 이치란",
  "category": "food",
  "priceLevel": "medium",
  "time": "18:30",
  "location": "도톤보리",
  "memo": "난바 동선에서 쉬운 라멘 맛집",
  "estimatedCost": "18,000원"
}
```

### TravelDay

```json
{
  "id": "day-1",
  "dayNumber": 1,
  "title": "난바 도착과 도톤보리 맛집",
  "city": "오사카",
  "region": "난바",
  "blocks": []
}
```

`city`, `region`은 Day별 추천과 장소 검색의 핵심 컨텍스트이므로 Real API 응답에 포함하는 것을 권장한다.

### TravelConnection

```json
{
  "id": "connection-1",
  "dayId": "day-1",
  "sourceBlockId": "block-1",
  "targetBlockId": "block-2",
  "transportMode": "walk",
  "duration": "15분"
}
```

### TravelPlanPayload

```json
{
  "trip": {},
  "days": [],
  "connections": []
}
```

### SavedTravelPlan

```json
{
  "id": "trip-1",
  "title": "오사카 맛집 쇼핑 4일",
  "subtitle": "3박 4일 · 맛집, 쇼핑",
  "trip": {},
  "days": [],
  "connections": []
}
```

### 공통 Error Response

```json
{
  "error": {
    "code": "ANALYSIS_FAILED",
    "message": "여행 소스를 분석하지 못했습니다.",
    "details": "optional diagnostic string"
  }
}
```

권장 HTTP status:

- `400`: 잘못된 요청
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 리소스 없음
- `408`: 서버 내부 timeout
- `422`: 분석/생성은 수행했지만 유효한 여행 JSON 생성 실패
- `429`: rate limit
- `500`: 서버 오류
- `503`: 외부 AI/Places provider 장애

---

## POST /api/analyze-link

### 목적

YouTube 링크, 블로그 링크, 일반 URL, 여행 일정 텍스트를 분석해 `TravelDay[]`를 생성한다. 현재 프론트 함수는 `realTravelApi.analyzeLinkOrText(input)`와 대응한다.

### Request Body

```json
{
  "sourceType": "youtube",
  "content": "https://www.youtube.com/watch?v=a6iqv_IRj-I"
}
```

- `sourceType`: `youtube | blog | text`
- `content`: URL 또는 여행 계획 텍스트

### Query Parameter

없음.

### Response

```json
[
  {
    "id": "day-1",
    "dayNumber": 1,
    "title": "난바 도착과 도톤보리 맛집",
    "city": "오사카",
    "region": "난바",
    "blocks": [
      {
        "id": "block-1",
        "title": "도톤보리 산책",
        "category": "sightseeing",
        "priceLevel": "low",
        "time": "17:00",
        "location": "도톤보리",
        "memo": "글리코상과 강변 포토 스팟 확인",
        "estimatedCost": "0원"
      }
    ]
  }
]
```

### Error Response

```json
{
  "error": {
    "code": "SOURCE_ANALYSIS_TIMEOUT",
    "message": "입력한 여행 소스 분석 시간이 초과되었습니다."
  }
}
```

### Timeout 정책

- 클라이언트 timeout: 8000ms
- 서버 권장 timeout: URL fetch 5000ms, AI JSON 생성 15000ms 이내
- 서버는 URL fetch 크기 제한과 SSRF 방어를 적용한다.

### Fallback 정책

- `VITE_USE_MOCK=true`: `mockTravelApi.analyzeLinkOrText()` 사용
- `VITE_USE_MOCK=false`, Real 실패, `VITE_AUTO_FALLBACK=true`: Mock 분석 결과 사용
- `VITE_AUTO_FALLBACK=false`: 에러를 UI에 전달

### Mock 사용 여부

현재 Mock 사용 중. 현재 Real 모드에서는 프론트가 내부 `/api/analyze-link` proxy를 호출한다.

---

## POST /api/generate-trip

### 목적

자연어 여행 요청을 전체 여행 계획(`TravelPlanPayload`)으로 생성한다. 현재 프론트 함수는 `realTravelApi.generateTripWithAI(prompt)`와 대응한다.

### Request Body

```json
{
  "prompt": "도쿄 4박 5일, 애니메이션 성지순례와 카페 투어 중심으로 일정을 짜줘.",
  "model": "gemini-2.5-flash"
}
```

### Query Parameter

없음.

### Response

```json
{
  "trip": {
    "name": "도쿄 애니 성지순례 5일",
    "country": "일본",
    "city": "도쿄",
    "duration": "4박 5일",
    "budget": "160만원",
    "travelers": "2명",
    "style": "애니 성지순례, 카페, 굿즈 쇼핑",
    "description": "아키하바라와 이케부쿠로를 포함한 일정"
  },
  "days": [],
  "connections": []
}
```

### Error Response

```json
{
  "error": {
    "code": "TRIP_GENERATION_FAILED",
    "message": "AI 여행 일정을 생성하지 못했습니다."
  }
}
```

### Timeout 정책

- 클라이언트 timeout: 8000ms 권장. 단, AI 생성 API는 서버에서 비동기/streaming 또는 서버 timeout 15000ms 이상 고려 가능.
- 프론트 현 구조를 유지하려면 8000ms 내 응답을 권장한다.

### Fallback 정책

- `VITE_USE_MOCK=true`: `mockTravelApi.generateTripWithAI()` 사용
- Real 실패 + `VITE_AUTO_FALLBACK=true`: Mock 여행 계획 사용
- Real 실패 + `VITE_AUTO_FALLBACK=false`: 에러 표시

### Mock 사용 여부

현재 일부 함수는 Mock 위임이며, Gemini 호출은 브라우저가 아니라 서버/API proxy에서 수행한다.

---

## GET /api/recommendations

### 목적

현재 여행 및 선택 Day의 `city/region` 맥락을 기반으로 추천 블록 목록을 반환한다. 현재 프론트 함수는 `travelApi.getRecommendations(trip, day)`와 대응한다.

### Request Body

GET이므로 없음.

### Query Parameter

| Name | Type | Required | Description |
|---|---|---:|---|
| tripCity | string | no | 전체 여행 도시 |
| dayCity | string | no | 선택 Day 도시 |
| region | string | no | 선택 Day 지역 |
| category | TravelBlockCategory | no | 추천 카테고리 필터 |
| limit | number | no | 반환 개수, 기본 4~6 |

예시:

```text
/api/recommendations?tripCity=오사카&dayCity=교토&region=기온&limit=4
```

### Response

```json
[
  {
    "id": "recommend-gion-matcha",
    "title": "기온 말차 디저트",
    "category": "cafe",
    "priceLevel": "medium",
    "location": "기온",
    "memo": "말차 카페 추천",
    "estimatedCost": "20,000원"
  }
]
```

### Error Response

```json
{
  "error": {
    "code": "RECOMMENDATION_FAILED",
    "message": "추천 블록을 불러오지 못했습니다."
  }
}
```

### Timeout 정책

- 클라이언트 timeout: 8000ms
- 추천 API는 3000~5000ms 내 응답 권장

### Fallback 정책

- `VITE_USE_MOCK=true`: 지역별 Mock 추천 사용
- Real 실패 + `VITE_AUTO_FALLBACK=true`: Mock 추천 사용
- 지역 값이 없으면 trip city 기준 추천으로 fallback

### Mock 사용 여부

현재 Mock 사용 중. Real 구현 시 `realTravelApi.getRecommendations(trip, day)` 서명을 확장하는 작업이 필요하다.

---

## POST /api/trips

### 목적

현재 여행 일정을 저장한다. 현재 프론트 함수는 `realTravelApi.saveTrip(payload)`와 대응한다.

### Request Body

```json
{
  "trip": {},
  "days": [],
  "connections": []
}
```

### Query Parameter

없음. 인증 도입 시 userId는 query가 아니라 인증 토큰/session에서 결정하는 것을 권장한다.

### Response

```json
{
  "ok": true,
  "id": "trip-123"
}
```

현재 프론트 타입은 `{ "ok": true }`만 요구한다. `id`는 추가 필드로 허용 가능하다.

### Error Response

```json
{
  "error": {
    "code": "TRIP_SAVE_FAILED",
    "message": "여행 일정을 저장하지 못했습니다."
  }
}
```

### Timeout 정책

- 클라이언트 timeout: 8000ms
- 서버 저장 timeout: 5000ms 권장

### Fallback 정책

- `VITE_USE_MOCK=true`: localStorage Mock 저장
- Real 실패 + `VITE_AUTO_FALLBACK=true`: localStorage Mock 저장
- Real 실패 + `VITE_AUTO_FALLBACK=false`: 저장 실패 표시

### Mock 사용 여부

현재 Mock/localStorage 사용 중.

---

## GET /api/trips

### 목적

저장된 여행 일정 목록을 조회한다. 현재 프론트 함수는 `realTravelApi.loadTrips()`와 대응한다.

### Request Body

없음.

### Query Parameter

| Name | Type | Required | Description |
|---|---|---:|---|
| userId | string | no | 개발/Mock 호환용. 실제 서비스는 인증 기반 권장 |
| limit | number | no | 목록 개수 |
| cursor | string | no | 페이지네이션 cursor |

### Response

```json
[
  {
    "id": "trip-123",
    "title": "오사카 맛집 쇼핑 4일",
    "subtitle": "3박 4일 · 맛집, 쇼핑",
    "trip": {},
    "days": [],
    "connections": []
  }
]
```

### Error Response

```json
{
  "error": {
    "code": "TRIP_LIST_FAILED",
    "message": "여행 일정 목록을 불러오지 못했습니다."
  }
}
```

### Timeout 정책

- 클라이언트 timeout: 8000ms
- 서버 조회 timeout: 5000ms 권장

### Fallback 정책

- `VITE_USE_MOCK=true`: Mock saved plans + localStorage current plan 사용
- Real 실패 + `VITE_AUTO_FALLBACK=true`: Mock 목록 사용

### Mock 사용 여부

현재 Mock 사용 중.

---

## GET /api/trips/:id

### 목적

저장된 여행 일정 상세를 조회한다. 현재 프론트 함수는 `realTravelApi.loadTrip(tripId)`와 대응한다.

### Request Body

없음.

### Query Parameter

없음.

### Path Parameter

| Name | Type | Required | Description |
|---|---|---:|---|
| id | string | yes | 여행 일정 ID |

### Response

```json
{
  "id": "trip-123",
  "title": "오사카 맛집 쇼핑 4일",
  "subtitle": "3박 4일 · 맛집, 쇼핑",
  "trip": {},
  "days": [],
  "connections": []
}
```

찾지 못한 경우:

```json
null
```

### Error Response

```json
{
  "error": {
    "code": "TRIP_DETAIL_FAILED",
    "message": "여행 일정 상세를 불러오지 못했습니다."
  }
}
```

### Timeout 정책

- 클라이언트 timeout: 8000ms
- 서버 조회 timeout: 5000ms 권장

### Fallback 정책

- `VITE_USE_MOCK=true`: Mock 상세 사용
- Real 실패 + `VITE_AUTO_FALLBACK=true`: Mock 상세 사용

### Mock 사용 여부

현재 Mock 사용 중.

---

## GET /api/places/search

### 목적

블록 추가/수정 시 실제 장소 후보를 검색한다. 현재 프론트 Mock 함수는 `placeSearchService.searchTravelPlaces(input)`와 대응한다.

### Request Body

없음.

### Query Parameter

| Name | Type | Required | Description |
|---|---|---:|---|
| query | string | yes | 검색어. prefix/substring 검색 지원 권장 |
| category | TravelBlockCategory | no | 현재 블록 카테고리 |
| city | string | no | 선택 Day 도시 |
| region | string | no | 선택 Day 지역 |
| limit | number | no | 기본 6 |

예시:

```text
/api/places/search?query=도톤&category=food&city=오사카&region=난바&limit=6
```

### Response

```json
[
  {
    "id": "place-osaka-ichiran-dotonbori",
    "name": "도톤보리 이치란",
    "category": "food",
    "city": "오사카",
    "region": "난바",
    "address": "도톤보리",
    "priceLevel": "medium",
    "estimatedCost": "18,000원",
    "memo": "난바와 도톤보리 동선에서 찾기 쉬운 라멘 맛집"
  }
]
```

### Error Response

```json
{
  "error": {
    "code": "PLACE_SEARCH_FAILED",
    "message": "장소 검색에 실패했습니다."
  }
}
```

### Timeout 정책

- 클라이언트 timeout: 8000ms
- Places provider 호출 timeout: 3000~5000ms 권장
- provider rate limit 발생 시 `429` 반환 권장

### Fallback 정책

- 현재 장소 검색은 `travelApi.ts` 경유가 아니라 `placeSearchService.ts` 내 Mock 서비스로 동작한다.
- Real 도입 시 같은 `PlaceSearchResult[]`로 매핑하면 UI 변경 없이 교체 가능하다.
- provider 실패 시 region/city 기반 Mock 장소 후보를 fallback으로 사용할 수 있다.

### Mock 사용 여부

현재 Mock 사용 중. 현재 Real 모드에서는 OpenStreetMap Nominatim을 서버/API proxy에서 호출한다.

---

## 현재 프론트 연결 매핑

| Frontend Function | Current Real Stub | Target API |
|---|---|---|
| `realTravelApi.analyzeLinkOrText(input)` | endpoint 호출 가능 | `POST /api/analyze-link` |
| `realTravelApi.generateTripWithAI(prompt)` | mock 위임 | `POST /api/generate-trip` |
| `realTravelApi.getRecommendations()` | mock 위임 | `GET /api/recommendations` |
| `realTravelApi.saveTrip(payload)` | mock 위임 | `POST /api/trips` |
| `realTravelApi.loadTrips()` | mock 위임 | `GET /api/trips` |
| `realTravelApi.loadTrip(tripId)` | mock 위임 | `GET /api/trips/:id` |
| `placeSearchService.searchTravelPlaces(input)` | local mock | `GET /api/places/search` |

## Real 전환 전 필수 작업

1. `realTravelApi.ts`에 endpoint 환경변수 또는 base URL 설정 추가.
2. `generateTripWithAI`, `getRecommendations`, `saveTrip`, `loadTrips`, `loadTrip`의 mock 위임 제거.
3. `getRecommendations(trip, day)`가 trip/day context를 Real API에 전달하도록 서명 확장.
4. `placeSearchService.ts`를 adapter 구조로 바꾸거나 `travelApi.ts` 계층에 편입.
5. 서버/API proxy에서 Gemini/Places 비밀키 관리.
6. API 응답 validator 또는 최소 shape guard 추가 권장.
