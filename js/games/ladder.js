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
    const MAX_TRAIL = 20;
    const BALL_RADIUS = 10;

    // Canvas 레이아웃 비율
    const L_LEFT = 0.3;
    const L_RIGHT = 0.7;
    const L_TOP = 0.10;
    const L_BOTTOM = 0.90;

    // 색상
    const C = {
        bg: '#0a0a1a',
        ladder: '#00e5ff',
        ladderGlow: 'rgba(0, 229, 255, 0.5)',
        rung: '#e040fb',
        rungGlow: 'rgba(224, 64, 251, 0.5)',
        ball: '#ffaa00',
        ballGlow: 'rgba(255, 170, 0, 0.7)',
        ballCore: '#ffffff',
        trail: '#ff6600',
        textDim: 'rgba(255, 255, 255, 0.4)',
        odd: '#4488ff',
        even: '#ff4466',
        win: '#00ff88',
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

        // 별 위치 미리 생성
        starPositions = [];
        for (let i = 0; i < 60; i++) {
            starPositions.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.15 + 0.05
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
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, cW, cH);

        // 배경 별
        starPositions.forEach(s => {
            ctx.globalAlpha = s.alpha;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x * cW, s.y * cH, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function _drawLadder(showRungs, rungPos, rungCount) {
        const lx = _lx(), rx = _rx(), ty = _ty(), by = _by();

        // 세로선
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = C.ladderGlow;
        ctx.strokeStyle = C.ladder;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(lx, ty); ctx.lineTo(lx, by);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx, ty); ctx.lineTo(rx, by);
        ctx.stroke();

        // 가로선
        if (showRungs && rungPos && rungCount > 0) {
            ctx.shadowColor = C.rungGlow;
            ctx.strokeStyle = C.rung;
            ctx.lineWidth = 3;

            const cnt = Math.min(rungCount, rungPos.length);
            for (let i = 0; i < cnt; i++) {
                ctx.beginPath();
                ctx.moveTo(lx, rungPos[i]);
                ctx.lineTo(rx, rungPos[i]);
                ctx.stroke();

                // 교차점 원
                ctx.fillStyle = C.rung;
                [lx, rx].forEach(x => {
                    ctx.beginPath();
                    ctx.arc(x, rungPos[i], 5, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        }
        ctx.restore();

        // 상단 라벨
        ctx.font = `bold ${Math.max(13, cW * 0.035)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = C.textDim;
        ctx.fillText('좌', lx, ty - 14);
        ctx.fillStyle = C.textDim;
        ctx.fillText('우', rx, ty - 14);

        // 하단 라벨
        ctx.fillStyle = C.odd;
        ctx.fillText('홀', lx, by + 24);
        ctx.fillStyle = C.even;
        ctx.fillText('짝', rx, by + 24);
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

    /** v1.1 귀여운 애벌레 캐릭터 */
    function _drawBall(x, y) {
        const now = Date.now();
        const HR = BALL_RADIUS * 1.15; // 머리 반지름

        // ── 몸통 세그먼트 (트레일에서 간격 샘플링) ──
        const BODY_COUNT = 6;
        const step = Math.max(1, Math.floor(trail.length / BODY_COUNT));
        const parts = [];
        for (let i = 0; i < trail.length; i += step) parts.push(trail[i]);

        for (let i = 0; i < parts.length; i++) {
            const t = i / Math.max(parts.length, 1);
            const segR = BALL_RADIUS * (0.4 + 0.4 * t);
            const wobble = Math.sin(now * 0.008 + i * 1.0) * 2.5;
            const sx = parts[i].x + wobble;
            const sy = parts[i].y;

            // 세그먼트 (연두-초록 교차)
            ctx.fillStyle = i % 2 === 0 ? '#7ddf64' : '#5cb842';
            ctx.beginPath();
            ctx.arc(sx, sy, segR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(50, 120, 30, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 작은 발 (양쪽)
            if (i % 2 === 0 && i > 0) {
                ctx.fillStyle = '#4da832';
                ctx.beginPath();
                ctx.arc(sx - segR - 2, sy + 1, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(sx + segR + 2, sy + 1, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // ── 머리 ──
        const hw = Math.sin(now * 0.006) * 1.2; // 미세 흔들림
        const hx = x + hw;

        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = 'rgba(125, 223, 100, 0.6)';
        ctx.fillStyle = '#8de86e';
        ctx.beginPath();
        ctx.arc(hx, y, HR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5cb842';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // ── 더듬이 ──
        ctx.strokeStyle = '#5cb842';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        // 왼쪽
        const antW = Math.sin(now * 0.005) * 2;
        ctx.beginPath();
        ctx.moveTo(hx - HR * 0.25, y - HR * 0.75);
        ctx.quadraticCurveTo(hx - HR * 0.7 + antW, y - HR * 1.55, hx - HR * 0.35, y - HR * 1.35);
        ctx.stroke();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(hx - HR * 0.35, y - HR * 1.35, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // 오른쪽
        ctx.beginPath();
        ctx.moveTo(hx + HR * 0.25, y - HR * 0.75);
        ctx.quadraticCurveTo(hx + HR * 0.7 - antW, y - HR * 1.55, hx + HR * 0.35, y - HR * 1.35);
        ctx.stroke();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(hx + HR * 0.35, y - HR * 1.35, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // ── 눈 (큰 흰자 + 동공 + 하이라이트) ──
        const eyeOff = HR * 0.3;
        const eyeR = HR * 0.22;
        [-1, 1].forEach(dir => {
            const ex = hx + eyeOff * dir;
            const ey = y - HR * 0.08;
            // 흰자
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
            ctx.fill();
            // 동공
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(ex + dir * 0.8, ey + 1, eyeR * 0.55, 0, Math.PI * 2);
            ctx.fill();
            // 하이라이트
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(ex - dir * 0.8, ey - eyeR * 0.35, eyeR * 0.22, 0, Math.PI * 2);
            ctx.fill();
        });

        // ── 볼터치 (핑크) ──
        ctx.fillStyle = 'rgba(255, 140, 160, 0.4)';
        [-1, 1].forEach(dir => {
            ctx.beginPath();
            ctx.arc(hx + HR * 0.52 * dir, y + HR * 0.22, HR * 0.13, 0, Math.PI * 2);
            ctx.fill();
        });

        // ── 미소 ──
        ctx.strokeStyle = '#3d8c2a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(hx, y + HR * 0.15, HR * 0.2, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
    }

    function _drawIdle() {
        _clearCanvas();
        _drawLadder(false);

        ctx.font = `bold ${Math.max(15, cW * 0.04)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = C.textDim;
        ctx.fillText('베팅 후 START', cW / 2, cH / 2);
    }

    function _drawCountdown(num) {
        _clearCanvas();
        _drawLadder(false);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, cW, cH);

        ctx.save();
        ctx.font = `bold ${cW * 0.28}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 50;
        ctx.shadowColor = '#00e5ff';
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
                if (typeof SoundManager !== 'undefined') SoundManager.playCountTick();
                await _delay(900);
            }

            // 2. 사다리 가로선 공개 (v1.2: 800ms - 천천히)
            for (let i = 1; i <= result.rungs; i++) {
                _clearCanvas();
                _drawLadder(true, result.rungPositions, i);
                if (typeof SoundManager !== 'undefined') SoundManager.playReelStop(i - 1);
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
                await _delay(300);

                _clearCanvas();
                _drawLadder(true, result.rungPositions, result.rungs);
                await _delay(200);
            }

            if (typeof SoundManager !== 'undefined') SoundManager.playAnticipation();
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
                    if (typeof SoundManager !== 'undefined') SoundManager.playAnticipation();
                    await _delay(1200);
                }

                await _animSeg(from, to, dur, isH, isLast ? _easeInOutQuint : null);

                // 가로선 교차 후 일시정지 (긴장감)
                if (isH) {
                    if (typeof SoundManager !== 'undefined') SoundManager.playCountTick();
                    await _delay(500);
                }
            }

            // 5. 도착 플래시
            const endX = result.end === 'left' ? _lx() : _rx();
            const endColor = result.end === 'left' ? C.odd : C.even;

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
