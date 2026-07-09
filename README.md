# Travel Blocks AI

Travel Blocks AI는 OpenAI AX Hackathon 예선용 MyRealTrip AI 여행 플러그인 MVP입니다. YouTube/블로그/텍스트 여행 소스를 AI 입력으로 받아 Day별 여행 블록 일정으로 구성하고, 사용자가 블록을 추가·수정·이동·저장할 수 있도록 설계되었습니다.

현재 제출 빌드는 Mock OFF를 기본값으로 사용하며, Gemini 기반 AI 여행 생성/링크 분석/추천 블록 생성과 OpenStreetMap Nominatim 장소 검색을 내부 서버 proxy를 통해 사용합니다. VITE_USE_MOCK=true를 명시하면 기존 Mock MVP로 전환할 수 있습니다. 현재 실제 서비스 전환률은 약 80%입니다. Real API 연결은 서비스 계층에서 Mock/Real 전환 구조를 유지한 채 확장합니다.

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

```bash
cd src
npm install
npm run build
npm run preview
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

## Smoke Test

Playwright smoke test is available for the Real-mode demo path.

```bash
cd src
npm run build
npm run test:smoke
```

The smoke test covers first entry, AI trip generation, recommendations, save, list, reopen, connection mode, and refresh recovery. Real API latency can vary, so the test uses longer timeouts and relies on Mock fallback when Real calls fail.

## Mock / Real API Architecture

The UI calls `src/src/services/travelApi.ts`. That module selects Mock or Real implementations based on `VITE_USE_MOCK` and falls back to Mock when `VITE_AUTO_FALLBACK=true`.

Key files:

- `src/src/services/config.ts`: environment flags and timeout config
- `src/src/services/travelApi.ts`: Mock/Real switch and fallback
- `src/src/services/mockTravelApi.ts`: Mock MVP behavior
- `src/src/services/realTravelApi.ts`: Real API skeleton
- `src/src/services/sourceTypeService.ts`: source type inference
- `src/src/services/placeSearchService.ts`: Mock place search adapter shape

Real endpoint contract is documented in `docs/06_REAL_API_SPEC.md`.

## Current Limitations

- Permanent DB persistence is not implemented yet.
- Vercel/serverless deployments may restrict server-side persistence, so localStorage fallback remains part of the demo safety strategy.
- Real video transcript extraction and full travel-content crawling need further work.
- Blog/link body crawling and summarization quality need further tuning.
- Gemini recommendation quality needs more prompt, ranking, and place validation tuning.

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
- MCP config: `src/.mcp.json`
- MCP server: `src/mcp/server.mjs`
- Build output: `src/dist/`
- Do not commit real `.env` files or provider API keys.
