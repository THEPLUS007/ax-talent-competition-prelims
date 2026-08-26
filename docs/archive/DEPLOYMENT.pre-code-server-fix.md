# Deployment

web 정적 산출물과 api Node 프로세스를 별도로 배포하고 PostgreSQL을 연결합니다. production 필수 환경값은 `DATABASE_URL`, `GEMINI_API_KEY`이며 stable 모델을 `GEMINI_MODEL`로 명시합니다. TLS reverse proxy 뒤에서 API를 운영해 secure session cookie가 적용되게 해야 합니다.

배포 순서는 `npm ci`, `npm run build`, `npm run db:migrate`, `npm run start -w @travel-blocks/api`입니다. web은 `apps/web/dist`를 정적 호스팅하고 `/api`를 API origin으로 전달합니다. production에는 `AI_PROVIDER=test` 또는 `VITE_USE_MOCK=true`를 사용하지 않습니다.
