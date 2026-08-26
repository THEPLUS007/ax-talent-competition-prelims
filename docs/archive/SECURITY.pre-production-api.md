# Security

- 익명 session ID는 서버의 암호학적 난수로 생성하며 httpOnly, sameSite=lax cookie로 전달합니다. production에서는 secure가 활성화됩니다.
- DB에는 session 원문 대신 SHA-256 해시를 저장하고 모든 Trip query에 user ID 조건을 적용합니다.
- Zod 입력 검증, 64 KiB body limit, route rate limit 지점, request timeout, Helmet 보안 헤더를 적용합니다.
- Drizzle parameter binding으로 SQL injection을 방지하고 내부 오류 객체/provider 원문을 API 응답에 노출하지 않습니다.
- `SourceExtractor`만 정의되어 있으며 SSRF 위험이 있는 URL fetch는 구현하지 않았습니다. 향후 구현 시 private/metadata IP, redirect, 크기, content type, timeout, allowlist 검사가 필수입니다.
- `.env.local`은 무시하며 실제 secret을 저장소나 브라우저 bundle에 넣지 않습니다.
