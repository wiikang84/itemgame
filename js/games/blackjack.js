/**
 * Blackjack - 블랙잭 게임 엔진
 * ItemGame - 소셜 카지노
 *
 * - 6덱 슈
 * - 딜러 소프트17 스탠드
 * - Hit / Stand / Double Down / Split
 * - 블랙잭 3:2 배당
 * - 카드 딜/뒤집기 애니메이션
 * - 사운드 효과 연동
 */

const Blackjack = (() => {
    const SUITS = ['♠', '♥', '♦', '♣'];
    const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const DECK_COUNT = 6;
    const MIN_BET = 50;
    const MAX_BET = 5000;

    let shoe = [];
    let playerHands = [];
    let activeHandIdx = 0;
    let dealerCards = [];
    let currentBet = 100;
    let gamePhase = 'betting'; // 'betting' | 'dealing' | 'playing' | 'dealer' | 'result'

    /**
     * 카드 생성
     */
    function _createCard(rank, suit) {
        const value = rank === 'A' ? 11 :
            ['J', 'Q', 'K'].includes(rank) ? 10 :
            parseInt(rank);
        const color = ['♥', '♦'].includes(suit) ? 'red' : 'black';
        return { rank, suit, value, color };
    }

    /**
     * 슈 생성 (6덱)
     */
    function _createShoe() {
        shoe = [];
        for (let d = 0; d < DECK_COUNT; d++) {
            for (const suit of SUITS) {
                for (const rank of RANKS) {
                    shoe.push(_createCard(rank, suit));
                }
            }
        }
        for (let i = shoe.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
        }
    }

    /**
     * 카드 한 장 뽑기
     */
    function _drawCard() {
        if (shoe.length < 20) _createShoe();
        return shoe.pop();
    }

    /**
     * 핸드 점수 계산
     */
    function _calcScore(cards) {
        let score = 0;
        let aces = 0;

        cards.forEach(card => {
            if (!card.faceDown) {
                score += card.value;
                if (card.rank === 'A') aces++;
            }
        });

        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }

        return score;
    }

    /**
     * 실제 점수 (faceDown 무시)
     */
    function _calcRealScore(cards) {
        let score = 0;
        let aces = 0;
        cards.forEach(card => {
            score += card.value;
            if (card.rank === 'A') aces++;
        });
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    }

    function _isBlackjack(cards) {
        return cards.length === 2 && _calcRealScore(cards) === 21;
    }

    function _isBust(cards) {
        return _calcRealScore(cards) > 21;
    }

    /**
     * 초기화
     */
    function init() {
        _createShoe();
        gamePhase = 'betting';
        _render();
    }

    /**
     * 베팅 금액 설정
     */
    function setBet(amount) {
        if (gamePhase !== 'betting') return;
        currentBet = Math.max(MIN_BET, Math.min(MAX_BET, amount));
        if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();
        _render();
    }

    function addBet(amount) {
        setBet(currentBet + amount);
    }

    function clearBet() {
        if (gamePhase !== 'betting') return;
        currentBet = MIN_BET;
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
        _render();
    }

    /**
     * 딜 시작 (애니메이션 포함)
     */
    async function deal() {
        if (gamePhase !== 'betting') return;
        if (!ChipManager.deductChips(currentBet)) {
            _showStatus('칩이 부족합니다!');
            return;
        }

        playerHands = [{
            cards: [],
            bet: currentBet,
            standing: false,
            doubled: false
        }];
        activeHandIdx = 0;
        dealerCards = [];

        gamePhase = 'dealing';
        _render();

        // 순차적 카드 딜 애니메이션
        await _delay(200);
        playerHands[0].cards.push(_drawCard());
        if (typeof SoundManager !== 'undefined') SoundManager.playCardDeal();
        _render();

        await _delay(300);
        dealerCards.push(_drawCard());
        if (typeof SoundManager !== 'undefined') SoundManager.playCardDeal();
        _render();

        await _delay(300);
        playerHands[0].cards.push(_drawCard());
        if (typeof SoundManager !== 'undefined') SoundManager.playCardDeal();
        _render();

        await _delay(300);
        dealerCards.push({ ..._drawCard(), faceDown: true });
        if (typeof SoundManager !== 'undefined') SoundManager.playCardDeal();

        gamePhase = 'playing';

        // 블랙잭 체크
        if (_isBlackjack(playerHands[0].cards)) {
            _revealDealer();
            await _delay(500);
            _endRound();
            return;
        }

        _render();
    }

    /**
     * Hit
     */
    async function hit() {
        if (gamePhase !== 'playing') return;
        const hand = playerHands[activeHandIdx];
        if (hand.standing) return;

        hand.cards.push(_drawCard());
        if (typeof SoundManager !== 'undefined') SoundManager.playCardDeal();

        if (_isBust(hand.cards) || _calcRealScore(hand.cards) === 21) {
            hand.standing = true;
            _render();
            await _delay(400);
            _nextHand();
        } else {
            _render();
        }
    }

    /**
     * Stand
     */
    function stand() {
        if (gamePhase !== 'playing') return;
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
        playerHands[activeHandIdx].standing = true;
        _nextHand();
    }

    /**
     * Double Down
     */
    async function doubleDown() {
        if (gamePhase !== 'playing') return;
        const hand = playerHands[activeHandIdx];
        if (hand.cards.length !== 2) return;
        if (!ChipManager.deductChips(hand.bet)) {
            _showStatus('더블다운 칩 부족!');
            return;
        }

        if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();

        hand.doubled = true;
        hand.bet *= 2;
        hand.cards.push(_drawCard());
        if (typeof SoundManager !== 'undefined') SoundManager.playCardDeal();
        hand.standing = true;
        _render();
        await _delay(500);
        _nextHand();
    }

    /**
     * Split
     */
    async function split() {
        if (gamePhase !== 'playing') return;
        const hand = playerHands[activeHandIdx];
        if (hand.cards.length !== 2) return;
        if (hand.cards[0].rank !== hand.cards[1].rank) return;
        if (playerHands.length >= 4) return;
        if (!ChipManager.deductChips(hand.bet)) {
            _showStatus('스플릿 칩 부족!');
            return;
        }

        if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();

        const splitCard = hand.cards.pop();
        hand.cards.push(_drawCard());

        const newHand = {
            cards: [splitCard, _drawCard()],
            bet: hand.bet,
            standing: false,
            doubled: false
        };

        playerHands.splice(activeHandIdx + 1, 0, newHand);
        if (typeof SoundManager !== 'undefined') SoundManager.playCardDeal();
        _render();
    }

    /**
     * 다음 핸드
     */
    function _nextHand() {
        activeHandIdx++;
        if (activeHandIdx >= playerHands.length) {
            _dealerTurn();
        } else {
            _render();
        }
    }

    /**
     * 딜러 카드 공개
     */
    function _revealDealer() {
        dealerCards.forEach(card => { card.faceDown = false; });
        if (typeof SoundManager !== 'undefined') SoundManager.playCardFlip();
    }

    /**
     * 딜러 턴
     */
    async function _dealerTurn() {
        gamePhase = 'dealer';
        _revealDealer();
        _render();

        const allBust = playerHands.every(h => _isBust(h.cards));
        if (!allBust) {
            while (_calcRealScore(dealerCards) < 17) {
                await _delay(600);
                dealerCards.push(_drawCard());
                if (typeof SoundManager !== 'undefined') SoundManager.playCardDeal();
                _render();
            }
        }

        await _delay(400);
        _endRound();
    }

    /**
     * 라운드 종료
     */
    function _endRound() {
        gamePhase = 'result';
        _revealDealer();
        const dealerScore = _calcRealScore(dealerCards);
        const dealerBJ = _isBlackjack(dealerCards);
        const dealerBust = _isBust(dealerCards);

        let totalPayout = 0;
        const results = [];

        playerHands.forEach((hand, idx) => {
            const playerScore = _calcRealScore(hand.cards);
            const playerBJ = _isBlackjack(hand.cards);
            const playerBust = _isBust(hand.cards);
            let result, payout;

            if (playerBust) {
                result = 'BUST';
                payout = 0;
            } else if (playerBJ && dealerBJ) {
                result = 'PUSH';
                payout = hand.bet;
            } else if (playerBJ) {
                result = 'BLACKJACK!';
                payout = hand.bet + Math.floor(hand.bet * 1.5);
            } else if (dealerBust) {
                result = 'WIN';
                payout = hand.bet * 2;
            } else if (playerScore > dealerScore) {
                result = 'WIN';
                payout = hand.bet * 2;
            } else if (playerScore === dealerScore) {
                result = 'PUSH';
                payout = hand.bet;
            } else {
                result = 'LOSE';
                payout = 0;
            }

            totalPayout += payout;
            results.push({ handIdx: idx, result, payout });
        });

        if (totalPayout > 0) {
            ChipManager.addChips(totalPayout);
        }

        // 사운드
        const totalBet = playerHands.reduce((sum, h) => sum + h.bet, 0);
        const netWin = totalPayout - totalBet;
        if (netWin > 0) {
            if (typeof SoundManager !== 'undefined') {
                if (results.some(r => r.result === 'BLACKJACK!')) {
                    SoundManager.playBigWin();
                } else {
                    SoundManager.playWin();
                }
            }
        } else if (netWin < 0) {
            if (typeof SoundManager !== 'undefined') SoundManager.playLose();
        }

        _renderResults(results, totalPayout);
    }

    function _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 고품질 카드 HTML 생성
     */
    function _cardHTML(card, animDelay) {
        const delay = animDelay ? `style="animation-delay:${animDelay}ms"` : '';

        if (card.faceDown) {
            return `<div class="card-item face-down" ${delay}>
                <div class="card-back-pattern"></div>
            </div>`;
        }

        // 카드 앞면: 실제 카드 모양
        const isRed = card.color === 'red';
        const colorClass = isRed ? 'red' : 'black';
        const suitSmall = card.suit;

        return `
            <div class="card-item face-up ${colorClass}" ${delay}>
                <div class="card-corner card-top-left">
                    <span class="card-corner-rank">${card.rank}</span>
                    <span class="card-corner-suit">${suitSmall}</span>
                </div>
                <div class="card-center">
                    <span class="card-center-suit">${card.suit}</span>
                </div>
                <div class="card-corner card-bottom-right">
                    <span class="card-corner-rank">${card.rank}</span>
                    <span class="card-corner-suit">${suitSmall}</span>
                </div>
            </div>
        `;
    }

    /**
     * 메인 렌더링
     */
    function _render() {
        const tableEl = document.getElementById('bjTable');
        if (!tableEl) return;

        const hasFaceDown = dealerCards.some(c => c.faceDown);
        const dealerScore = hasFaceDown
            ? _calcScore(dealerCards)
            : _calcRealScore(dealerCards);

        const dealerScoreText = hasFaceDown
            ? `${dealerScore} + ?`
            : (dealerCards.length > 0 ? dealerScore : '-');

        let dealerScoreClass = '';
        if (!hasFaceDown && dealerCards.length > 0) {
            const realScore = _calcRealScore(dealerCards);
            if (realScore > 21) dealerScoreClass = 'bust';
            else if (_isBlackjack(dealerCards)) dealerScoreClass = 'blackjack';
        }

        // 딜러 영역
        let html = `
            <div class="hand-area dealer-area">
                <div class="hand-label">
                    <span class="name"><span class="hand-icon">🎩</span> 딜러</span>
                    <span class="score ${dealerScoreClass}">${dealerCards.length > 0 ? dealerScoreText : '-'}</span>
                </div>
                <div class="cards-row">
                    ${dealerCards.map((c, i) => _cardHTML(c, i * 150)).join('')}
                </div>
            </div>
            <div class="table-divider"></div>
        `;

        // 플레이어 영역
        if (playerHands.length > 1) {
            html += '<div class="split-hands">';
            playerHands.forEach((hand, idx) => {
                const score = _calcRealScore(hand.cards);
                let scoreClass = '';
                if (score > 21) scoreClass = 'bust';
                else if (_isBlackjack(hand.cards)) scoreClass = 'blackjack';

                const isActive = gamePhase === 'playing' && idx === activeHandIdx;
                html += `
                    <div class="split-hand ${isActive ? 'active-hand' : ''}">
                        <div class="hand-label">
                            <span class="name">핸드 ${idx + 1} (${ChipManager.formatBalance(hand.bet)})</span>
                            <span class="score ${scoreClass}">${score}</span>
                        </div>
                        <div class="cards-row">
                            ${hand.cards.map((c, i) => _cardHTML(c, i * 100)).join('')}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        } else if (playerHands.length === 1) {
            const hand = playerHands[0];
            const score = _calcRealScore(hand.cards);
            let scoreClass = '';
            if (score > 21) scoreClass = 'bust';
            else if (_isBlackjack(hand.cards)) scoreClass = 'blackjack';

            html += `
                <div class="hand-area player-area">
                    <div class="hand-label">
                        <span class="name"><span class="hand-icon">👤</span> 플레이어 (베팅: ${ChipManager.formatBalance(hand.bet)})</span>
                        <span class="score ${scoreClass}">${hand.cards.length > 0 ? score : '-'}</span>
                    </div>
                    <div class="cards-row">
                        ${hand.cards.map((c, i) => _cardHTML(c, i * 100)).join('')}
                    </div>
                </div>
            `;
        }

        tableEl.innerHTML = html;

        _updateActions();

        const chipEl = document.getElementById('headerChips');
        if (chipEl) chipEl.textContent = ChipManager.formatBalance();

        const betEl = document.getElementById('currentBet');
        if (betEl) betEl.textContent = currentBet.toLocaleString();
    }

    /**
     * 액션 버튼 상태
     */
    function _updateActions() {
        const hitBtn = document.getElementById('btnHit');
        const standBtn = document.getElementById('btnStand');
        const doubleBtn = document.getElementById('btnDouble');
        const splitBtn = document.getElementById('btnSplit');
        const dealBtn = document.getElementById('btnDeal');
        const betArea = document.getElementById('betArea');
        const actionArea = document.getElementById('actionArea');

        if (gamePhase === 'betting') {
            if (betArea) betArea.style.display = 'flex';
            if (actionArea) actionArea.style.display = 'none';
        } else if (gamePhase === 'playing') {
            if (betArea) betArea.style.display = 'none';
            if (actionArea) {
                actionArea.style.display = 'flex';
                actionArea.classList.add('slide-in');
            }

            const hand = playerHands[activeHandIdx];
            const canDouble = hand && hand.cards.length === 2 && ChipManager.getBalance() >= hand.bet;
            const canSplit = hand && hand.cards.length === 2 &&
                hand.cards[0].rank === hand.cards[1].rank &&
                playerHands.length < 4 &&
                ChipManager.getBalance() >= hand.bet;

            if (hitBtn) hitBtn.disabled = false;
            if (standBtn) standBtn.disabled = false;
            if (doubleBtn) doubleBtn.disabled = !canDouble;
            if (splitBtn) splitBtn.disabled = !canSplit;
        } else {
            if (actionArea) actionArea.style.display = 'none';
        }
    }

    /**
     * 결과 렌더링
     */
    function _renderResults(results, totalPayout) {
        _render();

        const resultEl = document.getElementById('bjResult');
        if (!resultEl) return;

        const totalBet = playerHands.reduce((sum, h) => sum + h.bet, 0);
        const netWin = totalPayout - totalBet;

        let resultClass, resultText;
        if (netWin > 0) {
            resultClass = 'result-win';
            resultText = `WIN! +${netWin.toLocaleString()} 칩`;
        } else if (netWin === 0) {
            resultClass = 'result-push';
            resultText = 'PUSH (무승부)';
        } else {
            resultClass = 'result-lose';
            resultText = `LOSE −${Math.abs(netWin).toLocaleString()} 칩`;
        }

        const details = results.map(r =>
            `핸드${results.length > 1 ? (r.handIdx + 1) : ''}: ${r.result}`
        ).join(' | ');

        resultEl.className = `result-display ${resultClass}`;
        resultEl.innerHTML = `${resultText}<br><small style="font-size:0.75em;opacity:0.8">${details}</small>`;

        // 베팅 영역 + 새 게임 버튼 표시
        const betArea = document.getElementById('betArea');
        if (betArea) betArea.style.display = 'flex';

        const newGameBtn = document.getElementById('btnNewGame');
        if (newGameBtn) newGameBtn.style.display = 'inline-flex';

        gamePhase = 'betting';
    }

    function _showStatus(text) {
        const el = document.getElementById('bjStatus');
        if (el) {
            el.textContent = text;
            setTimeout(() => { el.textContent = ''; }, 2000);
        }
    }

    /**
     * 새 게임
     */
    function newGame() {
        gamePhase = 'betting';
        playerHands = [];
        dealerCards = [];
        activeHandIdx = 0;

        if (typeof SoundManager !== 'undefined') SoundManager.playClick();

        const resultEl = document.getElementById('bjResult');
        if (resultEl) {
            resultEl.className = 'result-display';
            resultEl.textContent = '';
        }

        const newGameBtn = document.getElementById('btnNewGame');
        if (newGameBtn) newGameBtn.style.display = 'none';

        _render();
    }

    return {
        init,
        deal,
        hit,
        stand,
        doubleDown,
        split,
        setBet,
        addBet,
        clearBet,
        newGame,
        MIN_BET,
        MAX_BET
    };
})();
