# Travel Blocks AI

Travel Blocks AI는 OpenAI AX Hackathon 예선용 MyRealTrip AI 여행 플러그인 MVP입니다. YouTube URL, 블로그 URL, 일반 여행 링크 문자열, 자연어 여행 조건을 AI 입력으로 받아 Day별 여행 블록 일정으로 구성하고, 사용자가 블록을 추가·수정·이동·저장할 수 있도록 설계되었습니다. 현재 MVP는 영상 자막 전체 추출이나 모든 블로그 본문 자동 수집보다, 사용자가 제공한 링크/텍스트/여행 조건을 구조화된 일정 블록으로 변환하는 흐름에 집중합니다.

현재 제출 빌드는 웹 UI에서 Mock OFF를 기본값으로 사용하며, Gemini 기반 AI 여행 생성/링크·텍스트 분석/추천 블록 생성과 OpenStreetMap Nominatim 장소 검색을 내부 서버 proxy를 통해 사용합니다. Codex MCP 도구는 심사 환경의 API 키 부재를 고려해 입력 기반 deterministic fallback 일정을 제공합니다. `VITE_USE_MOCK=true`를 명시하면 개발 및 UI 테스트용 Mock mode로 전환할 수 있습니다.

## Project Structure

```text
.
├── README.md
├── docs/
│   ├── 01_PROJECT_CONTEXT.md
│   ├── 02_UI_UX_REQUIREMENTS.md
│   ├── 03_FEATURE_SPEC.md
│   ├── 04_PRODUCT_VISION.md
│   ├── 05_IMPLEMENTATION_PLAN.md
│   ├── 06_REAL_API_SPEC.md
│   ├── MOCK_TEST_SCENARIOS.md
│   ├── QA_CHECKLIST.md
│   └── REAL_INTEGRATION_CHECKLIST.md
├── logs/
├── tools/
└── src/
    ├── .codex-plugin/plugin.json
    ├── .mcp.json
    ├── mcp/server.mjs
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── components/
        ├── hooks/
        ├── mock/
        ├── pages/
        ├── services/
        ├── types/
        └── utils/
```

## Run

### API key 없이 MCP 플러그인만 실행

```bash
cd src
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"local-check","version":"1.0.0"}}}' | node mcp/server.mjs
```

### API key 없이 웹 UI를 fallback으로 실행

```bash
cd src
npm install
npm run build
npm run preview
```

`VITE_AUTO_FALLBACK=true`이면 Real API 실패 시 앱이 중단되지 않고 fallback 경로를 사용한다.

### Gemini API key로 웹 UI Real mode 실행

```bash
cd src
# src/.env.local에 GEMINI_API_KEY를 넣고 VITE_USE_MOCK=false 또는 미설정 상태로 둔다.
npm run build
npm run preview
```

### 명시적으로 Mock mode 켜기

```bash
cd src
# src/.env.local 또는 shell에서 VITE_USE_MOCK=true 설정
npm run dev
```

### MCP 테스트 실행

```bash
cd src
npm run test:mcp
```

Preview runs on:

```text
http://localhost:5173/
```

Use the preview server for demo/submission checks. The built app uses relative Vite assets so it can be served reliably through the preview server.

## Scripts

```bash
npm run dev      # Vite dev server
npm run build    # TypeScript build + Vite production build
npm run lint     # ESLint
npm run preview  # Serve built dist on 5173
npm run serve    # Build then preview
npm run test:mcp # Run deterministic MCP stdio tests
```

## Environment

Both root `.env.example` and `src/.env.example` document the current environment variables.

```env
VITE_USE_MOCK=false
VITE_AUTO_FALLBACK=true

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Security note: do not expose provider secrets in the browser bundle. GEMINI_API_KEY is read only by the Vite internal server proxy through process.env; frontend code never reads it. Nominatim place search, coordinate search, and reverse geocoding use server-side proxy routes without an API key.

### Real API Mode

To test the real AI service locally, create `src/.env.local` and keep the real provider value only in that file. Mock OFF is the default because `VITE_USE_MOCK` is treated as enabled only when it is exactly `true`. Keep `VITE_AUTO_FALLBACK=true` for demo-safe fallback. Then run `npm run build` and `npm run preview`.

Real mode currently uses these internal routes:

- `POST /api/generate-trip`: Gemini AI trip generation.
- `POST /api/analyze-link`: Gemini link/text analysis.
- `POST /api/recommendations`: Gemini day/city/region-aware recommendation block generation.
- `GET /api/places/search`: Nominatim place search.
- `GET /api/places/coordinates`: Nominatim coordinate search.
- `GET /api/places/reverse`: Nominatim reverse geocoding.
- `POST /api/trips`: save a generated travel plan to temporary server persistence.
- `GET /api/trips`: load saved travel plan list from server persistence.
- `GET /api/trips/:id`: load a single saved travel plan by id.

Server persistence is an in-memory demo store. It avoids adding a database dependency for the hackathon preview and may reset when the server restarts or when deployed to serverless environments. When server save/load fails or returns no saved data, `VITE_AUTO_FALLBACK=true` keeps the existing localStorage-backed Mock save/load flow active so the demo does not break.

If any real API call fails or times out, the app keeps the existing Mock fallback path when `VITE_AUTO_FALLBACK=true`. Recommendation generation also falls back to the existing city/region Mock recommendation blocks when Gemini is unavailable, returns invalid JSON, times out, or produces too few non-duplicate places.

### Mock ON/OFF

- Real mode default: omit `VITE_USE_MOCK` or set `VITE_USE_MOCK=false`.
- Mock mode: set `VITE_USE_MOCK=true` in `src/.env.local` or the shell environment.
- Demo-safe fallback: keep `VITE_AUTO_FALLBACK=true` so Real API failures fall back to Mock data instead of breaking the app.
- Frontend code must not read provider keys. Provider values are used only by the internal server proxy through `process.env`.

### Save/Load Persistence

- `POST /api/trips`, `GET /api/trips`, and `GET /api/trips/:id` use temporary in-memory server persistence for local demo.
- If server save/load fails or has no saved data, the existing localStorage-backed Mock persistence remains available through fallback.
- This keeps first-user/existing-user flows testable without adding a database dependency.

## Tests

Playwright smoke test is available for the Real-mode demo path. MCP tests run without external API keys and verify different inputs produce different deterministic fallback itineraries.

```bash
cd src
npm run build
npm run test:smoke
npm run test:mcp
```

The smoke test covers first entry, AI trip generation, recommendations, save, list, reopen, connection mode, and refresh recovery. Real API latency can vary, so the test uses longer timeouts and relies on Mock fallback when Real calls fail. The MCP test verifies newline-delimited JSON-RPC initialize, tools/list, tools/call, parse-error recovery, and JSON-only stdout.

## Mock / Real / Fallback Architecture

The web UI and MCP server have intentionally different runtime contracts.

- Real mode: the web UI calls `src/src/services/travelApi.ts` with `VITE_USE_MOCK=false` or no `VITE_USE_MOCK` value. Gemini and Nominatim are called only through server proxy routes. This path requires a valid server-side Gemini API key and working network for AI generation.
- Fallback mode: when a Real mode API key is missing, the request fails, the network fails, or timeout occurs, `VITE_AUTO_FALLBACK=true` keeps the app running. Web UI fallback uses the existing Mock/safe data path. MCP fallback analyzes the user's city, duration, and theme and returns deterministic itinerary blocks without external credentials.
- Mock mode: `VITE_USE_MOCK=true` explicitly selects development/QA Mock data for the web UI. It is separate from Real mode fallback.
- MCP tools: `src/mcp/server.mjs` provides input-based deterministic fallback by default for judge-safe execution without provider credentials. It reads `TRAVEL_BLOCKS_USE_MOCK`; setting it to `false` does not enable a Real MCP provider because Real MCP provider integration is not implemented.

Key files:

- `src/src/services/config.ts`: environment flags and timeout config
- `src/src/services/travelApi.ts`: Mock/Real switch and fallback
- `src/src/services/mockTravelApi.ts`: Mock MVP behavior
- `src/src/services/realTravelApi.ts`: Real API calls to internal server proxy routes
- `src/server/geminiClient.ts`: server-only Gemini client with timeout/retry/concurrency guards
- `src/server/internalApi.ts`: Vite internal API routes for Gemini, Nominatim, and demo persistence
- `src/src/services/sourceTypeService.ts`: source type inference
- `src/src/services/placeSearchService.ts`: Nominatim-backed place search with Mock fallback

Real endpoint contract is documented in `docs/06_REAL_API_SPEC.md`.


## Implementation Status

| 기능 | 상태 | 설명 |
| --- | --- | --- |
| Gemini 일정 생성 | 구현 | API 키와 네트워크가 정상일 때 웹 UI Real mode에서 server proxy를 통해 사용 |
| 링크·텍스트 분석 | 구현 | URL 문자열, 사용자 입력 텍스트, 여행 조건을 Gemini로 구조화하고 실패 시 fallback 사용 |
| Gemini 추천 블록 | 구현 | 선택 Day의 city/region과 기존 장소를 기반으로 추천 생성, 실패 시 도시/지역 fallback 사용 |
| Nominatim 장소 검색 | 구현 | 서버 proxy로 장소 검색, 좌표 검색, 역지오코딩 호출 |
| 일정 블록 편집 | 구현 | 생성, 수정, 삭제, 복사, 이동, 순서 변경, 연결 지원 |
| MCP 여행 일정 생성 | 구현 | 외부 API 키 없이 입력 기반 deterministic fallback 반환 |
| Mock 전환 | 구현 | `VITE_USE_MOCK=true`로 개발/QA용 Mock mode 전환 |
| 임시 저장/불러오기 | 구현 | 서버 in-memory persistence와 localStorage fallback 사용 |
| 영구 데이터베이스 | 미구현 | 현재 DB 영구 저장은 적용하지 않음 |
| YouTube 자막 전체 추출 | 미구현 | URL 및 사용자 입력 텍스트 중심 분석 |
| 블로그 본문 전체 크롤링 | 미구현 | 보안/CORS/사이트별 구조 이슈로 MVP 범위에서 제외 |
| Real MCP provider | 미구현 | MCP는 입력 기반 deterministic fallback 전용 |

## Current Limitations

- Permanent DB persistence is not implemented yet.
- Vercel/serverless deployments may restrict server-side persistence, so localStorage fallback remains part of the demo safety strategy.
- Full YouTube transcript extraction is not implemented in this MVP.
- Complete blog body crawling for every URL is not implemented in this MVP.
- Link inputs currently work as URL/source context for AI structuring; deeper content extraction and summarization need further tuning.
- Gemini recommendation quality needs more prompt, ranking, and place validation tuning.
- MCP tools return input-based deterministic fallback itineraries for credential-free judging, not Real Gemini/Nominatim MCP integrations.



## Logs And AI Process Disclosure

The `logs/` folder is included for hackathon process transparency. `logs/codex/*.jsonl` files are Codex CLI JSONL execution logs. Files with `manual` in the name, including `logs/codex/manual-current-session.md`, are auxiliary manual notes for sessions where the automatic logging path was not easy to verify. These manual notes do not replace the automatic JSONL logs. See `docs/LOG_DISCLOSURE.md` for the exact file roles.

## Security Notes

- Do not commit `.env`, `.env.local`, or provider secrets.
- `.env.example` must contain placeholders only.
- Do not print API keys, Authorization headers, tokens, cookies, or raw provider responses in logs or reports.
- Playwright reports and terminal logs should contain only UI/test status, not provider secrets.

## Current MVP Capabilities

- User1/User2 entry flows
- saved trip list for User2
- manual trip creation
- AI natural-language trip generation through Gemini in Real mode, Mock API in Mock mode
- single-input link/text analysis with source type inference
- Day creation, selection, rename, delete, reorder
- Day city/region context
- block add/edit/delete/copy/move/reorder
- block connection add/update/delete
- Day/region-aware recommendations through Mock data or Gemini in Real mode
- Nominatim place search in Real mode, Mock place search fallback for block creation/editing
- Google Maps search link from block menu
- localStorage-backed Mock save/load
- direct PDF export download
- clipboard/share text export

## Documentation

- `docs/06_REAL_API_SPEC.md`: Real API request/response spec
- `docs/REAL_INTEGRATION_CHECKLIST.md`: Real integration checklist
- `docs/MOCK_TEST_SCENARIOS.md`: Mock test inputs and scenarios
- `docs/QA_CHECKLIST.md`: QA checklist and result table

## Submission Notes

- Plugin manifest: `src/.codex-plugin/plugin.json`
- Skill: `src/skills/travel-blocks/SKILL.md`
- MCP config: `src/.mcp.json`
- MCP server: `src/mcp/server.mjs`
- MCP test: `src/tests/mcp-server.test.mjs`
- Build output for local verification: `src/dist/`
- Do not include `src/node_modules/`, `src/dist/`, `.git/`, `.env`, or `src/.env.local` in the final ZIP.
- Do not commit real `.env` files or provider API keys.
