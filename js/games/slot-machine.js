/**
 * SlotMachine v3.0 - LUCKY SEVENS (클래식 카지노)
 * ItemGame - 소셜 카지노
 *
 * [v1.0: commit fd342be / v2.0: commit bbeba0e]
 *
 * v3.0: 실제 카지노 스타일 리뉴얼
 * - 클래식 카지노 심볼 (7/BAR/Cherry/Bell/Diamond + A/K/Q/J + Wild/Scatter)
 * - 카지노 캐비닛 UI (메탈릭 프레임, LED 디스플레이, 빨간 스핀 버튼)
 * - 와일드 심볼 대체, 스캐터 프리스핀, 갬블/더블업
 * - 5단계 승리 연출, 페이라인 SVG, 앤티시페이션
 */

const SlotMachine = (() => {
    // ═══ 심볼 타입 ═══
    const SYM_NORMAL = 'normal';
    const SYM_WILD = 'wild';
    const SYM_SCATTER = 'scatter';

    // ═══ 심볼 정의 (클래식 카지노) ═══
    const SYMBOLS = [
        { emoji: '7️⃣', name: 'Lucky 7', label: '7', pay: [25, 75, 250], type: SYM_NORMAL, cls: 'sym-high' },
        { emoji: '🍒', name: 'Cherry', label: '🍒', pay: [20, 50, 200], type: SYM_NORMAL, cls: 'sym-high' },
        { emoji: '🔔', name: 'Bell', label: '🔔', pay: [15, 40, 150], type: SYM_NORMAL, cls: 'sym-high' },
        { emoji: '💎', name: 'Diamond', label: '💎', pay: [10, 30, 100], type: SYM_NORMAL, cls: 'sym-mid' },
        { emoji: '🍋', name: 'Lemon', label: '🍋', pay: [8, 20, 75], type: SYM_NORMAL, cls: 'sym-mid' },
        { emoji: 'A', name: 'Ace', label: 'A', pay: [3, 10, 30], type: SYM_NORMAL, cls: 'sym-card' },
        { emoji: 'K', name: 'King', label: 'K', pay: [3, 8, 25], type: SYM_NORMAL, cls: 'sym-card' },
        { emoji: 'Q', name: 'Queen', label: 'Q', pay: [2, 5, 20], type: SYM_NORMAL, cls: 'sym-card' },
        { emoji: 'J', name: 'Jack', label: 'J', pay: [2, 5, 20], type: SYM_NORMAL, cls: 'sym-card' },
        { emoji: '⭐', name: 'WILD', label: 'W', pay: [30, 100, 500], type: SYM_WILD, cls: 'sym-wild' },
        { emoji: '💰', name: 'BONUS', label: '$', pay: [2, 10, 50], type: SYM_SCATTER, cls: 'sym-scatter' },
    ];

    // 릴 가중치 (인덱스 = SYMBOLS 순서)
    // [Pharaoh, Eye, Scarab, Cobra, Horus, A, K, Q, J, Wild, Scatter]
    const REEL_WEIGHTS = [2, 3, 3, 5, 5, 8, 8, 9, 9, 1, 2];

    // 와일드/스캐터 인덱스
    const WILD_IDX = SYMBOLS.findIndex(s => s.type === SYM_WILD);
    const SCATTER_IDX = SYMBOLS.findIndex(s => s.type === SYM_SCATTER);

    // ═══ 페이라인 (9개) ═══
    const PAYLINES = [
        [1, 1, 1, 1, 1],  // 1: 중앙 수평
        [0, 0, 0, 0, 0],  // 2: 상단 수평
        [2, 2, 2, 2, 2],  // 3: 하단 수평
        [0, 1, 2, 1, 0],  // 4: V자
        [2, 1, 0, 1, 2],  // 5: 역V자
        [0, 0, 1, 2, 2],  // 6: 대각선 ↘
        [2, 2, 1, 0, 0],  // 7: 대각선 ↗
        [1, 0, 0, 0, 1],  // 8: U자 위
        [1, 2, 2, 2, 1],  // 9: U자 아래
    ];

    // 페이라인 색상
    const LINE_COLORS = [
        '#ff4444', '#44ff44', '#4488ff', '#ffff44', '#ff44ff',
        '#44ffff', '#ff8844', '#88ff44', '#ff4488'
    ];

    // ═══ 상수 ═══
    const ROWS = 3;
    const COLS = 5;
    const MIN_BET = 10;
    const MAX_BET = 1000;
    const BET_STEPS = [10, 25, 50, 100, 200, 500, 1000];
    const AUTO_SPIN_OPTIONS = [10, 25, 50, 100, -1]; // -1 = 무제한

    // ═══ 게임 상태 ═══
    let reelStrips = [];
    let currentBet = 100;
    let isSpinning = false;
    let currentGrid = []; // [col][row] = symbolIndex
    let autoSpin = false;
    let autoSpinCount = 0;
    let autoSpinLimit = -1;

    // ═══ 프리스핀 상태 ═══
    let freeSpinsRemaining = 0;
    let freeSpinMultiplier = 1;
    let isFreeSpinMode = false;
    let freeSpinTotalWin = 0;
    let freeSpinStartBet = 0;

    // ═══ 갬블 상태 ═══
    let gambleAmount = 0;
    let gambleActive = false;

    // ═══ 통계 ═══
    let stats = { spins: 0, wins: 0, biggestWin: 0 };

    // ═══════════════════════════════════
    //  초기화
    // ═══════════════════════════════════

    function init() {
        reelStrips = [];
        for (let i = 0; i < COLS; i++) {
            reelStrips.push(_buildReelStrip());
        }

        currentGrid = [];
        for (let c = 0; c < COLS; c++) {
            currentGrid[c] = [];
            for (let r = 0; r < ROWS; r++) {
                currentGrid[c][r] = _weightedRandom(reelStrips[c]);
            }
        }

        // 로컬 통계 로드
        try {
            const saved = localStorage.getItem('slot_stats');
            if (saved) stats = JSON.parse(saved);
        } catch (e) { }

        _renderReels();
        _updateUI();

        // BGM 시작
        if (typeof SoundManager !== 'undefined') {
            setTimeout(() => SoundManager.startBGM('main'), 500);
        }
    }

    function _buildReelStrip() {
        const strip = [];
        REEL_WEIGHTS.forEach((weight, idx) => {
            for (let i = 0; i < weight; i++) {
                strip.push(idx);
            }
        });
        // Fisher-Yates 셔플
        for (let i = strip.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [strip[i], strip[j]] = [strip[j], strip[i]];
        }
        return strip;
    }

    function _weightedRandom(strip) {
        return strip[Math.floor(Math.random() * strip.length)];
    }

    // ═══════════════════════════════════
    //  릴 렌더링
    // ═══════════════════════════════════

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

            for (let r = 0; r < ROWS; r++) {
                stripEl.appendChild(_createSymbolEl(currentGrid[c][r], r, c));
            }

            stripEl.style.transform = 'translateY(0px)';
            reelEl.appendChild(stripEl);
            reelsGrid.appendChild(reelEl);
        }
    }

    function _createSymbolEl(symIdx, row, col) {
        const sym = SYMBOLS[symIdx];
        const el = document.createElement('div');
        el.className = `reel-symbol ${sym.cls || ''}`;
        if (sym.type === SYM_WILD) el.classList.add('wild-symbol');
        if (sym.type === SYM_SCATTER) el.classList.add('scatter-symbol');

        if (sym.cls === 'sym-card') {
            // 카드 심볼은 텍스트 스타일
            el.innerHTML = `<span class="card-letter">${sym.emoji}</span>`;
        } else {
            el.textContent = sym.emoji;
        }

        el.dataset.row = row;
        el.dataset.col = col;
        el.dataset.symIdx = symIdx;
        return el;
    }

    // ═══════════════════════════════════
    //  스핀
    // ═══════════════════════════════════

    async function spin() {
        if (isSpinning || gambleActive) return;

        // 프리스핀 모드
        if (isFreeSpinMode) {
            freeSpinsRemaining--;
            _updateFreeSpinUI();
        } else {
            if (!ChipManager.deductChips(currentBet)) {
                _showResult('칩이 부족합니다!', 'lose');
                stopAutoSpin();
                return;
            }
        }

        isSpinning = true;
        gambleAmount = 0;
        _clearHighlights();
        _clearPaylines();
        _hideGambleUI();
        _updateUI();

        const spinBtn = document.getElementById('spinButton');
        if (spinBtn) {
            spinBtn.disabled = true;
            spinBtn.classList.add('spinning');
        }

        if (typeof SoundManager !== 'undefined') SoundManager.playSpinStart();

        stats.spins++;

        // 새 결과 생성
        const newGrid = _generateResult();

        // 릴 애니메이션
        await _animateReels(newGrid);

        currentGrid = newGrid;

        // 스캐터 카운트 & 사운드
        const scatterCount = _countScatters();
        if (scatterCount >= 1 && typeof SoundManager !== 'undefined') {
            SoundManager.playScatterLand(scatterCount);
        }

        // 와일드 사운드
        const wildCount = _countWilds();
        if (wildCount >= 1 && typeof SoundManager !== 'undefined') {
            SoundManager.playWildLand();
        }

        // 당첨 체크 (와일드 대체 적용)
        const winResult = _checkWins();
        let totalWin = winResult.totalWin;

        // 프리스핀 멀티플라이어 적용
        if (isFreeSpinMode && totalWin > 0) {
            totalWin = Math.floor(totalWin * freeSpinMultiplier);
        }

        // 승리 처리
        if (totalWin > 0) {
            ChipManager.addChips(totalWin);
            if (isFreeSpinMode) freeSpinTotalWin += totalWin;
            stats.wins++;
            if (totalWin > stats.biggestWin) stats.biggestWin = totalWin;

            _highlightWins(winResult.winLines);
            _drawPaylines(winResult.winLines);

            // 승리 등급 판정 & 연출
            const ratio = totalWin / currentBet;
            await _showWinCelebration(totalWin, ratio);

            // 프리스핀 중 멀티플라이어 증가
            if (isFreeSpinMode) {
                freeSpinMultiplier = Math.min(freeSpinMultiplier + 1, 10);
                _updateMultiplierUI();
                if (typeof SoundManager !== 'undefined') SoundManager.playMultiplierUp();
            }

            // 갬블 옵션 (프리스핀/자동스핀 아닐 때만)
            if (!isFreeSpinMode && !autoSpin) {
                gambleAmount = totalWin;
                _showGambleUI();
            }
        } else {
            _showResult('', 'none');
            if (typeof SoundManager !== 'undefined') SoundManager.playLose();
            // 프리스핀 중 패배시 멀티플라이어 감소 (최소 1)
            if (isFreeSpinMode) {
                freeSpinMultiplier = Math.max(1, freeSpinMultiplier - 1);
                _updateMultiplierUI();
            }
        }

        // 스캐터 3개+ → 프리스핀 트리거
        if (scatterCount >= 3) {
            await _triggerFreeSpins(scatterCount);
        }

        isSpinning = false;
        if (spinBtn) {
            spinBtn.disabled = false;
            spinBtn.classList.remove('spinning');
        }
        _updateUI();
        _saveStats();

        // 다음 스핀 (프리스핀 or 오토)
        if (isFreeSpinMode && freeSpinsRemaining > 0) {
            setTimeout(spin, 1200);
        } else if (isFreeSpinMode && freeSpinsRemaining <= 0) {
            _endFreeSpins();
        } else if (autoSpin && !gambleAmount) {
            autoSpinCount++;
            if (autoSpinLimit !== -1 && autoSpinCount >= autoSpinLimit) {
                stopAutoSpin();
            } else {
                setTimeout(() => {
                    if (autoSpin && ChipManager.getBalance() >= currentBet) {
                        spin();
                    } else {
                        stopAutoSpin();
                    }
                }, 800);
            }
        }
    }

    // ═══════════════════════════════════
    //  결과 생성
    // ═══════════════════════════════════

    function _generateResult() {
        const grid = [];
        for (let c = 0; c < COLS; c++) {
            grid[c] = [];
            for (let r = 0; r < ROWS; r++) {
                grid[c][r] = _weightedRandom(reelStrips[c]);
            }
        }
        return grid;
    }

    // ═══════════════════════════════════
    //  릴 애니메이션
    // ═══════════════════════════════════

    function _animateReels(newGrid) {
        return new Promise((resolve) => {
            const reels = document.querySelectorAll('.reel');
            let completedReels = 0;

            // 앤티시페이션: 스캐터가 2개 이상이면 마지막 릴 지연
            let scatterSoFar = 0;
            for (let c = 0; c < COLS - 1; c++) {
                for (let r = 0; r < ROWS; r++) {
                    if (newGrid[c][r] === SCATTER_IDX) scatterSoFar++;
                }
            }
            const hasAnticipation = scatterSoFar >= 2;

            reels.forEach((reelEl, col) => {
                const stripEl = reelEl.querySelector('.reel-strip');
                const symbolHeight = _getSymbolHeight();
                const spinSymbolCount = 15 + col * 5;

                stripEl.innerHTML = '';

                // 현재 심볼
                for (let r = 0; r < ROWS; r++) {
                    stripEl.appendChild(_createSymbolEl(currentGrid[col][r], r, col));
                }

                // 스핀 심볼 (랜덤)
                for (let i = 0; i < spinSymbolCount; i++) {
                    const idx = Math.floor(Math.random() * SYMBOLS.length);
                    const el = _createSymbolEl(idx, -1, col);
                    el.removeAttribute('data-row');
                    el.removeAttribute('data-col');
                    stripEl.appendChild(el);
                }

                // 최종 결과 심볼
                for (let r = 0; r < ROWS; r++) {
                    stripEl.appendChild(_createSymbolEl(newGrid[col][r], r, col));
                }

                stripEl.style.transition = 'none';
                stripEl.style.transform = 'translateY(0px)';
                stripEl.offsetHeight; // force reflow

                // 마지막 릴 앤티시페이션
                let extraDelay = 0;
                if (hasAnticipation && col === COLS - 1) {
                    extraDelay = 600;
                    setTimeout(() => {
                        if (typeof SoundManager !== 'undefined') SoundManager.playAnticipation();
                    }, col * 120);
                }

                setTimeout(() => {
                    const targetY = (spinSymbolCount + ROWS) * symbolHeight;
                    const duration = hasAnticipation && col === COLS - 1
                        ? 1.8  // 마지막 릴 서스펜스 (더 긴 시간)
                        : 0.8 + col * 0.3;

                    stripEl.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.85, 0.25, 1.02)`;
                    stripEl.style.transform = `translateY(-${targetY}px)`;

                    const onEnd = () => {
                        stripEl.removeEventListener('transitionend', onEnd);

                        if (typeof SoundManager !== 'undefined') SoundManager.playReelStop(col);

                        // 최종 심볼로 교체
                        stripEl.style.transition = 'none';
                        stripEl.innerHTML = '';
                        for (let r = 0; r < ROWS; r++) {
                            stripEl.appendChild(_createSymbolEl(newGrid[col][r], r, col));
                        }
                        stripEl.style.transform = 'translateY(0px)';

                        completedReels++;
                        if (completedReels >= COLS) {
                            resolve();
                        }
                    };

                    stripEl.addEventListener('transitionend', onEnd);
                }, col * 120 + extraDelay);
            });
        });
    }

    function _getSymbolHeight() {
        const sym = document.querySelector('.reel-symbol');
        return sym ? sym.offsetHeight : 80;
    }

    // ═══════════════════════════════════
    //  당첨 체크 (와일드 대체 지원)
    // ═══════════════════════════════════

    function _checkWins() {
        let totalWin = 0;
        const winLines = [];

        PAYLINES.forEach((payline, lineIdx) => {
            // 첫 번째 비-스캐터 심볼 찾기 (와일드는 패스)
            let matchSymIdx = -1;
            for (let c = 0; c < COLS; c++) {
                const idx = currentGrid[c][payline[c]];
                if (SYMBOLS[idx].type === SYM_SCATTER) break; // 스캐터는 라인 매칭 안 함
                if (SYMBOLS[idx].type !== SYM_WILD) {
                    matchSymIdx = idx;
                    break;
                }
            }

            // 전부 와일드인 경우
            if (matchSymIdx === -1) {
                // 첫 심볼이 와일드인지 확인
                const firstIdx = currentGrid[0][payline[0]];
                if (SYMBOLS[firstIdx].type === SYM_WILD) {
                    matchSymIdx = WILD_IDX;
                } else {
                    return; // 스캐터로 시작하면 라인 매칭 안 함
                }
            }

            // 연속 매칭 카운트 (와일드 대체)
            let matchCount = 0;
            for (let c = 0; c < COLS; c++) {
                const idx = currentGrid[c][payline[c]];
                if (idx === matchSymIdx || SYMBOLS[idx].type === SYM_WILD) {
                    matchCount++;
                } else {
                    break;
                }
            }

            if (matchCount >= 3) {
                const symbol = SYMBOLS[matchSymIdx];
                const payIdx = Math.min(matchCount - 3, symbol.pay.length - 1);
                const multiplier = symbol.pay[payIdx];
                const lineWin = currentBet * multiplier;
                totalWin += lineWin;

                winLines.push({
                    lineIdx,
                    payline,
                    matchCount,
                    symbol: matchSymIdx,
                    multiplier,
                    win: lineWin
                });
            }
        });

        // 스캐터 보너스 (위치 무관)
        const scatterCount = _countScatters();
        if (scatterCount >= 3) {
            const scatterPay = SYMBOLS[SCATTER_IDX].pay[Math.min(scatterCount - 3, 2)];
            const scatterWin = currentBet * scatterPay;
            totalWin += scatterWin;
        }

        return { totalWin, winLines };
    }

    function _countScatters() {
        let count = 0;
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                if (currentGrid[c][r] === SCATTER_IDX) count++;
            }
        }
        return count;
    }

    function _countWilds() {
        let count = 0;
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                if (currentGrid[c][r] === WILD_IDX) count++;
            }
        }
        return count;
    }

    // ═══════════════════════════════════
    //  5단계 승리 연출
    // ═══════════════════════════════════

    async function _showWinCelebration(amount, ratio) {
        let tier, duration, soundFn;

        if (ratio >= 100) {
            tier = 'epic';
            duration = 5000;
            soundFn = 'playEpicWin';
        } else if (ratio >= 50) {
            tier = 'mega';
            duration = 4000;
            soundFn = 'playMegaWin';
        } else if (ratio >= 15) {
            tier = 'big';
            duration = 3000;
            soundFn = 'playBigWin';
        } else if (ratio >= 5) {
            tier = 'nice';
            duration = 2000;
            soundFn = 'playNiceWin';
        } else {
            tier = 'small';
            duration = 1200;
            soundFn = 'playSmallWin';
        }

        // 사운드
        if (typeof SoundManager !== 'undefined' && SoundManager[soundFn]) {
            SoundManager[soundFn]();
        }

        // 코인 샤워 (Big 이상)
        if (ratio >= 15 && typeof SoundManager !== 'undefined') {
            SoundManager.startCoinShower(duration);
        }

        // 오버레이 표시
        _showWinOverlay(amount, tier);

        // 결과 텍스트
        const tierLabels = { small: 'WIN', nice: 'NICE WIN', big: 'BIG WIN', mega: 'MEGA WIN', epic: 'EPIC WIN' };
        _showResult(`${tierLabels[tier]}! +${amount.toLocaleString()}`, 'win');

        // 카운트업 애니메이션
        _animateWinCount(amount, tier);

        // 파티클 (Nice 이상)
        if (ratio >= 5) {
            _createWinParticles(tier);
        }

        // 오버레이 자동 닫기
        return new Promise(resolve => {
            setTimeout(() => {
                _hideWinOverlay();
                resolve();
            }, duration);
        });
    }

    function _showWinOverlay(amount, tier) {
        const overlay = document.getElementById('winOverlay');
        if (!overlay) return;

        const tierLabels = { small: 'WIN!', nice: 'NICE WIN!', big: 'BIG WIN!', mega: 'MEGA WIN!', epic: 'EPIC WIN!' };
        const winTextEl = overlay.querySelector('.win-tier-text');
        const amountEl = overlay.querySelector('.win-amount');

        if (winTextEl) winTextEl.textContent = tierLabels[tier] || 'WIN!';
        if (amountEl) amountEl.textContent = `+${amount.toLocaleString()}`;

        // 모든 티어 클래스 제거 후 현재 티어 추가
        overlay.className = 'win-overlay active tier-' + tier;
    }

    function _hideWinOverlay() {
        const overlay = document.getElementById('winOverlay');
        if (overlay) overlay.className = 'win-overlay';
    }

    // ═══════════════════════════════════
    //  프리스핀 시스템
    // ═══════════════════════════════════

    async function _triggerFreeSpins(scatterCount) {
        const spinsMap = { 3: 10, 4: 15, 5: 25 };
        const newSpins = spinsMap[Math.min(scatterCount, 5)] || 10;

        if (isFreeSpinMode) {
            // 리트리거 (추가 스핀)
            freeSpinsRemaining += newSpins;
        } else {
            isFreeSpinMode = true;
            freeSpinsRemaining = newSpins;
            freeSpinMultiplier = 1;
            freeSpinTotalWin = 0;
            freeSpinStartBet = currentBet;

            // BGM 전환
            if (typeof SoundManager !== 'undefined') {
                SoundManager.playFreeSpinTrigger();
                setTimeout(() => SoundManager.switchBGM('freespin'), 1500);
            }
        }

        // 프리스핀 배너 표시
        _showFreeSpinBanner(newSpins, isFreeSpinMode && freeSpinsRemaining > newSpins);
        _updateFreeSpinUI();

        // 잠시 대기 (연출)
        return new Promise(resolve => setTimeout(resolve, 2000));
    }

    function _endFreeSpins() {
        isFreeSpinMode = false;
        const totalWin = freeSpinTotalWin;

        // 프리스핀 결과 오버레이
        _showFreeSpinResult(totalWin);

        // BGM 복원
        if (typeof SoundManager !== 'undefined') {
            SoundManager.playFreeSpinComplete();
            setTimeout(() => SoundManager.switchBGM('main'), 1000);
        }

        freeSpinsRemaining = 0;
        freeSpinMultiplier = 1;
        freeSpinTotalWin = 0;
        _updateFreeSpinUI();
    }

    function _showFreeSpinBanner(count, isRetrigger) {
        const banner = document.getElementById('freeSpinBanner');
        if (!banner) return;
        const text = isRetrigger ? `+${count} FREE SPINS!` : `${count} FREE SPINS!`;
        banner.querySelector('.fs-text').textContent = text;
        banner.classList.add('active');
        setTimeout(() => banner.classList.remove('active'), 2500);
    }

    function _showFreeSpinResult(totalWin) {
        const banner = document.getElementById('freeSpinBanner');
        if (!banner) return;
        banner.querySelector('.fs-text').textContent =
            `FREE SPINS COMPLETE! Total: +${totalWin.toLocaleString()}`;
        banner.classList.add('active');
        setTimeout(() => banner.classList.remove('active'), 3000);
    }

    function _updateFreeSpinUI() {
        const counter = document.getElementById('freeSpinCounter');
        const multiplierEl = document.getElementById('multiplierDisplay');

        if (counter) {
            if (isFreeSpinMode) {
                counter.style.display = 'flex';
                counter.querySelector('.fs-count').textContent = freeSpinsRemaining;
            } else {
                counter.style.display = 'none';
            }
        }
        _updateMultiplierUI();
    }

    function _updateMultiplierUI() {
        const el = document.getElementById('multiplierDisplay');
        if (el) {
            if (isFreeSpinMode && freeSpinMultiplier > 1) {
                el.style.display = 'flex';
                el.querySelector('.mult-value').textContent = `x${freeSpinMultiplier}`;
            } else {
                el.style.display = 'none';
            }
        }
    }

    // ═══════════════════════════════════
    //  갬블(더블업) 기능
    // ═══════════════════════════════════

    function _showGambleUI() {
        const el = document.getElementById('gamblePanel');
        if (el && gambleAmount > 0) {
            el.style.display = 'block';
            el.querySelector('.gamble-amount').textContent = gambleAmount.toLocaleString();
            gambleActive = false; // 선택 대기중
        }
    }

    function _hideGambleUI() {
        const el = document.getElementById('gamblePanel');
        if (el) el.style.display = 'none';
        gambleActive = false;
    }

    function gambleDouble(choice) {
        if (gambleActive || gambleAmount <= 0) return;
        gambleActive = true;

        if (typeof SoundManager !== 'undefined') SoundManager.playGambleReveal();

        // 결과 (50/50)
        const result = Math.random() < 0.5 ? 'red' : 'black';
        const won = (choice === result);

        const cardEl = document.getElementById('gambleCard');
        if (cardEl) {
            cardEl.className = `gamble-card ${result}`;
            cardEl.textContent = result === 'red' ? '♥' : '♠';
        }

        setTimeout(() => {
            if (won) {
                gambleAmount *= 2;
                ChipManager.addChips(gambleAmount / 2); // 차액 지급
                if (typeof SoundManager !== 'undefined') SoundManager.playGambleWin();
                _showResult(`DOUBLE! ${gambleAmount.toLocaleString()}`, 'win');
                // 계속 갬블 가능
                const amtEl = document.querySelector('.gamble-amount');
                if (amtEl) amtEl.textContent = gambleAmount.toLocaleString();
                gambleActive = false;
            } else {
                ChipManager.deductChips(gambleAmount);
                gambleAmount = 0;
                if (typeof SoundManager !== 'undefined') SoundManager.playGambleLose();
                _showResult('GAMBLE LOST!', 'lose');
                _hideGambleUI();
            }
        }, 600);
    }

    function gambleCollect() {
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
        _showResult(`COLLECTED: ${gambleAmount.toLocaleString()}`, 'win');
        gambleAmount = 0;
        _hideGambleUI();
    }

    // ═══════════════════════════════════
    //  당첨 하이라이트 & 파티클
    // ═══════════════════════════════════

    function _highlightWins(winLines) {
        winLines.forEach(line => {
            for (let c = 0; c < line.matchCount; c++) {
                const row = line.payline[c];
                document.querySelectorAll(`[data-col="${c}"][data-row="${row}"]`).forEach(el => {
                    el.classList.add('highlight', 'win-scale');
                });
            }
        });
    }

    function _clearHighlights() {
        document.querySelectorAll('.reel-symbol.highlight, .reel-symbol.win-scale').forEach(el => {
            el.classList.remove('highlight', 'win-scale');
        });
        document.querySelectorAll('.win-particle').forEach(el => el.remove());
    }

    function _createWinParticles(tier) {
        const container = document.querySelector('.reels-container');
        if (!container) return;

        const counts = { small: 10, nice: 20, big: 40, mega: 60, epic: 80 };
        const count = counts[tier] || 20;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = `win-particle particle-${tier}`;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 0.8 + 's';
            particle.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
            container.appendChild(particle);
            setTimeout(() => particle.remove(), 3500);
        }
    }

    // ═══════════════════════════════════
    //  페이라인 SVG 시각화
    // ═══════════════════════════════════

    function _drawPaylines(winLines) {
        _clearPaylines();
        const container = document.querySelector('.reels-container');
        if (!container || winLines.length === 0) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('payline-svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '5';

        const rect = container.getBoundingClientRect();
        const symH = _getSymbolHeight();
        const colW = rect.width / COLS;

        winLines.forEach(line => {
            const color = LINE_COLORS[line.lineIdx % LINE_COLORS.length];
            const points = [];

            for (let c = 0; c < line.matchCount; c++) {
                const x = colW * c + colW / 2;
                const y = symH * line.payline[c] + symH / 2 + 8; // 8px padding
                points.push(`${x},${y}`);
            }

            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            polyline.setAttribute('points', points.join(' '));
            polyline.setAttribute('fill', 'none');
            polyline.setAttribute('stroke', color);
            polyline.setAttribute('stroke-width', '3');
            polyline.setAttribute('stroke-linecap', 'round');
            polyline.setAttribute('stroke-linejoin', 'round');
            polyline.setAttribute('opacity', '0.7');
            polyline.classList.add('payline-glow');
            svg.appendChild(polyline);
        });

        container.appendChild(svg);
    }

    function _clearPaylines() {
        document.querySelectorAll('.payline-svg').forEach(el => el.remove());
    }

    // ═══════════════════════════════════
    //  카운트업 애니메이션
    // ═══════════════════════════════════

    function _animateWinCount(targetAmount, tier) {
        const resultEl = document.getElementById('slotResult');
        if (!resultEl) return;

        const tierLabels = { small: 'WIN', nice: 'NICE WIN', big: 'BIG WIN', mega: 'MEGA WIN', epic: 'EPIC WIN' };
        const label = tierLabels[tier] || 'WIN';
        const steps = tier === 'small' ? 15 : tier === 'nice' ? 25 : 40;
        let current = 0;
        const step = Math.max(1, Math.floor(targetAmount / steps));

        const interval = setInterval(() => {
            current += step;
            if (current >= targetAmount) {
                current = targetAmount;
                clearInterval(interval);
            }
            resultEl.textContent = `${label}! +${current.toLocaleString()}`;
            if (typeof SoundManager !== 'undefined' && current < targetAmount) {
                SoundManager.playCountTick();
            }
        }, 40);
    }

    // ═══════════════════════════════════
    //  결과 표시
    // ═══════════════════════════════════

    function _showResult(text, type) {
        const el = document.getElementById('slotResult');
        if (el) {
            el.textContent = text;
            el.className = `info-value result-text result-${type}`;
        }
        // WIN 디스플레이 업데이트
        const winEl = document.getElementById('winDisplay');
        if (winEl) {
            if (type === 'win') {
                const numMatch = text.match(/[\d,]+/);
                winEl.textContent = numMatch ? numMatch[0] : '0';
            } else {
                winEl.textContent = '0';
            }
        }
    }

    // ═══════════════════════════════════
    //  UI 업데이트
    // ═══════════════════════════════════

    function _updateUI() {
        const betEl = document.getElementById('betAmount');
        if (betEl) betEl.textContent = currentBet.toLocaleString();

        // TOTAL BET 업데이트
        const totalBetEl = document.getElementById('totalBet');
        if (totalBetEl) totalBetEl.textContent = currentBet.toLocaleString();

        const chipEl = document.getElementById('headerChips');
        if (chipEl) chipEl.textContent = ChipManager.formatBalance();

        // CREDIT 디스플레이 업데이트
        const creditEl = document.getElementById('creditDisplay');
        if (creditEl) creditEl.textContent = ChipManager.getBalance().toLocaleString();

        // 프리스핀 중 베팅 버튼 비활성화
        document.querySelectorAll('.cab-btn-bet, .cab-btn-maxbet').forEach(btn => {
            if (isFreeSpinMode) {
                btn.style.opacity = '0.4';
                btn.style.pointerEvents = 'none';
            } else {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            }
        });

        // 스핀 버튼 텍스트 (내부 span으로)
        const spinBtn = document.getElementById('spinButton');
        if (spinBtn && !isSpinning) {
            const labelEl = spinBtn.querySelector('.cab-btn-label');
            if (labelEl) {
                labelEl.textContent = isFreeSpinMode ? 'FREE' : 'SPIN';
            }
        }

        // 통계 업데이트
        const statsEl = document.getElementById('gameStats');
        if (statsEl) {
            statsEl.innerHTML = `
                <span>SPINS: ${stats.spins}</span>
                <span>WINS: ${stats.wins}</span>
                <span>BEST: ${stats.biggestWin.toLocaleString()}</span>
            `;
        }
    }

    // ═══════════════════════════════════
    //  베팅 컨트롤
    // ═══════════════════════════════════

    function setBet(amount) {
        if (isFreeSpinMode) return;
        currentBet = Math.max(MIN_BET, Math.min(MAX_BET, amount));
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
        _updateUI();
    }

    function increaseBet() {
        if (isFreeSpinMode) return;
        const idx = BET_STEPS.indexOf(currentBet);
        if (idx >= 0 && idx < BET_STEPS.length - 1) {
            setBet(BET_STEPS[idx + 1]);
        } else if (idx < 0) {
            const nextStep = BET_STEPS.find(s => s > currentBet);
            if (nextStep) setBet(nextStep);
        }
    }

    function decreaseBet() {
        if (isFreeSpinMode) return;
        const idx = BET_STEPS.indexOf(currentBet);
        if (idx > 0) {
            setBet(BET_STEPS[idx - 1]);
        } else if (idx < 0) {
            const prevSteps = BET_STEPS.filter(s => s < currentBet);
            if (prevSteps.length > 0) setBet(prevSteps[prevSteps.length - 1]);
        }
    }

    // ═══════════════════════════════════
    //  자동 스핀
    // ═══════════════════════════════════

    function toggleAutoSpin(limit) {
        if (isFreeSpinMode) return;

        if (autoSpin) {
            stopAutoSpin();
            return;
        }

        autoSpin = true;
        autoSpinCount = 0;
        autoSpinLimit = limit || -1;

        const btn = document.getElementById('autoSpinBtn');
        if (btn) {
            btn.classList.add('active');
            const labelEl = btn.querySelector('.cab-btn-label');
            if (labelEl) {
                labelEl.textContent = autoSpinLimit === -1 ? 'STOP' : `${autoSpinLimit - autoSpinCount}`;
            }
        }

        if (typeof SoundManager !== 'undefined') SoundManager.playClick();

        if (!isSpinning) spin();
    }

    function stopAutoSpin() {
        autoSpin = false;
        autoSpinCount = 0;
        const btn = document.getElementById('autoSpinBtn');
        if (btn) {
            btn.classList.remove('active');
            const labelEl = btn.querySelector('.cab-btn-label');
            if (labelEl) labelEl.textContent = 'AUTO';
        }
    }

    // ═══════════════════════════════════
    //  통계 저장
    // ═══════════════════════════════════

    function _saveStats() {
        try {
            localStorage.setItem('slot_stats', JSON.stringify(stats));
        } catch (e) { }
    }

    // ═══════════════════════════════════
    //  Getters
    // ═══════════════════════════════════

    function getBet() { return currentBet; }
    function getIsSpinning() { return isSpinning; }
    function getIsFreeSpinMode() { return isFreeSpinMode; }

    // ═══════════════════════════════════
    //  Public API
    // ═══════════════════════════════════

    return {
        init,
        spin,
        setBet,
        increaseBet,
        decreaseBet,
        toggleAutoSpin,
        stopAutoSpin,
        gambleDouble,
        gambleCollect,
        getBet,
        getIsSpinning,
        getIsFreeSpinMode,
        SYMBOLS,
        PAYLINES,
        LINE_COLORS,
        MIN_BET,
        MAX_BET,
        AUTO_SPIN_OPTIONS,
    };
})();
