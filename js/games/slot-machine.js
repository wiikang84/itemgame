/**
 * SlotMachine - 5x3 릴 슬롯머신 엔진
 * ItemGame - 소셜 카지노
 *
 * - 5 릴 x 3 행
 * - RTP ~96%
 * - 다양한 심볼 + 페이라인
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
    const REEL_WEIGHTS = [
        1,  // 💎 다이아몬드 (희귀)
        2,  // 7️⃣ 세븐
        3,  // 🔔 벨
        4,  // ⭐ 스타
        5,  // 🍒 체리
        6,  // 🍋 레몬
        6,  // 🍊 오렌지
        7,  // 🍇 포도
        7,  // 🍉 수박
    ];

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

    // 릴 strip 생성 (가중치 기반)
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
        // 셔플
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
        // 5개 릴 strip 생성
        for (let i = 0; i < COLS; i++) {
            reelStrips.push(_buildReelStrip());
        }

        // 초기 그리드 설정
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
     * 릴 UI 렌더링
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

            // 현재 그리드 심볼 + 여분 (애니메이션용)
            const extraSymbols = 20;
            const allSymbols = [];

            // 위에 여분 심볼
            for (let i = 0; i < extraSymbols; i++) {
                allSymbols.push(Math.floor(Math.random() * SYMBOLS.length));
            }
            // 실제 표시 심볼
            for (let r = 0; r < ROWS; r++) {
                allSymbols.push(currentGrid[c][r]);
            }

            allSymbols.forEach((symIdx, i) => {
                const symEl = document.createElement('div');
                symEl.className = 'reel-symbol';
                symEl.textContent = SYMBOLS[symIdx].emoji;
                symEl.dataset.row = i - extraSymbols;
                symEl.dataset.col = c;
                stripEl.appendChild(symEl);
            });

            // 최종 위치로 바로 이동
            const symbolHeight = 80;
            stripEl.style.transform = `translateY(-${extraSymbols * symbolHeight}px)`;

            reelEl.appendChild(stripEl);
            reelsGrid.appendChild(reelEl);
        }
    }

    /**
     * 스핀 실행
     */
    async function spin() {
        if (isSpinning) return;

        // 베팅 차감
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

        // 새 결과 생성
        const newGrid = _generateResult();

        // 릴 애니메이션
        await _animateReels(newGrid);

        currentGrid = newGrid;

        // 당첨 체크
        const winResult = _checkWins();
        const totalWin = winResult.totalWin;

        if (totalWin > 0) {
            ChipManager.addChips(totalWin);
            _highlightWins(winResult.winLines);
            _showResult(`WIN! +${totalWin.toLocaleString()}`, 'win');
            _showWinOverlay(totalWin);
        } else {
            _showResult('꽝!', 'lose');
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
     * 결과 생성 (가중치 기반 랜덤)
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
     * 릴 스핀 애니메이션
     */
    function _animateReels(newGrid) {
        return new Promise((resolve) => {
            const symbolHeight = _getSymbolHeight();
            const extraSymbols = 20;
            const reels = document.querySelectorAll('.reel');

            let completedReels = 0;

            reels.forEach((reelEl, col) => {
                const stripEl = reelEl.querySelector('.reel-strip');

                // 새 심볼 세트 생성 (스핀 효과용)
                stripEl.innerHTML = '';
                const spinCount = 15 + col * 5; // 각 릴마다 점점 더 많이 회전

                const allSymbols = [];
                // 회전용 랜덤 심볼
                for (let i = 0; i < spinCount; i++) {
                    allSymbols.push(Math.floor(Math.random() * SYMBOLS.length));
                }
                // 최종 심볼
                for (let r = 0; r < ROWS; r++) {
                    allSymbols.push(newGrid[col][r]);
                }

                allSymbols.forEach((symIdx, i) => {
                    const symEl = document.createElement('div');
                    symEl.className = 'reel-symbol';
                    symEl.textContent = SYMBOLS[symIdx].emoji;
                    symEl.dataset.row = i - spinCount;
                    symEl.dataset.col = col;
                    stripEl.appendChild(symEl);
                });

                // 시작 위치 (맨 위)
                stripEl.style.transition = 'none';
                stripEl.style.transform = `translateY(0px)`;

                // 약간의 딜레이 후 애니메이션 시작
                setTimeout(() => {
                    const targetY = spinCount * symbolHeight;
                    const duration = 0.8 + col * 0.25; // 릴마다 시간차

                    stripEl.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.8, 0.3, 1)`;
                    stripEl.style.transform = `translateY(-${targetY}px)`;

                    stripEl.addEventListener('transitionend', () => {
                        completedReels++;
                        if (completedReels >= COLS) {
                            resolve();
                        }
                    }, { once: true });
                }, col * 100);
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
            // 페이라인의 첫 심볼
            const firstSymbol = currentGrid[0][payline[0]];
            let matchCount = 1;

            // 연속 매칭 체크 (왼쪽→오른쪽)
            for (let c = 1; c < COLS; c++) {
                if (currentGrid[c][payline[c]] === firstSymbol) {
                    matchCount++;
                } else {
                    break;
                }
            }

            // 3개 이상 연속이면 당첨
            if (matchCount >= 3) {
                const symbol = SYMBOLS[firstSymbol];
                const payIdx = matchCount - 3; // 0=3개, 1=4개, 2=5개
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
     * 당첨 하이라이트
     */
    function _highlightWins(winLines) {
        winLines.forEach(line => {
            for (let c = 0; c < line.matchCount; c++) {
                const row = line.payline[c];
                const symbols = document.querySelectorAll(`[data-col="${c}"][data-row="${row}"]`);
                symbols.forEach(el => el.classList.add('highlight'));
            }
        });
    }

    /**
     * 하이라이트 초기화
     */
    function _clearHighlights() {
        document.querySelectorAll('.reel-symbol.highlight').forEach(el => {
            el.classList.remove('highlight');
        });
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
     * 큰 승리 오버레이
     */
    function _showWinOverlay(amount) {
        const overlay = document.getElementById('winOverlay');
        if (!overlay) return;

        const amountEl = overlay.querySelector('.amount');
        if (amountEl) amountEl.textContent = `+${amount.toLocaleString()} CHIPS`;

        overlay.classList.add('active');
        setTimeout(() => overlay.classList.remove('active'), 2000);
    }

    /**
     * UI 업데이트
     */
    function _updateUI() {
        const betEl = document.getElementById('betAmount');
        if (betEl) betEl.textContent = currentBet.toLocaleString();

        const chipEl = document.getElementById('headerChips');
        if (chipEl) chipEl.textContent = ChipManager.formatBalance();

        // 퀵베팅 버튼 활성 상태
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
        _updateUI();
    }

    function increaseBet() {
        const steps = [10, 25, 50, 100, 200, 500, 1000];
        const idx = steps.indexOf(currentBet);
        if (idx < steps.length - 1) {
            setBet(steps[idx + 1]);
        }
    }

    function decreaseBet() {
        const steps = [10, 25, 50, 100, 200, 500, 1000];
        const idx = steps.indexOf(currentBet);
        if (idx > 0) {
            setBet(steps[idx - 1]);
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

    /**
     * Getter
     */
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
