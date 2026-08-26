# 05_IMPLEMENTATION_PLAN.md

# Travel Blocks AI Implementation Plan

## 목적

이 문서는 Travel Blocks AI를 구현하기 위한 개발 순서를 정의한다.

Codex는 반드시 아래 순서를 지켜 작업해야 한다.

새로운 기능을 구현하기 전에 반드시 기존 프로젝트 구조를 먼저 분석하고 이해한다.

기존 UI와 아키텍처는 최대한 유지한다.

무리하게 전체 구조를 갈아엎지 않는다.

---

# 전체 개발 원칙

항상 다음 순서를 따른다.

① 프로젝트 분석

↓

② 설계 이해

↓

③ 작은 단위 구현

↓

④ 빌드

↓

⑤ 테스트

↓

⑥ 다음 기능 구현

기능을 여러 개 동시에 구현하지 않는다.

항상 하나의 Phase가 끝난 뒤 다음 Phase로 이동한다.

---

# Phase 0

## 프로젝트 분석

먼저 다음 파일을 모두 확인한다.

README.md

package.json

src 전체

plugin.json

.mcp.json

skills

mock 데이터

vite.config.ts

기존 컴포넌트

기존 Hook

기존 Utils

TODO

분석이 끝나기 전에는

절대 구현하지 않는다.

출력

- 현재 프로젝트 구조
- 컴포넌트 구조
- 상태 관리 방식
- Mock 데이터 구조
- 개선 대상

---

# Phase 1

## 프로젝트 안정화

목표

기존 프로젝트를 깨지 않는 것

수행

npm install

npm run build

npm run dev

가능하면

npm run lint

실행

빌드 오류가 있으면

먼저 해결

---

## log-hooks 확인

다음 확인

logs 폴더

log-hooks

README

없으면

설치 안내 추가

---

## README 확인

README에

- 실행 방법
- 프로젝트 소개
- 제출 구조
- log-hooks
- Mock AI

누락 여부 확인

---

# Phase 2

## Onboarding 구현

앱 첫 화면

↓

여행 생성 방식 선택

버튼

🧳

직접 생성

🤖

AI 생성

🔗

영상/링크 분석

각 버튼은

클릭 시

해당 입력 UI를 펼친다.

---

## 직접 생성

입력

여행 제목

국가

도시

기간

예산

인원

스타일

↓

여행 생성

---

## AI 생성

큰 입력창

↓

AI 일정 생성

↓

Mock AI

↓

여행 생성

---

## 링크 분석

입력창

↓

분석

↓

Mock AI

↓

여행 생성

---

완료 후

기존 메인 화면으로 이동

---

# Phase 3

## Day 시스템

브라우저 탭 방식 구현

기능

Day 추가

Day 삭제

Day 이름 변경

Day Drag

Split View

Detach View

현재 선택 Day 표시

---

# Phase 4

## Travel Block

여행 블록 구현

블록

추가

삭제

수정

복사

Drag

Drop

Day 이동

색상

카테고리

시간

비용

지원

---

# Phase 5

## Graph

블록 연결

구현

블록 클릭

↓

간선 추가

↓

다른 블록

↓

연결

간선 클릭

↓

메뉴

↓

교통수단 추가

↓

간선 삭제

간선 위

아이콘

이동시간

표시

---

# Phase 6

## 검색

검색

숙소

식당

카페

관광

액티비티

항공권

검색 결과

↓

블록으로 추가

↓

현재 Day 삽입

---

# Phase 7

## 추천 시스템

추천 블록

추천 이유

거리

예산

동선

추천 카드

Drag 가능

클릭 추가 가능

---

# Phase 8

## AI 보조

우측 하단

AI 버튼

↓

사이드 패널

지원

빈 시간 채우기

예산 줄이기

촬영지 추천

맛집 추천

동선 최적화

비 오는 날 추천

↓

블록 추가

---

# Phase 9

## 저장

저장

불러오기

삭제

이름 변경

최근 수정일

localStorage

Mock

지원

---

# Phase 10

## Export

텍스트

Markdown

복사

공유

지원

---

# Phase 11

## 예산

총 예산

Day 비용

남은 예산

블록 비용

추천 추가 시

실시간 계산

---

# Phase 12

## AI Travel Score

점수 계산

100점

평가

동선

예산

이동

다양성

변경 이유

출력

---

# Phase 13

## UI Polish

애니메이션

Hover

Transition

Drag 효과

Skeleton

Loading

AI 진행률

추가

---

# Phase 14

## Error Handling

모든 비동기

try-catch

timeout

fallback

Mock

적용

앱 종료 금지

---

# Phase 15

## 최종 QA

다음 확인

✔ npm run build

✔ npm run dev

✔ lint

✔ TypeScript Error 없음

✔ Console Error 없음

✔ README 최신

✔ plugin.json 최신

✔ SKILL.md 최신

✔ logs 확인

---

# 작업 규칙

Codex는

절대

모든 파일을 한 번에 수정하지 않는다.

항상

1개 Phase

↓

Build

↓

Commit 수준 검증

↓

다음 Phase

순서로 진행한다.

---

# 구현 원칙

Priority 1

Onboarding

Day

Travel Block

Graph

저장

Export

Priority 2

검색

추천

AI 보조

Split View

Priority 3

Detach

AI Score

고급 동선

고급 예산

---

# 완료 보고 형식

각 Phase 종료 시 다음 내용을 출력한다.

## 완료한 기능

## 수정한 파일

## 추가한 파일

## 빌드 결과

## 테스트 결과

## 남은 TODO

Phase가 모두 끝나면

최종 프로젝트 요약을 제공한다.