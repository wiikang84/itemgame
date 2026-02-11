/**
 * Blackjack - 블랙잭 게임 엔진
 * ItemGame - 소셜 카지노
 *
 * - 6덱 슈
 * - 딜러 소프트17 스탠드
 * - Hit / Stand / Double Down / Split
 * - 블랙잭 3:2 배당
 */

const Blackjack = (() => {
    const SUITS = ['♠', '♥', '♦', '♣'];
    const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const DECK_COUNT = 6;
    const MIN_BET = 50;
    const MAX_BET = 5000;

    let shoe = [];
    let playerHands = []; // [{cards:[], bet:0, standing:false, doubled:false}]
    let activeHandIdx = 0;
    let dealerCards = [];
    let currentBet = 100;
    let gamePhase = 'betting'; // 'betting' | 'playing' | 'dealer' | 'result'

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
        // 셔플
        for (let i = shoe.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
        }
    }

    /**
     * 카드 한 장 뽑기
     */
    function _drawCard() {
        if (shoe.length < 20) _createShoe(); // 리셔플
        return shoe.pop();
    }

    /**
     * 핸드 점수 계산
     */
    function _calcScore(cards) {
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

    /**
     * 블랙잭 여부 (첫 2장 21)
     */
    function _isBlackjack(cards) {
        return cards.length === 2 && _calcScore(cards) === 21;
    }

    /**
     * 버스트 여부
     */
    function _isBust(cards) {
        return _calcScore(cards) > 21;
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
        _render();
    }

    function addBet(amount) {
        setBet(currentBet + amount);
    }

    function clearBet() {
        if (gamePhase !== 'betting') return;
        currentBet = MIN_BET;
        _render();
    }

    /**
     * 딜 시작
     */
    function deal() {
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

        // 카드 배분: 플레이어-딜러-플레이어-딜러(뒤집기)
        playerHands[0].cards.push(_drawCard());
        dealerCards.push(_drawCard());
        playerHands[0].cards.push(_drawCard());
        dealerCards.push({ ..._drawCard(), faceDown: true });

        gamePhase = 'playing';

        // 블랙잭 체크
        if (_isBlackjack(playerHands[0].cards)) {
            // 딜러도 블랙잭이면 푸시, 아니면 3:2 배당
            _revealDealer();
            if (_isBlackjack(dealerCards)) {
                _endRound();
            } else {
                _endRound();
            }
            return;
        }

        _render();
    }

    /**
     * Hit
     */
    function hit() {
        if (gamePhase !== 'playing') return;
        const hand = playerHands[activeHandIdx];
        if (hand.standing) return;

        hand.cards.push(_drawCard());

        if (_isBust(hand.cards) || _calcScore(hand.cards) === 21) {
            hand.standing = true;
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
        playerHands[activeHandIdx].standing = true;
        _nextHand();
    }

    /**
     * Double Down
     */
    function doubleDown() {
        if (gamePhase !== 'playing') return;
        const hand = playerHands[activeHandIdx];
        if (hand.cards.length !== 2) return;
        if (!ChipManager.deductChips(hand.bet)) {
            _showStatus('더블다운 칩 부족!');
            return;
        }

        hand.doubled = true;
        hand.bet *= 2;
        hand.cards.push(_drawCard());
        hand.standing = true;
        _nextHand();
    }

    /**
     * Split
     */
    function split() {
        if (gamePhase !== 'playing') return;
        const hand = playerHands[activeHandIdx];
        if (hand.cards.length !== 2) return;
        if (hand.cards[0].rank !== hand.cards[1].rank) return;
        if (playerHands.length >= 4) return; // 최대 4 핸드
        if (!ChipManager.deductChips(hand.bet)) {
            _showStatus('스플릿 칩 부족!');
            return;
        }

        const splitCard = hand.cards.pop();
        hand.cards.push(_drawCard());

        const newHand = {
            cards: [splitCard, _drawCard()],
            bet: hand.bet,
            standing: false,
            doubled: false
        };

        playerHands.splice(activeHandIdx + 1, 0, newHand);
        _render();
    }

    /**
     * 다음 핸드로 이동
     */
    function _nextHand() {
        activeHandIdx++;
        if (activeHandIdx >= playerHands.length) {
            // 모든 핸드 완료 → 딜러 턴
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
    }

    /**
     * 딜러 턴
     */
    async function _dealerTurn() {
        gamePhase = 'dealer';
        _revealDealer();
        _render();

        // 모든 플레이어 핸드가 버스트면 딜러 드로우 불필요
        const allBust = playerHands.every(h => _isBust(h.cards));
        if (!allBust) {
            // 딜러는 17 미만이면 히트
            while (_calcScore(dealerCards) < 17) {
                await _delay(500);
                dealerCards.push(_drawCard());
                _render();
            }
        }

        await _delay(300);
        _endRound();
    }

    /**
     * 라운드 종료 - 결과 계산
     */
    function _endRound() {
        gamePhase = 'result';
        _revealDealer();
        const dealerScore = _calcScore(dealerCards);
        const dealerBJ = _isBlackjack(dealerCards);
        const dealerBust = _isBust(dealerCards);

        let totalPayout = 0;
        const results = [];

        playerHands.forEach((hand, idx) => {
            const playerScore = _calcScore(hand.cards);
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

        _renderResults(results, totalPayout);
    }

    /**
     * 유틸: 딜레이
     */
    function _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 카드 HTML 생성
     */
    function _cardHTML(card) {
        if (card.faceDown) {
            return '<div class="card-item face-down"></div>';
        }
        return `
            <div class="card-item face-up ${card.color}">
                <span class="card-suit">${card.suit}</span>
                <span class="card-rank">${card.rank}</span>
                <span class="card-suit">${card.suit}</span>
            </div>
        `;
    }

    /**
     * 메인 렌더링
     */
    function _render() {
        const tableEl = document.getElementById('bjTable');
        if (!tableEl) return;

        const dealerScore = dealerCards.some(c => c.faceDown)
            ? _calcScore(dealerCards.filter(c => !c.faceDown))
            : _calcScore(dealerCards);

        const dealerScoreText = dealerCards.some(c => c.faceDown)
            ? `${dealerScore} + ?`
            : dealerScore;

        let dealerScoreClass = '';
        if (!dealerCards.some(c => c.faceDown)) {
            if (_calcScore(dealerCards) > 21) dealerScoreClass = 'bust';
            else if (_isBlackjack(dealerCards)) dealerScoreClass = 'blackjack';
        }

        // 딜러 영역
        let html = `
            <div class="hand-area">
                <div class="hand-label">
                    <span class="name">딜러</span>
                    <span class="score ${dealerScoreClass}">${dealerCards.length > 0 ? dealerScoreText : '-'}</span>
                </div>
                <div class="cards-row">
                    ${dealerCards.map(c => _cardHTML(c)).join('')}
                </div>
            </div>
            <div class="table-divider"></div>
        `;

        // 플레이어 영역
        if (playerHands.length > 1) {
            html += '<div class="split-hands">';
            playerHands.forEach((hand, idx) => {
                const score = _calcScore(hand.cards);
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
                            ${hand.cards.map(c => _cardHTML(c)).join('')}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        } else if (playerHands.length === 1) {
            const hand = playerHands[0];
            const score = _calcScore(hand.cards);
            let scoreClass = '';
            if (score > 21) scoreClass = 'bust';
            else if (_isBlackjack(hand.cards)) scoreClass = 'blackjack';

            html += `
                <div class="hand-area">
                    <div class="hand-label">
                        <span class="name">플레이어 (베팅: ${ChipManager.formatBalance(hand.bet)})</span>
                        <span class="score ${scoreClass}">${hand.cards.length > 0 ? score : '-'}</span>
                    </div>
                    <div class="cards-row">
                        ${hand.cards.map(c => _cardHTML(c)).join('')}
                    </div>
                </div>
            `;
        }

        tableEl.innerHTML = html;

        // 액션 버튼 업데이트
        _updateActions();

        // 칩 표시 업데이트
        const chipEl = document.getElementById('headerChips');
        if (chipEl) chipEl.textContent = ChipManager.formatBalance();

        // 베팅 금액 표시
        const betEl = document.getElementById('currentBet');
        if (betEl) betEl.textContent = currentBet.toLocaleString();
    }

    /**
     * 액션 버튼 상태 업데이트
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
            if (actionArea) actionArea.style.display = 'flex';

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

        // 핸드별 상세 결과
        const details = results.map(r =>
            `핸드${results.length > 1 ? (r.handIdx + 1) : ''}: ${r.result}`
        ).join(' | ');

        resultEl.className = `result-display ${resultClass}`;
        resultEl.innerHTML = `${resultText}<br><small style="font-size:0.75em;opacity:0.8">${details}</small>`;

        // 베팅 영역 다시 표시
        const betArea = document.getElementById('betArea');
        if (betArea) betArea.style.display = 'flex';

        // 새 게임 버튼 표시
        const newGameBtn = document.getElementById('btnNewGame');
        if (newGameBtn) newGameBtn.style.display = 'inline-flex';

        gamePhase = 'betting';
    }

    /**
     * 상태 메시지 표시
     */
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
