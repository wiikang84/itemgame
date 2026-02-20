/**
 * LadderGame v4.0 - 4선 캐릭터 사다리 타기
 * ItemGame - 소셜 카지노
 *
 * v4.0: 2선 홀짝 → 4선 캐릭터+도착지 매칭 게임 전면 재설계
 * - 4마리 캐릭터 (고양이/오리/펭귄/양) 선택
 * - 4개 도착지 중 예측 베팅
 * - 8행 가로선 랜덤 생성, 아래→위 이동
 * - 배당 3.6x (25% 확률, 하우스 엣지 10%)
 *
 * v3.1: 픽셀 고양이 캐릭터 + 베팅 재구성
 * v3.0: 한국 80~90년대 복고풍 레트로 전면 개편
 * v2.0: 점진적 가로선 발견 시스템
 */

const LadderGame = (() => {
    // ═══ 상수 ═══
    const PAYOUT = 3.6;
    const BET_CHIPS = [100, 500, 1000, 5000, 10000];
    const MAX_HISTORY = 30;

    // v4.0: 4선 레이아웃
    const LANES = 4;
    const LANE_X = [0.15, 0.38, 0.62, 0.85];
    const LADDER_TOP = 0.12;
    const LADDER_BOTTOM = 0.88;
    const ROWS = 8;

    // 캐릭터 데이터
    const CHARACTERS = [
        { id: 'cat',     name: '고양이', emoji: '🐱', color: '#FF8844', bgColor: '#FFF0E0' },
        { id: 'duck',    name: '오리',   emoji: '🦆', color: '#FFD700', bgColor: '#FFFFF0' },
        { id: 'penguin', name: '펭귄',   emoji: '🐧', color: '#4488FF', bgColor: '#F0F8FF' },
        { id: 'sheep',   name: '양',     emoji: '🐑', color: '#FFFFFF', bgColor: '#FFF5F5' },
    ];

    // 도착지 데이터
    const DESTINATIONS = [
        { id: 0, label: '1번', icon: '🎁', color: '#FF6B6B', name: '선물' },
        { id: 1, label: '2번', icon: '💎', color: '#4ECDC4', name: '보석' },
        { id: 2, label: '3번', icon: '⭐', color: '#FFE66D', name: '별' },
        { id: 3, label: '4번', icon: '🍀', color: '#95E86B', name: '행운' },
    ];

    // v3.1 파라미터 (주석처리 보존)
    // const PAYOUT_SINGLE = 1.95;
    // const PAYOUT_COMBO = 3.75;
    // const MAX_TRAIL = 12;
    // const BALL_RADIUS = 13;

    const MAX_TRAIL = 10;
    const CHAR_SIZE = 16;

    /* v3.0 색상 객체 (주석처리 보존)
    const C = {
        bg: '#0a0a0a', bgMid: '#0d0d0d',
        ladder: '#00ff00', ladderGlow: 'rgba(0, 255, 0, 0.4)',
        rung: '#ffff00', rungGlow: 'rgba(255, 255, 0, 0.4)',
        ball: '#ff3333', ballGlow: 'rgba(255, 51, 51, 0.6)',
        ballCore: '#ff8888', trail: '#ff3333',
        textDim: 'rgba(0, 255, 0, 0.5)',
        odd: '#3366ff', even: '#ff3333', win: '#00ff00',
        grid: 'rgba(0, 255, 0, 0.04)',
        scanline: 'rgba(0, 0, 0, 0.08)',
    };
    */

    // ═══ 상태 ═══
    let canvas, ctx;
    let cW = 400, cH = 560;
    let dpr = 1;

    let isPlaying = false;
    let selectedChip = 100;
    let selectedChar = -1;    // 선택된 캐릭터 인덱스 (0~3)
    let destBets = {};        // {0: 500, 2: 1000} = 도착지별 베팅
    let lastChar = -1;
    let lastDestBets = {};
    let result = null;
    let history = [];
    let stats = { rounds: 0, wins: 0, biggestWin: 0, totalBet: 0, totalWin: 0, streak: 0, maxStreak: 0 };

    // 애니메이션
    let trail = [];
    let animFrameId = null;

    // v4.0: 사다리 데이터
    let currentRungs = [];    // [{row, leftLane, rightLane, y}, ...]
    let currentPaths = {};    // {0: {segments, destLane}, ...}
    let revealedRows = [];    // 공개된 행 번호
    let fogAlpha = {};        // 행별 안개 투명도

    // 오토 + 속도
    let autoMode = false;
    let autoTimer = null;
    let speedMode = 1;

    // ═══════════════════════════════════
    //  초기화
    // ═══════════════════════════════════

    function init() {
        canvas = document.getElementById('ladderCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        _resizeCanvas();
        window.addEventListener('resize', () => { _resizeCanvas(); _drawIdle(); });

        // 통계 로드
        try {
            const s = localStorage.getItem('ladder_stats_v4');
            if (s) stats = { ...stats, ...JSON.parse(s) };
            const h = localStorage.getItem('ladder_history_v4');
            if (h) history = JSON.parse(h);
        } catch (e) {}

        _clearBets();
        _drawIdle();
        _updateUI();
        _renderHistory();
        _updateChipSelection();
        _updateSpeedUI();

        if (typeof SoundManager !== 'undefined') {
            setTimeout(() => SoundManager.startBGM('main'), 500);
        }
    }

    function _resizeCanvas() {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        dpr = window.devicePixelRatio || 1;

        cW = Math.min(rect.width, 480);
        cH = cW * 1.35;

        canvas.width = cW * dpr;
        canvas.height = cH * dpr;
        canvas.style.width = cW + 'px';
        canvas.style.height = cH + 'px';

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ═══ 좌표 헬퍼 ═══
    function _laneX(lane) { return cW * LANE_X[lane]; }
    function _ty() { return cH * LADDER_TOP; }
    function _by() { return cH * LADDER_BOTTOM; }

    // ═══════════════════════════════════
    //  4선 사다리 생성 알고리즘
    // ═══════════════════════════════════

    /**
     * v4.0: 공정한 4선 사다리 생성 (결과 우선 방식)
     *
     * 원리: 먼저 랜덤 순열(도착 매핑)을 정하고,
     * 그 순열을 만들어내는 사다리를 버블소트 방식으로 역으로 구성.
     * → 모든 출발→도착 확률이 정확히 균등 (25%)
     *
     * 1) 랜덤 순열 선택 (24가지 중 1개)
     * 2) 버블소트 스왑으로 필수 가로선 배치
     * 3) 나머지 행에 서로 상쇄되는 랜덤 가로선 추가 (시각적 복잡성)
     */
    function _generateLadder() {
        const ty = _ty(), by = _by();
        const height = by - ty;
        const rowHeight = height / (ROWS + 1);

        // 1) 랜덤 순열 생성 (bottom→top 매핑: 출발 lane i → 도착 lane perm[i])
        const perm = [0, 1, 2, 3];
        for (let i = perm.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [perm[i], perm[j]] = [perm[j], perm[i]];
        }

        // 2) 버블소트로 필수 스왑 계산
        //    사다리는 bottom→top 이동이므로, 순열을 인접 전치(adjacent transposition)로 분해
        const arr = [...perm]; // 현재 상태 (bottom에서의 lane 배치)
        const swaps = [];      // [{leftLane, rightLane}] 순서대로 (bottom→top)

        // 버블소트: arr을 [0,1,2,3]으로 정렬 (= top에서 올바른 위치)
        let sorted = false;
        while (!sorted) {
            sorted = true;
            for (let i = 0; i < arr.length - 1; i++) {
                if (arr[i] > arr[i + 1]) {
                    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                    swaps.push({ leftLane: i, rightLane: i + 1 });
                    sorted = false;
                }
            }
        }

        const rungs = [];
        let currentRow = 0;

        // 필수 스왑을 행에 배치
        // 같은 행에 충돌 없는 스왑은 묶기 가능
        let swapIdx = 0;
        while (swapIdx < swaps.length && currentRow < ROWS) {
            const rowSwaps = [];
            const usedLanes = new Set();

            // 이 행에 배치 가능한 스왑 수집
            let peekIdx = swapIdx;
            while (peekIdx < swaps.length) {
                const sw = swaps[peekIdx];
                if (!usedLanes.has(sw.leftLane) && !usedLanes.has(sw.rightLane)) {
                    rowSwaps.push(sw);
                    usedLanes.add(sw.leftLane);
                    usedLanes.add(sw.rightLane);
                    peekIdx++;
                } else {
                    break;
                }
            }
            swapIdx = peekIdx;

            const y = ty + rowHeight * (currentRow + 1);
            for (const sw of rowSwaps) {
                const jitter = (Math.random() - 0.5) * rowHeight * 0.15;
                rungs.push({
                    row: currentRow,
                    leftLane: sw.leftLane,
                    rightLane: sw.rightLane,
                    y: y + jitter
                });
            }
            currentRow++;
        }

        // 3) 나머지 빈 행에 랜덤 더미 가로선 추가 (서로 상쇄되는 쌍)
        //    같은 위치에 2개 가로선 = 갔다가 돌아옴 → 결과 불변
        const filledRows = new Set(rungs.map(r => r.row));
        const emptyRows = [];
        for (let r = 0; r < ROWS; r++) {
            if (!filledRows.has(r)) emptyRows.push(r);
        }

        // 빈 행을 쌍으로 묶어서 상쇄 가로선 배치
        // 또는 단독 행에 겹치지 않는 2개 가로선 배치 (0-1 + 2-3)
        for (let i = 0; i < emptyRows.length; i += 2) {
            if (i + 1 < emptyRows.length) {
                // 쌍: 같은 위치에 가로선 → 상쇄
                const pair = [[0,1],[1,2],[2,3]][Math.floor(Math.random() * 3)];
                const y1 = ty + rowHeight * (emptyRows[i] + 1);
                const y2 = ty + rowHeight * (emptyRows[i + 1] + 1);
                const jitter1 = (Math.random() - 0.5) * rowHeight * 0.15;
                const jitter2 = (Math.random() - 0.5) * rowHeight * 0.15;
                rungs.push({ row: emptyRows[i], leftLane: pair[0], rightLane: pair[1], y: y1 + jitter1 });
                rungs.push({ row: emptyRows[i + 1], leftLane: pair[0], rightLane: pair[1], y: y2 + jitter2 });
            } else {
                // 홀수 남은 행: 충돌 없는 2개 동시 배치 (0-1 + 2-3) → 결과에 영향 없으려면 상쇄쌍 필요
                // 단독 행은 가로선 없이 유지 (자연스러움)
            }
        }

        // 최소 시각적 복잡성: 가로선이 너무 적으면 추가 상쇄쌍
        if (rungs.length < 6) {
            // 사용되지 않은 행 찾기
            const usedRows = new Set(rungs.map(r => r.row));
            for (let r = 0; r < ROWS && rungs.length < 8; r++) {
                if (!usedRows.has(r)) {
                    const y = ty + rowHeight * (r + 1);
                    // 0-1과 2-3 동시 배치 (둘 다 추가해도 서로 독립이라 결과에 영향)
                    // → 상쇄를 위해 이 행과 다른 행에 같은 쌍 배치
                    const pair = [[0,1],[1,2],[2,3]][Math.floor(Math.random() * 3)];
                    rungs.push({ row: r, leftLane: pair[0], rightLane: pair[1], y: y + (Math.random()-0.5)*rowHeight*0.15 });
                    usedRows.add(r);

                    // 상쇄 짝 찾기
                    for (let r2 = r + 1; r2 < ROWS; r2++) {
                        if (!usedRows.has(r2)) {
                            const y2 = ty + rowHeight * (r2 + 1);
                            rungs.push({ row: r2, leftLane: pair[0], rightLane: pair[1], y: y2 + (Math.random()-0.5)*rowHeight*0.15 });
                            usedRows.add(r2);
                            break;
                        }
                    }
                }
            }
        }

        return rungs.sort((a, b) => a.y - b.y);
    }

    /** v4.0: 모든 경로 계산 (bottom→top) */
    function _calcAllPaths(rungs) {
        const ty = _ty(), by = _by();
        const paths = {};

        for (let startLane = 0; startLane < LANES; startLane++) {
            let curLane = startLane;
            const segments = [{ x: _laneX(startLane), y: by }];

            // 가로선을 아래에서 위로 순회 (y 큰 것부터)
            const sortedRungs = [...rungs].sort((a, b) => b.y - a.y);

            for (const rung of sortedRungs) {
                if (rung.leftLane === curLane) {
                    // 현재 줄이 왼쪽 → 오른쪽으로 이동
                    segments.push({ x: _laneX(curLane), y: rung.y });
                    curLane = rung.rightLane;
                    segments.push({ x: _laneX(curLane), y: rung.y });
                } else if (rung.rightLane === curLane) {
                    // 현재 줄이 오른쪽 → 왼쪽으로 이동
                    segments.push({ x: _laneX(curLane), y: rung.y });
                    curLane = rung.leftLane;
                    segments.push({ x: _laneX(curLane), y: rung.y });
                }
            }

            segments.push({ x: _laneX(curLane), y: ty });
            paths[startLane] = { segments, destLane: curLane };
        }

        return paths;
    }

    // ═══════════════════════════════════
    //  Canvas 그리기 v4.0
    // ═══════════════════════════════════

    /* v3.0 _clearCanvas (CRT 배경) 주석처리 보존
    function _clearCanvas_v30() {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, cW, cH);
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.04)';
        ctx.lineWidth = 0.5;
        const gridSize = 20;
        for (let x = 0; x < cW; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cH); ctx.stroke(); }
        for (let y = 0; y < cH; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cW, y); ctx.stroke(); }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let y = 0; y < cH; y += 3) { ctx.fillRect(0, y, cW, 1); }
    }
    */

    /** v4.0: 초록 체크무늬 자연 배경 */
    function _clearCanvas() {
        // 초록 체크무늬 바닥
        const tileSize = 30;
        const light = '#7EC850';
        const dark = '#5DAA3A';
        for (let y = 0; y < cH; y += tileSize) {
            for (let x = 0; x < cW; x += tileSize) {
                const isLight = ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0);
                ctx.fillStyle = isLight ? light : dark;
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }

        // 상단 하늘 영역 (부드러운 그라디언트)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, cH * 0.15);
        skyGrad.addColorStop(0, 'rgba(135, 200, 255, 0.4)');
        skyGrad.addColorStop(1, 'rgba(135, 200, 255, 0)');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, cW, cH * 0.15);

        // 하단 풀밭 느낌 (약간 어둡게)
        const grassGrad = ctx.createLinearGradient(0, cH * 0.85, 0, cH);
        grassGrad.addColorStop(0, 'rgba(40, 80, 20, 0)');
        grassGrad.addColorStop(1, 'rgba(40, 80, 20, 0.3)');
        ctx.fillStyle = grassGrad;
        ctx.fillRect(0, cH * 0.85, cW, cH * 0.15);
    }

    /* v3.0 _drawLadderV2 (2선 초록사다리) 주석처리 보존
    function _drawLadderV2_v30() {
        const lx = cW * 0.3, rx = cW * 0.7, ty = _ty(), by = _by();
        ctx.save(); ctx.lineCap = 'round';
        ctx.shadowBlur = 15; ctx.shadowColor = 'rgba(0,255,0,0.4)';
        ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(lx, ty); ctx.lineTo(lx, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rx, ty); ctx.lineTo(rx, by); ctx.stroke();
        // ... 가로선, 엔드포인트, 라벨 ...
        ctx.restore();
    }
    */

    /** v4.0: 나무 사다리 그리기 */
    function _drawLadder() {
        const ty = _ty(), by = _by();

        ctx.save();

        // 4개 세로줄 (나무 기둥)
        for (let i = 0; i < LANES; i++) {
            const x = _laneX(i);

            // 나무 기둥 그라디언트
            const poleGrad = ctx.createLinearGradient(x - 5, 0, x + 5, 0);
            poleGrad.addColorStop(0, '#8B6914');
            poleGrad.addColorStop(0.3, '#C49A2C');
            poleGrad.addColorStop(0.5, '#D4AA3C');
            poleGrad.addColorStop(0.7, '#C49A2C');
            poleGrad.addColorStop(1, '#8B6914');

            ctx.fillStyle = poleGrad;
            ctx.fillRect(x - 4, ty - 5, 8, by - ty + 10);

            // 기둥 아웃라인
            ctx.strokeStyle = '#6B4F0E';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 4, ty - 5, 8, by - ty + 10);
        }

        // 가로선 (나무 판자) - 공개된 것만
        if (currentRungs.length > 0) {
            for (const rung of currentRungs) {
                const row = rung.row;
                const isRevealed = revealedRows.includes(row);

                const lx = _laneX(rung.leftLane);
                const rx = _laneX(rung.rightLane);

                if (isRevealed) {
                    // 공개된 가로선: 나무 판자
                    const rungGrad = ctx.createLinearGradient(0, rung.y - 4, 0, rung.y + 4);
                    rungGrad.addColorStop(0, '#D4AA3C');
                    rungGrad.addColorStop(0.5, '#E8C050');
                    rungGrad.addColorStop(1, '#C49A2C');

                    ctx.fillStyle = rungGrad;
                    _roundRect(lx - 2, rung.y - 4, rx - lx + 4, 8, 3);
                    ctx.fill();

                    ctx.strokeStyle = '#8B6914';
                    ctx.lineWidth = 1;
                    _roundRect(lx - 2, rung.y - 4, rx - lx + 4, 8, 3);
                    ctx.stroke();
                } else {
                    // 숨겨진 가로선: 안개/구름
                    const fogA = fogAlpha[row] !== undefined ? fogAlpha[row] : 1;
                    if (fogA > 0) {
                        ctx.save();
                        ctx.globalAlpha = fogA * 0.6;
                        const midX = (lx + rx) / 2;
                        const fogGrad = ctx.createRadialGradient(midX, rung.y, 5, midX, rung.y, (rx - lx) * 0.7);
                        fogGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                        fogGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                        ctx.fillStyle = fogGrad;
                        ctx.fillRect(lx - 20, rung.y - 15, rx - lx + 40, 30);
                        ctx.restore();
                    }
                }
            }
        }

        ctx.restore();

        // 도착지 (상단) - 원형 배지 + 아이콘
        for (let i = 0; i < LANES; i++) {
            const x = _laneX(i);
            const y = ty - 20;
            const dest = DESTINATIONS[i];

            // 배경 원
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = dest.color;
            ctx.fillStyle = dest.color;
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI * 2);
            ctx.fill();

            // 흰 테두리
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            // 아이콘
            ctx.font = `${Math.max(14, cW * 0.035)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dest.icon, x, y);

            // 번호 라벨
            ctx.font = `bold ${Math.max(10, cW * 0.025)}px 'DungGeunMo', sans-serif`;
            ctx.fillStyle = '#fff';
            ctx.textBaseline = 'top';
            ctx.fillText(dest.label, x, y + 19);
        }
    }

    /** 둥근 사각형 경로 헬퍼 */
    function _roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // ═══════════════════════════════════
    //  캐릭터 그리기 v4.0
    // ═══════════════════════════════════

    /* v3.1 _drawBall (픽셀 고양이) 주석처리 보존
    function _drawBall_v31(x, y) {
        const now = Date.now(); const S = 13;
        // 잔상 trail (오렌지 고스트)
        for (let i = 0; i < trail.length; i++) { ... }
        // bob, legPhase, tailWag 애니메이션
        // 꼬리, 다리, 몸통, 머리, 귀, 눈, 코, 입, 수염
        // 전체 코드는 git history (v3.1 commit) 참조
    }
    */

    /* v3.0 빨간 구슬 _drawBall (주석처리 보존)
    function _drawBall_v30(x, y) {
        // trail 잔상 + radialGradient 구슬
        // 전체 코드는 git history (v3.0 commit) 참조
    }
    */

    /** v4.0: 고양이 그리기 */
    function _drawCat(x, y, size, anim) {
        const S = size;
        const bob = Math.sin(anim * 0.008) * 2;
        const legPhase = anim * 0.012;
        const tailWag = Math.sin(anim * 0.006) * 6;
        const bx = x, by = y + bob;
        const hy = by - S * 0.65;

        // 꼬리
        ctx.strokeStyle = '#ee7700';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, by + S * 0.2);
        ctx.quadraticCurveTo(bx + tailWag, by + S * 1.0, bx + tailWag * 1.3, by + S * 0.5);
        ctx.stroke();

        // 다리
        const legMove = Math.sin(legPhase) * 3;
        ctx.strokeStyle = '#cc6600';
        ctx.lineWidth = 2;
        [-1, 1].forEach((dir, idx) => {
            const lx = bx + S * 0.25 * dir;
            const ly = by + S * 0.4;
            const offset = idx === 0 ? legMove : -legMove;
            ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + offset, ly + S * 0.4); ctx.stroke();
            ctx.fillStyle = '#aa5500';
            ctx.beginPath(); ctx.arc(lx + offset, ly + S * 0.4, 2, 0, Math.PI * 2); ctx.fill();
        });

        // 몸통
        ctx.save();
        ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(255, 136, 0, 0.4)';
        const bodyGrad = ctx.createRadialGradient(bx - 1, by - 2, 0, bx, by, S * 0.55);
        bodyGrad.addColorStop(0, '#ffcc44'); bodyGrad.addColorStop(0.7, '#ff8800'); bodyGrad.addColorStop(1, '#cc5500');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath(); ctx.ellipse(bx, by, S * 0.5, S * 0.45, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 머리
        ctx.save();
        ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(255, 170, 0, 0.3)';
        const headGrad = ctx.createRadialGradient(bx - 1, hy - 1, 0, bx, hy, S * 0.45);
        headGrad.addColorStop(0, '#ffdd66'); headGrad.addColorStop(0.7, '#ffaa22'); headGrad.addColorStop(1, '#dd7700');
        ctx.fillStyle = headGrad;
        ctx.beginPath(); ctx.arc(bx, hy, S * 0.42, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 귀
        [-1, 1].forEach(dir => {
            ctx.fillStyle = '#ff8800';
            ctx.beginPath();
            ctx.moveTo(bx + S * 0.25 * dir, hy - S * 0.15);
            ctx.lineTo(bx + S * 0.42 * dir, hy - S * 0.6);
            ctx.lineTo(bx + S * 0.05 * dir, hy - S * 0.3);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ff6688';
            ctx.beginPath();
            ctx.moveTo(bx + S * 0.22 * dir, hy - S * 0.18);
            ctx.lineTo(bx + S * 0.36 * dir, hy - S * 0.5);
            ctx.lineTo(bx + S * 0.08 * dir, hy - S * 0.28);
            ctx.closePath(); ctx.fill();
        });

        // 눈
        [-1, 1].forEach(dir => {
            const ex = bx + S * 0.15 * dir, ey = hy;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.ellipse(ex, ey, S * 0.11, S * 0.13, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(ex + dir * 0.8, ey + 0.5, S * 0.065, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(ex - dir * 0.5, ey - S * 0.05, S * 0.03, 0, Math.PI * 2); ctx.fill();
        });

        // 코 + 입
        ctx.fillStyle = '#ff6688';
        ctx.beginPath(); ctx.ellipse(bx, hy + S * 0.12, S * 0.05, S * 0.035, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#cc4466'; ctx.lineWidth = 1; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(bx, hy + S * 0.18, S * 0.07, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

        // 수염
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.8;
        [-1, 1].forEach(dir => {
            for (let w = -1; w <= 1; w++) {
                ctx.beginPath();
                ctx.moveTo(bx + S * 0.12 * dir, hy + S * 0.11);
                ctx.lineTo(bx + S * 0.45 * dir, hy + S * 0.11 + w * S * 0.08);
                ctx.stroke();
            }
        });
    }

    /** v4.0: 오리 그리기 */
    function _drawDuck(x, y, size, anim) {
        const S = size;
        const bob = Math.sin(anim * 0.009) * 2;
        const wingFlap = Math.sin(anim * 0.015) * 5;
        const bx = x, by = y + bob;
        const hy = by - S * 0.55;

        // 꼬리깃
        ctx.fillStyle = '#FFB800';
        ctx.beginPath();
        ctx.moveTo(bx, by + S * 0.1);
        ctx.quadraticCurveTo(bx - S * 0.3, by + S * 0.5, bx - S * 0.1, by + S * 0.7);
        ctx.quadraticCurveTo(bx + S * 0.1, by + S * 0.4, bx, by + S * 0.1);
        ctx.fill();

        // 날개
        [-1, 1].forEach(dir => {
            ctx.save();
            ctx.fillStyle = '#FFCC00';
            ctx.beginPath();
            ctx.ellipse(bx + S * 0.4 * dir, by + wingFlap * dir * 0.1, S * 0.15, S * 0.35, dir * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 몸통
        ctx.save();
        ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
        const bodyGrad = ctx.createRadialGradient(bx, by - 2, 0, bx, by, S * 0.55);
        bodyGrad.addColorStop(0, '#FFE44D'); bodyGrad.addColorStop(0.7, '#FFD700'); bodyGrad.addColorStop(1, '#E6B800');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath(); ctx.ellipse(bx, by, S * 0.45, S * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 머리
        ctx.save();
        ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
        const headGrad = ctx.createRadialGradient(bx, hy, 0, bx, hy, S * 0.4);
        headGrad.addColorStop(0, '#FFF176'); headGrad.addColorStop(0.8, '#FFD700');
        ctx.fillStyle = headGrad;
        ctx.beginPath(); ctx.arc(bx, hy, S * 0.38, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 부리
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(bx - S * 0.15, hy + S * 0.08);
        ctx.lineTo(bx, hy + S * 0.22);
        ctx.lineTo(bx + S * 0.15, hy + S * 0.08);
        ctx.closePath(); ctx.fill();

        // 눈
        [-1, 1].forEach(dir => {
            const ex = bx + S * 0.12 * dir, ey = hy - S * 0.02;
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(ex, ey, S * 0.07, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(ex - dir * 0.5, ey - 1, S * 0.03, 0, Math.PI * 2); ctx.fill();
        });

        // 발 (다리)
        const legMove = Math.sin(anim * 0.012) * 3;
        ctx.fillStyle = '#FF8C00';
        [-1, 1].forEach((dir, idx) => {
            const lx = bx + S * 0.15 * dir;
            const ly = by + S * 0.45;
            const offset = idx === 0 ? legMove : -legMove;
            // 발바닥
            ctx.beginPath();
            ctx.ellipse(lx + offset, ly + S * 0.12, S * 0.12, S * 0.05, 0, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /** v4.0: 펭귄 그리기 */
    function _drawPenguin(x, y, size, anim) {
        const S = size;
        const bob = Math.sin(anim * 0.007) * 1.5;
        const waddle = Math.sin(anim * 0.01) * 2;
        const bx = x + waddle * 0.3, by = y + bob;
        const hy = by - S * 0.55;

        // 날개 (뒤)
        [-1, 1].forEach(dir => {
            const flapAngle = Math.sin(anim * 0.008 + dir) * 0.3;
            ctx.save();
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.ellipse(bx + S * 0.45 * dir, by + S * 0.05, S * 0.12, S * 0.4, flapAngle * dir, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 몸통 (검정)
        ctx.save();
        ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(68, 136, 255, 0.3)';
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.ellipse(bx, by, S * 0.45, S * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 배 (흰색)
        ctx.fillStyle = '#f0f0ff';
        ctx.beginPath(); ctx.ellipse(bx, by + S * 0.05, S * 0.3, S * 0.4, 0, 0, Math.PI * 2); ctx.fill();

        // 머리
        ctx.save();
        ctx.shadowBlur = 5; ctx.shadowColor = 'rgba(68, 136, 255, 0.2)';
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.arc(bx, hy, S * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 눈 (흰 패치)
        [-1, 1].forEach(dir => {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.ellipse(bx + S * 0.14 * dir, hy - S * 0.02, S * 0.12, S * 0.14, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(bx + S * 0.14 * dir, hy, S * 0.06, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(bx + S * 0.12 * dir, hy - S * 0.03, S * 0.025, 0, Math.PI * 2); ctx.fill();
        });

        // 부리 (주황)
        ctx.fillStyle = '#FF6B00';
        ctx.beginPath();
        ctx.moveTo(bx - S * 0.1, hy + S * 0.1);
        ctx.lineTo(bx, hy + S * 0.22);
        ctx.lineTo(bx + S * 0.1, hy + S * 0.1);
        ctx.closePath(); ctx.fill();

        // 발
        const legMove = Math.sin(anim * 0.01) * 2;
        ctx.fillStyle = '#FF6B00';
        [-1, 1].forEach((dir, idx) => {
            const lx = bx + S * 0.15 * dir;
            const ly = by + S * 0.48;
            const offset = idx === 0 ? legMove : -legMove;
            ctx.beginPath();
            ctx.ellipse(lx + offset, ly, S * 0.1, S * 0.05, dir * 0.2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /** v4.0: 양 그리기 */
    function _drawSheep(x, y, size, anim) {
        const S = size;
        const bob = Math.sin(anim * 0.006) * 2;
        const bx = x, by = y + bob;
        const hy = by - S * 0.55;

        // 다리 (가느다란)
        const legMove = Math.sin(anim * 0.011) * 3;
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        [-1, 1].forEach((dir, idx) => {
            const lx = bx + S * 0.2 * dir;
            const ly = by + S * 0.3;
            const offset = idx === 0 ? legMove : -legMove;
            ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + offset, ly + S * 0.45); ctx.stroke();
            // 발굽
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.arc(lx + offset, ly + S * 0.45, 2.5, 0, Math.PI * 2); ctx.fill();
        });

        // 몸통 (뭉글뭉글 양털)
        ctx.save();
        ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        ctx.fillStyle = '#f5f5f5';
        // 여러 원으로 뭉글뭉글 표현
        const woolPositions = [
            [0, 0, 0.45], [-0.25, -0.15, 0.3], [0.25, -0.15, 0.3],
            [-0.2, 0.15, 0.28], [0.2, 0.15, 0.28], [0, -0.25, 0.25],
        ];
        for (const [ox, oy, r] of woolPositions) {
            ctx.beginPath();
            ctx.arc(bx + S * ox, by + S * oy, S * r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 머리 (분홍)
        ctx.save();
        ctx.shadowBlur = 5; ctx.shadowColor = 'rgba(255, 182, 193, 0.3)';
        const headGrad = ctx.createRadialGradient(bx, hy, 0, bx, hy, S * 0.35);
        headGrad.addColorStop(0, '#FFD4DC'); headGrad.addColorStop(1, '#FFB6C1');
        ctx.fillStyle = headGrad;
        ctx.beginPath(); ctx.arc(bx, hy, S * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 귀
        [-1, 1].forEach(dir => {
            ctx.fillStyle = '#FFB6C1';
            ctx.beginPath();
            ctx.ellipse(bx + S * 0.32 * dir, hy - S * 0.05, S * 0.08, S * 0.18, dir * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF8CA0';
            ctx.beginPath();
            ctx.ellipse(bx + S * 0.32 * dir, hy - S * 0.05, S * 0.05, S * 0.12, dir * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });

        // 머리 위 양털 (둥글둥글)
        ctx.fillStyle = '#f5f5f5';
        [[0, -0.3, 0.15], [-0.15, -0.28, 0.12], [0.15, -0.28, 0.12]].forEach(([ox, oy, r]) => {
            ctx.beginPath(); ctx.arc(bx + S * ox, hy + S * oy, S * r, 0, Math.PI * 2); ctx.fill();
        });

        // 눈
        [-1, 1].forEach(dir => {
            const ex = bx + S * 0.1 * dir, ey = hy + S * 0.02;
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(ex, ey, S * 0.06, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(ex - dir * 0.5, ey - 1, S * 0.025, 0, Math.PI * 2); ctx.fill();
        });

        // 코
        ctx.fillStyle = '#FF8CA0';
        ctx.beginPath(); ctx.ellipse(bx, hy + S * 0.14, S * 0.045, S * 0.03, 0, 0, Math.PI * 2); ctx.fill();

        // 입
        ctx.strokeStyle = '#cc6677'; ctx.lineWidth = 1; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(bx, hy + S * 0.2, S * 0.05, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    }

    /** v4.0: 인덱스로 캐릭터 호출 */
    function _drawCharacter(charIdx, x, y, size, anim) {
        switch (charIdx) {
            case 0: _drawCat(x, y, size, anim); break;
            case 1: _drawDuck(x, y, size, anim); break;
            case 2: _drawPenguin(x, y, size, anim); break;
            case 3: _drawSheep(x, y, size, anim); break;
        }
    }

    // ═══════════════════════════════════
    //  렌더링 조합
    // ═══════════════════════════════════

    function _drawIdle() {
        _clearCanvas();
        currentRungs = [];
        revealedRows = [];
        fogAlpha = {};
        _drawLadder();

        // 캐릭터 4마리를 하단에 표시
        const by = _by();
        const now = Date.now();
        for (let i = 0; i < LANES; i++) {
            const x = _laneX(i);
            const isSelected = (i === selectedChar);
            const charSize = isSelected ? CHAR_SIZE * 1.15 : CHAR_SIZE;
            _drawCharacter(i, x, by + 18, charSize, now);

            if (isSelected) {
                // 선택 표시: 밝은 원 글로우
                ctx.save();
                ctx.strokeStyle = CHARACTERS[i].color;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 12;
                ctx.shadowColor = CHARACTERS[i].color;
                ctx.beginPath();
                ctx.arc(x, by + 18, charSize + 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        ctx.save();
        ctx.font = `bold ${Math.max(14, cW * 0.035)}px 'DungGeunMo', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText('캐릭터를 선택하고 베팅하세요!', cW / 2, cH / 2);
        ctx.restore();
    }

    function _drawCountdown(num) {
        _clearCanvas();
        _drawLadder();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, cW, cH);

        ctx.save();
        ctx.font = `bold ${cW * 0.22}px 'DungGeunMo', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFD700';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(num, cW / 2, cH / 2);
        ctx.restore();
    }

    function _drawFrame(charIdx, x, y) {
        _clearCanvas();
        _drawLadder();

        // 잔상 trail
        for (let i = 0; i < trail.length; i++) {
            const a = (i / trail.length) * 0.2;
            const r = CHAR_SIZE * 0.2 * (i / trail.length);
            ctx.globalAlpha = a;
            ctx.fillStyle = CHARACTERS[charIdx].color;
            ctx.beginPath();
            ctx.arc(trail[i].x, trail[i].y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 다른 캐릭터들 (대기 상태)
        const by = _by();
        const now = Date.now();
        for (let i = 0; i < LANES; i++) {
            if (i === charIdx) continue;
            ctx.globalAlpha = 0.4;
            _drawCharacter(i, _laneX(i), by + 18, CHAR_SIZE * 0.85, now);
        }
        ctx.globalAlpha = 1;

        // 이동 중인 캐릭터
        _drawCharacter(charIdx, x, y, CHAR_SIZE * 1.1, now);
    }

    // ═══════════════════════════════════
    //  게임 플로우 v4.0
    // ═══════════════════════════════════

    /* v3.1 _evalBets (기본6+변칙4) 주석처리 보존
    function _evalBets_v31(r) {
        let w = 0;
        if (bets.leftStart && r.start === 'left') w += bets.leftStart * 1.95;
        if (bets.rightStart && r.start === 'right') w += bets.rightStart * 1.95;
        if (bets.odd && r.end === 'left') w += bets.odd * 1.95;
        if (bets.even && r.end === 'right') w += bets.even * 1.95;
        if (bets.three && r.rungs === 3) w += bets.three * 1.95;
        if (bets.four && r.rungs === 4) w += bets.four * 1.95;
        if (bets.diagLR && r.start === 'left' && r.end === 'right') w += bets.diagLR * 3.75;
        if (bets.diagRL && r.start === 'right' && r.end === 'left') w += bets.diagRL * 3.75;
        if (bets.straightL && r.start === 'left' && r.end === 'left') w += bets.straightL * 3.75;
        if (bets.straightR && r.start === 'right' && r.end === 'right') w += bets.straightR * 3.75;
        return Math.floor(w);
    }
    */

    async function start() {
        if (isPlaying) return;

        // 검증
        if (selectedChar < 0) { _toast('캐릭터를 먼저 선택해주세요!'); return; }
        const totalBet = _getTotalBet();
        if (totalBet <= 0) { _toast('도착지에 베팅해주세요!'); return; }
        if (totalBet > ChipManager.getBalance()) { _toast('칩이 부족합니다!'); return; }

        isPlaying = true;
        lastChar = selectedChar;
        lastDestBets = { ...destBets };
        ChipManager.deductChips(totalBet);
        if (typeof LevelManager !== 'undefined') LevelManager.addXP(totalBet);
        stats.totalBet += totalBet;
        _updateUI();
        _disableBets(true);

        // 사다리 생성 + 경로 계산
        currentRungs = _generateLadder();
        currentPaths = _calcAllPaths(currentRungs);
        revealedRows = [];
        fogAlpha = {};
        trail = [];
        stats.rounds++;

        const charIdx = selectedChar;
        const path = currentPaths[charIdx];
        const segments = path.segments;
        const destLane = path.destLane;

        try {
            // ── 1. 카운트다운 ──
            for (let i = 3; i >= 1; i--) {
                _drawCountdown(i);
                if (typeof SoundManager !== 'undefined') SoundManager.playLadderTick();
                await _delay(_getDelay(700));
            }

            // ── 2. 캐릭터 이동 (아래→위) ──
            // 세그먼트별로 이동
            for (let s = 0; s < segments.length - 1; s++) {
                const from = segments[s];
                const to = segments[s + 1];

                const isHorizontal = (from.y === to.y);
                const isVertical = (from.x === to.x);
                const isLastVert = (s === segments.length - 2);

                // 수직 이동 시 해당 높이의 가로선 행 공개
                if (isVertical && !isLastVert) {
                    // 이동 구간에 있는 가로선 행 찾기
                    const minY = Math.min(from.y, to.y);
                    const maxY = Math.max(from.y, to.y);
                    for (const rung of currentRungs) {
                        if (rung.y >= minY && rung.y <= maxY && !revealedRows.includes(rung.row)) {
                            revealedRows.push(rung.row);
                        }
                    }
                }

                // 수평 이동 시 사운드
                if (isHorizontal) {
                    if (typeof SoundManager !== 'undefined') SoundManager.playLadderCross();
                }

                // 마지막 수직 구간: 슬로모션
                const dur = isLastVert ? _getDelay(2000) :
                            isHorizontal ? _getDelay(400) :
                            _getDelay(600);
                const easeFn = isLastVert ? _easeInOutQuint :
                               isHorizontal ? _easeInOutQuad :
                               _easeInOutCubic;

                if (isLastVert) {
                    if (typeof SoundManager !== 'undefined') SoundManager.playLadderSuspense();
                    // 모든 남은 행 공개
                    for (const rung of currentRungs) {
                        if (!revealedRows.includes(rung.row)) revealedRows.push(rung.row);
                    }
                }

                await _animSeg(charIdx, from, to, dur, easeFn);
            }

            // ── 3. 도착 이펙트 ──
            const finalX = _laneX(destLane);
            const finalY = _ty();
            if (typeof SoundManager !== 'undefined') SoundManager.playLadderLand();

            // 바운스
            const bounceOffsets = [-10, 0, -5, 0, -2, 0];
            for (let b = 0; b < bounceOffsets.length; b++) {
                _drawFrame(charIdx, finalX, finalY + bounceOffsets[b]);
                // 도착지 글로우
                const dest = DESTINATIONS[destLane];
                ctx.save();
                ctx.shadowBlur = 20;
                ctx.shadowColor = dest.color;
                ctx.fillStyle = dest.color;
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(finalX, _ty() - 20, 25, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                await _delay(_getDelay(80));
            }

            // 모든 경로 점선으로 표시
            _drawFrame(charIdx, finalX, finalY);
            _drawAllPaths(charIdx);

            await _delay(_getDelay(500));

            // ── 4. 결과 표시 ──
            const charName = CHARACTERS[charIdx].name;
            const destName = DESTINATIONS[destLane].label;
            const destIcon = DESTINATIONS[destLane].icon;

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            _roundRect(cW * 0.1, cH * 0.42, cW * 0.8, cH * 0.12, 12);
            ctx.fill();
            ctx.font = `bold ${cW * 0.05}px 'DungGeunMo', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.fillText(`${CHARACTERS[charIdx].emoji} ${charName} → ${destIcon} ${destName}`, cW / 2, cH * 0.48);
            ctx.restore();

            // 베팅 평가
            let totalWin = 0;
            if (destBets[destLane]) {
                totalWin = Math.floor(destBets[destLane] * PAYOUT);
            }

            _addHistory({ charIdx, destLane });
            _renderHistory();

            if (totalWin > 0) {
                ChipManager.addChips(totalWin);
                stats.wins++;
                stats.totalWin += totalWin;
                stats.streak++;
                if (stats.streak > stats.maxStreak) stats.maxStreak = stats.streak;
                if (totalWin > stats.biggestWin) stats.biggestWin = totalWin;

                if (typeof SoundManager !== 'undefined') SoundManager.playLadderBigWin();
                if (typeof CoinShower !== 'undefined') CoinShower.start(3000, 'big');
                document.body.classList.add('shake');
                setTimeout(() => document.body.classList.remove('shake'), 600);

                _showResult(`+${totalWin.toLocaleString()}`, 'win');
            } else {
                stats.streak = 0;
                if (typeof SoundManager !== 'undefined') SoundManager.playLose();
                _showResult('꽝!', 'lose');
            }

            _updateUI();
            await _delay(_getDelay(2000));

        } catch (err) {
            console.error('[LadderGame v4] error:', err);
        } finally {
            isPlaying = false;
            _disableBets(false);
            _updateUI();
            _saveStats();
            _drawIdle();
            if (autoMode) _scheduleNextAuto();
        }
    }

    /** 모든 경로를 점선으로 표시 */
    function _drawAllPaths(activeChar) {
        for (let lane = 0; lane < LANES; lane++) {
            if (lane === activeChar) continue;
            const path = currentPaths[lane];
            if (!path) continue;

            ctx.save();
            ctx.strokeStyle = CHARACTERS[lane].color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.4;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            for (let i = 0; i < path.segments.length; i++) {
                const seg = path.segments[i];
                if (i === 0) ctx.moveTo(seg.x, seg.y);
                else ctx.lineTo(seg.x, seg.y);
            }
            ctx.stroke();
            ctx.restore();
        }

        // 활성 캐릭터 경로 (실선)
        const activePath = currentPaths[activeChar];
        if (activePath) {
            ctx.save();
            ctx.strokeStyle = CHARACTERS[activeChar].color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.7;
            ctx.shadowBlur = 6;
            ctx.shadowColor = CHARACTERS[activeChar].color;
            ctx.beginPath();
            for (let i = 0; i < activePath.segments.length; i++) {
                const seg = activePath.segments[i];
                if (i === 0) ctx.moveTo(seg.x, seg.y);
                else ctx.lineTo(seg.x, seg.y);
            }
            ctx.stroke();
            ctx.restore();
        }
    }

    function _animSeg(charIdx, from, to, dur, easeFn) {
        return new Promise(resolve => {
            const t0 = performance.now();

            function frame(now) {
                const elapsed = now - t0;
                let p = Math.min(elapsed / dur, 1);
                p = easeFn ? easeFn(p) : _easeInOutCubic(p);

                const x = from.x + (to.x - from.x) * p;
                const y = from.y + (to.y - from.y) * p;

                trail.push({ x, y });
                if (trail.length > MAX_TRAIL) trail.shift();

                _drawFrame(charIdx, x, y);

                if (p < 1) {
                    animFrameId = requestAnimationFrame(frame);
                } else {
                    resolve();
                }
            }
            animFrameId = requestAnimationFrame(frame);
        });
    }

    // ═══ 이펙트 ═══

    function _shakeCanvas(intensity, duration) {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (Date.now() - startTime > duration) {
                clearInterval(interval);
                canvas.style.transform = '';
                return;
            }
            const x = (Math.random() - 0.5) * intensity * 2;
            const y = (Math.random() - 0.5) * intensity * 2;
            canvas.style.transform = `translate(${x}px, ${y}px)`;
        }, 30);
    }

    // ═══════════════════════════════════
    //  베팅 v4.0
    // ═══════════════════════════════════

    function selectChar(idx) {
        if (isPlaying) return;
        selectedChar = idx;
        if (typeof SoundManager !== 'undefined') SoundManager.playCharSelect();
        _updateCharSelection();
        _drawIdle();
    }

    function placeBet(destIdx) {
        if (isPlaying) return;
        if (selectedChar < 0) { _toast('캐릭터를 먼저 선택하세요!'); return; }
        if (!destBets[destIdx]) destBets[destIdx] = 0;

        if (_getTotalBet() + selectedChip > ChipManager.getBalance()) {
            _toast('칩이 부족합니다!'); return;
        }

        destBets[destIdx] += selectedChip;
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
        _updateBetDisplay();
        _updateUI();
    }

    function clearBets() {
        if (isPlaying) return;
        _clearBets();
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
        _updateBetDisplay();
        _updateUI();
    }

    function reBet() {
        if (isPlaying) return;
        if (lastChar < 0 || !lastDestBets || Object.keys(lastDestBets).length === 0) return;

        const lt = Object.values(lastDestBets).reduce((s, v) => s + (v || 0), 0);
        if (lt > ChipManager.getBalance()) {
            _toast('칩이 부족합니다!'); return;
        }
        selectedChar = lastChar;
        destBets = { ...lastDestBets };
        _updateCharSelection();
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
        _updateBetDisplay();
        _updateUI();
        _drawIdle();
    }

    function setChip(amount) {
        selectedChip = amount;
        _updateChipSelection();
    }

    function _clearBets() { destBets = {}; }

    function _getTotalBet() {
        return Object.values(destBets).reduce((s, v) => s + (v || 0), 0);
    }

    // ═══════════════════════════════════
    //  오토 베팅 v4.0
    // ═══════════════════════════════════

    function toggleAuto() {
        autoMode = !autoMode;
        _updateAutoBtn();
        if (!autoMode && autoTimer) {
            clearTimeout(autoTimer);
            autoTimer = null;
        }
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
    }

    function _scheduleNextAuto() {
        if (!autoMode) return;

        if (lastChar < 0 || !lastDestBets || Object.keys(lastDestBets).length === 0) {
            _toast('베팅 기록이 없어 AUTO 정지');
            autoMode = false;
            _updateAutoBtn();
            return;
        }

        const lt = Object.values(lastDestBets).reduce((s, v) => s + (v || 0), 0);
        if (lt > ChipManager.getBalance()) {
            _toast('칩 부족으로 AUTO 정지');
            autoMode = false;
            _updateAutoBtn();
            return;
        }

        autoTimer = setTimeout(() => {
            if (!autoMode || isPlaying) return;
            selectedChar = lastChar;
            destBets = { ...lastDestBets };
            _updateCharSelection();
            _updateBetDisplay();
            _updateUI();
            start();
        }, _getDelay(800));
    }

    function _updateAutoBtn() {
        const btn = document.getElementById('autoBtn');
        if (btn) {
            btn.classList.toggle('active', autoMode);
            btn.textContent = autoMode ? 'AUTO ON' : 'AUTO';
        }
    }

    // ═══════════════════════════════════
    //  속도 조절
    // ═══════════════════════════════════

    function setSpeed(mode) {
        speedMode = mode;
        _updateSpeedUI();
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
    }

    function _getDelay(baseMs) {
        if (speedMode === 2) return baseMs * 0.5;
        if (speedMode === 3) return baseMs * 0.25;
        return baseMs;
    }

    function _updateSpeedUI() {
        document.querySelectorAll('.speed-btn').forEach(btn => {
            const mode = parseInt(btn.dataset.speed);
            btn.classList.toggle('active', mode === speedMode);
        });
    }

    // ═══════════════════════════════════
    //  히스토리 v4.0
    // ═══════════════════════════════════

    function _addHistory(r) {
        history.unshift({ charIdx: r.charIdx, destLane: r.destLane });
        if (history.length > MAX_HISTORY) history.pop();
        try { localStorage.setItem('ladder_history_v4', JSON.stringify(history)); } catch (e) {}
    }

    function _renderHistory() {
        const el = document.getElementById('ladderHistory');
        if (!el) return;
        el.innerHTML = '';
        history.forEach(h => {
            const d = document.createElement('div');
            d.className = 'hist-dot';
            d.style.background = DESTINATIONS[h.destLane].color;
            d.style.boxShadow = `0 0 6px ${DESTINATIONS[h.destLane].color}`;
            const charEmoji = CHARACTERS[h.charIdx] ? CHARACTERS[h.charIdx].emoji : '?';
            const destLabel = DESTINATIONS[h.destLane] ? (h.destLane + 1) : '?';
            d.title = `${charEmoji} → ${destLabel}번`;
            d.textContent = `${charEmoji}${destLabel}`;
            el.appendChild(d);
        });
    }

    // ═══════════════════════════════════
    //  UI v4.0
    // ═══════════════════════════════════

    function _updateUI() {
        const chipEl = document.getElementById('headerChips');
        if (chipEl) chipEl.textContent = ChipManager.formatBalance();
        const totalEl = document.getElementById('totalBetDisplay');
        if (totalEl) totalEl.textContent = _getTotalBet().toLocaleString();

        const roundEl = document.getElementById('roundInfo');
        if (roundEl) roundEl.textContent = `제 ${stats.rounds + 1}회`;

        _updateStats();
    }

    function _updateStats() {
        const statsEl = document.getElementById('ladderStats');
        if (!statsEl) return;

        const winRate = stats.rounds > 0 ? Math.round((stats.wins / stats.rounds) * 100) : 0;
        const profitRate = stats.totalBet > 0 ? Math.round(((stats.totalWin - stats.totalBet) / stats.totalBet) * 100) : 0;

        // 캐릭터별/도착지별 카운트
        let charCounts = [0, 0, 0, 0];
        let destCounts = [0, 0, 0, 0];
        history.forEach(h => {
            if (h.charIdx >= 0 && h.charIdx < 4) charCounts[h.charIdx]++;
            if (h.destLane >= 0 && h.destLane < 4) destCounts[h.destLane]++;
        });

        statsEl.innerHTML = `
            <span>라운드: ${stats.rounds}</span>
            <span>당첨: ${stats.wins} (${winRate}%)</span>
            <span>최고: ${stats.biggestWin.toLocaleString()}</span>
            <span>연승: ${stats.streak}/${stats.maxStreak}</span>
            <span>수익률: ${profitRate > 0 ? '+' : ''}${profitRate}%</span>
            <div class="stat-item">
                <span>도착지: ${destCounts.map((c, i) => `${i+1}번(${c})`).join(' ')}</span>
            </div>
        `;
    }

    function _updateBetDisplay() {
        for (let i = 0; i < 4; i++) {
            const el = document.getElementById('bet-dest' + i);
            if (el) el.textContent = destBets[i] ? destBets[i].toLocaleString() : '';
        }
    }

    function _updateChipSelection() {
        document.querySelectorAll('.chip-select-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.value) === selectedChip);
        });
    }

    function _updateCharSelection() {
        document.querySelectorAll('.char-btn').forEach(btn => {
            const idx = parseInt(btn.dataset.char);
            btn.classList.toggle('active', idx === selectedChar);
        });
    }

    function _disableBets(disabled) {
        document.querySelectorAll('.bet-btn, .chip-select-btn, .char-btn, .dest-btn, .ctrl-btn:not(.btn-auto)').forEach(el => {
            el.style.pointerEvents = disabled ? 'none' : 'auto';
            el.style.opacity = disabled ? '0.35' : '1';
        });
    }

    function _showResult(text, type) {
        const el = document.getElementById('ladderResult');
        if (el) {
            el.textContent = text;
            el.className = 'ladder-result result-' + type;
        }
    }

    function _toast(msg) {
        const c = document.getElementById('toastContainer');
        if (!c) return;
        const t = document.createElement('div');
        t.className = 'toast toast-error';
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    }

    // ═══ 유틸 ═══
    function _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
    function _easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
    function _easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; }
    function _easeInOutQuint(t) { return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2; }
    function _saveStats() {
        try { localStorage.setItem('ladder_stats_v4', JSON.stringify(stats)); } catch (e) {}
    }

    // ═══ Public ═══
    return { init, start, selectChar, placeBet, clearBets, reBet, setChip, toggleAuto, setSpeed };
})();
