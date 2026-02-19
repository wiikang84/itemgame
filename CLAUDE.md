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
├── css/
│   ├── common.css          # 공통 다크 카지노 테마 + 레벨/XP UI
│   ├── slot.css            # 슬롯 전용 (v5.1 프리미엄 비주얼)
│   ├── blackjack.css       # 블랙잭 전용
│   └── roulette.css        # 룰렛 전용
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
│       └── roulette.js         # 룰렛 로직
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
