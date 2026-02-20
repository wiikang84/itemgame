# ItemGame - 소셜 카지노 웹 게임

## 프로젝트 개요
| 항목 | 내용 |
|------|------|
| **프로젝트명** | ItemGame |
| **유형** | 소셜 카지노 웹 게임 데모 |
| **GitHub** | https://github.com/wiikang84/itemgame |
| **외부 URL** | https://wiikang84.github.io/itemgame/ |
| **슬롯머신** | https://wiikang84.github.io/itemgame/slot.html |
| **블랙잭** | https://wiikang84.github.io/itemgame/blackjack.html |
| **룰렛** | https://wiikang84.github.io/itemgame/roulette.html |
| **호스팅** | GitHub Pages |
| **DB** | Firebase (Firestore + Auth) |

## 핵심 모델
- 카지노 스타일 게임(슬롯/블랙잭/룰렛)에서 **가상 칩** 사용
- 플랫폼이 칩 판매, 유저간 거래 없음, 환전 불가 → 표준 소셜 카지노 모델

## 기술 스택
- HTML5 + CSS3 + Vanilla JS (프레임워크 없음)
- Canvas API (룰렛 휠 애니메이션, HiDPI 지원 / 코인 샤워 파티클)
- Web Audio API (프로그래매틱 효과음, 외부 파일 없음)
- CSS Transform 기반 릴 애니메이션 (슬롯)
- CSS 3D Perspective 카드 애니메이션 (블랙잭)
- Firebase (Firestore + Auth, 익명 로그인)
- GitHub Pages 호스팅

## 파일 구조
```
itemgame/
├── index.html              # 메인 로비 (게임 선택 + 7일 출석 보너스)
├── slot.html               # 슬롯머신 "LUCKY JACKPOT"
├── blackjack.html          # 블랙잭
├── roulette.html           # 룰렛
├── sea-story.html          # 바다이야기 슬롯
├── ladder.html             # 사다리 게임 "NEON LADDER"
├── css/
│   ├── common.css          # 공통 다크 카지노 테마 + 레벨/XP UI
│   ├── slot.css            # 슬롯 전용 (v5.1 프리미엄 비주얼)
│   ├── blackjack.css       # 블랙잭 전용
│   ├── roulette.css        # 룰렛 전용
│   ├── sea-story.css       # 바다이야기 전용
│   └── ladder.css          # 사다리 전용
├── js/
│   ├── core/
│   │   ├── firebase-config.js  # Firebase 설정 + Firestore 헬퍼
│   │   ├── chip-manager.js     # 칩 잔액 관리 (Firestore 동기화)
│   │   ├── sound-manager.js    # Web Audio API 사운드 매니저
│   │   ├── coin-shower.js      # Canvas 코인 파티클 (3D 회전)
│   │   └── level-manager.js    # XP/레벨 시스템
│   └── games/
│       ├── slot-machine.js     # 슬롯머신 로직 v3.0
│       ├── blackjack.js        # 블랙잭 로직
│       ├── roulette.js         # 룰렛 로직
│       ├── sea-story.js       # 바다이야기 로직
│       └── ladder.js         # 사다리 게임 로직
├── firestore.rules         # Firestore 보안 규칙
├── CLAUDE.md
└── .gitignore
```

## 게임 사양

### 슬롯머신 "LUCKY JACKPOT" (현재 v5.1)
- **릴 구성**: 5x3 릴, 9 페이라인, RTP ~96%
- **심볼 11종**: 7, BAR, Cherry, Bell, Diamond, Lemon, Orange, Grapes, Watermelon, WILD, BONUS
- **와일드(WILD)**: 보너스 제외 모든 심볼 대체, 최고 배당 x1000
- **보너스(Scatter)**: 3개+ 출현 시 무료스핀 (10/15/25회), 프로그레시브 배율 (최대 x10)
- **5단계 승리 연출**: 당첨 → 좋은 당첨 → 대박 → 초대박 → 잭팟
- **갬블/더블업**: 빨강/검정 카드 색상 맞추기 (50/50), 연속 갬블 가능
- **앤티시페이션**: 스캐터 2개 출현 시 마지막 릴 지연 + 서스펜스 효과
- **오토스핀**: 10/25/50/100/무제한 횟수 선택 메뉴
- **비주얼 (v5.1)**: 12개 황금 스포트라이트, 크롬 그라데이션 캐비닛, 7레이어 JACKPOT 네온, 금+빨강 10개 LED, 릴 프레임 LED 테두리, 마카오풍 레드 언더글로우
- **전체 UI 한국어화**

### 블랙잭 (v2.0 프리미엄)
- 6덱 슈, 딜러 소프트17 스탠드
- Hit / Stand / Double / Split / **Insurance** / **Surrender**
- **딜러 Peek**: 딜러 에이스/10 시 블랙잭 자동 확인
- **Soft/Hard 점수**: 에이스 11 카운트 시 "Soft" 라벨
- **사이드벳**: Perfect Pairs (5:1~25:1) + 21+3 (5:1~100:1)
- **통계 추적**: 승/패/무승부/블랙잭/총핸드 실시간 표시
- **리벳**: 이전 베팅 금액으로 빠른 딜
- **슈 인디케이터**: 남은 카드 수 프로그레스 바
- **테이블 글로우**: 승리 시 그린 글로우, 블랙잭 시 골드 글로우
- 세미서클 펠트 테이블 + 골드 림 + 스포트라이트/비네팅
- 3D 칩 (엣지 스팟 + 두께 그림자) + 페이스 카드 아이콘 (J♞/Q♛/K♚)
- 3D 아크 궤적 카드 딜 + 플립 애니메이션

### 바다이야기 "SEA STORY" (v1.0)
- **릴 구성**: 5x3 릴, 9 페이라인, RTP ~96%
- **심볼 11종**: 인어공주, 상어, 문어, 거북이, 돌고래, 열대어, 조개, 불가사리, 게, WILD(삼지창), BONUS(닻)
- **와일드(🔱)**: 보너스 제외 모든 심볼 대체, 최고 배당 x1000
- **보너스(⚓ Scatter)**: 3개+ 출현 시 무료스핀 (10/15/25회), 프로그레시브 배율 (최대 x10)
- **5단계 승리 연출**: 당첨 → 좋은 당첨 → 대어 → 보물발견 → 인어의축복
- **갬블/더블업**: 물고기 방향 맞추기 (50/50), 연속 갬블 가능
- **수중 비주얼**: 딥오션 블루 팔레트, 버블 파티클, 수중 광선, 오션 크롬 캐비닛
- **오토스핀**: 10/25/50/100/무제한 횟수 선택 메뉴

### 사다리 "NEON LADDER" (v2.0)
- **구조**: 2선 사다리, 3줄 or 4줄 가로선 (50/50 랜덤)
- **베팅 2종**:
  - 홀짝 (1.95배): 홀 / 짝
  - 조합 (3.8배): 홀3 / 짝3 / 홀4 / 짝4
- **v2.0 점진적 가로선 발견**: 가로선을 숨기고 애벌레가 내려가며 하나씩 발견
  - 4개 체크포인트 (3줄=1개 빈칸, 4줄=모두 가로선)
  - 각 체크포인트에서 "?" 서스펜스 → 발견/빈칸 결정
  - 마지막 체크포인트까지 결과 모름 → 긴장감 극대화
- **Canvas 카와이 파스텔 비주얼**: 핑크 네온 사다리 + 민트 가로선 + 귀여운 애벌레 캐릭터
- **테마**: 카와이 파스텔+네온 (다크퍼플 #1a0a2e + 핑크 #FF78F0 + 민트 #3CFFDC)
- **히스토리 바**: 최근 30회 결과 (홀=파스텔블루, 짝=파스텔핑크 도트)

### 룰렛
- 유럽식 37칸 (0~36)
- Canvas 휠 애니메이션 (HiDPI 지원)
- 히스토리 빨강/검정 비율 바 차트

### 공통 시스템
- **칩 시스템**: Firestore 동기화, 익명 Auth, BFCache 대응
- **레벨 시스템**: 베팅 금액 10% XP 획득, 레벨업 보너스 칩
- **사운드**: Web Audio API BGM(메인+프리스핀), 5단계 승리음, 각종 효과음
- **코인 샤워**: Canvas 기반 3D 코인 파티클 (Big Win 이상)
- **7일 출석 보너스**: 1K→1.5K→2K→3K→5K→7K→10K (Firestore streak 동기화)
- **모바일 하단 네비**: 768px 이하 홈/보너스/사운드 탭

## 로컬 테스트
```bash
cd itemgame
python -m http.server 8888
# → http://localhost:8888
```
**포트 8888 고정** (8080은 다른 서비스와 충돌 가능)

## JS 셀렉터 (슬롯머신 - 변경 금지)
- **ID 29개**: spinButton, autoSpinBtn, creditDisplay, winDisplay, slotResult, betAmount, totalBet, reelsGrid, reelsContainer, freeSpinCounter, multiplierDisplay, gamblePanel, gambleCard, autoSpinMenu, winOverlay, freeSpinBanner, paytableSection, paytableGrid, gameStats, headerChips, levelDisplay, xpBarFill, xpText, coinShowerCanvas, levelupOverlay, levelupTitle, levelupBonus, soundToggleBtn, toastContainer
- **Class 19개**: .reels-grid, .reel, .reel-strip, .reel-symbol, .cab-btn-spin, .cab-btn-auto, .cab-btn-maxbet, .cab-btn-bet, .cab-btn-info, .auto-spin-wrapper, .auto-spin-menu, .gamble-panel, .gamble-card, .gamble-btn, .win-overlay, .win-content, .win-tier-text, .win-amount, .free-spin-banner

---

## 변경 로그

### 2026-02-11 | 초기 구현 + 품질 개선

- 프로젝트 초기 생성, 전체 게임(로비/슬롯/블랙잭/룰렛) 구현
- 품질 대폭 개선 (5 Phase): 버그 수정, 릴 애니메이션 재작성, 블랙잭 카드 재설계, 룰렛 Canvas HiDPI, SoundManager 신규
- 슬롯머신 v2.0 "PHARAOH'S FORTUNE": 해외 인기 슬롯 벤치마킹, Wild/Scatter 프리스핀, 5단계 빅윈, 갬블/더블업, 이집트 테마

### 2026-02-12 | 슬롯 v3.0~v5.1 + Firebase 실연동

- **슬롯 v3.0 "LUCKY SEVENS"**: 이집트 → 클래식 카지노 전환, 캐비닛 UI (메탈릭 프레임, LED, 크롬 베젤)
- **심볼 교체**: 알파벳(A/K/Q/J) 완전 제거 → 과일/전통 심볼만 (7/BAR/Cherry 등 11종)
- **슬롯 v4.0**: 전체 UI 한국어화, 오토스핀 UX 개선, transitionend 안전 타이머
- **ItemGame v2.0**: Firebase 실연동(익명 Auth+Firestore), coin-shower.js, level-manager.js 신규, 7일 출석 보너스, 모바일 하단 네비 (16개 파일 변경)
- **슬롯 v5.0 "LUCKY JACKPOT"**: 12개 황금 스포트라이트, conic-gradient 회전, 3D 캐비닛 깊이감, JACKPOT 네온 배너, LED 스트립, 버튼 삼분할, 승리 배경 반응
- **슬롯 v5.1 "International Premium"**: v5.0 비주얼 수치 3~5배 대폭 강화
  - 스포트라이트 opacity 0.10~0.18 → 0.25~0.45
  - conic-gradient opacity 0.02~0.03 → 0.08~0.10
  - 캐비닛: 크롬 그라데이션 border 5px + box-shadow 6계층 (골드 글로우 3배)
  - JACKPOT: 2.8rem → 3.4rem, 7레이어 text-shadow (화이트 코어)
  - LED: 6개 금색 → 10개 금+빨강 교차
  - 신규: 장식 요소(별/다이아/크라운), 릴 프레임 LED 테두리, 마카오풍 레드 언더글로우
  - 승리 시 릴 프레임 LED 버스트 (JS 6줄)
  - 반응형: 768px LED 8개, 480px LED 6개 + 장식 숨김
  - 변경 파일: slot.html, css/slot.css, js/games/slot-machine.js, CLAUDE.md
- **블랙잭 v2.0 "Premium Casino"**: 전면 비주얼/로직 업그레이드
  - 비주얼: 세미서클 펠트 테이블, 골드 림 보더, 스포트라이트/비네팅, 3D 칩 (엣지스팟), 골드 네온 타이틀
  - 카드: 페이스카드 아이콘(J♞/Q♛/K♚), 아크 궤적 딜 애니메이션, 호버 들어올림
  - 게임 로직: 인슈어런스(2:1 보험), 서렌더(절반 환불), 딜러 Peek, Soft/Hard 점수 표시
  - 사이드벳: Perfect Pairs(Mixed 5:1/Colored 12:1/Perfect 25:1) + 21+3(Flush~Suited Three 5:1~100:1)
  - UX: 리벳 버튼, 슈 인디케이터, 통계 패널(5항목), 테이블 글로우(승리/블랙잭), 최대 베팅 50,000
  - 변경 파일: blackjack.html, css/blackjack.css, js/games/blackjack.js, CLAUDE.md

### 2026-02-19 | 룰렛 v2.0 전면 개선

- **베팅 시스템 개편**: MAX_BET 상한 철폐 (잔액=한도), 칩 단위 확대 (100/500/1K/5K/10K/50K)
- **퀵 베팅 버튼 추가**: REBET(이전 베팅 반복), x2(더블), ALL-IN(잔액 전부)
- **UI 가독성 대폭 강화**:
  - 베팅 셀: 40px→48px, 폰트 0.85rem→1rem, text-shadow 추가
  - 빨강 셀: #cc0000→#e61919 (더 밝고 선명)
  - 아웃사이드 배경: rgba(0,0,0,0.3)→rgba(0,0,0,0.6)
  - 칩 버튼: 48px→56px + 바운스 애니메이션
  - 히스토리: 28px→36px, 폰트 0.7rem→0.85rem
  - 총 베팅액 표시 확대 (1.5rem + 글로우)
- **승리 연출 강화**: 배수 기준→당첨금 절대액 기준 (1만/10만/100만칩)
- **MEGA WIN 연출**: 100만칩 이상 당첨 시 풀스크린 오버레이 + 코인샤워 6초
- 변경 파일: roulette.html, css/roulette.css, js/games/roulette.js, CLAUDE.md

### 2026-02-19 | 룰렛 볼-휠 동기화 버그 수정 + 포징 연출

- **[치명적 버그 수정]** 볼이 마지막 프레임에서 순간이동하던 문제 해결
  - 원인: 볼과 휠이 독립적 easing으로 회전 → progress=1에서 강제 스냅
  - 해결: 3-Phase 볼 물리 시스템 도입
- 변경 파일: js/games/roulette.js, CLAUDE.md

### 2026-02-19 | 룰렛 리얼 카지노급 애니메이션 (카지노 전문가 리뷰)

- **5-Phase 볼 물리 시스템** 전면 재작성 (카지노 전문가 마이클 첸 감수)
  - Phase 1 (0~50%): 외곽 림 고속 나선형 감속
  - Phase 2 (50~70%): 안쪽 낙하 + S커브 포켓 진입
  - Phase 3 (70~88%): **포켓 바운스** (+2칸 → -1칸 → +1칸 → 안착) ← 핵심 긴장감
  - Phase 4 (88~100%): 포켓 안착 + 휠 동기화 최종 감속
  - Phase 5 (+3초): 포징 (줌인 + 글로우 + 하이라이트)
- **휠 감속 개선**: easeOutQuart → **easeOutExpo** (마지막이 극적으로 느림)
- **볼 크기 확대**: 6px → **8px** + 3D 입체 그라디언트 + 테두리
- **틱 사운드 끝까지**: Phase 3~4에서 각도 기반 틱 (포켓 지날 때마다)
- **총 애니메이션**: 5초 → **6초** (감속 여유)
- **휠 회전량**: 10π → **12π** (더 많이 돌아서 리얼함)
- 변경 파일: js/games/roulette.js, CLAUDE.md

### 2026-02-19 | 블랙잭 ALL-IN + 슬롯머신 자동스핀 안정화

- **블랙잭 v2.1: ALL-IN 기능 추가**
  - `allIn()` 함수 추가 (잔액 전부 베팅, MAX_BET 50,000 상한)
  - blackjack.html에 ALL-IN 버튼 추가 (빨간 그라디언트 스타일)
  - 모듈 export에 allIn 추가
- **슬롯머신 v3.1: 자동스핀 멈춤 현상 수정**
  - `spin()` 함수 try-catch-finally 래핑 → isSpinning 항상 해제 보장
  - `_animateReels` 마스터 타임아웃 8초 추가 (전체 애니메이션 강제 완료)
  - 릴별 안전 타이머: 고정 4000ms → 동적 계산 (duration + 2초)
  - 자동스핀용 빠른 승리 연출 `_showWinCelebrationQuick()` 추가 (원래의 ~40% 시간)
  - 다음 스핀 스케줄링 `_scheduleNextSpin()` 함수 분리
  - 자동스핀 간격 800ms → 600ms로 단축
- 변경 파일: js/games/blackjack.js, blackjack.html, js/games/slot-machine.js, CLAUDE.md

### 2026-02-19 | 룰렛 v3.0 프리미엄 카지노 테이블 리디자인

- **전면 UI 리디자인** (슬롯/블랙잭 수준 프리미엄화)
  - 골드 림 보더 테이블 프레임 (5단계 그라디언트 + 다층 box-shadow)
  - 카지노 펠트 텍스처 배경 (SVG 패턴 + radial-gradient 조명)
  - 비네팅 효과 (중앙 밝고 가장자리 어둡게)
  - 스포트라이트 오버레이 (상단 골드 + 좌우 백색)
  - 다크 그린 카지노 컬러 (#0c2810 → #061408)
- **타이틀 리뉴얼**: 이모지 제거, Poppins 폰트 + 네온 골드 text-shadow + 다이아몬드 장식
- **베팅 테이블 업그레이드**: 골드 림 분리 프레임, 펠트 텍스처, 그라디언트 셀 배경
- **컨트롤 패널**: 별도 다크 패널로 분리, TOTAL BET + 퀵 버튼 한 줄 배치
- **규칙 카드**: 전용 .roulette-rules 스타일 (인라인 스타일 제거)
- **승리 시 테이블 글로우**: 골드 림이 그린으로 발광
- **SPIN 버튼**: 레드 그라디언트 + 골드 보더 + 인셋 하이라이트
- 변경 파일: roulette.html, css/roulette.css, js/games/roulette.js, CLAUDE.md

### 2026-02-19 | 룰렛 v3.1 자동스핀 기능 추가

- **AUTO 스핀 기능 추가** (기존에 없던 신규 기능)
  - `toggleAutoSpin()`, `_stopAutoSpin()`, `_updateAutoBtn()` 함수 추가
  - `_scheduleNextAutoSpin()` - 잔액/베팅 확인 후 800ms 후 다음 스핀
  - 자동스핀 시 이전 베팅(`lastBets`) 자동 복원
  - 자동스핀 중 칩 부족/베팅 없음 시 자동 정지
- **안전 메커니즘 추가**
  - `spin()` 함수 try-catch-finally 래핑 → isSpinning 항상 해제 보장
  - `_animateWheelWithBall` 마스터 타임아웃 12초 + safeResolve 패턴
  - quickMode: 포징 3초→1.5초, 딜레이 단축
- **AUTO 버튼 CSS**: 블루 기본 + 레드 active 상태 + pulse 애니메이션
- 변경 파일: roulette.html, css/roulette.css, js/games/roulette.js, CLAUDE.md

### 2026-02-19 | 바다이야기 SEA STORY v1.0 신규 게임 추가

- **바다이야기 슬롯머신 신규 생성** (4개 파일 신규)
  - `sea-story.html` - 해양 테마 슬롯머신 페이지
  - `css/sea-story.css` - 수중 테마 CSS (딥오션 블루 팔레트)
  - `js/games/sea-story.js` - SeaStory 게임 모듈
- **해양 심볼 11종**: 인어공주(x600), 상어(x300), 문어(x200), 거북이(x150), 돌고래(x100), 열대어(x80), 조개(x50), 불가사리(x40), 게(x30), 🔱WILD(x1000), ⚓BONUS(프리스핀)
- **수중 비주얼 테마**
  - 컬러 팔레트: 골드→시안(#00d4ff), 레드→코랄(#ff6b6b), 딥오션 배경(#020818)
  - 수중 스포트라이트 (12개 블루 광선)
  - 버블 효과 (Canvas 기반 25개 버블 파티클)
  - LED 스트립: 블루+시안 교차
  - 스핀 버튼: 틸 그라디언트
  - 캐비닛: 오션 크롬 프레임
- **게임 로직**: LUCKY JACKPOT과 동일 (5x3릴, 9페이라인, RTP~96%, 프리스핀, 갬블/더블업)
- **승리 티어**: 당첨/좋은 당첨/대어/보물발견/인어의축복
- **더블업**: "물고기가 어느 쪽으로 헤엄칠까?" (왼쪽/오른쪽)
- **로비(index.html)**: 바다이야기 게임 카드 추가 (시안 테마 PLAY 버튼)
- 변경 파일: sea-story.html(신규), css/sea-story.css(신규), js/games/sea-story.js(신규), index.html, CLAUDE.md

### 2026-02-19 | 사다리 게임 "NEON LADDER" v1.0 신규 추가

- **사다리 게임 신규 생성** (3개 파일 신규)
  - `ladder.html` - 사다리 게임 페이지
  - `css/ladder.css` - 사이버펑크 네온 테마 CSS
  - `js/games/ladder.js` - LadderGame 게임 모듈
- **게임 방식**: 네임드 스타일 2선 사다리, 3줄/4줄 가로선
- **베팅 시스템**: 싱글 3종(출발/줄수/도착) 1.95배 + 조합 4종 3.8배
- **Canvas 비주얼**: 네온 시안 사다리 + 퍼플 가로선 + 골든 파이어볼 + 트레일 이펙트
- **3단계 연출**: 카운트다운 → 사다리 가로선 순차 공개 → 출발점 깜빡임 → 볼 하강 애니메이션
- **볼 물리**: 세그먼트별 이징(수직=easeInOutCubic, 수평=easeInOutQuad), 마지막 구간 슬로모션 1.2초
- **도착 플래시**: 3회 글로우 펄스 + 결과 텍스트 오버레이
- **히스토리 바**: 최근 30회 결과 스크롤 (홀=블루, 짝=레드)
- **로비(index.html)**: 사다리 게임 카드 추가 (시안-퍼플 그라디언트 테마)
- 변경 파일: ladder.html(신규), css/ladder.css(신규), js/games/ladder.js(신규), index.html, CLAUDE.md

### 2026-02-19 | 사다리 v1.1 귀여운 애벌레 캐릭터 적용

- **골든 파이어볼 → 애벌레 캐릭터로 교체** (_drawBall 전면 리디자인)
  - 머리: 연두색 원 + 큰 눈(흰자+동공+하이라이트) + 핑크 볼터치 + 미소
  - 더듬이: 곡선 + 노란 끝 구슬 + 사인파 흔들림
  - 몸통: 트레일 → 6마디 세그먼트 (연두-초록 교차), 사인파 웨이글
  - 작은 발: 세그먼트 양옆에 귀여운 점 발
- 기존 _drawBall(파이어볼) 코드 주석처리 보존
- 타이틀: "네온 사다리" → "꿈틀꿈틀 애벌레 사다리 🐛"
- 변경 파일: js/games/ladder.js, ladder.html, index.html, CLAUDE.md

### 2026-02-19 | 사다리 v1.2 베팅 단순화 + 극적 슬로모션

- **베팅 시스템 단순화** (10종 → 6종)
  - 제거: 출발(좌/우), 줄수(3/4) 싱글 베팅
  - 유지: 홀/짝 (1.95배)
  - 조합 리네이밍: 좌3짝/좌4홀/우3홀/우4짝 → 홀3/짝3/홀4/짝4 (3.8배)
  - 조합 그리드: 4열 → 2열 (더 큰 버튼, 모바일 편의)
- **극적 슬로모션 연출** (~7초 → ~20초)
  - 카운트다운: 750ms → 900ms
  - 가로선 공개: 400ms → 800ms
  - 줄수 텍스트: 500ms → 1000ms (폰트 확대)
  - 출발점 깜빡: 3회(180/120ms) → 4회(300/200ms)
  - 일반 수직 이동: 450ms → 1200ms
  - 가로선 교차: 300ms → 600ms
  - 교차 후 정지: 60ms → 500ms (긴장감 극대화)
  - 마지막 하강 전: 서스펜스 1200ms 추가 (NEW)
  - 마지막 하강: 1200ms → 3000ms + QuintEasing (극적 가감속)
- **_easeInOutQuint** 이징 함수 추가 (마지막 하강 전용)
- **_animSeg** 커스텀 이징 파라미터 추가
- 캔버스 라벨: '좌출발/우출발' → '좌/우', '홀(좌)/짝(우)' → '홀/짝'
- 게임 규칙 텍스트 업데이트
- 기존 _evalBets 코드 주석처리 보존
- 변경 파일: js/games/ladder.js, ladder.html, css/ladder.css, CLAUDE.md

### 2026-02-20 | 사다리 v2.0 점진적 가로선 발견 시스템 (게임 플로우 완전 재작성)

- **핵심 문제 해결**: 가로선+출발점이 미리 공개되어 결과를 즉시 알 수 있던 치명적 설계 결함 수정
- **v2.0 새 게임 플로우** (점진적 발견 → 긴장감 극대화)
  1. 카운트다운 3-2-1
  2. 출발점만 공개 (가로선은 숨김!)
  3. 애벌레가 내려가면서 4개 체크포인트에서 가로선 존재 여부 발견
  4. 각 체크포인트: "?" 서스펜스 → 가로선 등장(교차) 또는 빈칸(✕ 통과)
  5. 3줄 게임=1개 빈칸, 4줄=모두 가로선 → 마지막까지 결과 모름
  6. 도착 플래시 + 결과 공개
- **_generateResult() 재설계**: 항상 4개 체크포인트 생성, `rungActive` 배열로 3줄/4줄 구분
- **_drawLadderV2() 신규**: 모듈 변수 `visibleRungs`/`emptyChecks` 기반 점진적 렌더링
- **_drawFrame() v2.0**: 파라미터 제거, 모듈 변수 사용
- **_calcPath() 주석처리**: 사전 경로 계산 → 동적 실시간 경로로 전환
- **start() 완전 재작성**: 체크포인트 기반 순차 하강 + 서스펜스 연출
- **빈 체크포인트 시각화**: 빨간 ✕ 표시로 "여기는 빈칸" 명시
- 변경 파일: js/games/ladder.js, CLAUDE.md

### 2026-02-20 | 사다리 v1.2 카와이 파스텔 테마 그래픽 전면 개편

- **색상 팔레트 전면 교체** (사이버펑크 → 카와이 파스텔+네온)
  - 배경: #0a0a1a 딥네이비 → #1a0a2e 다크퍼플 그라디언트
  - 사다리: #00e5ff 시안 → #FF78F0 핑크 네온
  - 가로선: #e040fb 퍼플 → #3CFFDC 민트 네온
  - 홀: #4488ff → #8CA0FF 파스텔 블루
  - 짝: #ff4466 → #FF8CA0 파스텔 핑크
  - 승리: #00ff88 → #3CFFDC 민트
- **배경 시스템 개편** (60개 흰색 별 → 100개 컬러 트윙클 파티클)
  - 6색 파티클: 흰색, 핑크, 블루, 민트, 핑크네온, 골드
  - 사인파 트윙클 애니메이션 (각 파티클 독립 주기)
  - 큰 파티클에 글로우 효과 추가
- **사다리 비주얼 업그레이드**
  - 핑크 네온 멀티레이어 글로우 (외부 글로우 + 화이트 코어)
  - 교차점: 민트 글로잉 서클 + 화이트 코어 도트
  - 상하단 엔드포인트: 글로잉 도트 (핑크/블루/핑크)
- **애벌레 캐릭터 v1.2** (더 크고 귀엽게)
  - BALL_RADIUS: 10→13, MAX_TRAIL: 20→28
  - 머리: 3색 radialGradient (#b8f5a2→#8de86e→#65d050)
  - 몸통: 7색 그라디언트 세그먼트 + 상단 하이라이트
  - 더듬이 팁: 노란 구슬 → ♡ 핑크 하트 (_drawMiniHeart 신규)
  - 눈: 28% 더 큰 흰자 + 더블 하이라이트 (대+소)
  - 볼터치: 40%→50% 불투명도 (더 선명)
  - 미소: 더 큰 호 (lineWidth 2px)
- **CSS 전면 리뉴얼** (카와이 파스텔 테마)
  - START 버튼: 그린→핑크 그라디언트
  - 리벳 버튼: 시안→민트
  - 조합 버튼: 골드→민트, 크기 확대
  - 히스토리 도트: 파스텔 블루/핑크
- 변경 파일: js/games/ladder.js, css/ladder.css, ladder.html, js/core/sound-manager.js, CLAUDE.md
