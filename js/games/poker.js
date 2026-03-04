/* ============================================
   세븐포커 v1.0 - Seven Poker Game Module
   한국식 7-Card Stud (AI 3명 대전)
   1덱 52장, 플레이어 vs AI 3명
   ============================================ */

const PokerGame = (() => {
    'use strict';

    // === 설정 ===
    const SUITS = ['♠', '♥', '♦', '♣'];
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    const HAND_NAMES = ['하이 카드', '원 페어', '투 페어', '트리플', '스트레이트', '플러시', '풀 하우스', '포카드', '스트레이트 플러시', '로열 플러시'];
    const ANTE = 50;
    const BET_AMOUNTS = [50, 100, 200, 500];

    // AI 플레이어 설정
    const AI_CONFIG = [
        { name: '미나', style: 'tight', avatar: '👩', color: '#ff6b9d' },
        { name: '재훈', style: 'balanced', avatar: '🧑', color: '#4ecdc4' },
        { name: '소영', style: 'aggressive', avatar: '👧', color: '#ffe66d' }
    ];

    // === 상태 ===
    let deck = [];
    let players = [];     // [{ name, avatar, color, cards[], faceUp[], stack, bet, folded, isHuman, style }]
    let pot = 0;
    let currentBet = 0;   // 현재 라운드 최대 베팅
    let bettingPlayerIdx = 0;
    let dealRound = 0;    // 0~4 (딜링 라운드)
    let gamePhase = 'waiting'; // waiting, dealing, betting, ai-turn, showdown
    let raiseCount = 0;   // 라운드당 레이즈 횟수
    let actedThisRound = new Set();
    let lastRaiserIdx = -1;
    let stats = { played: 0, won: 0, bestHand: '' };
    let selectedRaise = BET_AMOUNTS[0];

    // === 초기화 ===
    function init() {
        _loadStats();
        _renderTable();
        _updateUI();
    }

    // === 덱 관리 ===
    function _createDeck() {
        deck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({ rank, suit, value: RANK_VALUES[rank] });
            }
        }
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function _drawCard() {
        return deck.pop();
    }

    // === 핸드 평가 ===
    function _evaluateHand(fiveCards) {
        const sorted = [...fiveCards].sort((a, b) => b.value - a.value);
        const values = sorted.map(c => c.value);
        const suits = sorted.map(c => c.suit);
        const isFlush = suits.every(s => s === suits[0]);

        // 스트레이트 체크
        let isStraight = false;
        let straightHigh = values[0];
        if (new Set(values).size === 5) {
            if (values[0] - values[4] === 4) {
                isStraight = true;
            }
            // A-2-3-4-5 (휠)
            if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
                isStraight = true;
                straightHigh = 5;
            }
        }

        // 카운트
        const counts = {};
        for (const v of values) counts[v] = (counts[v] || 0) + 1;
        const groups = Object.entries(counts)
            .map(([v, c]) => ({ value: parseInt(v), count: c }))
            .sort((a, b) => b.count - a.count || b.value - a.value);

        // 핸드 판정
        if (isFlush && isStraight) {
            if (straightHigh === 14) return { rank: 9, name: HAND_NAMES[9], score: [9, 14] };
            return { rank: 8, name: HAND_NAMES[8], score: [8, straightHigh] };
        }
        if (groups[0].count === 4) {
            return { rank: 7, name: HAND_NAMES[7], score: [7, groups[0].value, groups[1].value] };
        }
        if (groups[0].count === 3 && groups[1].count === 2) {
            return { rank: 6, name: HAND_NAMES[6], score: [6, groups[0].value, groups[1].value] };
        }
        if (isFlush) {
            return { rank: 5, name: HAND_NAMES[5], score: [5, ...values] };
        }
        if (isStraight) {
            return { rank: 4, name: HAND_NAMES[4], score: [4, straightHigh] };
        }
        if (groups[0].count === 3) {
            const kickers = groups.slice(1).map(g => g.value).sort((a, b) => b - a);
            return { rank: 3, name: HAND_NAMES[3], score: [3, groups[0].value, ...kickers] };
        }
        if (groups[0].count === 2 && groups[1].count === 2) {
            const pairHigh = Math.max(groups[0].value, groups[1].value);
            const pairLow = Math.min(groups[0].value, groups[1].value);
            const kicker = groups[2].value;
            return { rank: 2, name: HAND_NAMES[2], score: [2, pairHigh, pairLow, kicker] };
        }
        if (groups[0].count === 2) {
            const kickers = groups.slice(1).map(g => g.value).sort((a, b) => b - a);
            return { rank: 1, name: HAND_NAMES[1], score: [1, groups[0].value, ...kickers] };
        }
        return { rank: 0, name: HAND_NAMES[0], score: [0, ...values] };
    }

    // 7장 중 최고 5장 조합 찾기
    function _findBest5(sevenCards) {
        let best = null;
        // C(7,5) = 21 조합 (2장씩 제외)
        for (let i = 0; i < 7; i++) {
            for (let j = i + 1; j < 7; j++) {
                const five = sevenCards.filter((_, idx) => idx !== i && idx !== j);
                const result = _evaluateHand(five);
                if (!best || _compareScores(result.score, best.score) > 0) {
                    best = result;
                    best.cards = five;
                }
            }
        }
        return best;
    }

    // 현재까지 받은 카드로 잠정 핸드 평가 (2~7장)
    function _evaluateCurrent(cards) {
        if (cards.length < 5) {
            // 5장 미만이면 실제 카드만으로 간이 평가
            return _evaluatePartial(cards);
        }
        if (cards.length === 5) return _evaluateHand(cards);
        if (cards.length === 6) {
            let best = null;
            for (let i = 0; i < 6; i++) {
                const five = cards.filter((_, idx) => idx !== i);
                const result = _evaluateHand(five);
                if (!best || _compareScores(result.score, best.score) > 0) best = result;
            }
            return best;
        }
        return _findBest5(cards);
    }

    // 5장 미만 간이 핸드 평가
    function _evaluatePartial(cards) {
        if (cards.length < 2) return { rank: 0, name: HAND_NAMES[0], score: [0] };

        const counts = {};
        for (const c of cards) counts[c.value] = (counts[c.value] || 0) + 1;
        const groups = Object.entries(counts)
            .map(([v, c]) => ({ value: parseInt(v), count: c }))
            .sort((a, b) => b.count - a.count || b.value - a.value);

        const allSameSuit = cards.every(c => c.suit === cards[0].suit);
        const values = cards.map(c => c.value).sort((a, b) => b - a);

        // 포카드 (4장일 때)
        if (groups[0].count === 4) return { rank: 7, name: HAND_NAMES[7], score: [7, groups[0].value] };
        // 트리플
        if (groups[0].count === 3) {
            if (groups.length > 1 && groups[1].count === 2) return { rank: 6, name: HAND_NAMES[6], score: [6, groups[0].value, groups[1].value] };
            return { rank: 3, name: HAND_NAMES[3], score: [3, groups[0].value] };
        }
        // 투 페어
        if (groups[0].count === 2 && groups.length > 1 && groups[1].count === 2) {
            return { rank: 2, name: HAND_NAMES[2], score: [2, Math.max(groups[0].value, groups[1].value)] };
        }
        // 원 페어
        if (groups[0].count === 2) return { rank: 1, name: HAND_NAMES[1], score: [1, groups[0].value] };

        // 플러시 가능성 (3장 이상 같은 문양)
        if (allSameSuit && cards.length >= 3) return { rank: 0, name: '플러시 드로', score: [0, ...values] };

        return { rank: 0, name: HAND_NAMES[0], score: [0, ...values] };
    }

    function _compareScores(a, b) {
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            const va = a[i] || 0;
            const vb = b[i] || 0;
            if (va !== vb) return va - vb;
        }
        return 0;
    }

    // === 게임 시작 ===
    function newGame() {
        if (gamePhase !== 'waiting' && gamePhase !== 'showdown') return;

        const balance = ChipManager.getBalance();
        if (balance < ANTE) {
            _showToast('앤티 칩이 부족합니다. (최소 ' + ANTE + ')', 'error');
            return;
        }

        _createDeck();
        pot = 0;
        currentBet = 0;
        dealRound = 0;
        raiseCount = 0;
        lastRaiserIdx = -1;
        actedThisRound.clear();

        // 플레이어 초기화
        players = [
            { name: '나', avatar: '😎', color: '#d4a843', cards: [], faceUp: [], stack: balance, bet: 0, folded: false, isHuman: true, style: 'human' }
        ];
        AI_CONFIG.forEach(ai => {
            players.push({ name: ai.name, avatar: ai.avatar, color: ai.color, cards: [], faceUp: [], stack: 5000, bet: 0, folded: false, isHuman: false, style: ai.style });
        });

        // 앤티
        players.forEach((p, i) => {
            p.bet = ANTE;
            p.stack -= ANTE;
            pot += ANTE;
            if (i === 0) ChipManager.deductChips(ANTE);
        });

        gamePhase = 'dealing';
        _renderTable();
        _updateUI();

        // 초기 딜: 2장 히든 + 1장 오픈
        _dealInitialCards();
    }

    async function _dealInitialCards() {
        // 카드 3장씩 딜 (2 face-down + 1 face-up)
        for (let round = 0; round < 3; round++) {
            for (let i = 0; i < players.length; i++) {
                if (players[i].folded) continue;
                const card = _drawCard();
                players[i].cards.push(card);
                players[i].faceUp.push(round === 2); // 3번째만 face-up
                _renderTable();
                _playDealSound();
                await _delay(200);
            }
        }
        dealRound = 0;
        await _delay(400);
        _startBettingRound();
    }

    // === 딜링 라운드 ===
    async function _dealNextCard() {
        dealRound++;
        if (dealRound > 4) {
            _startShowdown();
            return;
        }

        gamePhase = 'dealing';
        _updateUI();

        const isFaceDown = (dealRound === 4); // 7번째 카드만 히든
        for (let i = 0; i < players.length; i++) {
            if (players[i].folded) continue;
            const card = _drawCard();
            players[i].cards.push(card);
            players[i].faceUp.push(!isFaceDown);
            _renderTable();
            _playDealSound();
            await _delay(250);
        }

        await _delay(400);
        _startBettingRound();
    }

    // === 베팅 라운드 ===
    function _startBettingRound() {
        currentBet = 0;
        raiseCount = 0;
        lastRaiserIdx = -1;
        actedThisRound.clear();

        // 베팅 리셋
        players.forEach(p => { p.bet = 0; });

        // 가장 높은 오픈 카드를 가진 플레이어부터 시작
        bettingPlayerIdx = _findHighestVisibleHand();
        gamePhase = 'betting';
        _updateUI();
        _processCurrentPlayer();
    }

    function _findHighestVisibleHand() {
        let bestIdx = 0;
        let bestVal = -1;
        players.forEach((p, i) => {
            if (p.folded) return;
            const visibleCards = p.cards.filter((_, ci) => p.faceUp[ci]);
            if (visibleCards.length === 0) return;
            const highCard = Math.max(...visibleCards.map(c => c.value));
            if (highCard > bestVal) {
                bestVal = highCard;
                bestIdx = i;
            }
        });
        return bestIdx;
    }

    function _processCurrentPlayer() {
        const player = players[bettingPlayerIdx];

        if (player.folded) {
            _nextPlayer();
            return;
        }

        if (player.isHuman) {
            gamePhase = 'betting';
            _updateUI();
            // 사용자 입력 대기
        } else {
            gamePhase = 'ai-turn';
            _updateUI();
            setTimeout(() => _aiAction(bettingPlayerIdx), 800 + Math.random() * 600);
        }
    }

    function _nextPlayer() {
        const activePlayers = players.filter(p => !p.folded);
        if (activePlayers.length <= 1) {
            // 한 명만 남음 → 승리
            _declareWinner(activePlayers[0], false);
            return;
        }

        // 다음 플레이어
        let next = (bettingPlayerIdx + 1) % players.length;
        let loopCount = 0;
        while ((players[next].folded || actedThisRound.has(next)) && loopCount < players.length) {
            next = (next + 1) % players.length;
            loopCount++;
        }

        // 모든 활성 플레이어가 액션했는지 확인
        const allActed = activePlayers.every(p => {
            const idx = players.indexOf(p);
            return actedThisRound.has(idx);
        });

        // 모든 플레이어가 동일한 금액을 베팅했는지 확인
        const allEven = activePlayers.every(p => p.bet === currentBet);

        if (allActed && allEven) {
            // 베팅 라운드 종료 → 다음 카드 딜
            _dealNextCard();
            return;
        }

        // 레이즈 후 다시 돌아온 경우 체크
        if (next === lastRaiserIdx) {
            _dealNextCard();
            return;
        }

        bettingPlayerIdx = next;
        _processCurrentPlayer();
    }

    // === 플레이어 액션 ===
    function fold() {
        if (gamePhase !== 'betting' || !players[0].isHuman) return;
        _doAction(0, 'fold', 0);
    }

    function check() {
        if (gamePhase !== 'betting' || !players[0].isHuman) return;
        if (currentBet > players[0].bet) {
            _showToast('체크할 수 없습니다. 콜 또는 폴드하세요.', 'error');
            return;
        }
        _doAction(0, 'check', 0);
    }

    function call() {
        if (gamePhase !== 'betting' || !players[0].isHuman) return;
        const callAmount = currentBet - players[0].bet;
        if (callAmount <= 0) {
            check();
            return;
        }
        if (ChipManager.getBalance() < callAmount) {
            _showToast('칩이 부족합니다.', 'error');
            return;
        }
        _doAction(0, 'call', callAmount);
    }

    function raise() {
        if (gamePhase !== 'betting' || !players[0].isHuman) return;
        if (raiseCount >= 3) {
            _showToast('더 이상 레이즈할 수 없습니다.', 'error');
            return;
        }
        const callAmount = currentBet - players[0].bet;
        const totalNeeded = callAmount + selectedRaise;
        if (ChipManager.getBalance() < totalNeeded) {
            _showToast('칩이 부족합니다.', 'error');
            return;
        }
        _doAction(0, 'raise', totalNeeded);
    }

    function selectRaise(amount) {
        selectedRaise = amount;
        _updateUI();
    }

    function _doAction(playerIdx, action, amount) {
        const player = players[playerIdx];

        if (action === 'fold') {
            player.folded = true;
            _showPlayerAction(playerIdx, '폴드');
            if (typeof SoundManager !== 'undefined') SoundManager.playClick();
        } else if (action === 'check') {
            _showPlayerAction(playerIdx, '체크');
            if (typeof SoundManager !== 'undefined') SoundManager.playClick();
        } else if (action === 'call') {
            player.stack -= amount;
            player.bet += amount;
            pot += amount;
            if (player.isHuman) ChipManager.deductChips(amount);
            _showPlayerAction(playerIdx, '콜 ' + amount);
            if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();
        } else if (action === 'raise') {
            player.stack -= amount;
            player.bet += amount;
            pot += amount;
            currentBet = player.bet;
            raiseCount++;
            lastRaiserIdx = playerIdx;
            actedThisRound.clear(); // 레이즈 시 모든 액션 초기화
            actedThisRound.add(playerIdx);
            if (player.isHuman) ChipManager.deductChips(amount);
            _showPlayerAction(playerIdx, '레이즈 ' + amount);
            if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();
        }

        actedThisRound.add(playerIdx);
        _renderTable();
        _updateUI();

        setTimeout(() => _nextPlayer(), 500);
    }

    // === AI 결정 ===
    function _aiAction(playerIdx) {
        const player = players[playerIdx];
        const handResult = _evaluateCurrent(player.cards);
        const handRank = handResult.rank;
        const callAmount = currentBet - player.bet;
        const style = player.style;

        // 핸드 강도 + 스타일별 결정
        let action = 'check';
        let amount = 0;

        // 폴드 임계값 (aggressive도 약한 패에서 간혹 폴드)
        // const foldThreshold = style === 'tight' ? 1 : style === 'balanced' ? 0.5 : 0;
        const foldThreshold = style === 'tight' ? 1 : style === 'balanced' ? 0.5 : 0.3;
        // 레이즈 임계값
        // const raiseThreshold = style === 'tight' ? 3 : style === 'balanced' ? 2 : 1;
        const raiseThreshold = style === 'tight' ? 3 : style === 'balanced' ? 2 : 1.5;

        // 베팅할 금액이 있는 경우
        if (callAmount > 0) {
            // 약한 핸드면 폴드 고려
            if (handRank < foldThreshold && Math.random() < 0.6) {
                action = 'fold';
            } else if (handRank >= raiseThreshold && raiseCount < 3 && Math.random() < 0.5) {
                // 강한 핸드면 레이즈
                const raiseAmt = BET_AMOUNTS[Math.min(handRank, BET_AMOUNTS.length - 1)];
                action = 'raise';
                amount = callAmount + raiseAmt;
            } else {
                action = 'call';
                amount = callAmount;
            }
        } else {
            // 체크 가능한 상황
            if (handRank >= raiseThreshold && raiseCount < 3 && Math.random() < 0.4) {
                const raiseAmt = BET_AMOUNTS[Math.min(handRank - 1, BET_AMOUNTS.length - 1)];
                action = 'raise';
                amount = raiseAmt;
            } else {
                action = 'check';
            }
        }

        // 어그레시브 AI 추가 블러프 (25% → 15%로 하향)
        // if (style === 'aggressive' && action === 'check' && Math.random() < 0.25 && raiseCount < 3) {
        if (style === 'aggressive' && action === 'check' && Math.random() < 0.15 && raiseCount < 3) {
            action = 'raise';
            amount = BET_AMOUNTS[0];
        }

        // 스택 체크
        if ((action === 'call' || action === 'raise') && player.stack < amount) {
            if (player.stack >= callAmount && callAmount > 0) {
                action = 'call';
                amount = Math.min(callAmount, player.stack);
            } else {
                action = callAmount > 0 ? 'fold' : 'check';
                amount = 0;
            }
        }

        _doAction(playerIdx, action, amount);
    }

    // === 쇼다운 ===
    function _startShowdown() {
        gamePhase = 'showdown';

        const activePlayers = players.filter(p => !p.folded);
        if (activePlayers.length === 1) {
            _declareWinner(activePlayers[0], false);
            return;
        }

        // 모든 카드 공개
        players.forEach(p => {
            if (!p.folded) {
                p.faceUp = p.cards.map(() => true);
            }
        });
        _renderTable();

        // 핸드 평가
        let bestPlayer = null;
        let bestResult = null;

        activePlayers.forEach(p => {
            const result = p.cards.length >= 5 ? _findBest5(p.cards) : _evaluateCurrent(p.cards);
            p.handResult = result;
            if (!bestResult || _compareScores(result.score, bestResult.score) > 0) {
                bestResult = result;
                bestPlayer = p;
            }
        });

        setTimeout(() => _declareWinner(bestPlayer, true), 1000);
    }

    function _declareWinner(winner, showHand) {
        gamePhase = 'showdown';

        // 팟 지급
        const winAmount = pot;
        winner.stack += winAmount;
        if (winner.isHuman) {
            ChipManager.addChips(winAmount);
        }

        // 핸드 결과 표시
        const handName = showHand && winner.handResult ? winner.handResult.name : '';
        const resultEl = document.getElementById('pokerResult');
        if (resultEl) {
            const isWin = winner.isHuman;
            resultEl.className = `poker-result ${isWin ? 'win' : 'lose'}`;
            if (isWin) {
                const profit = winAmount - ANTE; // 실제 이득 계산용
                resultEl.textContent = `승리! ${handName} +${winAmount.toLocaleString()}`;
                if (typeof SoundManager !== 'undefined') SoundManager.playWin();
                if (typeof CoinShower !== 'undefined') CoinShower.start(2000, winAmount > 1000 ? 'big' : 'normal');
            } else {
                resultEl.textContent = `${winner.name} 승리! ${handName}`;
                if (typeof SoundManager !== 'undefined') SoundManager.playLose();
            }
        }

        // 통계 업데이트
        stats.played++;
        if (winner.isHuman) {
            stats.won++;
            if (showHand && winner.handResult) {
                if (!stats.bestHand || HAND_NAMES.indexOf(winner.handResult.name) > HAND_NAMES.indexOf(stats.bestHand)) {
                    stats.bestHand = winner.handResult.name;
                }
            }
        }
        _saveStats();

        // XP
        if (typeof LevelManager !== 'undefined') {
            LevelManager.addXP(ANTE);
        }

        pot = 0;
        _renderTable();
        _updateUI();
    }

    // === 렌더링 ===
    function _renderTable() {
        const positions = ['bottom', 'left', 'top', 'right'];
        players.forEach((p, i) => {
            const pos = positions[i];
            const seat = document.getElementById(`seat-${pos}`);
            if (!seat) return;

            // 아바타 + 이름
            const nameEl = seat.querySelector('.seat-name');
            const avatarEl = seat.querySelector('.seat-avatar');
            const stackEl = seat.querySelector('.seat-stack');
            const betEl = seat.querySelector('.seat-bet');
            const cardsEl = seat.querySelector('.seat-cards');
            const actionEl = seat.querySelector('.seat-action');

            if (nameEl) nameEl.textContent = p.name;
            if (avatarEl) {
                avatarEl.textContent = p.avatar;
                avatarEl.style.borderColor = p.color;
            }
            if (stackEl) stackEl.textContent = p.isHuman ? ChipManager.formatBalance() : p.stack.toLocaleString();
            if (betEl) betEl.textContent = p.bet > 0 ? p.bet.toLocaleString() : '';

            // 카드 렌더링
            if (cardsEl) {
                cardsEl.innerHTML = '';
                p.cards.forEach((card, ci) => {
                    const cardEl = document.createElement('div');
                    const isVisible = p.faceUp[ci] || (p.isHuman && gamePhase !== 'waiting');
                    if (isVisible) {
                        const isRed = card.suit === '♥' || card.suit === '♦';
                        cardEl.className = `poker-card face-up ${isRed ? 'red' : 'black'}`;
                        cardEl.innerHTML = `<span class="pc-rank">${card.rank}</span><span class="pc-suit">${card.suit}</span>`;
                    } else {
                        cardEl.className = 'poker-card face-down';
                    }
                    cardsEl.appendChild(cardEl);
                });
            }

            // 폴드 상태
            seat.classList.toggle('folded', p.folded);
            // 현재 턴 하이라이트
            seat.classList.toggle('active-turn', bettingPlayerIdx === i && (gamePhase === 'betting' || gamePhase === 'ai-turn'));
        });

        // 팟 표시
        const potEl = document.getElementById('potAmount');
        if (potEl) potEl.textContent = pot.toLocaleString();

        // 내 핸드 표시
        if (players.length > 0 && players[0].cards.length >= 2 && !players[0].folded) {
            const myHand = _evaluateCurrent(players[0].cards);
            const handEl = document.getElementById('myHandName');
            if (handEl) handEl.textContent = myHand.name;
        } else {
            const handEl = document.getElementById('myHandName');
            if (handEl) handEl.textContent = '-';
        }
    }

    function _updateUI() {
        // 액션 버튼 상태
        const isMyTurn = gamePhase === 'betting' && bettingPlayerIdx === 0 && !players[0]?.folded;
        const callAmount = currentBet - (players[0]?.bet || 0);

        const foldBtn = document.getElementById('pokerFoldBtn');
        const checkBtn = document.getElementById('pokerCheckBtn');
        const callBtn = document.getElementById('pokerCallBtn');
        const raiseBtn = document.getElementById('pokerRaiseBtn');
        const newGameBtn = document.getElementById('pokerNewGameBtn');
        const raiseBtns = document.getElementById('raiseAmountBtns');

        if (foldBtn) foldBtn.disabled = !isMyTurn;
        if (checkBtn) {
            checkBtn.disabled = !isMyTurn || callAmount > 0;
            checkBtn.style.display = callAmount > 0 ? 'none' : '';
        }
        if (callBtn) {
            callBtn.disabled = !isMyTurn || callAmount <= 0;
            callBtn.style.display = callAmount <= 0 ? 'none' : '';
            callBtn.textContent = `콜 (${callAmount})`;
        }
        if (raiseBtn) {
            raiseBtn.disabled = !isMyTurn || raiseCount >= 3;
            raiseBtn.textContent = `레이즈 (+${selectedRaise})`;
        }
        if (newGameBtn) {
            newGameBtn.disabled = gamePhase !== 'waiting' && gamePhase !== 'showdown';
        }
        if (raiseBtns) {
            raiseBtns.querySelectorAll('.raise-chip').forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.value) === selectedRaise);
            });
        }

        // 통계 업데이트
        const statPlayed = document.getElementById('statPlayed');
        const statWon = document.getElementById('statWon');
        const statWinRate = document.getElementById('statWinRate');
        const statBestHand = document.getElementById('statBestHand');
        if (statPlayed) statPlayed.textContent = stats.played;
        if (statWon) statWon.textContent = stats.won;
        if (statWinRate) statWinRate.textContent = stats.played > 0 ? Math.round(stats.won / stats.played * 100) + '%' : '-';
        if (statBestHand) statBestHand.textContent = stats.bestHand || '-';

        // 헤더 칩 동기화
        const headerChips = document.getElementById('headerChips');
        if (headerChips) headerChips.textContent = ChipManager.formatBalance();
    }

    function _showPlayerAction(playerIdx, text) {
        const positions = ['bottom', 'left', 'top', 'right'];
        const seat = document.getElementById(`seat-${positions[playerIdx]}`);
        if (!seat) return;
        const actionEl = seat.querySelector('.seat-action');
        if (!actionEl) return;
        actionEl.textContent = text;
        actionEl.classList.add('show');
        setTimeout(() => actionEl.classList.remove('show'), 1500);
    }

    // === 유틸 ===
    function _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function _playDealSound() {
        if (typeof SoundManager !== 'undefined') {
            try { SoundManager.playCardDeal(); } catch (e) { /* ignore */ }
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

    function _saveStats() {
        try { localStorage.setItem('poker_stats', JSON.stringify(stats)); } catch (e) { /* ignore */ }
    }

    function _loadStats() {
        try {
            const s = localStorage.getItem('poker_stats');
            if (s) stats = JSON.parse(s);
        } catch (e) { /* ignore */ }
    }

    // === Public API ===
    return {
        init,
        newGame,
        fold,
        check,
        call,
        raise,
        selectRaise
    };
})();
