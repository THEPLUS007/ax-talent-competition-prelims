import type { SavedTravelPlan, TravelBlock, TravelDay, TravelSourceType, TripFormData } from '../types/travel';

export type MockTravelCity = 'osaka' | 'tokyo' | 'fukuoka' | 'jeju';

export interface NaturalLanguageTravelTestCase {
  id: string;
  title: string;
  city: MockTravelCity;
  prompt: string;
}

export interface TravelUrlTestCase {
  id: string;
  title: string;
  sourceType: Exclude<TravelSourceType, 'text'>;
  provider: 'youtube' | 'naver-mobile' | 'naver-pc' | 'tistory';
  city: MockTravelCity;
  url: string;
}

export const naturalLanguageTravelTestCases: NaturalLanguageTravelTestCase[] = [
  { id: 'nl-osaka-food-shopping', title: '오사카 첫 해외여행 맛집 쇼핑', city: 'osaka', prompt: '오사카 3박 4일, 첫 해외여행, 맛집과 쇼핑 중심으로 짜줘.' },
  { id: 'nl-fukuoka-parents-onsen', title: '후쿠오카 부모님 여유 여행', city: 'fukuoka', prompt: '후쿠오카 2박 3일, 부모님과 함께 가는 여유로운 여행을 계획해줘.\n이동은 최소화하고 맛집과 온천을 포함해줘.' },
  { id: 'nl-tokyo-anime-cafe', title: '도쿄 애니 성지순례 카페', city: 'tokyo', prompt: '도쿄 4박 5일, 애니메이션 성지순례와 카페 투어 중심으로 일정을 짜줘.\n아키하바라와 이케부쿠로는 반드시 포함해줘.' },
  { id: 'nl-jeju-rental-car-cafe-sea', title: '제주 렌터카 카페 바다', city: 'jeju', prompt: '제주도 2박 3일 렌터카 여행.\n카페와 바다 위주로 동선을 최소화해서 계획해줘.' },
];

export const youtubeTravelTestCases: TravelUrlTestCase[] = [
  { id: 'youtube-osaka-guide', title: 'Osaka Travel Guide', sourceType: 'youtube', provider: 'youtube', city: 'osaka', url: 'https://www.youtube.com/watch?v=a6iqv_IRj-I' },
  { id: 'youtube-osaka-6-days-vlog', title: 'Osaka 6 Days Travel Vlog', sourceType: 'youtube', provider: 'youtube', city: 'osaka', url: 'https://www.youtube.com/watch?v=mHsQbwtn3vE' },
  { id: 'youtube-osaka-3-days-guide', title: 'Osaka 3 Days Guide', sourceType: 'youtube', provider: 'youtube', city: 'osaka', url: 'https://www.youtube.com/watch?v=_p-o51VxaOA' },
];

export const blogTravelTestCases: TravelUrlTestCase[] = [
  { id: 'blog-naver-mobile', title: '네이버 모바일 블로그', sourceType: 'blog', provider: 'naver-mobile', city: 'osaka', url: 'https://m.blog.naver.com/PostView.naver?blogId=won_jieun&logNo=224334136284&navType=by' },
  { id: 'blog-tistory', title: '티스토리 여행 블로그', sourceType: 'blog', provider: 'tistory', city: 'osaka', url: 'https://cha2romantic.tistory.com/77' },
  { id: 'blog-naver-pc', title: '네이버 PC 블로그', sourceType: 'blog', provider: 'naver-pc', city: 'osaka', url: 'https://blog.naver.com/velyworld/220641782274' },
];

export const mockCityTrips: Record<MockTravelCity, TripFormData> = {
  osaka: { name: '오사카 맛집 쇼핑 4일', country: '일본', city: '오사카', duration: '3박 4일', budget: '120만원', travelers: '2명', style: '맛집, 쇼핑, 첫 해외여행', description: '난바와 우메다를 중심으로 첫 해외여행자가 이동하기 쉬운 맛집과 쇼핑 일정' },
  tokyo: { name: '도쿄 애니 성지순례 5일', country: '일본', city: '도쿄', duration: '4박 5일', budget: '160만원', travelers: '2명', style: '애니 성지순례, 카페, 굿즈 쇼핑', description: '아키하바라와 이케부쿠로를 포함한 애니메이션 성지순례와 카페 투어 일정' },
  fukuoka: { name: '후쿠오카 부모님 온천 3일', country: '일본', city: '후쿠오카', duration: '2박 3일', budget: '110만원', travelers: '3명', style: '부모님, 여유, 맛집, 온천', description: '이동을 최소화하고 하카타와 다자이후, 온천 휴식을 중심으로 구성한 가족 여행' },
  jeju: { name: '제주 렌터카 카페 바다 3일', country: '대한민국', city: '제주', duration: '2박 3일', budget: '80만원', travelers: '2명', style: '렌터카, 카페, 바다, 짧은 동선', description: '렌터카로 동선을 줄이고 오션뷰 카페와 바다 명소를 중심으로 구성한 제주 여행' },
};

const block = (id: string, title: string, category: TravelBlock['category'], priceLevel: TravelBlock['priceLevel'], time: string, location: string, memo: string, estimatedCost: string): TravelBlock => ({ id, title, category, priceLevel, time, location, memo, estimatedCost });

export const mockCityTravelDays: Record<MockTravelCity, TravelDay[]> = {
  osaka: [
    { id: 'osaka-day-1', dayNumber: 1, title: '난바 도착과 도톤보리 맛집', city: '오사카', region: '난바', blocks: [block('osaka-1-checkin', '난바 숙소 체크인', 'stay', 'medium', '15:00', '난바', '라피트 또는 난카이선으로 이동하기 쉬운 숙소 권장', '160,000원'), block('osaka-1-dotonbori', '도톤보리 산책', 'sightseeing', 'low', '17:00', '도톤보리', '글리코상과 강변 포토 스팟 확인', '0원'), block('osaka-1-takoyaki', '타코야키와 오코노미야키', 'food', 'medium', '18:30', '도톤보리', '첫날은 숙소 근처에서 부담 없이 식사', '35,000원'), block('osaka-1-donki', '돈키호테 쇼핑', 'activity', 'medium', '20:00', '도톤보리점', '면세 쇼핑과 간식 구매', '70,000원')] },
    { id: 'osaka-day-2', dayNumber: 2, title: '오사카성 우메다 쇼핑', city: '오사카', region: '우메다', blocks: [block('osaka-2-castle', '오사카성 공원', 'sightseeing', 'low', '09:30', '오사카성', '오전 산책 후 실내 쇼핑으로 이동', '6,000원'), block('osaka-2-lunch', '규카츠 점심', 'food', 'medium', '12:30', '우메다', '웨이팅을 고려해 점심 피크 전후 방문', '28,000원'), block('osaka-2-shopping', '한큐 백화점 쇼핑', 'activity', 'high', '14:00', '우메다', '화장품, 잡화, 기념품 쇼핑 테스트 블록', '150,000원'), block('osaka-2-sky', '우메다 스카이빌딩 야경', 'sightseeing', 'medium', '18:30', '우메다', '해 질 무렵 입장 추천', '18,000원')] },
    { id: 'osaka-day-3', dayNumber: 3, title: '교토 당일치기 또는 감성 카페', city: '교토', region: '기온', blocks: [block('osaka-3-train', '교토 이동', 'transport', 'low', '09:00', '오사카역', 'JR 또는 한큐선 이동', '8,000원'), block('osaka-3-fushimi', '후시미이나리', 'sightseeing', 'low', '10:30', '교토', '초반 구간만 둘러봐도 충분한 코스', '0원'), block('osaka-3-cafe', '말차 카페', 'cafe', 'medium', '14:30', '기온', '휴식과 디저트 중심', '18,000원'), block('osaka-3-ramen', '난바 라멘 저녁', 'food', 'medium', '19:00', '난바', '오사카 복귀 후 간단한 저녁', '22,000원')] },
    { id: 'osaka-day-4', dayNumber: 4, title: '마지막 쇼핑과 공항 이동', city: '오사카', region: '난바', blocks: [block('osaka-4-market', '구로몬시장 아침', 'food', 'medium', '09:30', '구로몬시장', '해산물과 간식 위주로 짧게 방문', '35,000원'), block('osaka-4-parks', '난바 파크스', 'activity', 'medium', '11:00', '난바', '공항 이동 전 마지막 쇼핑', '60,000원'), block('osaka-4-airport', '간사이공항 이동', 'transport', 'medium', '14:30', '간사이국제공항', '출국 3시간 전 도착 기준', '15,000원')] },
  ],
  fukuoka: [
    { id: 'fukuoka-day-1', dayNumber: 1, title: '하카타 도착과 편한 저녁', city: '후쿠오카', region: '하카타', blocks: [block('fukuoka-1-checkin', '하카타역 근처 숙소 체크인', 'stay', 'medium', '15:00', '하카타', '부모님 동행 기준 역세권 숙소 추천', '150,000원'), block('fukuoka-1-canal', '캐널시티 짧은 산책', 'sightseeing', 'low', '16:30', '캐널시티', '무리하지 않는 실내 중심 첫 일정', '0원'), block('fukuoka-1-yatai', '하카타 라멘 저녁', 'food', 'medium', '18:30', '나카스', '좌석 있는 매장 우선', '28,000원')] },
    { id: 'fukuoka-day-2', dayNumber: 2, title: '다자이후와 온천 휴식', city: '다자이후', region: '다자이후', blocks: [block('fukuoka-2-train', '다자이후 이동', 'transport', 'low', '09:30', '니시테츠 후쿠오카역', '오전 한 번만 이동하는 여유 코스', '8,000원'), block('fukuoka-2-shrine', '다자이후 텐만구', 'sightseeing', 'low', '10:30', '다자이후', '평지 위주로 천천히 관람', '0원'), block('fukuoka-2-lunch', '우메가에모치와 정식 점심', 'food', 'medium', '12:30', '다자이후 상점가', '부모님 취향의 정식 메뉴 포함', '32,000원'), block('fukuoka-2-onsen', '온천 휴식', 'activity', 'medium', '15:30', '후쓰카이치 온천', '이동 피로를 줄이는 핵심 블록', '25,000원')] },
    { id: 'fukuoka-day-3', dayNumber: 3, title: '오호리공원과 공항 이동', city: '후쿠오카', region: '오호리공원', blocks: [block('fukuoka-3-park', '오호리공원 산책', 'sightseeing', 'low', '09:30', '오호리공원', '벤치와 카페가 많아 쉬기 좋음', '0원'), block('fukuoka-3-sushi', '스시 점심', 'food', 'medium', '12:00', '텐진', '공항 이동 전 가벼운 식사', '35,000원'), block('fukuoka-3-airport', '후쿠오카공항 이동', 'transport', 'low', '14:00', '후쿠오카공항', '도심에서 가까워 마지막 일정 부담이 낮음', '5,000원')] },
  ],
  tokyo: [
    { id: 'tokyo-day-1', dayNumber: 1, title: '도착과 아키하바라 입문', city: '도쿄', region: '아키하바라', blocks: [block('tokyo-1-checkin', '우에노 숙소 체크인', 'stay', 'medium', '15:00', '우에노', '아키하바라 접근성이 좋은 숙소', '170,000원'), block('tokyo-1-akiba', '아키하바라 전자상가', 'sightseeing', 'medium', '17:00', '아키하바라', '필수 포함 테스트 지점', '20,000원'), block('tokyo-1-goods', '굿즈샵 투어', 'activity', 'high', '18:30', '아키하바라', '피규어, 중고 굿즈 쇼핑', '100,000원')] },
    { id: 'tokyo-day-2', dayNumber: 2, title: '이케부쿠로와 콘셉트 카페', city: '도쿄', region: '이케부쿠로', blocks: [block('tokyo-2-ikebukuro', '이케부쿠로 선샤인시티', 'sightseeing', 'medium', '10:30', '이케부쿠로', '필수 포함 테스트 지점', '15,000원'), block('tokyo-2-otome', '오토메로드', 'activity', 'medium', '13:00', '이케부쿠로', '애니 성지순례 쇼핑 블록', '50,000원'), block('tokyo-2-cafe', '캐릭터 카페', 'cafe', 'medium', '15:30', '이케부쿠로', '예약 필요 여부 확인', '25,000원'), block('tokyo-2-ramen', '라멘 저녁', 'food', 'medium', '19:00', '신주쿠', '숙소 복귀 전 식사', '18,000원')] },
    { id: 'tokyo-day-3', dayNumber: 3, title: '시부야 하라주쿠 카페 투어', city: '도쿄', region: '시부야/하라주쿠', blocks: [block('tokyo-3-crossing', '시부야 스크램블', 'sightseeing', 'low', '10:00', '시부야', '도쿄 대표 포토 스팟', '0원'), block('tokyo-3-cafe', '하라주쿠 디저트 카페', 'cafe', 'medium', '13:00', '하라주쿠', '카페 투어 검증 블록', '20,000원'), block('tokyo-3-meiji', '메이지신궁 산책', 'sightseeing', 'low', '15:00', '하라주쿠', '쇼핑 사이 쉬어가는 일정', '0원')] },
    { id: 'tokyo-day-4', dayNumber: 4, title: '나카노 브로드웨이와 마지막 쇼핑', city: '도쿄', region: '나카노', blocks: [block('tokyo-4-nakano', '나카노 브로드웨이', 'activity', 'high', '11:00', '나카노', '중고 굿즈와 레트로 아이템 탐색', '90,000원'), block('tokyo-4-cafe', '키치조지 카페', 'cafe', 'medium', '15:00', '키치조지', '여유로운 카페 휴식', '18,000원'), block('tokyo-4-dinner', '이자카야 저녁', 'food', 'medium', '19:00', '신주쿠', '마지막 밤 식사', '45,000원')] },
    { id: 'tokyo-day-5', dayNumber: 5, title: '출국 전 우에노 산책', city: '도쿄', region: '우에노', blocks: [block('tokyo-5-park', '우에노공원 산책', 'sightseeing', 'low', '09:30', '우에노', '공항 이동 전 가벼운 산책', '0원'), block('tokyo-5-lunch', '에키벤과 기념품 구매', 'food', 'medium', '12:00', '우에노역', '나리타 이동 전 간단한 식사와 쇼핑', '25,000원'), block('tokyo-5-airport', '나리타공항 이동', 'transport', 'medium', '14:00', '나리타공항', '출국 3시간 전 도착 기준', '35,000원')] },
  ],
  jeju: [
    { id: 'jeju-day-1', dayNumber: 1, title: '공항 도착과 애월 바다', city: '제주', region: '애월', blocks: [block('jeju-1-rental', '렌터카 픽업', 'transport', 'medium', '10:00', '제주국제공항', '렌터카 여행 시작 지점', '70,000원'), block('jeju-1-cafe', '애월 오션뷰 카페', 'cafe', 'medium', '11:30', '애월', '바다와 카페 중심 테스트 블록', '20,000원'), block('jeju-1-coast', '한담해안산책로', 'sightseeing', 'low', '14:00', '애월', '동선을 줄이는 인접 코스', '0원'), block('jeju-1-checkin', '서쪽 숙소 체크인', 'stay', 'medium', '17:00', '애월', '첫날 이동 최소화', '130,000원')] },
    { id: 'jeju-day-2', dayNumber: 2, title: '협재와 한림 바다 코스', city: '제주', region: '한림/협재', blocks: [block('jeju-2-beach', '협재해수욕장', 'sightseeing', 'low', '10:00', '협재', '서쪽 바다 핵심 일정', '0원'), block('jeju-2-brunch', '한림 브런치 카페', 'cafe', 'medium', '12:30', '한림', '이동 거리가 짧은 카페', '25,000원'), block('jeju-2-park', '금능 해변 산책', 'sightseeing', 'low', '15:00', '금능', '협재와 가까운 바다 산책', '0원'), block('jeju-2-dinner', '흑돼지 저녁', 'food', 'high', '18:30', '한림', '숙소 복귀 전 식사', '70,000원')] },
    { id: 'jeju-day-3', dayNumber: 3, title: '공항 방향 카페와 반납', city: '제주', region: '제주시', blocks: [block('jeju-3-cafe', '이호테우 카페', 'cafe', 'medium', '10:30', '이호테우', '공항 가는 길에 들르기 좋은 카페', '18,000원'), block('jeju-3-market', '동문시장 기념품', 'activity', 'medium', '12:30', '제주시', '기념품과 간식 구매', '40,000원'), block('jeju-3-airport', '렌터카 반납과 공항 이동', 'transport', 'low', '15:00', '제주국제공항', '출발 2시간 전 반납 기준', '0원')] },
  ],
};

export const mockCityRecommendations: Record<MockTravelCity, TravelBlock[]> = {
  osaka: [block('recommend-osaka-kuromon', '구로몬시장 먹거리', 'food', 'medium', '', '닛폰바시', '오사카 맛집 추천', '35,000원'), block('recommend-osaka-shinsaibashi', '신사이바시 쇼핑', 'activity', 'high', '', '신사이바시', '쇼핑 중심 여행 추천', '120,000원'), block('recommend-osaka-aquarium', '가이유칸 수족관', 'sightseeing', 'medium', '', '덴포잔', '비 오는 날 대체 코스', '27,000원'), block('recommend-osaka-cafe', '호리에 카페', 'cafe', 'medium', '', '호리에', '쇼핑 후 휴식', '16,000원')],
  fukuoka: [block('recommend-fukuoka-motsunabe', '모츠나베 저녁', 'food', 'medium', '', '하카타', '부모님 동행 추천 식사', '45,000원'), block('recommend-fukuoka-onsen', '하카타역 온천', 'activity', 'medium', '', '하카타', '이동 최소화 온천 대안', '20,000원'), block('recommend-fukuoka-tower', '후쿠오카 타워', 'sightseeing', 'medium', '', '모모치', '야경 추천', '12,000원'), block('recommend-fukuoka-cafe', '오호리공원 카페', 'cafe', 'medium', '', '오호리공원', '산책 후 휴식', '14,000원')],
  tokyo: [block('recommend-tokyo-akiba-cafe', '아키하바라 콜라보 카페', 'cafe', 'medium', '', '아키하바라', '애니 테마 추천', '28,000원'), block('recommend-tokyo-ghibli', '지브리 미술관', 'sightseeing', 'medium', '', '미타카', '예약 필요', '10,000원'), block('recommend-tokyo-goods', '중고 굿즈샵', 'activity', 'high', '', '이케부쿠로', '성지순례 쇼핑 추천', '80,000원'), block('recommend-tokyo-sushi', '츠키지 스시', 'food', 'high', '', '츠키지', '도쿄 식사 추천', '60,000원')],
  jeju: [block('recommend-jeju-snoopy', '스누피가든', 'sightseeing', 'medium', '', '구좌읍', '비 오는 날도 가능한 관광지', '18,000원'), block('recommend-jeju-pork', '흑돼지 저녁', 'food', 'high', '', '제주시', '제주 대표 식사', '70,000원'), block('recommend-jeju-hotel', '오션뷰 호텔', 'stay', 'high', '', '중문', '숙소 업그레이드 추천', '220,000원'), block('recommend-jeju-kayak', '투명 카약', 'activity', 'medium', '', '쇠소깍', '렌터카 여행 액티비티', '35,000원')],
};


export const mockRegionRecommendations: Record<string, TravelBlock[]> = {
  '오사카': mockCityRecommendations.osaka,
  '난바': [block('recommend-namba-hozenji', '호젠지 요코초', 'sightseeing', 'low', '', '난바', '도톤보리 근처 전통 골목', '0원'), block('recommend-namba-ramen', '난바 라멘 골목', 'food', 'medium', '', '난바', '첫 해외여행자도 접근 쉬운 식사', '18,000원'), block('recommend-namba-parks', '난바 파크스', 'activity', 'medium', '', '난바', '공항 이동 전 쇼핑 대안', '60,000원'), block('recommend-namba-cafe', '도톤보리 리버뷰 카페', 'cafe', 'medium', '', '도톤보리', '도보 이동 가능한 휴식 포인트', '15,000원')],
  '우메다': [block('recommend-umeda-hep', 'HEP FIVE 관람차', 'sightseeing', 'medium', '', '우메다', '쇼핑 동선 안의 전망 명소', '8,000원'), block('recommend-umeda-links', '링크스 우메다 쇼핑', 'activity', 'high', '', '우메다', '가전, 패션, 잡화 쇼핑', '100,000원'), block('recommend-umeda-cafe', '그랑프론트 카페', 'cafe', 'medium', '', '우메다', '백화점 쇼핑 중 휴식', '16,000원'), block('recommend-umeda-kushikatsu', '우메다 쿠시카츠', 'food', 'medium', '', '우메다', '저녁 식사 추천', '32,000원')],
  '교토': [block('recommend-kyoto-kiyomizu', '기요미즈데라', 'sightseeing', 'medium', '', '교토', '대표 사찰 추천', '5,000원'), block('recommend-kyoto-ninenzaka', '니넨자카 산넨자카', 'sightseeing', 'low', '', '히가시야마', '전통거리 산책', '0원'), block('recommend-kyoto-machiya-cafe', '마치야 카페', 'cafe', 'medium', '', '기온', '전통가옥 카페', '18,000원'), block('recommend-kyoto-yudofu', '유도후 정식', 'food', 'medium', '', '교토', '교토식 점심 추천', '35,000원')],
  '기온': [block('recommend-gion-hanamikoji', '하나미코지도리', 'sightseeing', 'low', '', '기온', '전통거리 산책', '0원'), block('recommend-gion-yasaka', '야사카 신사', 'sightseeing', 'low', '', '기온', '기온 도보권 사찰/신사', '0원'), block('recommend-gion-matcha', '기온 말차 디저트', 'cafe', 'medium', '', '기온', '말차 카페 추천', '20,000원'), block('recommend-gion-kaiseki', '기온 가이세키 점심', 'food', 'high', '', '기온', '전통 식사 추천', '70,000원')],
  '하카타': [block('recommend-hakata-station-food', '하카타역 맛집층', 'food', 'medium', '', '하카타', '이동 적은 식사 추천', '30,000원'), block('recommend-hakata-onsen', '하카타역 온천', 'activity', 'medium', '', '하카타', '부모님 동행 휴식', '20,000원'), block('recommend-hakata-cafe', '하카타 커피 로스터리', 'cafe', 'medium', '', '하카타', '역 근처 휴식', '14,000원'), block('recommend-hakata-mall', '아뮤플라자 하카타', 'activity', 'medium', '', '하카타', '실내 쇼핑', '60,000원')],
  '다자이후': [block('recommend-dazaifu-museum', '규슈국립박물관', 'sightseeing', 'medium', '', '다자이후', '부모님과 보기 좋은 실내 명소', '7,000원'), block('recommend-dazaifu-street', '다자이후 상점가', 'sightseeing', 'low', '', '다자이후', '우메가에모치와 기념품', '15,000원'), block('recommend-dazaifu-cafe', '다자이후 정원 카페', 'cafe', 'medium', '', '다자이후', '천천히 쉬기 좋은 카페', '16,000원'), block('recommend-dazaifu-onsen', '후쓰카이치 온천 추가 휴식', 'activity', 'medium', '', '후쓰카이치', '오후 온천 대안', '25,000원')],
  '도쿄': mockCityRecommendations.tokyo,
  '아키하바라': [block('recommend-akiba-radio', '라디오회관', 'activity', 'high', '', '아키하바라', '피규어와 굿즈 쇼핑', '80,000원'), block('recommend-akiba-collabo', '콜라보 카페', 'cafe', 'medium', '', '아키하바라', '애니 테마 카페', '28,000원'), block('recommend-akiba-kanda', '칸다묘진', 'sightseeing', 'low', '', '아키하바라', '애니 팬 방문 명소', '0원'), block('recommend-akiba-curry', '아키하바라 카레', 'food', 'medium', '', '아키하바라', '쇼핑 중 빠른 식사', '18,000원')],
  '이케부쿠로': [block('recommend-ikebukuro-animate', '애니메이트 이케부쿠로', 'activity', 'high', '', '이케부쿠로', '굿즈 쇼핑 핵심', '80,000원'), block('recommend-ikebukuro-sunshine', '선샤인시티 전망대', 'sightseeing', 'medium', '', '이케부쿠로', '실내 관광 대안', '22,000원'), block('recommend-ikebukuro-cafe', '캐릭터 카페', 'cafe', 'medium', '', '이케부쿠로', '예약형 카페 추천', '30,000원'), block('recommend-ikebukuro-ramen', '이케부쿠로 라멘', 'food', 'medium', '', '이케부쿠로', '동선 짧은 저녁', '18,000원')],
  '시부야/하라주쿠': [block('recommend-shibuya-sky', '시부야 스카이', 'sightseeing', 'high', '', '시부야', '도쿄 전망 명소', '28,000원'), block('recommend-harajuku-crepe', '하라주쿠 크레페', 'food', 'low', '', '하라주쿠', '카페 투어 간식', '8,000원'), block('recommend-omotesando-cafe', '오모테산도 카페', 'cafe', 'medium', '', '오모테산도', '카페 투어 추천', '20,000원'), block('recommend-shibuya-parco', '시부야 PARCO 굿즈샵', 'activity', 'high', '', '시부야', '캐릭터/게임 굿즈 쇼핑', '90,000원')],
  '나카노': [block('recommend-nakano-mandarake', '만다라케 나카노', 'activity', 'high', '', '나카노', '레트로 굿즈 탐색', '90,000원'), block('recommend-nakano-cafe', '나카노 골목 카페', 'cafe', 'medium', '', '나카노', '쇼핑 후 휴식', '16,000원'), block('recommend-nakano-izakaya', '나카노 이자카야', 'food', 'medium', '', '나카노', '마지막 밤 식사', '40,000원'), block('recommend-nakano-park', '나카노 센트럴파크', 'sightseeing', 'low', '', '나카노', '짧은 산책', '0원')],
  '우에노': [block('recommend-ueno-ameyoko', '아메요코 시장', 'activity', 'medium', '', '우에노', '출국 전 쇼핑', '40,000원'), block('recommend-ueno-museum', '도쿄국립박물관', 'sightseeing', 'medium', '', '우에노', '비 오는 날 실내 명소', '10,000원'), block('recommend-ueno-cafe', '우에노 공원 카페', 'cafe', 'medium', '', '우에노', '공항 이동 전 휴식', '15,000원'), block('recommend-ueno-unagi', '우에노 장어덮밥', 'food', 'high', '', '우에노', '마지막 식사 추천', '55,000원')],
  '제주': mockCityRecommendations.jeju,
  '애월': [block('recommend-aewol-cafe', '애월 해안 카페', 'cafe', 'medium', '', '애월', '오션뷰 카페 추가 추천', '18,000원'), block('recommend-aewol-coast', '애월해안도로 드라이브', 'sightseeing', 'low', '', '애월', '렌터카 동선 추천', '0원'), block('recommend-aewol-seafood', '애월 해산물 식당', 'food', 'medium', '', '애월', '숙소 근처 저녁', '45,000원'), block('recommend-aewol-stay', '애월 오션뷰 숙소', 'stay', 'high', '', '애월', '첫날 숙소 대안', '220,000원')],
  '한림/협재': [block('recommend-hyeopjae-cafe', '협재 해변 카페', 'cafe', 'medium', '', '협재', '바다 앞 휴식', '18,000원'), block('recommend-hyeopjae-biyangdo', '비양도 뷰 포인트', 'sightseeing', 'low', '', '협재', '해변 포토 스팟', '0원'), block('recommend-hallim-park', '한림공원', 'sightseeing', 'medium', '', '한림', '가까운 관광 대안', '15,000원'), block('recommend-hallim-seafood', '한림 해산물 저녁', 'food', 'medium', '', '한림', '동선 짧은 식사', '45,000원')],
  '제주시': [block('recommend-jeju-city-market', '동문시장 야식', 'food', 'medium', '', '제주시', '공항 전후 간식', '30,000원'), block('recommend-jeju-city-cafe', '이호테우 해변 카페', 'cafe', 'medium', '', '제주시', '공항 가까운 카페', '18,000원'), block('recommend-jeju-city-museum', '제주민속자연사박물관', 'sightseeing', 'low', '', '제주시', '짧은 실내 관광', '5,000원'), block('recommend-jeju-city-shopping', '공항 면세 쇼핑', 'activity', 'medium', '', '제주국제공항', '출국 전 쇼핑', '50,000원')],
};

const cityKeywordMap: Array<{ city: MockTravelCity; keywords: string[] }> = [
  { city: 'osaka', keywords: ['오사카', 'osaka', 'a6iqv_irj-i', 'mhsqbwtn3ve', '_p-o51vxaoa', 'won_jieun', '224334136284', 'cha2romantic.tistory.com/77', 'velyworld/220641782274'] },
  { city: 'tokyo', keywords: ['도쿄', 'tokyo', '아키하바라', '이케부쿠로', 'akihabara', 'ikebukuro'] },
  { city: 'fukuoka', keywords: ['후쿠오카', 'fukuoka', '하카타', '다자이후', '온천'] },
  { city: 'jeju', keywords: ['제주', '제주도', 'jeju', '렌터카', '애월', '협재'] },
];

export function resolveMockCityFromContent(content: string): MockTravelCity {
  const normalizedContent = content.toLowerCase();
  return cityKeywordMap.find(({ keywords }) => keywords.some((keyword) => normalizedContent.includes(keyword.toLowerCase())))?.city ?? 'jeju';
}

export function detectMockUrlProvider(content: string): TravelUrlTestCase['provider'] | null {
  const normalizedContent = content.toLowerCase();
  if (normalizedContent.includes('youtube.com') || normalizedContent.includes('youtu.be')) return 'youtube';
  if (normalizedContent.includes('m.blog.naver.com')) return 'naver-mobile';
  if (normalizedContent.includes('blog.naver.com')) return 'naver-pc';
  if (normalizedContent.includes('tistory.com')) return 'tistory';
  return null;
}

export const mockSavedTravelPlans: SavedTravelPlan[] = [
  { id: 'saved-osaka-food-shopping', title: mockCityTrips.osaka.name, subtitle: '첫 해외여행, 맛집과 쇼핑 중심', trip: mockCityTrips.osaka, days: mockCityTravelDays.osaka, connections: [] },
  { id: 'saved-fukuoka-parents-onsen', title: mockCityTrips.fukuoka.name, subtitle: '부모님과 함께하는 여유로운 온천 여행', trip: mockCityTrips.fukuoka, days: mockCityTravelDays.fukuoka, connections: [] },
  { id: 'saved-tokyo-anime-cafe', title: mockCityTrips.tokyo.name, subtitle: '아키하바라, 이케부쿠로 포함', trip: mockCityTrips.tokyo, days: mockCityTravelDays.tokyo, connections: [] },
  { id: 'saved-jeju-rental-car', title: mockCityTrips.jeju.name, subtitle: '렌터카, 카페, 바다, 짧은 동선', trip: mockCityTrips.jeju, days: mockCityTravelDays.jeju, connections: [] },
];
