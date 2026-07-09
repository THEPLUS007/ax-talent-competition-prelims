# 실제 연동 체크리스트

Travel Blocks AI는 현재 해커톤 심사 환경에서 외부 API 없이 동작하도록 Mock API를 기본값으로 사용합니다. 실제 API 키를 전달받으면 `src/src/services` 계층만 교체/확장하는 방식으로 전환합니다.

## 1. 현재 Mock으로 동작 중인 기능

- AI 여행 생성: `travelApi.generateTripWithAI()` -> `mockTravelApi.generateTripWithAI()`
- 링크/텍스트 분석: `travelApi.analyzeLinkOrText()` -> `mockTravelApi.analyzeLinkOrText()`
- AI 추천 블록: `travelApi.getRecommendations()` -> `mockTravelApi.getRecommendations()`
- 여행 저장: `travelApi.saveTrip()` -> 현재 localStorage 기반 Mock 저장
- User2 여행 목록: `travelApi.loadTrips()` -> `mockSavedTravelPlans`

## 2. 실제 연동으로 바꿔야 하는 기능

- AI 여행 생성 API
- 링크/텍스트 분석 API
- 추천 블록 생성 API
- 여행 목록 조회 API
- 여행 상세 조회 API
- 여행 저장 API

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
- 실제 API 뼈대: `src/src/services/realTravelApi.ts`

API 키를 받으면 우선 `realTravelApi.ts`의 함수 내부를 실제 endpoint 호출로 교체합니다. UI 컴포넌트와 hook은 `travelApi.ts`만 바라보도록 유지합니다.

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

1. `.env` 또는 배포 환경변수에 값을 입력합니다.
2. `VITE_USE_MOCK=false`로 변경합니다.
3. `src/src/services/realTravelApi.ts`에서 실제 서버 endpoint 호출을 연결합니다.
4. 브라우저에 직접 비밀키를 넣지 말고, 서버/API proxy endpoint만 `VITE_*_ENDPOINT`로 노출합니다.

## 10. 보안 주의사항

- 실제 Gemini API 키는 프론트엔드 번들에 포함하지 않습니다.
- `.env`는 커밋하지 않습니다.
- `.env.example`에는 빈 값만 둡니다.
- 링크 분석 서버는 SSRF 방어, URL allowlist/denylist, timeout, 파일 크기 제한을 적용해야 합니다.
- 저장 API에는 사용자 인증과 권한 검사가 필요합니다.
