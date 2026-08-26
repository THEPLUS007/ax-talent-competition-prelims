# Travel Blocks AI

Travel Blocks AI는 Day와 Travel Block 단위로 여행 일정을 만들고 편집·저장하는 웹 서비스 기반 프로젝트입니다. 해커톤 원본은 `hackathon-submission-2026-07-10` 태그에 보존되어 있습니다.

## 현재 지원

- 직접 여행 생성, Day 추가·삭제·이름 변경·정렬
- 블록 추가·수정·삭제·복사·Day 간 이동, 블록 연결과 교통수단
- PostgreSQL 기반 사용자별 Trip 생성·목록·조회·수정·삭제
- 서버 발급 httpOnly 익명 세션
- Gemini provider adapter를 통한 일정 생성, 입력 텍스트 분석, 추천 후보 생성
- provider로 검증된 장소만 추천 블록으로 반환
- 일정 내보내기와 저장하지 않은 변경 경고
- JSON-RPC 방식의 기존 MCP deterministic fallback(웹 서비스와 분리)

## 지원하지 않음

- YouTube 자막 추출, 블로그 본문 크롤링, 임의 URL 분석
- 상용 장소 provider 기본 연결(현재 interface와 test provider만 제공)
- 로그인 UI, 결제, 예약, 가격 비교, 협업 편집
- production AI/장소 Mock fallback

사용자가 직접 붙여넣은 여행 메모와 콘텐츠 본문만 `/api/v1/ai/analyze-text`에서 지원합니다. URL 수집은 experimental interface만 있고 fetch 구현은 없습니다.

## 로컬 실행

Node.js 20 이상과 PostgreSQL이 필요합니다.

```bash
cp .env.example .env.local
# 빈 항목에 로컬 값 설정
npm ci
npm run db:migrate
npm run dev:api
npm run dev:web
```

API는 기본 `http://localhost:3000`, 웹은 `http://localhost:5173`에서 실행됩니다. 개발·E2E에서만 `AI_PROVIDER=test`, `VITE_USE_MOCK=true`를 사용할 수 있습니다. production에서는 provider 실패를 명시적 오류로 반환합니다.

## 명령

```bash
npm run lint
npm run build
npm run test
npm run test:unit
npm run test:api
npm run test:e2e
npm run test:mcp
npm run db:generate
npm run db:migrate
```

구조와 계약은 [ARCHITECTURE](docs/ARCHITECTURE.md), [API](docs/API.md), [DATA MODEL](docs/DATA_MODEL.md), [SECURITY](docs/SECURITY.md)를 참고하세요.
