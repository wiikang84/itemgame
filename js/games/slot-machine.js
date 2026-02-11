/**
 * SlotMachine - 5x3 릴 슬롯머신 엔진
 * ItemGame - 소셜 카지노
 *
 * - 5 릴 x 3 행
 * - RTP ~96%
 * - CSS transform 기반 부드러운 릴 애니메이션
 * - 승리 파티클 + 카운트업 효과
 * - 사운드 효과 연동
 */

const SlotMachine = (() => {
    // 심볼 정의 (이모지, 이름, 배수[3개,4개,5개])
    const SYMBOLS = [
        { emoji: '💎', name: '다이아몬드', pay: [20, 50, 200] },
        { emoji: '7️⃣', name: '세븐', pay: [15, 40, 150] },
        { emoji: '🔔', name: '벨', pay: [10, 25, 80] },
        { emoji: '⭐', name: '스타', pay: [8, 20, 60] },
        { emoji: '🍒', name: '체리', pay: [5, 15, 40] },
        { emoji: '🍋', name: '레몬', pay: [3, 10, 25] },
        { emoji: '🍊', name: '오렌지', pay: [3, 10, 25] },
        { emoji: '🍇', name: '포도', pay: [2, 8, 20] },
        { emoji: '🍉', name: '수박', pay: [2, 8, 20] },
    ];

    // 릴 가중치 (낮은 심볼이 더 자주 출현)
    const REEL_WEIGHTS = [1, 2, 3, 4, 5, 6, 6, 7, 7];

    // 페이라인 정의 (3행 기준: 0=상단, 1=중앙, 2=하단)
    const PAYLINES = [
        [1, 1, 1, 1, 1],  // 중앙 수평
        [0, 0, 0, 0, 0],  // 상단 수평
        [2, 2, 2, 2, 2],  // 하단 수평
        [0, 1, 2, 1, 0],  // V자
        [2, 1, 0, 1, 2],  // 역V자
        [0, 0, 1, 2, 2],  // 대각선 ↘
        [2, 2, 1, 0, 0],  // 대각선 ↗
        [1, 0, 0, 0, 1],  // U자 위
        [1, 2, 2, 2, 1],  // U자 아래
    ];

    const ROWS = 3;
    const COLS = 5;
    const MIN_BET = 10;
    const MAX_BET = 1000;
    const BET_STEPS = [10, 25, 50, 100, 200, 500, 1000];

    let reelStrips = [];
    let currentBet = 100;
    let isSpinning = false;
    let currentGrid = []; // [col][row] = symbolIndex
    let autoSpin = false;
    let autoSpinCount = 0;

    /**
     * 가중치 기반 릴 strip 생성
     */
    function _buildReelStrip() {
        const strip = [];
        REEL_WEIGHTS.forEach((weight, idx) => {
            for (let i = 0; i < weight; i++) {
                strip.push(idx);
            }
        });
        for (let i = strip.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [strip[i], strip[j]] = [strip[j], strip[i]];
        }
        return strip;
    }

    /**
     * 초기화
     */
    function init() {
        reelStrips = [];
        for (let i = 0; i < COLS; i++) {
            reelStrips.push(_buildReelStrip());
        }

        // 초기 그리드
        currentGrid = [];
        for (let c = 0; c < COLS; c++) {
            currentGrid[c] = [];
            for (let r = 0; r < ROWS; r++) {
                const idx = Math.floor(Math.random() * SYMBOLS.length);
                currentGrid[c][r] = idx;
            }
        }

        _renderReels();
        _updateUI();
    }

    /**
     * 릴 UI 렌더링 (초기 상태)
     */
    function _renderReels() {
        const reelsGrid = document.querySelector('.reels-grid');
        if (!reelsGrid) return;

        reelsGrid.innerHTML = '';

        for (let c = 0; c < COLS; c++) {
            const reelEl = document.createElement('div');
            reelEl.className = 'reel';
            reelEl.id = `reel-${c}`;

            const stripEl = document.createElement('div');
            stripEl.className = 'reel-strip';

            // 현재 보여질 3개 심볼만 렌더링
            for (let r = 0; r < ROWS; r++) {
                const symEl = document.createElement('div');
                symEl.className = 'reel-symbol';
                symEl.textContent = SYMBOLS[currentGrid[c][r]].emoji;
                symEl.dataset.row = r;
                symEl.dataset.col = c;
                stripEl.appendChild(symEl);
            }

            stripEl.style.transform = 'translateY(0px)';
            reelEl.appendChild(stripEl);
            reelsGrid.appendChild(reelEl);
        }
    }

    /**
     * 스핀 실행
     */
    async function spin() {
        if (isSpinning) return;

        if (!ChipManager.deductChips(currentBet)) {
            _showResult('칩이 부족합니다!', 'lose');
            stopAutoSpin();
            return;
        }

        isSpinning = true;
        _clearHighlights();
        _updateUI();

        const spinBtn = document.getElementById('spinButton');
        if (spinBtn) {
            spinBtn.disabled = true;
            spinBtn.classList.add('spinning');
            spinBtn.textContent = '...';
        }

        if (typeof SoundManager !== 'undefined') SoundManager.playSpinStart();

        // 새 결과 생성
        const newGrid = _generateResult();

        // CSS transform 기반 릴 애니메이션
        await _animateReels(newGrid);

        currentGrid = newGrid;

        // 당첨 체크
        const winResult = _checkWins();
        const totalWin = winResult.totalWin;

        if (totalWin > 0) {
            ChipManager.addChips(totalWin);
            _highlightWins(winResult.winLines);
            _showResult(`WIN! +${totalWin.toLocaleString()}`, 'win');

            // 큰 당첨 여부에 따라 다른 연출
            if (totalWin >= currentBet * 10) {
                _showBigWinOverlay(totalWin);
                if (typeof SoundManager !== 'undefined') SoundManager.playBigWin();
            } else {
                _showWinOverlay(totalWin);
                if (typeof SoundManager !== 'undefined') SoundManager.playWin();
            }

            // 승리 금액 카운트업
            _animateWinCount(totalWin);
        } else {
            _showResult('꽝!', 'lose');
            if (typeof SoundManager !== 'undefined') SoundManager.playLose();
        }

        isSpinning = false;
        if (spinBtn) {
            spinBtn.disabled = false;
            spinBtn.classList.remove('spinning');
            spinBtn.textContent = 'SPIN';
        }
        _updateUI();

        // 자동 스핀
        if (autoSpin) {
            autoSpinCount++;
            setTimeout(() => {
                if (autoSpin && ChipManager.getBalance() >= currentBet) {
                    spin();
                } else {
                    stopAutoSpin();
                }
            }, 800);
        }
    }

    /**
     * 결과 생성
     */
    function _generateResult() {
        const grid = [];
        for (let c = 0; c < COLS; c++) {
            grid[c] = [];
            const strip = reelStrips[c];
            for (let r = 0; r < ROWS; r++) {
                const idx = strip[Math.floor(Math.random() * strip.length)];
                grid[c][r] = idx;
            }
        }
        return grid;
    }

    /**
     * CSS Transform 기반 릴 애니메이션 (부드러운 스크롤)
     */
    function _animateReels(newGrid) {
        return new Promise((resolve) => {
            const reels = document.querySelectorAll('.reel');
            let completedReels = 0;

            reels.forEach((reelEl, col) => {
                const stripEl = reelEl.querySelector('.reel-strip');
                const symbolHeight = _getSymbolHeight();

                // 스핀 심볼 수 (각 릴마다 점점 더 많이)
                const spinSymbolCount = 15 + col * 5;

                // 새 strip 구성: [랜덤 심볼들... + 최종 3개]
                stripEl.innerHTML = '';

                // 현재 보여지는 3개 심볼 (시작 위치)
                for (let r = 0; r < ROWS; r++) {
                    const symEl = document.createElement('div');
                    symEl.className = 'reel-symbol';
                    symEl.textContent = SYMBOLS[currentGrid[col][r]].emoji;
                    stripEl.appendChild(symEl);
                }

                // 스핀용 랜덤 심볼들
                for (let i = 0; i < spinSymbolCount; i++) {
                    const symEl = document.createElement('div');
                    symEl.className = 'reel-symbol';
                    symEl.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].emoji;
                    stripEl.appendChild(symEl);
                }

                // 최종 결과 심볼 3개
                for (let r = 0; r < ROWS; r++) {
                    const symEl = document.createElement('div');
                    symEl.className = 'reel-symbol final-symbol';
                    symEl.textContent = SYMBOLS[newGrid[col][r]].emoji;
                    symEl.dataset.row = r;
                    symEl.dataset.col = col;
                    stripEl.appendChild(symEl);
                }

                // 시작 위치
                stripEl.style.transition = 'none';
                stripEl.style.transform = 'translateY(0px)';

                // force reflow
                stripEl.offsetHeight;

                // 딜레이 후 애니메이션 시작
                setTimeout(() => {
                    const targetY = (spinSymbolCount + ROWS) * symbolHeight;
                    const duration = 0.8 + col * 0.3;

                    // 바운스 이징 효과
                    stripEl.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.85, 0.25, 1.02)`;
                    stripEl.style.transform = `translateY(-${targetY}px)`;

                    const onEnd = () => {
                        stripEl.removeEventListener('transitionend', onEnd);

                        // 릴 멈춤 사운드
                        if (typeof SoundManager !== 'undefined') SoundManager.playReelStop(col);

                        // 릴 정착 후 최종 심볼만 남기기
                        stripEl.style.transition = 'none';
                        stripEl.innerHTML = '';

                        for (let r = 0; r < ROWS; r++) {
                            const symEl = document.createElement('div');
                            symEl.className = 'reel-symbol';
                            symEl.textContent = SYMBOLS[newGrid[col][r]].emoji;
                            symEl.dataset.row = r;
                            symEl.dataset.col = col;
                            stripEl.appendChild(symEl);
                        }

                        stripEl.style.transform = 'translateY(0px)';

                        completedReels++;
                        if (completedReels >= COLS) {
                            resolve();
                        }
                    };

                    stripEl.addEventListener('transitionend', onEnd);
                }, col * 120);
            });
        });
    }

    /**
     * 심볼 높이 계산
     */
    function _getSymbolHeight() {
        const sym = document.querySelector('.reel-symbol');
        return sym ? sym.offsetHeight : 80;
    }

    /**
     * 당첨 체크
     */
    function _checkWins() {
        let totalWin = 0;
        const winLines = [];

        PAYLINES.forEach((payline, lineIdx) => {
            const firstSymbol = currentGrid[0][payline[0]];
            let matchCount = 1;

            for (let c = 1; c < COLS; c++) {
                if (currentGrid[c][payline[c]] === firstSymbol) {
                    matchCount++;
                } else {
                    break;
                }
            }

            if (matchCount >= 3) {
                const symbol = SYMBOLS[firstSymbol];
                const payIdx = matchCount - 3;
                const multiplier = symbol.pay[payIdx];
                const lineWin = currentBet * multiplier;
                totalWin += lineWin;

                winLines.push({
                    lineIdx,
                    payline,
                    matchCount,
                    symbol: firstSymbol,
                    multiplier,
                    win: lineWin
                });
            }
        });

        return { totalWin, winLines };
    }

    /**
     * 당첨 하이라이트 (확대 + 골드 파티클)
     */
    function _highlightWins(winLines) {
        winLines.forEach(line => {
            for (let c = 0; c < line.matchCount; c++) {
                const row = line.payline[c];
                const symbols = document.querySelectorAll(`[data-col="${c}"][data-row="${row}"]`);
                symbols.forEach(el => {
                    el.classList.add('highlight');
                    el.classList.add('win-scale');
                });
            }
        });

        // 파티클 효과
        _createWinParticles();
    }

    /**
     * 승리 파티클 효과
     */
    function _createWinParticles() {
        const container = document.querySelector('.reels-container');
        if (!container) return;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'win-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 0.5 + 's';
            particle.style.animationDuration = (1 + Math.random() * 1) + 's';
            container.appendChild(particle);

            setTimeout(() => particle.remove(), 2500);
        }
    }

    /**
     * 승리 금액 카운트업 애니메이션
     */
    function _animateWinCount(targetAmount) {
        const resultEl = document.getElementById('slotResult');
        if (!resultEl) return;

        let current = 0;
        const step = Math.max(1, Math.floor(targetAmount / 30));
        const interval = setInterval(() => {
            current += step;
            if (current >= targetAmount) {
                current = targetAmount;
                clearInterval(interval);
            }
            resultEl.textContent = `WIN! +${current.toLocaleString()}`;
            if (typeof SoundManager !== 'undefined' && current < targetAmount) {
                SoundManager.playCountTick();
            }
        }, 40);
    }

    /**
     * 하이라이트 초기화
     */
    function _clearHighlights() {
        document.querySelectorAll('.reel-symbol.highlight, .reel-symbol.win-scale').forEach(el => {
            el.classList.remove('highlight', 'win-scale');
        });
        document.querySelectorAll('.win-particle').forEach(el => el.remove());
    }

    /**
     * 결과 표시
     */
    function _showResult(text, type) {
        const resultEl = document.getElementById('slotResult');
        if (resultEl) {
            resultEl.textContent = text;
            resultEl.className = `result-display result-${type}`;
        }
    }

    /**
     * 승리 오버레이 (일반)
     */
    function _showWinOverlay(amount) {
        const overlay = document.getElementById('winOverlay');
        if (!overlay) return;

        const amountEl = overlay.querySelector('.amount');
        if (amountEl) amountEl.textContent = `+${amount.toLocaleString()} CHIPS`;

        overlay.classList.remove('big-win');
        overlay.classList.add('active');
        setTimeout(() => overlay.classList.remove('active'), 2000);
    }

    /**
     * 큰 승리 오버레이 (x10 이상)
     */
    function _showBigWinOverlay(amount) {
        const overlay = document.getElementById('winOverlay');
        if (!overlay) return;

        const amountEl = overlay.querySelector('.amount');
        if (amountEl) amountEl.textContent = `+${amount.toLocaleString()} CHIPS`;

        const winText = overlay.querySelector('.win-text');
        if (winText) {
            // 기존 WIN! 텍스트를 BIG WIN!으로
            winText.childNodes[0].textContent = 'BIG WIN!';
        }

        overlay.classList.add('active', 'big-win');
        setTimeout(() => {
            overlay.classList.remove('active', 'big-win');
            if (winText) winText.childNodes[0].textContent = 'WIN!';
        }, 3500);
    }

    /**
     * UI 업데이트
     */
    function _updateUI() {
        const betEl = document.getElementById('betAmount');
        if (betEl) betEl.textContent = currentBet.toLocaleString();

        const chipEl = document.getElementById('headerChips');
        if (chipEl) chipEl.textContent = ChipManager.formatBalance();

        document.querySelectorAll('.quick-bet').forEach(btn => {
            const val = parseInt(btn.dataset.bet);
            btn.classList.toggle('active', val === currentBet);
        });
    }

    /**
     * 베팅 금액 변경
     */
    function setBet(amount) {
        currentBet = Math.max(MIN_BET, Math.min(MAX_BET, amount));
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
        _updateUI();
    }

    function increaseBet() {
        const idx = BET_STEPS.indexOf(currentBet);
        if (idx >= 0 && idx < BET_STEPS.length - 1) {
            setBet(BET_STEPS[idx + 1]);
        } else if (idx < 0) {
            // currentBet이 스텝에 없으면 가장 가까운 큰 단계로
            const nextStep = BET_STEPS.find(s => s > currentBet);
            if (nextStep) setBet(nextStep);
        }
    }

    function decreaseBet() {
        const idx = BET_STEPS.indexOf(currentBet);
        if (idx > 0) {
            setBet(BET_STEPS[idx - 1]);
        } else if (idx < 0) {
            // currentBet이 스텝에 없으면 가장 가까운 작은 단계로
            const prevSteps = BET_STEPS.filter(s => s < currentBet);
            if (prevSteps.length > 0) setBet(prevSteps[prevSteps.length - 1]);
        }
    }

    /**
     * 자동 스핀
     */
    function toggleAutoSpin() {
        autoSpin = !autoSpin;
        autoSpinCount = 0;

        const btn = document.getElementById('autoSpinBtn');
        if (btn) {
            btn.classList.toggle('active', autoSpin);
            btn.textContent = autoSpin ? '🔄 자동 중지' : '🔄 자동 스핀';
        }

        if (typeof SoundManager !== 'undefined') SoundManager.playClick();

        if (autoSpin && !isSpinning) {
            spin();
        }
    }

    function stopAutoSpin() {
        autoSpin = false;
        const btn = document.getElementById('autoSpinBtn');
        if (btn) {
            btn.classList.remove('active');
            btn.textContent = '🔄 자동 스핀';
        }
    }

    function getBet() { return currentBet; }
    function getIsSpinning() { return isSpinning; }

    return {
        init,
        spin,
        setBet,
        increaseBet,
        decreaseBet,
        toggleAutoSpin,
        stopAutoSpin,
        getBet,
        getIsSpinning,
        SYMBOLS,
        PAYLINES,
        MIN_BET,
        MAX_BET
    };
})();
