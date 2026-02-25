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

### 사다리 "사다리 타기" (v4.0)
- **구조**: 4선 사다리, 8행 가로선 랜덤 생성 (6~10개)
- **캐릭터 4종**: 고양이(🐱)/오리(🦆)/펭귄(🐧)/양(🐑) - Canvas 직접 그리기
- **베팅**: 캐릭터 1마리 선택 → 도착지 4곳(🎁💎⭐🍀) 중 예측 베팅 (3.6배)
- **게임 플로우**: 캐릭터 선택 → 도착지 베팅 → 카운트다운 → 아래→위 이동 → 도착
- **가로선**: 안개로 숨김 → 캐릭터 접근 시 행 단위 공개
- **경로**: 4개 출발점 각각 순열(permutation) 보장 = 도착지 모두 다름
- **테마**: 초록 체크무늬 배경 + 갈색 나무 사다리 + 귀여운 컬러풀
- **폰트**: DungGeunMo(둥근모꼴) + Jua(구글 귀여운 한글)
- **오토/속도**: v3.0과 동일 (이전 캐릭터+베팅 자동 반복, 3단계 속도)
- **통계**: 라운드/당첨률/최고/연승/수익률 + 도착지별 카운트
- **히스토리 바**: 최근 30회 (캐릭터 이모지+도착지 번호)
- **localStorage**: ladder_stats_v4, ladder_history_v4

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

### 2026-02-20 | 사다리 v3.0 "네임드 사다리" 한국 복고풍 레트로 전면 개편

- **비주얼 전면 전환** (카와이 파스텔 → 한국 80~90년대 CRT 오락실 레트로)
  - 배경: #1a0a2e 다크퍼플 → #0a0a0a CRT 블랙 + 레트로 격자 + 스캔라인
  - CSS ::after 스캔라인 오버레이 + ::before 비네팅 (pointer-events: none)
  - 폰트: Google Fonts `Press Start 2P` + CDN `DungGeunMo` (둥근모꼴)
  - 타이틀: `LADDER` → `사 다 리` (형광 초록 #00ff00 글로우)
  - 사다리: 핑크 → 초록 #00ff00, 가로선: 민트 → 노랑 #ffff00
  - 교차점: 글로잉 서클 → 노란 사각형 노드
  - 캐릭터: 애벌레 → 빨간 구슬 (3D radialGradient + 잔상 trail)
  - BALL_RADIUS: 13→10, MAX_TRAIL: 28→15
  - START 버튼: 핑크 → 빨간 그라디언트 + 노란 테두리
  - 히스토리 도트: 파스텔 → 원색 파랑/빨강
- **베팅 체계 확장** (6종 → 10종)
  - 출발 베팅 복원: 좌(주황) / 우(보라) - 1.95x
  - 줄수 베팅 복원: 3줄(하늘) / 4줄(핑크) - 1.95x
  - 홀짝 유지: 홀(파랑) / 짝(빨강) - 1.95x
  - 조합 변경: 홀3/짝3/홀4/짝4 → 좌3/좌4/우3/우4 (출발+줄수 기준, 네임드 정통) - 3.75x
  - HTML 베팅 패널 4섹션으로 확장
  - _evalBets() 10종 판정 로직 + v1.2 조합 주석처리 보존
- **연출 개선**
  - 출발점 결정: 슬롯 릴 방식 좌/우 교대 깜빡임 점점 감속 → 확정
  - 체크포인트 서스펜스: "?" 사이즈 변화 (3단계) + 색상 교차 (노랑/빨강/초록)
  - 마지막 하강 전 화면 떨림 (_shakeCanvas)
  - 도착 이펙트: 구슬 바운스 (6프레임) + 화면 전체 플래시
  - 조합 당첨: CRT 글리치 (_glitchEffect) + body shake + 코인샤워 mega
- **오토 베팅 기능 추가**
  - toggleAuto(): 활성화/비활성화 (버튼 파랑↔빨강 토글 + pulse 애니메이션)
  - _scheduleNextAuto(): 게임 종료 후 800ms 대기 → lastBets 복원 → start()
  - 안전장치: 칩 부족/베팅 기록 없음 시 자동 정지
  - start() finally 블록에서 오토 스케줄링
- **3단계 속도 조절 추가**
  - 1x(보통) / 2x(빠름, 50%) / 3x(터보, 25%)
  - _getDelay(baseMs): speedMode에 따라 딜레이 축소
  - start() 내 모든 _delay() 호출에 적용
  - CSS: 초록 테마 소형 버튼 3개
- **통계 확장**
  - 기존 3항목 → 라운드/당첨률/최고/연승/수익률 + 홀짝·줄수·좌우 비율
  - 프로그레스 바 형태 시각화 (CSS .stat-bar + .stat-bar-fill)
  - localStorage key: ladder_stats → ladder_stats_v3
- **사운드 3종 추가** (sound-manager.js)
  - playLadderDrumroll(): 출발점 교대 시 빠른 드럼롤
  - playLadderEmpty(): 빈칸 통과 시 하강 톤
  - playLadderBigWin(): 3.75x 조합 당첨 시 8비트 레트로 팡파레
- **로비(index.html) 사다리 카드 변경**
  - 배경: 시안-퍼플 그라디언트 → CRT 블랙 + 스캔라인 패턴
  - 제목: "사다리" → "네임드 사다리" (초록 글로우)
  - PLAY 버튼: 시안-퍼플 → 빨강 + 노란 테두리
- **컨트롤 패널**: 3열(취소/START/리벳) → 4열(취소/START/AUTO/리벳)
- 변경 파일: css/ladder.css, ladder.html, js/games/ladder.js, js/core/sound-manager.js, index.html, CLAUDE.md

### 2026-02-20 | 사다리 v4.0 "사다리 타기" 4선 캐릭터 사다리 전면 재설계

- **게임 방식 전면 변경**: 2선 홀짝 베팅 → 4선 캐릭터+도착지 매칭
  - 4마리 캐릭터 선택 (고양이/오리/펭귄/양) → 도착지 4곳 중 예측 베팅
  - 배당: 기존 1.95x/3.75x → 단일 3.6x (25% 확률, 하우스 엣지 10%)
- **4선 사다리 알고리즘** (_generateLadder, _calcAllPaths)
  - 4개 세로줄, 8행 가로선 랜덤 배치 (6~10개)
  - 인접 줄 쌍만 연결 (0-1, 1-2, 2-3), 같은 행 줄 공유 불가
  - bottom→top 경로 계산, 항상 순열(permutation) 보장
- **캐릭터 4종 Canvas 직접 그리기**
  - 고양이(_drawCat): 오렌지 몸+귀+수염+꼬리 (v3.1 기반)
  - 오리(_drawDuck): 노란 몸+주황 부리+날개 플랩+꼬리깃
  - 펭귄(_drawPenguin): 검정 몸+흰 배+주황 부리+워들 모션
  - 양(_drawSheep): 뭉글뭉글 양털+분홍 얼굴+작은 귀
  - 각 캐릭터: bobbing, 다리/날개 걷기 모션, 잔상 trail
- **비주얼 테마 전면 교체** (CRT 레트로 → 귀여운 컬러풀)
  - 배경: CRT 블랙 → 초록 체크무늬 (#7EC850 + #5DAA3A)
  - 사다리: 형광 초록/노란선 → 갈색 나무 기둥+판자 (그라디언트 입체감)
  - 가로선: 안개(흰색 반투명 타원)로 숨김 → 행 단위 공개
  - 상단: 하늘 그라디언트, 하단: 풀밭 느낌
  - 도착지: 원형 배지 + 아이콘 (🎁💎⭐🍀)
  - CSS: CRT 스캔라인/비네팅 제거, Jua 폰트 추가
  - START 버튼: 빨강 → 나무 느낌 주황 그라디언트
- **HTML 베팅 UI 전면 재구성**
  - 캐릭터 선택 (4개 원형 버튼, 각 색상별 active 글로우)
  - 도착지 예측 (4개 아이콘 버튼, 색상별)
  - 이전 10종 베팅 패널 → 단순화된 2단계 (캐릭터+도착지)
- **게임 플로우 재작성**
  - 출발점 릴 연출 제거 → 캐릭터 직접 이동
  - 아래→위 이동 (y감소 방향)
  - 가로선 행 접근 시 해당 행 모든 가로선 공개
  - 마지막 구간 슬로모션 (easeInOutQuint)
  - 도착 시 모든 경로 표시 (활성=실선, 나머지=점선)
- **히스토리 변경**: 홀짝 도트 → 캐릭터 이모지+도착지 번호 (🐱3)
- **통계 변경**: 홀짝/줄수/좌우 비율바 → 도착지별 카운트
- **localStorage 키 변경**: ladder_stats_v3 → ladder_stats_v4, ladder_history → ladder_history_v4
- **사운드 추가**: playCharSelect() - 캐릭터 선택 시 귀여운 팝 사운드
- **로비 카드 변경**: CRT 블랙 → 초록 체크무늬, "네임드 사다리" → "사다리 타기", 4마리 이모지
- **기존 코드 주석처리 보존**: v3.1 _drawBall, v3.0 색상 C, v3.0 _clearCanvas, v3.0 _drawLadderV2, v3.1 _evalBets
- 변경 파일: js/games/ladder.js(전면), ladder.html(전면), css/ladder.css(전면), js/core/sound-manager.js, index.html, CLAUDE.md

### 2026-02-20 | 사다리 v3.1 픽셀 고양이 캐릭터 + 베팅 재구성

- **캐릭터 교체**: 빨간 구슬 → 오렌지 픽셀 고양이
  - 몸통: 오렌지 그라디언트 타원 + 배 무늬
  - 머리: 둥근 오렌지 + 삼각 귀(핑크 안쪽) + 흰 눈(동공+하이라이트) + 핑크 코 + 수염
  - 꼬리: 사인파 흔들림 (quadraticCurveTo)
  - 다리: 2쌍 걷기 애니메이션 + 발
  - 몸 전체 bobbing 모션 + 오렌지 고스트 잔상
  - BALL_RADIUS: 10→13, MAX_TRAIL: 15→12
- **베팅 시스템 재구성** (10종 → 기본6 + 변칙4)
  - 기존 제거: 홀짝 섹션 분리 → 도착으로 통합
  - 기존 제거: 출발+줄수 조합 (좌3/좌4/우3/우4)
  - 기본 6종 (1.95x): 좌출발/우출발/좌도착(홀)/우도착(짝)/3줄/4줄
  - 변칙 4종 (3.75x): ↗좌→우/↙우→좌(대각선) + ↓좌→좌/↓우→우(직진)
  - _evalBets() 변칙 판정: start + end 조합으로 경로 판별
- **CSS 변칙 버튼 스타일** 추가
  - 대각선(.bet-diag): 마젠타 테마 (#ff44ff)
  - 직진(.bet-straight): 민트 테마 (#00ff88)
  - .payout-badge.variant: 마젠타 배지
- **HTML 베팅 패널**: 4섹션 (출발/도착/줄수/변칙) 으로 재구성
- **규칙 섹션**: 변칙 베팅 설명 추가
- **subtitle**: "홀짝을 맞춰라!" → "경로를 맞춰라!"
- 변경 파일: js/games/ladder.js, ladder.html, css/ladder.css, CLAUDE.md

### 2026-02-20 | 사다리 v4.1 노이즈 패딩 사다리 알고리즘 (시각적 다양성 강화)

- **_generateLadder() 알고리즘 개선** (v4.0 → v4.1)
  - 기존 문제: 필수 스왑이 하단에 몰리고, 상쇄쌍이 같은 위치에서 반복 → 단조로운 모양
  - 해결: 노이즈 패딩 방식 도입
- **노이즈 패딩 원리**
  - 필수 행 연산(k개)을 비충돌 스왑끼리 패킹하여 행 수 최소화
  - 남은 (8-k)행을 상쇄 노이즈 쌍으로 채움 (동일 연산 2회 = 항등원)
  - 노이즈 쌍을 필수 연산 사이 (k+1)개 슬롯에 랜덤 분배 → 전체 분산
- **더블 가로선 도입**: 40% 확률로 (0-1)+(2-3) 동시 배치 → 한 행에 2개 가로선
- **통계 개선** (10만회 시뮬레이션 검증)
  - 평균 가로선: 7.5개 → **9.8개** (+31%)
  - 평균 채워진 행: 5~6행 → **7.5행/8행**
  - 평균 더블행: 0개 → **2.3개**
  - 공정성: 모든 조합 정확히 25.0%, 순열 위반 0건
- **v4.0 _generateLadder 주석처리 보존** (요약 형태)
- 변경 파일: js/games/ladder.js, CLAUDE.md

### 2026-02-20 | 사다리 v4.1 안개 스포일러 제거 + 등장 글로우 효과

- **안개(fog) 완전 제거**: 숨겨진 가로선에 표시되던 흰 구름이 위치를 스포일러 → 아무것도 안 그림
- **등장 글로우 효과 추가**: 캐릭터 접근 시 가로선이 골드빛 발광하며 나타남 (600ms 페이드)
  - `rungRevealTime` 상태 추가: 행별 공개 시각 기록
  - 공개 직후 `shadowBlur 18` + 골드 `shadowColor` → 시간 경과에 따라 자연 소멸
- **v4.0 안개 렌더링 코드 주석처리 보존**
- 변경 파일: js/games/ladder.js, CLAUDE.md

### 2026-02-25 | 네온 사이버펑크 프리미엄 리디자인 (전체 5게임 + 로비)

- **디자인 시스템 전면 교체** (골드 카지노 → 네온 사이버펑크)
  - 컬러: 딥 다크(#050510) + 시안(#00fff5) + 핑크(#ff2d95) + 그린(#00ff41) + 퍼플(#b300ff)
  - 효과: 글래스모피즘, 네온 글로우, 스캔라인, 글리치 텍스트, 사이버 그리드 배경
  - 폰트: Orbitron (미래적 타이틀)
- **common.css**: CSS 변수 전면 교체, body 사이버 그리드 + 스캔라인 오버레이
- **index.html 로비**: Orbitron 글리치 타이틀, 글래스모피즘 게임 카드, 네온 보더 애니메이션
- **slot.css**: 스포트라이트/LED/JACKPOT/스핀버튼 골드→시안+핑크
- **blackjack.css**: 테이블 보더/타이틀/카드뒷면 골드→시안
- **roulette.css**: 테이블 외곽/SPIN 버튼 골드→시안+핑크
- **sea-story.css**: --casino-gold→시안, LED 시안+핑크
- **ladder.css**: 전면 교체 (Orbitron, 글래스모피즘, 시안 네온)
- **js/core/neon-particles.js** (신규): Canvas 기반 30개 네온 파티클 시스템 (4색)
- **js/core/coin-shower.js**: 골드 코인 → 시안/핑크/퍼플/그린 네온 코인
- **js/games/ladder.js**: Canvas 배경 사이버 그리드, 시안 글로잉 기둥, 핑크 네온 가로선, 모바일 SCALE 동적 계산
- **5개 HTML 파일**: neon-particles.js 스크립트 + NeonParticles.init() 추가
- 변경 파일: css/common.css, css/slot.css, css/blackjack.css, css/roulette.css, css/sea-story.css, css/ladder.css, index.html, slot.html, blackjack.html, roulette.html, sea-story.html, ladder.html, js/core/neon-particles.js(신규), js/core/coin-shower.js, js/games/ladder.js, CLAUDE.md
