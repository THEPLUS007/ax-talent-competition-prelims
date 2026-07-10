# Log Disclosure

이 프로젝트의 `logs/` 폴더는 OpenAI AX Hackathon 예선 제출을 위해 AI 활용 과정을 보존하는 공간이다.

## 로그 파일 구분

현재 로그 구조는 다음과 같다.

- `logs/codex/019f4115-fe26-73c2-a867-6d83f72e6c1a.jsonl`
  - Codex CLI 작업 과정에서 수집된 JSONL 형식의 자동 실행 로그다.
- `logs/codex/019f3a81-baae-79f1-838c-945aa74a2fe5.manual.jsonl`
  - 이름에 `manual`이 포함된 보조 기록이다.
- `logs/codex/manual-current-session.md`
  - 자동 로그 수집 경로를 확인하기 어려웠던 일부 세션의 수동 보조 요약 기록이다.
- `logs/.gitkeep`
  - 빈 폴더 유지를 위한 파일이다.

## 원본성과 보조 기록의 관계

`logs/codex/*.jsonl`은 Codex CLI에서 수집된 원본 실행 로그다. `manual-current-session.md` 및 이름에 `manual`이 포함된 파일은 자동 로그 수집 경로를 확인하기 어려웠던 세션의 보조 기록이다.

해당 보조 기록은 원본 자동 로그를 대체한다고 주장하지 않는다. 제출물에서는 자동 JSONL 로그와 수동 보조 기록의 성격을 투명하게 구분한다.

## 주의사항

- 기존 로그 파일은 사후 편집, 발췌, 삭제하지 않는다.
- 새 보조 설명 문서는 원본 로그 자체를 대체하지 않는다.
- API key, token, password 등 민감정보는 로그와 문서에 기록하지 않는다.
