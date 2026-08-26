# API

모든 응답은 `/api/v1` 기준이며 오류는 `{ "error": { "code", "message", "retryable", "requestId" } }` 형식입니다.

- `GET /health`
- `POST /trips`, `GET /trips`, `GET /trips/:tripId`, `PATCH /trips/:tripId`, `DELETE /trips/:tripId`
- `POST /ai/generate-trip`, `POST /ai/analyze-text`, `POST /ai/recommendations`
- `GET /places/search`, `GET /places/:placeId`

Trip 생성은 payload `{ trip, days, connections }`, 수정은 같은 payload에 현재 `version`을 추가합니다. 수정 충돌은 409, 다른 사용자 또는 없는 Trip은 404입니다. body limit는 64 KiB이며 기본 request timeout은 30초입니다.
