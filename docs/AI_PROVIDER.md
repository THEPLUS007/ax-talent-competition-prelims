# AI provider

`TravelAiProvider`는 `generateTrip`, `analyzeText`, `recommendPlaces`를 정의합니다. Gemini 구현은 server-only API key, timeout, retry, concurrency 제한, 동일 요청 dedupe, 오류 분류, Zod 출력 검증, usage callback을 제공합니다.

기본 모델은 2026-07-09 공식 모델 문서에서 stable로 안내된 `gemini-3.5-flash`이며 `GEMINI_MODEL`로 고정 모델을 교체할 수 있습니다. 사용자 입력은 `<user_data>` 경계 안 데이터로 전달합니다. 원문 prompt/provider response는 production log에 기록하지 않습니다. URL은 가져오지 않습니다.


## Gemini free-tier validation guardrails

Production uses the Gemini 3.5 Flash free tier: 5 RPM, 250,000 TPM, and 20 RPD.
Unit and CI tests must inject a mock `fetch`; they must never use a production Gemini key.

- The provider serializes calls by default (`GEMINI_MAX_CONCURRENCY=1`).
- Retry is owned only by the provider. It honors `Retry-After`; otherwise it uses bounded exponential backoff with jitter.
- `extract_intent` and `rank_places` use `GEMINI_TIMEOUT_MS` (15 seconds by default). Structured `generate_trip` and `analyze_text` use `GEMINI_LONG_TASK_TIMEOUT_MS` (40 seconds by default). A long-task client timeout is terminal: it is not retried, because the provider may still have performed inference. Retryable 429 and transient 5xx responses remain bounded by `GEMINI_MAX_RETRIES`.
- A terminal `rate_limit`, timeout, or provider-unavailable result ends live validation. Do not manually retry it.
- Do not run request loops, parallel live tests, model pings, or schema-isolation calls against production.
- Keep independent top-level live tests at least 15 seconds apart (20 seconds preferred). Normal calls inside one production request remain sequential.
- A successful full generation may use more than one Gemini provider attempt; Places Search/Details are not Gemini requests.
- Stop live validation if AI Studio reports daily quota exhaustion; do not infer remaining RPD.

### Gemini Request Budget

- Tier: Free
- RPM limit: 5 requests / minute
- RPD limit: 20 requests / day
- TPM limit: 250,000 input tokens / minute
- Live top-level tests executed:
- Estimated/provider attempts:
- 429 encountered:
- Additional manual retries: 0
- Validation stopped to preserve quota: YES / NO

production provider 실패 시 Mock 일정이 아니라 `AI_PROVIDER_UNAVAILABLE`과 `retryable`을 반환합니다.
