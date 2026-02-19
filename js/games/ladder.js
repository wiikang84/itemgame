/**
 * LadderGame v1.2 - 네온 사다리
 * ItemGame - 소셜 카지노
 *
 * 네임드 스타일 사다리 게임
 * - 2선 사다리, 3줄 or 4줄 가로선
 * - 베팅: 홀/짝(1.95x) + 조합(홀3/짝3/홀4/짝4, 3.8x)
 * - Canvas 기반 네온 비주얼 + 애벌레 애니메이션
 * - v1.2: 극적 슬로모션 (~20초), 베팅 6종 단순화
 */

const LadderGame = (() => {
    // ═══ 상수 ═══
    const PAYOUT_SINGLE = 1.95;
    const PAYOUT_COMBO = 3.8;
    const BET_CHIPS = [100, 500, 1000, 5000, 10000];
    const MAX_HISTORY = 30;
    // const MAX_TRAIL = 20;   // v1.1
    // const BALL_RADIUS = 10; // v1.1
    const MAX_TRAIL = 28;     // v1.2 (더 긴 몸통)
    const BALL_RADIUS = 13;   // v1.2 (더 큰 캐릭터)

    // Canvas 레이아웃 비율
    const L_LEFT = 0.3;
    const L_RIGHT = 0.7;
    const L_TOP = 0.10;
    const L_BOTTOM = 0.90;

    // 색상 (v1.2 카와이 파스텔 + 네온)
    const C = {
        /* v1.1 사이버펑크 네온 팔레트
        bg: '#0a0a1a', ladder: '#00e5ff', ladderGlow: 'rgba(0, 229, 255, 0.5)',
        rung: '#e040fb', rungGlow: 'rgba(224, 64, 251, 0.5)',
        odd: '#4488ff', even: '#ff4466', win: '#00ff88', */
        bg: '#1a0a2e',
        bgMid: '#251454',
        ladder: '#FF78F0',
        ladderGlow: 'rgba(255, 120, 240, 0.4)',
        rung: '#3CFFDC',
        rungGlow: 'rgba(60, 255, 220, 0.4)',
        ball: '#FFE4A0',
        ballGlow: 'rgba(255, 228, 160, 0.6)',
        ballCore: '#ffffff',
        trail: '#FF78F0',
        textDim: 'rgba(255, 222, 242, 0.5)',
        odd: '#8CA0FF',
        even: '#FF8CA0',
        win: '#3CFFDC',
    };

    // ═══ 상태 ═══
    let canvas, ctx;
    let cW = 400, cH = 560;
    let dpr = 1;

    let isPlaying = false;
    let selectedChip = 100;
    let bets = {};
    let lastBets = {};
    let result = null;
    let history = [];
    let stats = { rounds: 0, wins: 0, biggestWin: 0 };

    // 애니메이션
    let trail = [];
    let animFrameId = null;
    // 고정 별 위치 (한 번만 생성)
    let starPositions = [];

    // ═══════════════════════════════════
    //  초기화
    // ═══════════════════════════════════

    function init() {
        canvas = document.getElementById('ladderCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        // 반짝이 파티클 생성 (v1.2 트윙클 시스템)
        starPositions = [];
        const sparkleColors = ['#ffffff', '#FFE4F0', '#E2EEFF', '#3CFFDC', '#FF78F0', '#FFE4A0'];
        for (let i = 0; i < 100; i++) {
            starPositions.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.35 + 0.1,
                color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
                speed: Math.random() * 0.003 + 0.001,
                phase: Math.random() * Math.PI * 2,
            });
        }

        _resizeCanvas();
        window.addEventListener('resize', () => { _resizeCanvas(); _drawIdle(); });

        // 통계 로드
        try {
            const s = localStorage.getItem('ladder_stats');
            if (s) stats = JSON.parse(s);
            const h = localStorage.getItem('ladder_history');
            if (h) history = JSON.parse(h);
        } catch (e) {}

        _clearBets();
        _drawIdle();
        _updateUI();
        _renderHistory();
        _updateChipSelection();

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
    function _lx() { return cW * L_LEFT; }
    function _rx() { return cW * L_RIGHT; }
    function _ty() { return cH * L_TOP; }
    function _by() { return cH * L_BOTTOM; }

    // ═══════════════════════════════════
    //  Canvas 그리기
    // ═══════════════════════════════════

    function _clearCanvas() {
        // 그라디언트 배경 (다크 퍼플)
        const grad = ctx.createLinearGradient(0, 0, 0, cH);
        grad.addColorStop(0, C.bg);
        grad.addColorStop(0.5, C.bgMid);
        grad.addColorStop(1, C.bg);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cW, cH);

        // 트윙클 반짝이 파티클
        const now = Date.now();
        starPositions.forEach(s => {
            const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(now * s.speed + s.phase));
            const a = s.alpha * twinkle;
            const sx = s.x * cW;
            const sy = s.y * cH;

            ctx.globalAlpha = a;
            ctx.fillStyle = s.color;
            ctx.beginPath();
            ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
            ctx.fill();

            // 큰 파티클에 글로우
            if (s.size > 1.5) {
                ctx.globalAlpha = a * 0.2;
                ctx.beginPath();
                ctx.arc(sx, sy, s.size * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
    }

    function _drawLadder(showRungs, rungPos, rungCount) {
        const lx = _lx(), rx = _rx(), ty = _ty(), by = _by();

        // 세로선 (핑크 네온 멀티레이어 글로우)
        ctx.save();
        ctx.lineCap = 'round';
        ctx.shadowBlur = 25;
        ctx.shadowColor = C.ladderGlow;
        ctx.strokeStyle = C.ladder;
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(lx, ty); ctx.lineTo(lx, by);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx, ty); ctx.lineTo(rx, by);
        ctx.stroke();

        // 내부 밝은 코어 라인
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lx, ty); ctx.lineTo(lx, by);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx, ty); ctx.lineTo(rx, by);
        ctx.stroke();

        // 가로선 (민트 네온)
        if (showRungs && rungPos && rungCount > 0) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = C.rungGlow;
            ctx.strokeStyle = C.rung;
            ctx.lineWidth = 3;

            const cnt = Math.min(rungCount, rungPos.length);
            for (let i = 0; i < cnt; i++) {
                ctx.beginPath();
                ctx.moveTo(lx, rungPos[i]);
                ctx.lineTo(rx, rungPos[i]);
                ctx.stroke();

                // 교차점 (글로잉 서클 + 화이트 코어)
                ctx.shadowBlur = 8;
                [lx, rx].forEach(x => {
                    ctx.fillStyle = C.rung;
                    ctx.beginPath();
                    ctx.arc(x, rungPos[i], 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(x, rungPos[i], 2.5, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        }
        ctx.restore();

        // 상단 엔드포인트 (글로잉 도트)
        [lx, rx].forEach(x => {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = C.ladderGlow;
            ctx.fillStyle = C.ladder;
            ctx.beginPath();
            ctx.arc(x, ty, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x, ty, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 상단 라벨
        ctx.font = `bold ${Math.max(13, cW * 0.035)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = C.textDim;
        ctx.fillText('좌', lx, ty - 18);
        ctx.fillText('우', rx, ty - 18);

        // 하단 엔드포인트 + 라벨
        [{x: lx, c: C.odd, l: '홀'}, {x: rx, c: C.even, l: '짝'}].forEach(item => {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = item.c;
            ctx.fillStyle = item.c;
            ctx.beginPath();
            ctx.arc(item.x, by, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(item.x, by, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = item.c;
            ctx.fillText(item.l, item.x, by + 28);
        });
    }

    // /** v1.0 골든 파이어볼 (v1.1에서 애벌레로 교체) */
    // function _drawBall(x, y) {
    //     for (let i = 0; i < trail.length; i++) {
    //         const a = (i / trail.length) * 0.45;
    //         const r = (i / trail.length) * BALL_RADIUS * 0.7;
    //         ctx.globalAlpha = a; ctx.fillStyle = C.trail;
    //         ctx.beginPath(); ctx.arc(trail[i].x, trail[i].y, r, 0, Math.PI * 2); ctx.fill();
    //     }
    //     ctx.globalAlpha = 1;
    //     ctx.save(); ctx.shadowBlur = 25; ctx.shadowColor = C.ballGlow;
    //     const grad = ctx.createRadialGradient(x-2,y-2,0,x,y,BALL_RADIUS);
    //     grad.addColorStop(0,C.ballCore); grad.addColorStop(0.35,C.ball); grad.addColorStop(1,'rgba(255,136,0,0.7)');
    //     ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x,y,BALL_RADIUS,0,Math.PI*2); ctx.fill(); ctx.restore();
    // }

    /** v1.2 개선된 귀여운 애벌레 (카와이 파스텔 + 하트 더듬이 + 큰 눈) */
    function _drawBall(x, y) {
        const now = Date.now();
        const HR = BALL_RADIUS * 1.2;

        // ── 몸통 세그먼트 ──
        const BODY_COUNT = 7;
        const step = Math.max(1, Math.floor(trail.length / BODY_COUNT));
        const parts = [];
        for (let i = 0; i < trail.length; i += step) parts.push(trail[i]);
        const bodyColors = ['#4da832', '#5cb842', '#65d090', '#7ddf64', '#98e4b0', '#b0eecc', '#c5f5d5'];

        for (let i = 0; i < parts.length; i++) {
            const t = i / Math.max(parts.length, 1);
            const segR = BALL_RADIUS * (0.3 + 0.45 * t);
            const wobble = Math.sin(now * 0.008 + i * 1.2) * 3;
            const sx = parts[i].x + wobble;
            const sy = parts[i].y;

            // 세그먼트 (그라디언트)
            const sg = ctx.createRadialGradient(sx - segR * 0.2, sy - segR * 0.2, 0, sx, sy, segR);
            sg.addColorStop(0, bodyColors[Math.min(i, bodyColors.length - 1)]);
            sg.addColorStop(1, bodyColors[Math.max(0, i - 1)]);
            ctx.fillStyle = sg;
            ctx.beginPath();
            ctx.arc(sx, sy, segR, 0, Math.PI * 2);
            ctx.fill();

            // 세그먼트 상단 하이라이트
            ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
            ctx.beginPath();
            ctx.arc(sx - segR * 0.15, sy - segR * 0.3, segR * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // 귀여운 발
            if (i % 2 === 0 && i > 0) {
                ctx.fillStyle = '#4da832';
                [-1, 1].forEach(dir => {
                    ctx.beginPath();
                    ctx.arc(sx + (segR + 2.5) * dir, sy + 1.5, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        }

        // ── 머리 (그라디언트 + 글로우) ──
        const hw = Math.sin(now * 0.005) * 1.5;
        const hx = x + hw;

        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = 'rgba(125, 223, 100, 0.6)';
        const hg = ctx.createRadialGradient(hx - HR * 0.2, y - HR * 0.2, 0, hx, y, HR);
        hg.addColorStop(0, '#b8f5a2');
        hg.addColorStop(0.6, '#8de86e');
        hg.addColorStop(1, '#65d050');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(hx, y, HR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ── 더듬이 (♡ 하트 팁) ──
        ctx.strokeStyle = '#5cb842';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        const antW = Math.sin(now * 0.004) * 3;
        [-1, 1].forEach(dir => {
            const tipX = hx + HR * 0.4 * dir;
            const tipY = y - HR * 1.4;
            ctx.beginPath();
            ctx.moveTo(hx + HR * 0.2 * dir, y - HR * 0.8);
            ctx.quadraticCurveTo(hx + HR * 0.8 * dir + antW * dir, y - HR * 1.7, tipX, tipY);
            ctx.stroke();
            // 미니 하트
            _drawMiniHeart(tipX, tipY, 5, '#FF78F0');
        });

        // ── 눈 (더 크고 반짝이게!) ──
        const eyeOff = HR * 0.32;
        const eyeR = HR * 0.28;
        [-1, 1].forEach(dir => {
            const ex = hx + eyeOff * dir;
            const ey = y - HR * 0.05;
            // 흰자
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(100,180,80,0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
            // 동공
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(ex + dir * 1, ey + 1, eyeR * 0.55, 0, Math.PI * 2);
            ctx.fill();
            // 하이라이트 1 (큰)
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(ex - dir * 1.2, ey - eyeR * 0.3, eyeR * 0.28, 0, Math.PI * 2);
            ctx.fill();
            // 하이라이트 2 (작은)
            ctx.beginPath();
            ctx.arc(ex + dir * 1, ey + eyeR * 0.2, eyeR * 0.12, 0, Math.PI * 2);
            ctx.fill();
        });

        // ── 볼터치 (선명한 핑크) ──
        ctx.fillStyle = 'rgba(255, 120, 160, 0.5)';
        [-1, 1].forEach(dir => {
            ctx.beginPath();
            ctx.arc(hx + HR * 0.55 * dir, y + HR * 0.2, HR * 0.16, 0, Math.PI * 2);
            ctx.fill();
        });

        // ── 활짝 웃음 ──
        ctx.strokeStyle = '#3d8c2a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(hx, y + HR * 0.12, HR * 0.25, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    }

    /** 미니 하트 (더듬이 팁용) */
    function _drawMiniHeart(cx, cy, size, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        const topY = cy - size * 0.35;
        ctx.arc(cx - size * 0.25, topY, size * 0.3, Math.PI, 0);
        ctx.arc(cx + size * 0.25, topY, size * 0.3, Math.PI, 0);
        ctx.lineTo(cx, cy + size * 0.4);
        ctx.closePath();
        ctx.fill();
        // 하이라이트
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(cx - size * 0.15, topY - size * 0.05, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function _drawIdle() {
        _clearCanvas();
        _drawLadder(false);

        ctx.save();
        ctx.font = `bold ${Math.max(15, cW * 0.04)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 12;
        ctx.shadowColor = C.ladderGlow;
        ctx.fillStyle = C.textDim;
        ctx.fillText('🐛 베팅 후 START 🐛', cW / 2, cH / 2);
        ctx.restore();
    }

    function _drawCountdown(num) {
        _clearCanvas();
        _drawLadder(false);

        ctx.fillStyle = 'rgba(26, 10, 46, 0.6)';
        ctx.fillRect(0, 0, cW, cH);

        ctx.save();
        ctx.font = `bold ${cW * 0.28}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 50;
        ctx.shadowColor = '#FF78F0';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(num, cW / 2, cH / 2);
        ctx.restore();
    }

    function _drawFrame(x, y, rungPos, rungCount) {
        _clearCanvas();
        _drawLadder(true, rungPos, rungCount);
        _drawBall(x, y);
    }

    // ═══════════════════════════════════
    //  결과 생성
    // ═══════════════════════════════════

    function _generateResult() {
        const start = Math.random() < 0.5 ? 'left' : 'right';
        const rungs = Math.random() < 0.5 ? 3 : 4;
        const end = (rungs % 2 === 0) ? start : (start === 'left' ? 'right' : 'left');
        const rungPositions = _genRungPos(rungs);
        return { start, rungs, end, rungPositions };
    }

    function _genRungPos(num) {
        const ty = _ty(), by = _by();
        const h = by - ty;
        const sp = h / (num + 1);
        const pos = [];
        for (let i = 1; i <= num; i++) {
            const base = ty + sp * i;
            const jitter = (Math.random() - 0.5) * sp * 0.2;
            pos.push(Math.round(base + jitter));
        }
        return pos.sort((a, b) => a - b);
    }

    function _calcPath(r) {
        const lx = _lx(), rx = _rx(), ty = _ty(), by = _by();
        const path = [];
        let cx = r.start === 'left' ? lx : rx;

        path.push({ x: cx, y: ty });
        for (const ry of r.rungPositions) {
            path.push({ x: cx, y: ry });
            cx = (cx === lx) ? rx : lx;
            path.push({ x: cx, y: ry });
        }
        path.push({ x: cx, y: by });
        return path;
    }

    // ═══════════════════════════════════
    //  게임 플로우
    // ═══════════════════════════════════

    async function start() {
        if (isPlaying) return;

        const totalBet = _getTotalBet();
        if (totalBet <= 0) {
            _toast('베팅을 먼저 해주세요!'); return;
        }
        if (totalBet > ChipManager.getBalance()) {
            _toast('칩이 부족합니다!'); return;
        }

        isPlaying = true;
        lastBets = { ...bets };
        ChipManager.deductChips(totalBet);

        if (typeof LevelManager !== 'undefined') LevelManager.addXP(totalBet);
        _updateUI();
        _disableBets(true);

        result = _generateResult();
        trail = [];
        stats.rounds++;

        try {
            // 1. 카운트다운 (v1.2: 900ms - 무게감)
            for (let i = 3; i >= 1; i--) {
                _drawCountdown(i);
                if (typeof SoundManager !== 'undefined') SoundManager.playLadderTick();
                await _delay(900);
            }

            // 2. 사다리 가로선 공개 (v1.2: 800ms - 천천히)
            for (let i = 1; i <= result.rungs; i++) {
                _clearCanvas();
                _drawLadder(true, result.rungPositions, i);
                if (typeof SoundManager !== 'undefined') SoundManager.playLadderRungReveal();
                await _delay(800);
            }

            // 줄수 텍스트 (v1.2: 크게, 1초)
            ctx.save();
            ctx.font = `bold ${cW * 0.08}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.shadowBlur = 25;
            ctx.shadowColor = C.rungGlow;
            ctx.fillStyle = C.rung;
            ctx.fillText(`${result.rungs}줄`, cW / 2, cH * 0.50);
            ctx.restore();
            await _delay(1000);

            // 3. 출발점 표시 (v1.2: 4회 깜빡, 느리게)
            const sx = result.start === 'left' ? _lx() : _rx();
            const sColor = result.start === 'left' ? C.odd : C.even;

            for (let blink = 0; blink < 4; blink++) {
                _clearCanvas();
                _drawLadder(true, result.rungPositions, result.rungs);
                ctx.save();
                ctx.shadowBlur = 45;
                ctx.shadowColor = sColor;
                ctx.fillStyle = sColor;
                ctx.beginPath();
                ctx.arc(sx, _ty(), 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                if (typeof SoundManager !== 'undefined') SoundManager.playLadderBlink();
                await _delay(300);

                _clearCanvas();
                _drawLadder(true, result.rungPositions, result.rungs);
                await _delay(200);
            }

            if (typeof SoundManager !== 'undefined') SoundManager.playLadderSuspense();
            await _delay(800);

            // 4. 애벌레 하강 (v1.2: 극적 슬로모션 ~15초)
            const path = _calcPath(result);
            trail = [];
            const totalSegs = path.length - 1;

            for (let i = 0; i < totalSegs; i++) {
                const from = path[i];
                const to = path[i + 1];
                const isH = Math.abs(to.x - from.x) > 1;
                const isLast = (i === totalSegs - 1);

                let dur;
                if (isH) dur = 600;           // 가로선 교차: 0.6초
                else if (isLast) dur = 3000;   // 마지막 하강: 3초 극적 슬로모션
                else dur = 1200;               // 일반 수직: 1.2초

                // 마지막 구간 직전 극적 서스펜스
                if (isLast) {
                    if (typeof SoundManager !== 'undefined') SoundManager.playLadderSuspense();
                    await _delay(1200);
                }

                await _animSeg(from, to, dur, isH, isLast ? _easeInOutQuint : null);

                // 가로선 교차 후 일시정지 (긴장감)
                if (isH) {
                    if (typeof SoundManager !== 'undefined') SoundManager.playLadderCross();
                    await _delay(500);
                }
            }

            // 5. 도착 플래시
            const endX = result.end === 'left' ? _lx() : _rx();
            const endColor = result.end === 'left' ? C.odd : C.even;
            if (typeof SoundManager !== 'undefined') SoundManager.playLadderLand();

            for (let f = 0; f < 3; f++) {
                _clearCanvas();
                _drawLadder(true, result.rungPositions, result.rungs);
                ctx.save();
                ctx.shadowBlur = 45 - f * 10;
                ctx.shadowColor = endColor;
                ctx.fillStyle = endColor;
                ctx.beginPath();
                ctx.arc(endX, _by(), 18 - f * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                _drawBall(endX, _by());
                await _delay(150);
            }

            // 6. 결과 표시
            _clearCanvas();
            _drawLadder(true, result.rungPositions, result.rungs);
            _drawBall(endX, _by());

            // 캔버스 위 결과 텍스트
            const startLbl = result.start === 'left' ? '좌출발' : '우출발';
            const endLbl = result.end === 'left' ? '홀' : '짝';
            ctx.save();
            ctx.font = `bold ${cW * 0.055}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.shadowBlur = 12;
            ctx.shadowColor = C.ball;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${startLbl} · ${result.rungs}줄 · ${endLbl}`, cW / 2, cH * 0.50);
            ctx.restore();

            // 베팅 평가
            const totalWin = _evalBets(result);

            _addHistory(result);
            _renderHistory();

            if (totalWin > 0) {
                ChipManager.addChips(totalWin);
                stats.wins++;
                if (totalWin > stats.biggestWin) stats.biggestWin = totalWin;

                const ratio = totalWin / totalBet;
                if (ratio >= 3) {
                    if (typeof SoundManager !== 'undefined') SoundManager.playMegaWin();
                    if (typeof CoinShower !== 'undefined') CoinShower.start(3500, 'mega');
                    document.body.classList.add('shake');
                    setTimeout(() => document.body.classList.remove('shake'), 600);
                } else {
                    if (typeof SoundManager !== 'undefined') SoundManager.playNiceWin();
                    if (typeof CoinShower !== 'undefined') CoinShower.start(1500, 'big');
                }
                _showResult(`+${totalWin.toLocaleString()}`, 'win');
            } else {
                if (typeof SoundManager !== 'undefined') SoundManager.playLose();
                _showResult('꽝!', 'lose');
            }

            _updateUI();
            await _delay(2000);

        } catch (err) {
            console.error('[LadderGame] error:', err);
        } finally {
            isPlaying = false;
            _disableBets(false);
            _updateUI();
            _saveStats();
            _drawIdle();
        }
    }

    function _animSeg(from, to, dur, isH, easeFn) {
        return new Promise(resolve => {
            const t0 = performance.now();

            function frame(now) {
                const elapsed = now - t0;
                let p = Math.min(elapsed / dur, 1);
                p = easeFn ? easeFn(p) : (isH ? _easeInOutQuad(p) : _easeInOutCubic(p));

                const x = from.x + (to.x - from.x) * p;
                const y = from.y + (to.y - from.y) * p;

                trail.push({ x, y });
                if (trail.length > MAX_TRAIL) trail.shift();

                _drawFrame(x, y, result.rungPositions, result.rungs);

                if (p < 1) {
                    animFrameId = requestAnimationFrame(frame);
                } else {
                    resolve();
                }
            }
            animFrameId = requestAnimationFrame(frame);
        });
    }

    // ═══════════════════════════════════
    //  베팅
    // ═══════════════════════════════════

    function placeBet(type) {
        if (isPlaying) return;
        if (!bets[type]) bets[type] = 0;

        if (_getTotalBet() + selectedChip > ChipManager.getBalance()) {
            _toast('칩이 부족합니다!'); return;
        }

        bets[type] += selectedChip;
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
        if (!lastBets || Object.keys(lastBets).length === 0) return;

        const lt = Object.values(lastBets).reduce((s, v) => s + (v || 0), 0);
        if (lt > ChipManager.getBalance()) {
            _toast('칩이 부족합니다!'); return;
        }
        bets = { ...lastBets };
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
        _updateBetDisplay();
        _updateUI();
    }

    function setChip(amount) {
        selectedChip = amount;
        _updateChipSelection();
    }

    function _clearBets() { bets = {}; }

    function _getTotalBet() {
        return Object.values(bets).reduce((s, v) => s + (v || 0), 0);
    }

    // ═══════════════════════════════════
    //  베팅 평가
    // ═══════════════════════════════════

    function _evalBets(r) {
        let w = 0;
        // v1.0 싱글 (제거됨)
        // if (bets.leftStart && r.start === 'left') w += bets.leftStart * PAYOUT_SINGLE;
        // if (bets.rightStart && r.start === 'right') w += bets.rightStart * PAYOUT_SINGLE;
        // if (bets.three && r.rungs === 3) w += bets.three * PAYOUT_SINGLE;
        // if (bets.four && r.rungs === 4) w += bets.four * PAYOUT_SINGLE;
        // 홀짝 1.95x
        if (bets.odd && r.end === 'left') w += bets.odd * PAYOUT_SINGLE;
        if (bets.even && r.end === 'right') w += bets.even * PAYOUT_SINGLE;
        // v1.0 조합 (제거됨)
        // if (bets.left3 && r.start === 'left' && r.rungs === 3) w += bets.left3 * PAYOUT_COMBO;
        // if (bets.left4 && r.start === 'left' && r.rungs === 4) w += bets.left4 * PAYOUT_COMBO;
        // if (bets.right3 && r.start === 'right' && r.rungs === 3) w += bets.right3 * PAYOUT_COMBO;
        // if (bets.right4 && r.start === 'right' && r.rungs === 4) w += bets.right4 * PAYOUT_COMBO;
        // v1.2 조합 3.8x (도착 + 줄수)
        if (bets.odd3 && r.end === 'left' && r.rungs === 3) w += bets.odd3 * PAYOUT_COMBO;
        if (bets.even3 && r.end === 'right' && r.rungs === 3) w += bets.even3 * PAYOUT_COMBO;
        if (bets.odd4 && r.end === 'left' && r.rungs === 4) w += bets.odd4 * PAYOUT_COMBO;
        if (bets.even4 && r.end === 'right' && r.rungs === 4) w += bets.even4 * PAYOUT_COMBO;
        return Math.floor(w);
    }

    // ═══════════════════════════════════
    //  히스토리
    // ═══════════════════════════════════

    function _addHistory(r) {
        history.unshift({ start: r.start, rungs: r.rungs, end: r.end });
        if (history.length > MAX_HISTORY) history.pop();
        try { localStorage.setItem('ladder_history', JSON.stringify(history)); } catch (e) {}
    }

    function _renderHistory() {
        const el = document.getElementById('ladderHistory');
        if (!el) return;
        el.innerHTML = '';
        history.forEach(h => {
            const d = document.createElement('div');
            d.className = `hist-dot ${h.end === 'left' ? 'hist-odd' : 'hist-even'}`;
            d.title = `${h.start === 'left' ? '좌' : '우'}출발·${h.rungs}줄·${h.end === 'left' ? '홀' : '짝'}`;
            d.textContent = h.end === 'left' ? '홀' : '짝';
            el.appendChild(d);
        });
    }

    // ═══════════════════════════════════
    //  UI
    // ═══════════════════════════════════

    function _updateUI() {
        const chipEl = document.getElementById('headerChips');
        if (chipEl) chipEl.textContent = ChipManager.formatBalance();
        const totalEl = document.getElementById('totalBetDisplay');
        if (totalEl) totalEl.textContent = _getTotalBet().toLocaleString();
        const statsEl = document.getElementById('ladderStats');
        if (statsEl) {
            statsEl.innerHTML = `<span>라운드: ${stats.rounds}</span><span>당첨: ${stats.wins}</span><span>최고: ${stats.biggestWin.toLocaleString()}</span>`;
        }
    }

    function _updateBetDisplay() {
        // v1.0: ['leftStart', 'rightStart', 'three', 'four', 'odd', 'even', 'left3', 'left4', 'right3', 'right4']
        ['odd', 'even', 'odd3', 'even3', 'odd4', 'even4'].forEach(k => {
            const el = document.getElementById('bet-' + k);
            if (el) el.textContent = bets[k] ? bets[k].toLocaleString() : '';
        });
    }

    function _updateChipSelection() {
        document.querySelectorAll('.chip-select-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.value) === selectedChip);
        });
    }

    function _disableBets(disabled) {
        document.querySelectorAll('.bet-btn, .chip-select-btn, .ctrl-btn').forEach(el => {
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
        try { localStorage.setItem('ladder_stats', JSON.stringify(stats)); } catch (e) {}
    }

    // ═══ Public ═══
    return { init, start, placeBet, clearBets, reBet, setChip };
})();
