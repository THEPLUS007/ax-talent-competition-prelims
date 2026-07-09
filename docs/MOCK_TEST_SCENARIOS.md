# Mock Test Scenarios

이 문서는 Travel Blocks AI의 기본 기능 테스트 데이터셋과 시나리오를 정의한다. 동일한 입력값은 Mock 모드와 향후 Real API 연동 검증에서 그대로 사용한다.

## 자연어 여행 요청

1. 오사카 3박 4일, 첫 해외여행, 맛집과 쇼핑 중심으로 짜줘.
2. 후쿠오카 2박 3일, 부모님과 함께 가는 여유로운 여행을 계획해줘. 이동은 최소화하고 맛집과 온천을 포함해줘.
3. 도쿄 4박 5일, 애니메이션 성지순례와 카페 투어 중심으로 일정을 짜줘. 아키하바라와 이케부쿠로는 반드시 포함해줘.
4. 제주도 2박 3일 렌터카 여행. 카페와 바다 위주로 동선을 최소화해서 계획해줘.

## YouTube URL

1. Osaka Travel Guide: https://www.youtube.com/watch?v=a6iqv_IRj-I
2. Osaka 6 Days Travel Vlog: https://www.youtube.com/watch?v=mHsQbwtn3vE
3. Osaka 3 Days Guide: https://www.youtube.com/watch?v=_p-o51VxaOA

## Blog URL

1. 네이버 모바일 블로그: https://m.blog.naver.com/PostView.naver?blogId=won_jieun&logNo=224334136284&navType=by
2. 티스토리 여행 블로그: https://cha2romantic.tistory.com/77
3. 네이버 PC 블로그: https://blog.naver.com/velyworld/220641782274

## 공통 확인 항목

- 여행 생성
- 여행 정보 자동 입력
- Day 자동 생성
- 일정 블록 생성
- 추천 블록 생성
- 블록 수정
- 블록 삭제
- 블록 이동
- 일정 저장
- 일정 불러오기
- Mock에서 Real 전환 시 테스트 데이터 구조 유지

## URL 타입별 기대 흐름

- YouTube: URL 입력 후 분석 실행 시 오사카 Day 4개와 블록이 생성된다.
- 네이버 모바일 블로그: URL 입력 후 분석 실행 시 오사카 Day 4개와 블록이 생성된다.
- 네이버 PC 블로그: URL 입력 후 분석 실행 시 오사카 Day 4개와 블록이 생성된다.
- 티스토리: URL 입력 후 분석 실행 시 오사카 Day 4개와 블록이 생성된다.

Mock 모드에서는 실제 영상 분석이나 블로그 본문 크롤링을 수행하지 않는다. 대신 입력, 분석 요청, 여행 정보 생성, Day 생성, 블록 생성까지의 서비스 흐름을 동일하게 검증한다.
