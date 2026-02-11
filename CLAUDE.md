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
- **슬롯머신**: 5x3 릴, RTP 96%, 다양한 심볼/페이라인
- **블랙잭**: 6덱 슈, 딜러 소프트17 스탠드, Hit/Stand/Double/Split
- **룰렛**: 유럽식 37칸(0~36), Canvas 휠 애니메이션

## 로컬 테스트
```bash
cd itemgame
python -m http.server 8080
# → http://localhost:8080
```

## 변경 로그
- **2026-02-11**: 프로젝트 초기 생성, 전체 게임(로비/슬롯/블랙잭/룰렛) 구현
- **2026-02-11**: 품질 대폭 개선 (5 Phase)
  - Phase 1: roulette.js var_gold() 버그 수정, 슬롯 베팅 단계 버그 수정
  - Phase 2: 슬롯머신 릴 애니메이션 CSS Transform 기반 재작성, 승리 파티클/카운트업/빅윈 오버레이
  - Phase 3: 블랙잭 카드 비주얼 완전 재설계 (코너/센터/뒷면 패턴), 3D 딜/플립 애니메이션
  - Phase 4: 룰렛 Canvas 400px HiDPI, 골드 외곽링, 볼 애니메이션, 우클릭 베팅 제거
  - Phase 5: SoundManager (Web Audio API) 신규, 공통 CSS 강화 (페이지 전환/스크롤바/토스트), 사운드 토글 버튼, 게임카드 hover 효과
