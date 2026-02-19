/**
 * Roulette - 유럽식 룰렛 게임 엔진
 * ItemGame - 소셜 카지노
 *
 * - 유럽식 37칸 (0~36)
 * - Canvas 고품질 휠 + 볼 애니메이션
 * - 다양한 인사이드/아웃사이드 베팅
 * - 사운드 효과 연동
 */

const Roulette = (() => {
    // 유럽식 룰렛 숫자 배치 (휠 순서)
    const WHEEL_ORDER = [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36,
        11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
        22, 18, 29, 7, 28, 12, 35, 3, 26
    ];

    // 빨간색 숫자들
    const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

    const MIN_BET = 10;
    // const MAX_BET = 10000; // 상한 제거 - 잔액이 곧 한도

    let canvas, ctx;
    let currentAngle = 0;
    let isSpinning = false;
    let bets = {};
    let selectedChipValue = 100;
    let lastResult = null;
    let history = [];
    let lastBets = {}; // REBET용 이전 베팅 기록

    // 볼 애니메이션용
    let ballAngle = 0;
    let ballRadius = 0;
    let showBall = false;

    // 당첨 결과 포징 연출용
    let highlightSliceIdx = -1; // 당첨 슬라이스 하이라이트 (-1이면 비활성)
    let ballGlowing = false;    // 볼 글로우 펄스 활성화
    let glowPhase = 0;         // 글로우 펄스 위상

    /**
     * 숫자의 색상
     */
    function getColor(num) {
        if (num === 0) return 'green';
        return RED_NUMBERS.includes(num) ? 'red' : 'black';
    }

    /**
     * 초기화
     */
    function init() {
        canvas = document.getElementById('wheelCanvas');
        if (canvas) {
            ctx = canvas.getContext('2d');
            // 고해상도 Canvas (400px 기본)
            const size = 400;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = size * dpr;
            canvas.height = size * dpr;
            canvas.style.width = size + 'px';
            canvas.style.height = size + 'px';
            ctx.scale(dpr, dpr);
            _drawWheel(0);
        }
        _buildBettingTable();
        _render();
    }

    /**
     * 고품질 휠 그리기
     */
    function _drawWheel(angle) {
        if (!ctx) return;
        const size = 400;
        const cx = size / 2;
        const cy = size / 2;
        const outerRadius = cx - 10;
        const innerRadius = outerRadius - 50;
        const sliceAngle = (2 * Math.PI) / WHEEL_ORDER.length;

        ctx.clearRect(0, 0, size, size);

        // 외곽 장식 링 (골드)
        _drawOuterRing(cx, cy, outerRadius + 6);

        // 외곽 원 (어두운 나무색)
        ctx.beginPath();
        ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#1a0a00';
        ctx.fill();

        // 각 슬라이스
        WHEEL_ORDER.forEach((num, i) => {
            const startAngle = angle + i * sliceAngle - Math.PI / 2;
            const endAngle = startAngle + sliceAngle;
            const isHighlighted = (highlightSliceIdx >= 0 && i === highlightSliceIdx);
            const isDimmed = (highlightSliceIdx >= 0 && i !== highlightSliceIdx);

            // 슬라이스 배경
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, outerRadius - 3, startAngle, endAngle);
            ctx.closePath();

            const color = getColor(num);
            if (color === 'green') {
                const grad = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
                grad.addColorStop(0, isHighlighted ? '#00cc00' : '#008800');
                grad.addColorStop(1, isHighlighted ? '#008800' : '#004400');
                ctx.fillStyle = grad;
            } else if (color === 'red') {
                const grad = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
                grad.addColorStop(0, isHighlighted ? '#ff4444' : '#dd1111');
                grad.addColorStop(1, isHighlighted ? '#cc0000' : '#880000');
                ctx.fillStyle = grad;
            } else {
                const grad = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
                grad.addColorStop(0, isHighlighted ? '#555555' : '#222222');
                grad.addColorStop(1, isHighlighted ? '#333333' : '#0a0a0a');
                ctx.fillStyle = grad;
            }

            ctx.fill();

            // 당첨 아닌 슬라이스 어둡게
            if (isDimmed) {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, outerRadius - 3, startAngle, endAngle);
                ctx.closePath();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fill();
            }

            // 당첨 슬라이스 골드 테두리 강조
            if (isHighlighted) {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, outerRadius - 3, startAngle, endAngle);
                ctx.closePath();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.shadowBlur = 15;
                ctx.stroke();
                ctx.shadowBlur = 0;
            } else {
                // 일반 슬라이스 테두리
                ctx.strokeStyle = '#444';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // 숫자 텍스트
            const textAngle = startAngle + sliceAngle / 2;
            const textRadius = outerRadius - 24;
            const tx = cx + Math.cos(textAngle) * textRadius;
            const ty = cy + Math.sin(textAngle) * textRadius;

            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(textAngle + Math.PI / 2);
            ctx.fillStyle = isDimmed ? 'rgba(255,255,255,0.3)' : '#fff';
            ctx.font = isHighlighted ? 'bold 14px Arial' : 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = isHighlighted ? 'rgba(255,215,0,0.8)' : 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = isHighlighted ? 6 : 2;
            ctx.fillText(num.toString(), 0, 0);
            ctx.shadowBlur = 0;
            ctx.restore();
        });

        // 내부 장식 링
        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius + 2, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 볼 트랙 (얇은 원)
        ctx.beginPath();
        ctx.arc(cx, cy, outerRadius - 10, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255,215,0,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 중앙 원 - 그라디언트
        const centerGrad = ctx.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, 32);
        centerGrad.addColorStop(0, '#4a2800');
        centerGrad.addColorStop(0.7, '#2a1500');
        centerGrad.addColorStop(1, '#1a0a00');

        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, 2 * Math.PI);
        ctx.fillStyle = centerGrad;
        ctx.fill();

        // 중앙 원 테두리 (골드 그라디언트)
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 중앙 장식 내부 링
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255,215,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 중앙 텍스트
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = 'rgba(255,215,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ITEM', cx, cy - 6);
        ctx.fillText('GAME', cx, cy + 8);
        ctx.shadowBlur = 0;

        // 볼 그리기
        if (showBall) {
            _drawBall(cx, cy);
        }
    }

    /**
     * 외곽 골드 장식 링
     */
    function _drawOuterRing(cx, cy, radius) {
        // 외곽 그라디언트 링
        const grad = ctx.createRadialGradient(cx, cy, radius - 4, cx, cy, radius + 4);
        grad.addColorStop(0, '#8B6914');
        grad.addColorStop(0.3, '#ffd700');
        grad.addColorStop(0.5, '#FFE44D');
        grad.addColorStop(0.7, '#ffd700');
        grad.addColorStop(1, '#8B6914');

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 6;
        ctx.stroke();

        // 골드 장식 점
        const dotCount = 37;
        for (let i = 0; i < dotCount; i++) {
            const a = (i / dotCount) * Math.PI * 2;
            const dx = cx + Math.cos(a) * (radius);
            const dy = cy + Math.sin(a) * (radius);

            ctx.beginPath();
            ctx.arc(dx, dy, 1.5, 0, 2 * Math.PI);
            ctx.fillStyle = '#FFE44D';
            ctx.fill();
        }
    }

    /**
     * 볼 그리기 (글로우 펄스 지원)
     */
    function _drawBall(cx, cy) {
        const bx = cx + Math.cos(ballAngle) * ballRadius;
        const by = cy + Math.sin(ballAngle) * ballRadius;

        // 글로우 링 펄스 (볼 착지 후 포징 중)
        if (ballGlowing) {
            const pulseSize = 12 + Math.sin(glowPhase) * 6; // 12~18px 펄스
            const pulseAlpha = 0.4 + Math.sin(glowPhase) * 0.2; // 0.2~0.6 알파

            // 외곽 글로우
            const glowGrad = ctx.createRadialGradient(bx, by, 4, bx, by, pulseSize + 8);
            glowGrad.addColorStop(0, `rgba(255, 215, 0, ${pulseAlpha})`);
            glowGrad.addColorStop(0.5, `rgba(255, 215, 0, ${pulseAlpha * 0.4})`);
            glowGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');

            ctx.beginPath();
            ctx.arc(bx, by, pulseSize + 8, 0, 2 * Math.PI);
            ctx.fillStyle = glowGrad;
            ctx.fill();

            // 내부 밝은 링
            ctx.beginPath();
            ctx.arc(bx, by, pulseSize, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(255, 215, 0, ${pulseAlpha * 0.8})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // 볼 그림자
        ctx.beginPath();
        ctx.arc(bx + 2, by + 2, 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();

        // 볼 본체
        const ballGrad = ctx.createRadialGradient(bx - 2, by - 2, 0, bx, by, 6);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.5, '#e8e8e8');
        ballGrad.addColorStop(1, '#999999');

        ctx.beginPath();
        ctx.arc(bx, by, 6, 0, 2 * Math.PI);
        ctx.fillStyle = ballGrad;
        ctx.fill();

        // 볼 하이라이트
        ctx.beginPath();
        ctx.arc(bx - 2, by - 2, 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fill();
    }

    /**
     * 베팅 테이블 생성
     */
    function _buildBettingTable() {
        const gridEl = document.getElementById('numberGrid');
        if (!gridEl) return;

        gridEl.innerHTML = '';

        // 0 (3행 차지)
        const zeroCell = document.createElement('div');
        zeroCell.className = 'bet-cell zero-cell';
        zeroCell.textContent = '0';
        zeroCell.onclick = () => _placeBet('number_0');
        zeroCell.dataset.betKey = 'number_0';
        gridEl.appendChild(zeroCell);

        // 1~36 (3행 x 12열)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 12; col++) {
                const num = (col * 3) + (3 - row);
                const color = getColor(num);
                const cell = document.createElement('div');
                cell.className = `bet-cell ${color}-cell`;
                cell.textContent = num;
                cell.onclick = () => _placeBet(`number_${num}`);
                cell.dataset.betKey = `number_${num}`;
                gridEl.appendChild(cell);
            }
        }

        // 아웃사이드 베팅
        const outsideEl = document.getElementById('outsideBets');
        if (!outsideEl) return;

        const outsideBets = [
            { key: '1st12', label: '1st 12', desc: '(1-12)' },
            { key: '2nd12', label: '2nd 12', desc: '(13-24)' },
            { key: '3rd12', label: '3rd 12', desc: '(25-36)' },
            { key: '1to18', label: '1-18', desc: '' },
            { key: 'even', label: 'EVEN', desc: '짝수' },
            { key: 'red', label: '◆', desc: '빨강', cls: 'red-bg' },
            { key: 'black', label: '◆', desc: '검정', cls: 'black-bg' },
            { key: 'odd', label: 'ODD', desc: '홀수' },
            { key: '19to36', label: '19-36', desc: '' },
        ];

        outsideEl.innerHTML = '';
        outsideBets.forEach(b => {
            const cell = document.createElement('div');
            cell.className = `outside-bet ${b.cls || ''}`;
            cell.innerHTML = `${b.label}<br><small>${b.desc}</small>`;
            cell.onclick = () => _placeBet(b.key);
            // 우클릭으로 베팅 제거
            cell.oncontextmenu = (e) => { e.preventDefault(); _removeBet(b.key); };
            cell.dataset.betKey = b.key;
            outsideEl.appendChild(cell);
        });

        // 컬럼 베팅
        const colEl = document.getElementById('columnBets');
        if (!colEl) return;
        colEl.innerHTML = '';
        for (let col = 1; col <= 3; col++) {
            const cell = document.createElement('div');
            cell.className = 'outside-bet';
            cell.textContent = `Col ${col} (2:1)`;
            cell.onclick = () => _placeBet(`col_${col}`);
            cell.oncontextmenu = (e) => { e.preventDefault(); _removeBet(`col_${col}`); };
            cell.dataset.betKey = `col_${col}`;
            colEl.appendChild(cell);
        }

        // 숫자 셀에도 우클릭 제거 추가
        gridEl.querySelectorAll('.bet-cell').forEach(cell => {
            cell.oncontextmenu = (e) => {
                e.preventDefault();
                _removeBet(cell.dataset.betKey);
            };
        });
    }

    /**
     * 베팅 놓기
     */
    function _placeBet(key) {
        if (isSpinning) return;

        const totalBet = _getTotalBet();
        if (totalBet + selectedChipValue > ChipManager.getBalance()) {
            _showStatus('칩이 부족합니다!');
            return;
        }

        if (!bets[key]) bets[key] = 0;
        bets[key] += selectedChipValue;

        if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();

        _updateBetMarkers();
        _render();
    }

    /**
     * 베팅 제거 (우클릭/길게누르기)
     */
    function _removeBet(key) {
        if (isSpinning) return;
        if (!bets[key] || bets[key] <= 0) return;

        bets[key] -= selectedChipValue;
        if (bets[key] <= 0) delete bets[key];

        if (typeof SoundManager !== 'undefined') SoundManager.playChipRemove();

        _updateBetMarkers();
        _render();
    }

    /**
     * 총 베팅액
     */
    function _getTotalBet() {
        return Object.values(bets).reduce((sum, v) => sum + v, 0);
    }

    /**
     * 베팅 마커 업데이트 (칩 쌓이는 모양)
     */
    function _updateBetMarkers() {
        document.querySelectorAll('.chip-marker').forEach(el => el.remove());
        document.querySelectorAll('.bet-cell.selected, .outside-bet.selected').forEach(el => {
            el.classList.remove('selected');
        });

        Object.keys(bets).forEach(key => {
            if (bets[key] <= 0) return;
            const cell = document.querySelector(`[data-bet-key="${key}"]`);
            if (cell) {
                cell.classList.add('selected');

                // 칩 스택 마커
                const marker = document.createElement('div');
                marker.className = 'chip-marker';

                const chipCount = Math.min(Math.ceil(bets[key] / selectedChipValue), 5);
                let stackHTML = '';
                for (let i = 0; i < chipCount; i++) {
                    stackHTML += `<div class="chip-stack-layer" style="bottom:${i * 2}px"></div>`;
                }
                marker.innerHTML = `<div class="chip-stack">${stackHTML}</div><span class="chip-amount">${_formatShort(bets[key])}</span>`;
                cell.appendChild(marker);
            }
        });
    }

    /**
     * 숫자 약어 포맷 (1000→1K, 1000000→1M)
     */
    function _formatShort(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
        if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
        return n.toString();
    }

    /**
     * 스핀
     */
    async function spin() {
        if (isSpinning) return;

        const totalBet = _getTotalBet();
        if (totalBet === 0) {
            _showStatus('베팅을 먼저 놓아주세요!');
            return;
        }

        if (!ChipManager.deductChips(totalBet)) {
            _showStatus('칩이 부족합니다!');
            return;
        }

        // XP 획득 (총 베팅 금액의 10%)
        if (typeof LevelManager !== 'undefined') {
            LevelManager.addXP(totalBet);
        }

        isSpinning = true;
        _render();

        if (typeof SoundManager !== 'undefined') SoundManager.playRouletteSpinStart();

        // 결과 숫자 결정
        const resultIdx = Math.floor(Math.random() * WHEEL_ORDER.length);
        const resultNumber = WHEEL_ORDER[resultIdx];

        // 볼 + 휠 애니메이션
        await _animateWheelWithBall(resultIdx);

        lastResult = resultNumber;
        history.unshift(resultNumber);
        if (history.length > 20) history.pop();

        if (typeof SoundManager !== 'undefined') SoundManager.playBallLand();

        // 당첨 계산
        const winAmount = _calculateWinnings(resultNumber);

        if (winAmount > 0) {
            ChipManager.addChips(winAmount);
            _showResult(resultNumber, winAmount, true);
            _highlightWinningBets(resultNumber);

            // 당첨금 절대액 기준 연출 (개선: 배수 → 절대액)
            if (winAmount >= 1000000) {
                // MEGA WIN: 100만칩 이상
                if (typeof SoundManager !== 'undefined') SoundManager.playBigWin();
                if (typeof CoinShower !== 'undefined') CoinShower.start(6000, 'epic');
                document.body.classList.add('shake');
                setTimeout(() => document.body.classList.remove('shake'), 800);
                _showMegaWin(winAmount);
            } else if (winAmount >= 100000) {
                // 대박: 10만칩 이상
                if (typeof SoundManager !== 'undefined') SoundManager.playBigWin();
                if (typeof CoinShower !== 'undefined') CoinShower.start(4000, 'epic');
                document.body.classList.add('shake');
                setTimeout(() => document.body.classList.remove('shake'), 500);
            } else if (winAmount >= 10000) {
                // 중간 연출: 1만칩 이상
                if (typeof SoundManager !== 'undefined') SoundManager.playWin();
                if (typeof CoinShower !== 'undefined') CoinShower.start(2000, 'big');
            } else {
                if (typeof SoundManager !== 'undefined') SoundManager.playWin();
            }
        } else {
            _showResult(resultNumber, 0, false);
            if (typeof SoundManager !== 'undefined') SoundManager.playLose();
        }

        isSpinning = false;
        // 이전 베팅 기록 저장 (REBET용)
        lastBets = JSON.parse(JSON.stringify(bets));
        bets = {};
        _updateBetMarkers();
        _render();
    }

    /**
     * 휠 + 볼 애니메이션 (통합) + 당첨 포징 연출
     */
    function _animateWheelWithBall(targetIdx) {
        return new Promise(resolve => {
            const sliceAngle = (2 * Math.PI) / WHEEL_ORDER.length;
            const targetAngle = -(targetIdx * sliceAngle + sliceAngle / 2);
            const totalRotation = Math.PI * 10 + targetAngle - currentAngle;

            const startAngle = currentAngle;
            const duration = 5000; // 5초
            const startTime = performance.now();

            showBall = true;
            highlightSliceIdx = -1; // 회전 중에는 하이라이트 없음
            ballGlowing = false;
            const ballStartAngle = Math.random() * Math.PI * 2;
            const ballTotalRotation = -Math.PI * 14;
            const outerRadius = 190 - 10;

            let lastTickTime = 0;

            function animate(time) {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // 휠: easeOutQuart
                const wheelEased = 1 - Math.pow(1 - progress, 4);
                currentAngle = startAngle + totalRotation * wheelEased;
                _drawWheel(currentAngle);

                // 볼 애니메이션
                const ballEased = 1 - Math.pow(1 - progress, 3);
                ballAngle = ballStartAngle + ballTotalRotation * ballEased;

                // 볼이 점점 안쪽으로 이동
                if (progress < 0.6) {
                    ballRadius = outerRadius - 5;
                } else {
                    const landProgress = (progress - 0.6) / 0.4;
                    const landEased = landProgress * landProgress;
                    ballRadius = outerRadius - 5 - landEased * 30;
                }

                // 틱 사운드
                if (progress < 0.8 && typeof SoundManager !== 'undefined') {
                    const tickInterval = 80 + progress * 200;
                    if (time - lastTickTime > tickInterval) {
                        SoundManager.playRouletteTick();
                        lastTickTime = time;
                    }
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // === 볼 착지: 포징 연출 시작 ===
                    const finalSliceAngle = currentAngle + targetIdx * sliceAngle + sliceAngle / 2 - Math.PI / 2;
                    ballAngle = finalSliceAngle;
                    ballRadius = outerRadius - 30;

                    // 당첨 슬라이스 하이라이트 + 볼 글로우 ON
                    highlightSliceIdx = targetIdx;
                    ballGlowing = true;
                    glowPhase = 0;

                    // 휠 줌인 (CSS)
                    const wrapper = document.querySelector('.wheel-wrapper');
                    if (wrapper) wrapper.classList.add('zoom-in');

                    // 3초간 글로우 펄스 애니메이션 루프
                    const posingDuration = 3000;
                    const posingStart = performance.now();

                    function posingAnimate(time) {
                        const posingElapsed = time - posingStart;
                        glowPhase = (posingElapsed / 200) * Math.PI; // 펄스 속도
                        _drawWheel(currentAngle);

                        if (posingElapsed < posingDuration) {
                            requestAnimationFrame(posingAnimate);
                        } else {
                            // 포징 종료: 줌아웃 + 클린업
                            if (wrapper) wrapper.classList.remove('zoom-in');
                            highlightSliceIdx = -1;
                            ballGlowing = false;

                            // 볼 페이드아웃 (0.5초 후 제거)
                            setTimeout(() => {
                                showBall = false;
                                _drawWheel(currentAngle);
                                resolve();
                            }, 500);
                        }
                    }

                    // 0.2초 후 포징 시작 (착지 직후 짧은 딜레이)
                    _drawWheel(currentAngle);
                    setTimeout(() => {
                        requestAnimationFrame(posingAnimate);
                    }, 200);
                }
            }

            requestAnimationFrame(animate);
        });
    }

    /**
     * 당첨 베팅 영역 하이라이트
     */
    function _highlightWinningBets(resultNumber) {
        const color = getColor(resultNumber);

        Object.keys(bets).forEach(key => {
            if (bets[key] <= 0) return;
            let isWinning = false;

            if (key === `number_${resultNumber}`) isWinning = true;
            else if (key === 'red' && color === 'red') isWinning = true;
            else if (key === 'black' && color === 'black') isWinning = true;
            else if (key === 'even' && resultNumber !== 0 && resultNumber % 2 === 0) isWinning = true;
            else if (key === 'odd' && resultNumber !== 0 && resultNumber % 2 === 1) isWinning = true;
            else if (key === '1to18' && resultNumber >= 1 && resultNumber <= 18) isWinning = true;
            else if (key === '19to36' && resultNumber >= 19 && resultNumber <= 36) isWinning = true;
            else if (key === '1st12' && resultNumber >= 1 && resultNumber <= 12) isWinning = true;
            else if (key === '2nd12' && resultNumber >= 13 && resultNumber <= 24) isWinning = true;
            else if (key === '3rd12' && resultNumber >= 25 && resultNumber <= 36) isWinning = true;
            else if (key === 'col_1' && resultNumber !== 0 && resultNumber % 3 === 1) isWinning = true;
            else if (key === 'col_2' && resultNumber !== 0 && resultNumber % 3 === 2) isWinning = true;
            else if (key === 'col_3' && resultNumber !== 0 && resultNumber % 3 === 0) isWinning = true;

            if (isWinning) {
                const cell = document.querySelector(`[data-bet-key="${key}"]`);
                if (cell) {
                    cell.classList.add('winning-highlight');
                    setTimeout(() => cell.classList.remove('winning-highlight'), 3000);
                }
            }
        });
    }

    /**
     * 당첨금 계산
     */
    function _calculateWinnings(resultNumber) {
        let totalWin = 0;
        const color = getColor(resultNumber);

        Object.keys(bets).forEach(key => {
            const betAmount = bets[key];
            if (betAmount <= 0) return;

            let multiplier = 0;

            if (key.startsWith('number_')) {
                const num = parseInt(key.split('_')[1]);
                if (num === resultNumber) multiplier = 36;
            } else if (key === 'red') {
                if (color === 'red') multiplier = 2;
            } else if (key === 'black') {
                if (color === 'black') multiplier = 2;
            } else if (key === 'even') {
                if (resultNumber !== 0 && resultNumber % 2 === 0) multiplier = 2;
            } else if (key === 'odd') {
                if (resultNumber !== 0 && resultNumber % 2 === 1) multiplier = 2;
            } else if (key === '1to18') {
                if (resultNumber >= 1 && resultNumber <= 18) multiplier = 2;
            } else if (key === '19to36') {
                if (resultNumber >= 19 && resultNumber <= 36) multiplier = 2;
            } else if (key === '1st12') {
                if (resultNumber >= 1 && resultNumber <= 12) multiplier = 3;
            } else if (key === '2nd12') {
                if (resultNumber >= 13 && resultNumber <= 24) multiplier = 3;
            } else if (key === '3rd12') {
                if (resultNumber >= 25 && resultNumber <= 36) multiplier = 3;
            } else if (key === 'col_1') {
                if (resultNumber !== 0 && resultNumber % 3 === 1) multiplier = 3;
            } else if (key === 'col_2') {
                if (resultNumber !== 0 && resultNumber % 3 === 2) multiplier = 3;
            } else if (key === 'col_3') {
                if (resultNumber !== 0 && resultNumber % 3 === 0) multiplier = 3;
            }

            totalWin += betAmount * multiplier;
        });

        return totalWin;
    }

    /**
     * 결과 표시 (애니메이션 포함)
     */
    function _showResult(number, winAmount, isWin) {
        const resultEl = document.getElementById('rouletteResult');
        if (!resultEl) return;

        const color = getColor(number);
        const totalBet = _getTotalBet();

        if (isWin) {
            const net = winAmount - totalBet;
            resultEl.className = 'result-display result-win';
            resultEl.textContent = `${number} (${color === 'red' ? '빨강' : color === 'black' ? '검정' : '초록'}) - WIN! +${net.toLocaleString()} 칩`;
        } else {
            resultEl.className = 'result-display result-lose';
            resultEl.textContent = `${number} (${color === 'red' ? '빨강' : color === 'black' ? '검정' : '초록'}) - LOSE`;
        }

        // 결과 숫자 크게 팝업 (확대 후 축소)
        const numDisplay = document.getElementById('resultNumberDisplay');
        if (numDisplay) {
            numDisplay.className = `number-display ${color}`;
            numDisplay.textContent = number;
            numDisplay.parentElement.style.display = 'block';

            // 팝업 애니메이션
            numDisplay.classList.add('result-pop');
            setTimeout(() => numDisplay.classList.remove('result-pop'), 800);
        }

        _updateHistory();

        // 결과 색상 배경 플래시
        const frame = document.querySelector('.roulette-frame');
        if (frame) {
            frame.classList.remove('result-flash-red', 'result-flash-black', 'result-flash-green');
            frame.offsetHeight; // force reflow
            frame.classList.add(`result-flash-${color}`);
            setTimeout(() => frame.classList.remove(`result-flash-${color}`), 500);
        }
    }

    /**
     * 히스토리 바 업데이트 (비율 차트 포함)
     */
    function _updateHistory() {
        const bar = document.getElementById('historyBar');
        if (!bar) return;

        // 히스토리 숫자 볼
        let html = history.map(num => {
            const color = getColor(num);
            return `<div class="history-num h-${color}">${num}</div>`;
        }).join('');

        // 빨강/검정 비율 미니 바 차트
        if (history.length > 0) {
            const redCount = history.filter(n => getColor(n) === 'red').length;
            const blackCount = history.filter(n => getColor(n) === 'black').length;
            const greenCount = history.filter(n => getColor(n) === 'green').length;
            const total = history.length;

            const redPct = (redCount / total * 100).toFixed(0);
            const blackPct = (blackCount / total * 100).toFixed(0);
            const greenPct = (greenCount / total * 100).toFixed(0);

            html += `
                <div class="history-ratio-bar">
                    <div class="history-ratio-red" style="width:${redPct}%"></div>
                    <div class="history-ratio-green" style="width:${greenPct}%"></div>
                    <div class="history-ratio-black" style="width:${blackPct}%"></div>
                </div>
                <div class="history-ratio-labels">
                    <span class="ratio-red">빨강 ${redPct}%</span>
                    <span class="ratio-green">${greenPct}%</span>
                    <span class="ratio-black">검정 ${blackPct}%</span>
                </div>
            `;
        }

        bar.innerHTML = html;
    }

    /**
     * UI 렌더링
     */
    function _render() {
        const chipEl = document.getElementById('headerChips');
        if (chipEl) chipEl.textContent = ChipManager.formatBalance();

        const totalBetEl = document.getElementById('totalBet');
        if (totalBetEl) {
            const total = _getTotalBet();
            totalBetEl.textContent = total.toLocaleString();
            // 총 베팅액 변경 시 강조
            if (total > 0) {
                totalBetEl.classList.add('bet-highlight');
                setTimeout(() => totalBetEl.classList.remove('bet-highlight'), 300);
            }
        }

        const spinBtn = document.getElementById('spinRouletteBtn');
        if (spinBtn) {
            spinBtn.disabled = isSpinning || _getTotalBet() === 0;
            spinBtn.textContent = isSpinning ? 'SPINNING...' : 'SPIN';
        }

        document.querySelectorAll('.bet-chip-option').forEach(btn => {
            const val = parseInt(btn.dataset.value);
            btn.classList.toggle('active', val === selectedChipValue);
        });
    }

    /**
     * 칩 값 선택
     */
    function selectChip(value) {
        selectedChipValue = value;
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
        _render();
    }

    /**
     * 베팅 초기화
     */
    function clearBets() {
        if (isSpinning) return;
        bets = {};
        _updateBetMarkers();
        _render();

        if (typeof SoundManager !== 'undefined') SoundManager.playClick();

        const resultEl = document.getElementById('rouletteResult');
        if (resultEl) {
            resultEl.className = 'result-display';
            resultEl.textContent = '';
        }
    }

    /**
     * 상태 메시지
     */
    function _showStatus(text) {
        const el = document.getElementById('rouletteStatus');
        if (el) {
            el.textContent = text;
            setTimeout(() => { el.textContent = ''; }, 2000);
        }
    }

    /**
     * MEGA WIN 특별 연출 (100만칩 이상)
     */
    function _showMegaWin(amount) {
        // MEGA WIN 오버레이 생성
        let overlay = document.getElementById('megaWinOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'megaWinOverlay';
            overlay.className = 'mega-win-overlay';
            overlay.innerHTML = `
                <div class="mega-win-content">
                    <div class="mega-win-title">MEGA WIN!</div>
                    <div class="mega-win-amount">+${amount.toLocaleString()}</div>
                    <div class="mega-win-chips">CHIPS</div>
                </div>
            `;
            document.body.appendChild(overlay);
        } else {
            overlay.querySelector('.mega-win-amount').textContent = `+${amount.toLocaleString()}`;
        }
        overlay.classList.add('active');
        setTimeout(() => overlay.classList.remove('active'), 4000);
    }

    /**
     * REBET - 이전 베팅 그대로 다시 걸기
     */
    function rebet() {
        if (isSpinning) return;
        if (Object.keys(lastBets).length === 0) {
            _showStatus('이전 베팅 기록이 없습니다!');
            return;
        }

        const rebetTotal = Object.values(lastBets).reduce((sum, v) => sum + v, 0);
        if (rebetTotal > ChipManager.getBalance()) {
            _showStatus('칩이 부족합니다!');
            return;
        }

        bets = JSON.parse(JSON.stringify(lastBets));
        if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();
        _updateBetMarkers();
        _render();
    }

    /**
     * 현재 베팅 x2 더블
     */
    function doubleBet() {
        if (isSpinning) return;
        const currentTotal = _getTotalBet();
        if (currentTotal === 0) {
            _showStatus('베팅을 먼저 놓아주세요!');
            return;
        }

        // 잔액 확인
        if (currentTotal * 2 > ChipManager.getBalance()) {
            _showStatus('칩이 부족합니다!');
            return;
        }

        // 모든 베팅 2배
        Object.keys(bets).forEach(key => {
            bets[key] *= 2;
        });

        if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();
        _updateBetMarkers();
        _render();
    }

    /**
     * ALL-IN - 선택된 칩 값 무시하고 잔액 전부를 현재 선택 영역에 배분
     * 이미 베팅이 있으면 그 비율대로, 없으면 마지막 클릭한 곳에 올인
     */
    function allIn() {
        if (isSpinning) return;
        const balance = ChipManager.getBalance();
        const currentTotal = _getTotalBet();
        const available = balance - currentTotal;

        if (available <= 0) {
            _showStatus('추가로 걸 수 있는 칩이 없습니다!');
            return;
        }

        const keys = Object.keys(bets);
        if (keys.length === 0) {
            _showStatus('베팅 영역을 먼저 선택하세요!');
            return;
        }

        // 현재 베팅 비율대로 잔액 배분
        const ratio = {};
        keys.forEach(key => { ratio[key] = bets[key] / currentTotal; });
        keys.forEach(key => {
            bets[key] += Math.floor(available * ratio[key]);
        });

        if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();
        _updateBetMarkers();
        _render();
    }

    return {
        init,
        spin,
        selectChip,
        clearBets,
        rebet,
        doubleBet,
        allIn,
        getColor,
        MIN_BET
    };
})();
