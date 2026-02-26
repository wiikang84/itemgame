/* ============================================
   바카라 v1.0 - Baccarat Game Module
   피망/한게임 스타일 바카라
   8덱, 플레이어 vs 뱅커 + 타이 + 페어 사이드벳
   ============================================ */

const BaccaratGame = (() => {
    'use strict';

    // === 설정 ===
    const NUM_DECKS = 8;
    const CARD_VALUES = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 0, 'J': 0, 'Q': 0, 'K': 0 };
    const SUITS = ['♠', '♥', '♦', '♣'];
    const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    // === 상태 ===
    let shoe = [];
    let playerCards = [];
    let bankerCards = [];
    let selectedBet = null;   // 'player' | 'banker' | 'tie'
    let betAmount = 0;
    let selectedChip = 100;
    let ppPairEnabled = false; // Player Pair
    let bpPairEnabled = false; // Banker Pair
    let ppPairBet = 0;
    let bpPairBet = 0;
    let isDealing = false;
    let lastBet = null;
    let lastBetAmount = 0;
    let roadmap = []; // { winner: 'P'|'B'|'T' }
    let stats = { total: 0, playerWins: 0, bankerWins: 0, ties: 0 };

    // === 초기화 ===
    function init() {
        _createShoe();
        _loadStats();
        _updateUI();
        _renderRoadmap();
    }

    // === 슈 생성 (8덱) ===
    function _createShoe() {
        shoe = [];
        for (let d = 0; d < NUM_DECKS; d++) {
            for (const suit of SUITS) {
                for (const rank of RANKS) {
                    shoe.push({ rank, suit, value: CARD_VALUES[rank] });
                }
            }
        }
        // Fisher-Yates 셔플
        for (let i = shoe.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
        }
    }

    function _drawCard() {
        if (shoe.length < 6) _createShoe();
        return shoe.pop();
    }

    // === 점수 계산 ===
    function _calcScore(cards) {
        let total = 0;
        for (const c of cards) total += c.value;
        return total % 10;
    }

    // === 3번째 카드 드로 규칙 ===
    function _shouldPlayerDraw(playerScore) {
        return playerScore <= 5;
    }

    function _shouldBankerDraw(bankerScore, playerThirdCard) {
        if (playerThirdCard === null) {
            // 플레이어 스탠드 → 뱅커는 5 이하이면 드로
            return bankerScore <= 5;
        }
        const p3 = playerThirdCard.value;
        if (bankerScore <= 2) return true;
        if (bankerScore === 3) return p3 !== 8;
        if (bankerScore === 4) return p3 >= 2 && p3 <= 7;
        if (bankerScore === 5) return p3 >= 4 && p3 <= 7;
        if (bankerScore === 6) return p3 === 6 || p3 === 7;
        return false; // 7+ 스탠드
    }

    // === 베팅 ===
    function placeBet(type) {
        if (isDealing) return;
        if (type === selectedBet) {
            // 같은 곳 다시 클릭 → 추가 베팅
            if (ChipManager.getBalance() < selectedChip) {
                _showToast('칩이 부족합니다.', 'error');
                return;
            }
            betAmount += selectedChip;
            ChipManager.deductChips(selectedChip);
        } else {
            // 다른 곳 클릭 → 기존 베팅 환불 후 이동
            if (selectedBet && betAmount > 0) {
                ChipManager.addChips(betAmount);
            }
            if (ChipManager.getBalance() < selectedChip) {
                _showToast('칩이 부족합니다.', 'error');
                return;
            }
            selectedBet = type;
            betAmount = selectedChip;
            ChipManager.deductChips(selectedChip);
        }
        if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();
        _updateUI();
    }

    function selectChip(value) {
        selectedChip = value;
        _updateUI();
    }

    function togglePairBet(type) {
        if (isDealing) return;
        if (type === 'pp') {
            if (ppPairEnabled) {
                ChipManager.addChips(ppPairBet);
                ppPairBet = 0;
                ppPairEnabled = false;
            } else {
                const bet = Math.min(selectedChip, ChipManager.getBalance());
                if (bet <= 0) { _showToast('칩이 부족합니다.', 'error'); return; }
                ppPairBet = bet;
                ppPairEnabled = true;
                ChipManager.deductChips(bet);
            }
        } else {
            if (bpPairEnabled) {
                ChipManager.addChips(bpPairBet);
                bpPairBet = 0;
                bpPairEnabled = false;
            } else {
                const bet = Math.min(selectedChip, ChipManager.getBalance());
                if (bet <= 0) { _showToast('칩이 부족합니다.', 'error'); return; }
                bpPairBet = bet;
                bpPairEnabled = true;
                ChipManager.deductChips(bet);
            }
        }
        _updateUI();
    }

    // === 딜 ===
    async function deal() {
        if (isDealing) return;
        if (!selectedBet || betAmount <= 0) {
            _showToast('베팅을 먼저 해주세요.', 'error');
            return;
        }

        isDealing = true;
        lastBet = selectedBet;
        lastBetAmount = betAmount;

        // UI 초기화
        playerCards = [];
        bankerCards = [];
        document.getElementById('bacResult').textContent = '';
        document.getElementById('bacResult').className = 'bac-result';
        _renderCards();
        _updateUI();

        const table = document.querySelector('.bac-table');
        table.className = 'bac-table';

        // 카드 딜 (교대로)
        await _delay(300);

        // 1장: 플레이어
        playerCards.push(_drawCard());
        _renderCards();
        _playDealSound();
        await _delay(400);

        // 2장: 뱅커
        bankerCards.push(_drawCard());
        _renderCards();
        _playDealSound();
        await _delay(400);

        // 3장: 플레이어
        playerCards.push(_drawCard());
        _renderCards();
        _playDealSound();
        await _delay(400);

        // 4장: 뱅커
        bankerCards.push(_drawCard());
        _renderCards();
        _playDealSound();
        await _delay(500);

        const pScore = _calcScore(playerCards);
        const bScore = _calcScore(bankerCards);

        _updateScores();

        // 내추럴 체크 (8 또는 9)
        if (pScore >= 8 || bScore >= 8) {
            await _delay(600);
            _resolveGame();
            return;
        }

        // 플레이어 3장째
        let playerThirdCard = null;
        if (_shouldPlayerDraw(pScore)) {
            await _delay(600);
            playerThirdCard = _drawCard();
            playerCards.push(playerThirdCard);
            _renderCards();
            _playDealSound();
            await _delay(500);
            _updateScores();
        }

        // 뱅커 3장째
        if (_shouldBankerDraw(bScore, playerThirdCard)) {
            await _delay(600);
            bankerCards.push(_drawCard());
            _renderCards();
            _playDealSound();
            await _delay(500);
            _updateScores();
        }

        await _delay(600);
        _resolveGame();
    }

    // === 결과 판정 ===
    function _resolveGame() {
        const pScore = _calcScore(playerCards);
        const bScore = _calcScore(bankerCards);
        let winner = '';
        let resultText = '';
        let totalWin = 0;

        if (pScore > bScore) {
            winner = 'P';
            resultText = `플레이어 승! (${pScore} vs ${bScore})`;
        } else if (bScore > pScore) {
            winner = 'B';
            resultText = `뱅커 승! (${bScore} vs ${pScore})`;
        } else {
            winner = 'T';
            resultText = `타이! (${pScore} vs ${bScore})`;
        }

        // 메인 베팅 정산
        if (selectedBet === 'player' && winner === 'P') {
            totalWin += betAmount * 2; // 1:1
        } else if (selectedBet === 'banker' && winner === 'B') {
            totalWin += betAmount * 1.95; // 0.95:1 (5% 커미션)
        } else if (selectedBet === 'tie' && winner === 'T') {
            totalWin += betAmount * 9; // 8:1
        } else if (selectedBet === 'tie' && winner !== 'T') {
            // 타이 베팅 패배 → 이미 차감됨
        } else {
            // 일반 베팅 패배
        }

        // 타이일 때 플레이어/뱅커 베팅은 환불
        if (winner === 'T' && selectedBet !== 'tie') {
            totalWin += betAmount; // 원금 환불
        }

        // 페어 사이드벳 정산
        let ppWin = false, bpWin = false;
        if (ppPairEnabled && playerCards.length >= 2) {
            if (playerCards[0].rank === playerCards[1].rank) {
                totalWin += ppPairBet * 12; // 11:1
                ppWin = true;
            }
        }
        if (bpPairEnabled && bankerCards.length >= 2) {
            if (bankerCards[0].rank === bankerCards[1].rank) {
                totalWin += bpPairBet * 12; // 11:1
                bpWin = true;
            }
        }

        // 칩 지급
        totalWin = Math.floor(totalWin);
        if (totalWin > 0) {
            ChipManager.addChips(totalWin);
        }

        // XP
        if (typeof LevelManager !== 'undefined') {
            LevelManager.addXP(betAmount + ppPairBet + bpPairBet);
        }

        // 결과 표시
        const resultEl = document.getElementById('bacResult');
        const table = document.querySelector('.bac-table');

        if ((selectedBet === 'player' && winner === 'P') ||
            (selectedBet === 'banker' && winner === 'B') ||
            (selectedBet === 'tie' && winner === 'T')) {
            const profit = totalWin - betAmount - (ppPairEnabled ? ppPairBet : 0) - (bpPairEnabled ? bpPairBet : 0);
            resultText += ` +${profit.toLocaleString()}`;
            resultEl.className = `bac-result ${winner === 'P' ? 'player-win' : winner === 'B' ? 'banker-win' : 'tie-win'}`;
            table.className = `bac-table ${winner === 'P' ? 'player-glow' : winner === 'B' ? 'banker-glow' : 'tie-glow'}`;
            if (typeof SoundManager !== 'undefined') SoundManager.playWin();
            if (typeof CoinShower !== 'undefined') {
                CoinShower.start(winner === 'T' ? 3000 : 1500, totalWin > betAmount * 5 ? 'big' : 'normal');
            }
        } else if (winner === 'T' && selectedBet !== 'tie') {
            resultText += ' (베팅 환불)';
            resultEl.className = 'bac-result tie-win';
        } else {
            resultEl.className = 'bac-result ' + (winner === 'P' ? 'player-win' : winner === 'B' ? 'banker-win' : 'tie-win');
            if (typeof SoundManager !== 'undefined') SoundManager.playLose();
        }

        resultEl.textContent = resultText;

        // 페어 결과
        if (ppWin) _showToast(`플레이어 페어! +${(ppPairBet * 11).toLocaleString()}`, 'success');
        if (bpWin) _showToast(`뱅커 페어! +${(bpPairBet * 11).toLocaleString()}`, 'success');

        // 로드맵 업데이트
        roadmap.push({ winner });
        if (roadmap.length > 120) roadmap = roadmap.slice(-120);
        _renderRoadmap();

        // 통계
        stats.total++;
        if (winner === 'P') stats.playerWins++;
        else if (winner === 'B') stats.bankerWins++;
        else stats.ties++;
        _saveStats();
        _updateStats();

        // 리셋
        selectedBet = null;
        betAmount = 0;
        ppPairEnabled = false;
        bpPairEnabled = false;
        ppPairBet = 0;
        bpPairBet = 0;
        isDealing = false;
        _updateUI();
    }

    // === 리벳 ===
    function rebet() {
        if (isDealing || !lastBet || lastBetAmount <= 0) return;
        if (ChipManager.getBalance() < lastBetAmount) {
            _showToast('칩이 부족합니다.', 'error');
            return;
        }
        selectedBet = lastBet;
        betAmount = lastBetAmount;
        ChipManager.deductChips(lastBetAmount);
        _updateUI();
    }

    // === UI 업데이트 ===
    function _updateUI() {
        // 칩 선택 하이라이트
        document.querySelectorAll('.bac-chip-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.value) === selectedChip);
        });

        // 베팅 버튼 상태
        document.querySelectorAll('.bac-bet-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.bet === selectedBet);
            btn.disabled = isDealing;
        });

        // 베팅 금액 표시
        const amounts = { player: 0, tie: 0, banker: 0 };
        if (selectedBet) amounts[selectedBet] = betAmount;
        document.getElementById('playerBetAmount').textContent = amounts.player > 0 ? amounts.player.toLocaleString() : '';
        document.getElementById('tieBetAmount').textContent = amounts.tie > 0 ? amounts.tie.toLocaleString() : '';
        document.getElementById('bankerBetAmount').textContent = amounts.banker > 0 ? amounts.banker.toLocaleString() : '';

        // 사이드 베팅
        const ppToggle = document.getElementById('ppPairToggle');
        const bpToggle = document.getElementById('bpPairToggle');
        if (ppToggle) ppToggle.classList.toggle('active', ppPairEnabled);
        if (bpToggle) bpToggle.classList.toggle('active', bpPairEnabled);

        // DEAL 버튼
        const dealBtn = document.getElementById('bacDealBtn');
        if (dealBtn) dealBtn.disabled = isDealing || !selectedBet || betAmount <= 0;

        // REBET 버튼
        const rebetBtn = document.getElementById('bacRebetBtn');
        if (rebetBtn) rebetBtn.disabled = isDealing || !lastBet;
    }

    function _updateScores() {
        const pScore = _calcScore(playerCards);
        const bScore = _calcScore(bankerCards);
        const pEl = document.getElementById('playerScore');
        const bEl = document.getElementById('bankerScore');
        if (pEl) {
            pEl.textContent = pScore;
            if (pScore >= 8) pEl.classList.add('natural');
        }
        if (bEl) {
            bEl.textContent = bScore;
            if (bScore >= 8) bEl.classList.add('natural');
        }
    }

    // === 카드 렌더링 ===
    function _renderCards() {
        _renderHand('playerCards', playerCards);
        _renderHand('bankerCards', bankerCards);
    }

    function _renderHand(containerId, cards) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        cards.forEach((card, idx) => {
            const el = document.createElement('div');
            const isRed = card.suit === '♥' || card.suit === '♦';
            const isThird = idx === 2;
            el.className = `bac-card face-up ${isRed ? 'red' : 'black'}${isThird ? ' third-card' : ''}`;
            el.innerHTML = `
                <span class="card-rank">${card.rank}</span>
                <span class="card-suit">${card.suit}</span>
            `;
            container.appendChild(el);
        });
    }

    // === 로드맵 렌더링 ===
    function _renderRoadmap() {
        const grid = document.getElementById('roadmapGrid');
        if (!grid) return;
        grid.innerHTML = '';

        // 빅로드: 최근 120개를 6행 x 20열에 배치
        // 간단한 구현: 최근 결과를 왼→오 순서로 표시
        const recent = roadmap.slice(-120);
        recent.forEach(r => {
            const cell = document.createElement('div');
            cell.className = `roadmap-cell ${r.winner === 'P' ? 'player-cell' : r.winner === 'B' ? 'banker-cell' : 'tie-cell'}`;
            cell.textContent = r.winner;
            grid.appendChild(cell);
        });

        // 통계
        const pCount = roadmap.filter(r => r.winner === 'P').length;
        const bCount = roadmap.filter(r => r.winner === 'B').length;
        const tCount = roadmap.filter(r => r.winner === 'T').length;

        const pCountEl = document.getElementById('roadmapPlayerCount');
        const bCountEl = document.getElementById('roadmapBankerCount');
        const tCountEl = document.getElementById('roadmapTieCount');
        if (pCountEl) pCountEl.textContent = pCount;
        if (bCountEl) bCountEl.textContent = bCount;
        if (tCountEl) tCountEl.textContent = tCount;
    }

    // === 통계 ===
    function _updateStats() {
        const el = (id) => document.getElementById(id);
        if (el('statTotal')) el('statTotal').textContent = stats.total;
        if (el('statPlayerWins')) el('statPlayerWins').textContent = stats.playerWins;
        if (el('statBankerWins')) el('statBankerWins').textContent = stats.bankerWins;
        if (el('statTies')) el('statTies').textContent = stats.ties;
    }

    function _saveStats() {
        try {
            localStorage.setItem('baccarat_stats', JSON.stringify(stats));
            localStorage.setItem('baccarat_roadmap', JSON.stringify(roadmap));
        } catch (e) { /* ignore */ }
    }

    function _loadStats() {
        try {
            const s = localStorage.getItem('baccarat_stats');
            if (s) stats = JSON.parse(s);
            const r = localStorage.getItem('baccarat_roadmap');
            if (r) roadmap = JSON.parse(r);
        } catch (e) { /* ignore */ }
        _updateStats();
    }

    // === 유틸 ===
    function _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function _playDealSound() {
        if (typeof SoundManager !== 'undefined') {
            try { SoundManager.playCardDeal(); } catch (e) {
                try { SoundManager.playChipPlace(); } catch (e2) { /* ignore */ }
            }
        }
    }

    function _showToast(msg, type) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type ? 'toast-' + type : ''}`;
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // === Public API ===
    return {
        init,
        placeBet,
        selectChip,
        togglePairBet,
        deal,
        rebet
    };
})();
