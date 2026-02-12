# ItemGame - 소셜 카지노 웹 게임

## 프로젝트 개요
- **프로젝트명**: ItemGame
- **유형**: 소셜 카지노 웹 게임 데모
- **GitHub**: https://github.com/wiikang84/itemgame
- **호스팅**: GitHub Pages
- **DB**: Firebase (Firestore + Auth)

## 핵심 모델
- 카지노 스타일 게임(슬롯/블랙잭/룰렛)에서 **가상 칩** 사용
- 플랫폼이 칩 판매, 유저간 거래 없음, 환전 불가 → 표준 소셜 카지노 모델

## 기술 스택
- HTML5 + CSS3 + Vanilla JS (프레임워크 없음)
- Canvas API (룰렛 휠 애니메이션, HiDPI 지원)
- Web Audio API (프로그래매틱 효과음, 외부 파일 없음)
- CSS Transform 기반 릴 애니메이션 (슬롯)
- CSS 3D Perspective 카드 애니메이션 (블랙잭)
- Firebase (Firestore + Auth)
- GitHub Pages 호스팅

## 파일 구조
```
itemgame/
├── index.html          # 메인 로비 (게임 선택)
├── slot.html           # 슬롯머신
├── blackjack.html      # 블랙잭
├── roulette.html       # 룰렛
├── css/
│   ├── common.css      # 공통 다크 카지노 테마
│   ├── slot.css        # 슬롯 전용 스타일
│   ├── blackjack.css   # 블랙잭 전용 스타일
│   └── roulette.css    # 룰렛 전용 스타일
├── js/
│   ├── core/
│   │   ├── firebase-config.js  # Firebase 설정
│   │   ├── chip-manager.js     # 칩 잔액 관리
│   │   └── sound-manager.js    # Web Audio API 사운드 매니저
│   └── games/
│       ├── slot-machine.js     # 슬롯머신 로직
│       ├── blackjack.js        # 블랙잭 로직
│       └── roulette.js         # 룰렛 로직
├── assets/
│   ├── img/
│   └── sounds/
├── CLAUDE.md
└── .gitignore
```

## 게임 사양
- **슬롯머신**: "LUCKY JACKPOT" 클래식 카지노, 5x3 릴, 9 페이라인, RTP ~96%
  - 11종 심볼 (7/BAR/Cherry/Bell/Diamond/Lemon/Orange/Grapes/Watermelon + Wild + Bonus)
  - Wild: 보너스 제외 모든 심볼 대체
  - Bonus(Scatter): 3개+ 출현 시 무료스핀 (10/15/25회), 프로그레시브 배율 (최대 x10)
  - 5단계 승리 연출: 당첨 → 좋은 당첨 → 대박 → 초대박 → 잭팟
  - 갬블/더블업: 빨강/검정 카드 색상 맞추기 (50/50), 한국어 안내
  - 앤티시페이션: 스캐터 2개 출현 시 마지막 릴 지연 연출
  - 오토스핀: 10/25/50/100/무제한 횟수 선택 메뉴
  - 전체 UI 한국어화 (버튼/디스플레이/통계/갬블/배당표)
- **블랙잭**: 6덱 슈, 딜러 소프트17 스탠드, Hit/Stand/Double/Split
- **룰렛**: 유럽식 37칸(0~36), Canvas 휠 애니메이션

## 로컬 테스트
```bash
cd itemgame
python -m http.server 8888
# → http://localhost:8888
```

## 변경 로그
- **2026-02-11**: 프로젝트 초기 생성, 전체 게임(로비/슬롯/블랙잭/룰렛) 구현
- **2026-02-11**: 품질 대폭 개선 (5 Phase)
  - Phase 1: roulette.js var_gold() 버그 수정, 슬롯 베팅 단계 버그 수정
  - Phase 2: 슬롯머신 릴 애니메이션 CSS Transform 기반 재작성, 승리 파티클/카운트업/빅윈 오버레이
  - Phase 3: 블랙잭 카드 비주얼 완전 재설계 (코너/센터/뒷면 패턴), 3D 딜/플립 애니메이션
  - Phase 4: 룰렛 Canvas 400px HiDPI, 골드 외곽링, 볼 애니메이션, 우클릭 베팅 제거
  - Phase 5: SoundManager (Web Audio API) 신규, 공통 CSS 강화 (페이지 전환/스크롤바/토스트), 사운드 토글 버튼, 게임카드 hover 효과
- **2026-02-11**: 슬롯머신 v2.0 "PHARAOH'S FORTUNE" 대규모 업그레이드
  - 해외 인기 슬롯(Slotomania, Book of Dead, Mega Moolah 등) 벤치마킹 기반 전면 재설계
  - 사운드 시스템 v2.0: BGM(메인+프리스핀), 5단계 승리음, 앤티시페이션, Wild/Scatter/프리스핀/갬블 전용 효과음
  - 핵심 피처: Wild 심볼 대체, Scatter 프리스핀(10/15/25회), 프로그레시브 멀티플라이어(x1~x10)
  - 5단계 빅윈 연출: Small→Nice→Big→Mega→Epic Win (카운트업 + 파티클 + 오버레이)
  - 갬블/더블업: Red/Black 50/50 카드 게임, 연속 갬블 가능
  - UI/UX: 이집트 골드/틸 테마, SVG 페이라인, 반응형 디자인, 프리스핀 카운터/멀티플라이어 표시
  - 변경 파일: slot.html, css/slot.css, js/games/slot-machine.js, js/core/sound-manager.js (4파일 전면 재작성)
- **2026-02-12**: 슬롯머신 v3.0 "LUCKY SEVENS" 실제 카지노 스타일 리뉴얼
  - 이집트(파라오) 테마 전면 제거 → 클래식 카지노 스타일로 전환
  - 심볼: 7/Cherry/Bell/Diamond/Lemon + A/K/Q/J + Wild/Bonus
  - CSS 전면 재작성: 카지노 캐비닛 UI (메탈릭 프레임, LED 디스플레이, 빨간 스핀 버튼, 크롬 베젤)
  - 색상 팔레트: 검정+골드+빨강+크롬 (실제 카지노 벤치마킹)
  - 릴 비네트(상하 그라데이션), 릴 구분선, 물리적 버튼 눌림 효과
  - JS 셀렉터 수정: 새 HTML 캐비닛 구조(info-bar, cabinet-belly, cab-btn 등)에 맞게 업데이트
  - 변경 파일: slot.html, css/slot.css, js/games/slot-machine.js, CLAUDE.md
- **2026-02-12**: 심볼 전면 교체 - 알파벳(A/K/Q/J) 완전 제거
  - 클래식 카지노 과일/전통 심볼만 사용: 7, BAR, Cherry, Bell, Diamond, Lemon, Orange, Grapes, Watermelon, WILD, BONUS
  - Lucky 7: 빨간 그라데이션 세리프체 / BAR: 골드 뱃지 / WILD: 골드 뱃지 / BONUS: 초록 뱃지
  - 과일 심볼: 이모지 + CSS 그림자/글로우 효과
- **2026-02-12**: 슬롯머신 v4.0 한국어 번역 + QA 버그 수정
  - 전체 UI 한국어화: 버튼(스핀/자동/베팅/최대베팅/배당), 디스플레이(크레딧/당첨/총베팅), 통계(스핀/당첨/최고)
  - 5단계 승리 텍스트 한국어: 당첨→좋은 당첨→대박→초대박→잭팟
  - 갬블(더블업) UX 개선: 한국어 텍스트 + 초보자 안내 문구("카드 색상을 맞추면 당첨금 2배!")
  - 무료 스핀/배율 표시 한국어화
  - 배당표 한국어화 (설명/푸터 포함)
  - 오토스핀 UX 개선: 횟수 선택 팝업 메뉴 (10/25/50/100/무제한), 남은 횟수 실시간 표시
  - transitionend 안전 타이머 추가: 탭 전환 시 게임 멈춤 방지 (4초 타임아웃)
  - 죽은 CSS 제거: .sym-card .card-letter 참조 삭제
  - REEL_WEIGHTS 주석 수정: 이집트 심볼명 → 현재 심볼명
  - 변경 파일: slot.html, css/slot.css, js/games/slot-machine.js, CLAUDE.md
- **2026-02-12**: ItemGame v2.0 대규모 업그레이드 (해외 카지노 벤치마킹 + Firebase 실연동)
  - **Phase 1: Firebase 실연동**
    - firebase-config.js v2.0: 익명 Auth, Firestore CRUD 헬퍼, 오프라인 persistence
    - chip-manager.js v2.0: Firestore 동기화, BFCache 대응
    - firestore.rules: 유저별 읽기/쓰기 보안 규칙
  - **Phase 2: 프리미엄 비주얼 + 신규 모듈**
    - Google Fonts (Poppins + Inter), tabular-nums, CSS 변수 체계
    - coin-shower.js 신규: Canvas 기반 코인 파티클 (3D 회전, 중력, 페이드)
    - level-manager.js 신규: XP/레벨 시스템 (bet 10% XP, 레벨업 보너스 칩)
    - common.css v2.0: 레벨 뱃지, XP 바, 레벨업 오버레이, 화면 쉐이크, 카운트업 애니메이션
  - **Phase 3: 게임별 프리미엄화**
    - 슬롯: 릴 배경 빛 흐름, 페이라인 글로우 강화, 스핀 버튼 idle 맥동, CoinShower 빅윈 연동, 화면 쉐이크
    - 블랙잭: 펠트 텍스처 패턴, 딜러 1초 서스펜스 딜레이, 블랙잭 골드 이펙트, CoinShower 연동
    - 룰렛: 결과 줌인 강화, 색상별 배경 플래시, 히스토리 빨강/검정 비율 바 차트, CoinShower 연동
    - 전 게임: LevelManager.addXP() 연동 (베팅 시 XP 획득)
  - **Phase 4: 7일 출석 보너스 + 모바일 하단 네비**
    - 7일 프로그레시브 보너스: 1K→1.5K→2K→3K→5K→7K→10K (streak Firestore 동기화)
    - 출석 캘린더 UI: 7개 원형 프로그레스 (수령/현재/미래 상태)
    - 모바일 하단 네비 (768px 이하): 홈/보너스/사운드 탭
    - 기존 헤더 nav-btn 모바일 숨기기
  - **공통: 전 HTML Firebase SDK CDN 추가, 레벨 뱃지/코인 샤워 캔버스/하단 네비/레벨업 오버레이 HTML 추가**
  - 변경 파일 (16개): index.html, slot.html, blackjack.html, roulette.html, css/common.css, css/slot.css, css/blackjack.css, css/roulette.css, js/core/firebase-config.js, js/core/chip-manager.js, js/core/coin-shower.js(신규), js/core/level-manager.js(신규), js/games/slot-machine.js, js/games/blackjack.js, js/games/roulette.js, firestore.rules(신규)
- **2026-02-12**: 슬롯머신 v5.0 "LUCKY JACKPOT" 비주얼 업그레이드
  - 벤치마킹: Real Slot Machines: Lucky Jackpot (Microsoft Store)
  - **배경**: 12개 황금 스포트라이트 + 중앙 방사형 글로우 + conic-gradient 30초 회전 오버레이
  - **캐비닛 3D 깊이감**: 6단계 곡면 그라데이션 + 4계층 box-shadow (골든 글로우/하단 그림자/상단 하이라이트/내부 깊이) + 크롬 border 4px
  - **JACKPOT 네온 배너**: "LUCKY SEVENS" → "JACKPOT" 변경, 5레이어 text-shadow 네온 글로우, 2초 주기 글로우 펄스
  - **LED 스트립**: 상단 6개 골드 LED, 체이스 애니메이션 (animation-delay 패턴)
  - **하단 골드 라인**: border-image 대체 linear-gradient 라인 + 글로우
  - **버튼 삼분할 레이아웃**: 좌(배당/베팅-/+) / 중(최대베팅/스핀/자동) / 우(LINES 디스플레이)
  - **렌즈 플레어 강화**: 코너 라이트 10px + 3계층 box-shadow (30px 범위)
  - **인포 바 크롬 질감**: 4단계 그라데이션 + 크롬 border-color 패턴
  - **캐비닛 입장 애니메이션**: fade+scale (0.8초)
  - **승리 시 배경 반응**: body.win-glow 클래스 토글 → 골든 글로우 펄스 (JS 2줄 추가)
  - **접근성**: prefers-reduced-motion 대응 (모든 장식 애니메이션 OFF)
  - **모바일 반응형**: 768px 스포트라이트 회전 OFF + shadow 축소, 480px 텍스트/LED/border 축소
  - **conic-gradient 미지원 폴백**: 없어도 12개 radial-gradient 스포트라이트가 대체
  - JS 셀렉터 100% 호환 (29개 ID, 19개 Class 검증 완료)
  - 변경 파일: slot.html, css/slot.css, js/games/slot-machine.js, CLAUDE.md
