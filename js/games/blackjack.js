/**
 * Blackjack v2.0 - 프리미엄 블랙잭 게임 엔진
 * ItemGame - 소셜 카지노
 *
 * v2.0 추가 기능:
 * - 인슈어런스 (딜러 에이스 시 보험)
 * - 서렌더 (첫 2장에서 포기, 절반 환불)
 * - 딜러 Peek (딜러 에이스/10 시 블랙잭 확인)
 * - Soft/Hard 점수 표시
 * - 통계 추적 (승/패/무/블랙잭/총핸드)
 * - 리벳 (이전 베팅 금액으로 빠른 딜)
 * - 슈 인디케이터 (남은 카드 수)
 * - 사이드벳: Perfect Pairs + 21+3
 * - 테이블 글로우 효과
 * - 페이스 카드 아이콘 (J/Q/K)
 *
 * 기존 기능 (v1.0):
 * - 6덱 슈, 딜러 소프트17 스탠드
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
    const MAX_BET = 50000;
    const TOTAL_CARDS = DECK_COUNT * 52; // 312

    /* v2.0: 페이스 카드 아이콘 */
    const FACE_ICONS = { 'J': '♞', 'Q': '♛', 'K': '♚' };

    let shoe = [];
    let playerHands = [];
    let activeHandIdx = 0;
    let dealerCards = [];
    let currentBet = 100;
    let lastBet = 0; /* v2.0: 리벳용 */
    let gamePhase = 'betting'; // 'betting' | 'dealing' | 'insurance' | 'playing' | 'dealer' | 'result'

    /* v2.0: 인슈어런스 상태 */
    let insuranceBet = 0;
    let insuranceOffered = false;

    /* v2.0: 사이드벳 상태 */
    let sideBets = {
        perfectPairs: false,
        twentyOnePlus3: false
    };
    let sideBetResults = [];

    /* v2.0: 통계 */
    let stats = {
        wins: 0,
        losses: 0,
        pushes: 0,
        blackjacks: 0,
        hands: 0
    };

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
     * 슈 생성 (6덱, Fisher-Yates 셔플)
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
        _updateShoeIndicator();
    }

    /**
     * 카드 한 장 뽑기
     */
    function _drawCard() {
        if (shoe.length < 20) _createShoe();
        const card = shoe.pop();
        _updateShoeIndicator();
        return card;
    }

    /**
     * 핸드 점수 계산 (faceDown 카드 제외)
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
     * 실제 점수 (faceDown 무시, 모든 카드 포함)
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

    /**
     * v2.0: Soft/Hard 판별 (에이스가 11로 카운트되면 Soft)
     */
    function _calcSoftHard(cards) {
        let score = 0;
        let aces = 0;
        cards.forEach(card => {
            if (!card.faceDown) {
                score += card.value;
                if (card.rank === 'A') aces++;
            }
        });

        let softAces = aces;
        while (score > 21 && softAces > 0) {
            score -= 10;
            softAces--;
        }

        // softAces > 0 이면 에이스 하나 이상이 11로 카운트됨 → Soft
        return { score, isSoft: softAces > 0 && score <= 21 };
    }

    function _isBlackjack(cards) {
        return cards.length === 2 && _calcRealScore(cards) === 21;
    }

    function _isBust(cards) {
        return _calcRealScore(cards) > 21;
    }

    /**
     * v2.0: 슈 인디케이터 업데이트
     */
    function _updateShoeIndicator() {
        const textEl = document.getElementById('shoeText');
        const fillEl = document.getElementById('shoeBarFill');
        if (textEl) textEl.textContent = `${shoe.length}장`;
        if (fillEl) fillEl.style.width = `${(shoe.length / TOTAL_CARDS) * 100}%`;
    }

    /**
     * v2.0: 통계 업데이트 (DOM)
     */
    function _updateStats() {
        const ids = {
            statWins: stats.wins,
            statLosses: stats.losses,
            statPushes: stats.pushes,
            statBlackjacks: stats.blackjacks,
            statHands: stats.hands
        };
        Object.entries(ids).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });
    }

    /**
     * v2.0: 테이블 글로우 효과
     */
    function _tableGlow(type) {
        const table = document.getElementById('bjTableOuter');
        if (!table) return;
        table.classList.remove('win-glow', 'bj-glow');
        if (type) {
            table.classList.add(type);
            setTimeout(() => table.classList.remove(type), 3000);
        }
    }

    /**
     * 초기화
     */
    function init() {
        _createShoe();
        gamePhase = 'betting';
        _render();
        _updateStats();
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
     * v2.1: ALL-IN (잔액 전부 베팅)
     */
    function allIn() {
        if (gamePhase !== 'betting') return;
        const balance = ChipManager.getBalance();
        if (balance <= 0) {
            _showStatus('칩이 부족합니다!');
            return;
        }
        currentBet = Math.min(balance, MAX_BET);
        if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();
        _render();
    }

    /**
     * v2.0: 리벳 (이전 베팅 금액으로 빠른 딜)
     */
    function rebet() {
        if (gamePhase !== 'betting' || lastBet <= 0) return;
        currentBet = lastBet;
        if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();
        _render();
        deal();
    }

    /**
     * v2.0: 사이드벳 토글
     */
    function toggleSideBet(type) {
        if (gamePhase !== 'betting') return;
        sideBets[type] = !sideBets[type];
        const toggleId = type === 'perfectPairs' ? 'togglePerfectPairs' : 'toggleTwentyOnePlus3';
        const el = document.getElementById(toggleId);
        if (el) el.classList.toggle('active', sideBets[type]);
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();
    }

    /**
     * v2.0: Perfect Pairs 평가
     * Mixed Pair (다른 색): 5:1
     * Colored Pair (같은 색, 다른 슈트): 12:1
     * Perfect Pair (같은 슈트): 25:1
     */
    function _evaluatePerfectPairs(cards) {
        if (cards.length < 2) return null;
        const c1 = cards[0], c2 = cards[1];
        if (c1.rank !== c2.rank) return null;

        if (c1.suit === c2.suit) {
            return { type: 'Perfect Pair', multiplier: 25 };
        } else if (c1.color === c2.color) {
            return { type: 'Colored Pair', multiplier: 12 };
        } else {
            return { type: 'Mixed Pair', multiplier: 5 };
        }
    }

    /**
     * v2.0: 21+3 평가 (플레이어 2장 + 딜러 업카드)
     * Flush: 5:1
     * Straight: 10:1
     * Three of a Kind: 30:1
     * Straight Flush: 40:1
     * Suited Three: 100:1
     */
    function _evaluateTwentyOnePlus3(playerCards, dealerUpCard) {
        if (playerCards.length < 2 || !dealerUpCard) return null;
        const cards = [playerCards[0], playerCards[1], dealerUpCard];

        const ranks = cards.map(c => {
            const idx = RANKS.indexOf(c.rank);
            return idx === 0 ? 14 : (idx + 1); // A=14 for straight check
        }).sort((a, b) => a - b);

        const suits = cards.map(c => c.suit);
        const rankValues = cards.map(c => c.rank);

        const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
        const isThreeOfKind = rankValues[0] === rankValues[1] && rankValues[1] === rankValues[2];

        // Straight: 연속 3장 또는 Q-K-A
        const isStraight = (ranks[2] - ranks[1] === 1 && ranks[1] - ranks[0] === 1) ||
            (ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 14); // A-2-3

        if (isThreeOfKind && isFlush) return { type: 'Suited Three', multiplier: 100 };
        if (isStraight && isFlush) return { type: 'Straight Flush', multiplier: 40 };
        if (isThreeOfKind) return { type: 'Three of a Kind', multiplier: 30 };
        if (isStraight) return { type: 'Straight', multiplier: 10 };
        if (isFlush) return { type: 'Flush', multiplier: 5 };

        return null;
    }

    /**
     * v2.0: 사이드벳 결산
     */
    function _settleSideBets() {
        sideBetResults = [];
        const sideBetAmount = Math.floor(currentBet * 0.1) || MIN_BET; // 메인벳의 10%

        if (sideBets.perfectPairs) {
            const pp = _evaluatePerfectPairs(playerHands[0].cards);
            if (pp) {
                const win = sideBetAmount * pp.multiplier;
                ChipManager.addChips(win);
                sideBetResults.push({ name: 'Perfect Pairs', result: pp.type, win, isWin: true });
            } else {
                // 사이드벳 비용은 deal() 시 이미 차감
                sideBetResults.push({ name: 'Perfect Pairs', result: 'No Pair', win: 0, isWin: false });
            }
        }

        if (sideBets.twentyOnePlus3) {
            const dealerUpCard = dealerCards[0]; // 첫 번째 카드 (업카드)
            const tp = _evaluateTwentyOnePlus3(playerHands[0].cards, dealerUpCard);
            if (tp) {
                const win = sideBetAmount * tp.multiplier;
                ChipManager.addChips(win);
                sideBetResults.push({ name: '21+3', result: tp.type, win, isWin: true });
            } else {
                sideBetResults.push({ name: '21+3', result: 'No Hand', win: 0, isWin: false });
            }
        }

        _renderSideBetResults();
    }

    /**
     * v2.0: 사이드벳 결과 렌더링
     */
    function _renderSideBetResults() {
        const el = document.getElementById('sideBetResult');
        if (!el || sideBetResults.length === 0) {
            if (el) el.innerHTML = '';
            return;
        }

        el.innerHTML = sideBetResults.map(r => {
            const cls = r.isWin ? 'win' : 'lose';
            const text = r.isWin
                ? `${r.name}: ${r.result} +${r.win.toLocaleString()}`
                : `${r.name}: ${r.result}`;
            return `<div class="side-bet-result ${cls}">${text}</div>`;
        }).join('');
    }

    /**
     * 딜 시작 (애니메이션 포함)
     */
    async function deal() {
        if (gamePhase !== 'betting') return;

        // 사이드벳 비용 계산
        const sideBetAmount = Math.floor(currentBet * 0.1) || MIN_BET;
        let totalCost = currentBet;
        if (sideBets.perfectPairs) totalCost += sideBetAmount;
        if (sideBets.twentyOnePlus3) totalCost += sideBetAmount;

        if (!ChipManager.deductChips(totalCost)) {
            _showStatus('칩이 부족합니다!');
            return;
        }

        lastBet = currentBet; /* v2.0: 리벳용 저장 */

        // XP 획득 (베팅 금액의 10%)
        if (typeof LevelManager !== 'undefined') {
            LevelManager.addXP(currentBet);
        }

        playerHands = [{
            cards: [],
            bet: currentBet,
            standing: false,
            doubled: false
        }];
        activeHandIdx = 0;
        dealerCards = [];
        insuranceBet = 0;
        insuranceOffered = false;
        sideBetResults = [];

        // 인슈어런스 오퍼 & 사이드벳 결과 초기화
        const insurancePanel = document.getElementById('insuranceOffer');
        if (insurancePanel) insurancePanel.classList.remove('active');
        const sideBetEl = document.getElementById('sideBetResult');
        if (sideBetEl) sideBetEl.innerHTML = '';

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
        _render();

        // v2.0: 사이드벳 결산 (4장 딜 후)
        if (sideBets.perfectPairs || sideBets.twentyOnePlus3) {
            await _delay(300);
            _settleSideBets();
        }

        // v2.0: 플레이어 블랙잭 체크
        if (_isBlackjack(playerHands[0].cards)) {
            // 딜러도 블랙잭 가능성 체크 (Peek)
            _revealDealer();
            await _delay(500);
            _endRound();
            return;
        }

        // v2.0: 딜러 에이스 → 인슈어런스 오퍼
        if (dealerCards[0].rank === 'A') {
            gamePhase = 'insurance';
            insuranceOffered = true;
            const panel = document.getElementById('insuranceOffer');
            if (panel) panel.classList.add('active');
            _render();
            return; // 플레이어 선택 대기
        }

        // v2.0: 딜러 10-value Peek (홀카드가 에이스이면 블랙잭)
        if (dealerCards[0].value === 10) {
            if (_isBlackjack(dealerCards)) {
                _revealDealer();
                await _delay(500);
                _endRound();
                return;
            }
        }

        gamePhase = 'playing';
        _render();
    }

    /**
     * v2.0: 인슈어런스 수락
     */
    async function acceptInsurance() {
        if (gamePhase !== 'insurance') return;

        const insAmount = Math.floor(playerHands[0].bet / 2);
        if (!ChipManager.deductChips(insAmount)) {
            _showStatus('인슈어런스 칩 부족!');
            declineInsurance();
            return;
        }

        insuranceBet = insAmount;
        if (typeof SoundManager !== 'undefined') SoundManager.playChipPlace();

        const panel = document.getElementById('insuranceOffer');
        if (panel) panel.classList.remove('active');

        // 딜러 블랙잭 확인 (Peek)
        if (_isBlackjack(dealerCards)) {
            // 인슈어런스 승리: 2:1 배당
            const insWin = insuranceBet * 3; // 원금 + 2:1 = 3배 반환
            ChipManager.addChips(insWin);
            _showStatus(`인슈어런스 승리! +${(insWin - insuranceBet).toLocaleString()} 칩`);
            _revealDealer();
            await _delay(500);
            _endRound();
        } else {
            // 인슈어런스 패배 (이미 차감됨)
            _showStatus('인슈어런스 패배');
            gamePhase = 'playing';
            _render();
        }
    }

    /**
     * v2.0: 인슈어런스 거절
     */
    async function declineInsurance() {
        if (gamePhase !== 'insurance') return;

        const panel = document.getElementById('insuranceOffer');
        if (panel) panel.classList.remove('active');
        if (typeof SoundManager !== 'undefined') SoundManager.playClick();

        // 딜러 블랙잭 확인 (Peek)
        if (_isBlackjack(dealerCards)) {
            _revealDealer();
            await _delay(500);
            _endRound();
        } else {
            gamePhase = 'playing';
            _render();
        }
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
     * v2.0: Surrender (첫 2장에서만 가능, 베팅의 절반 환불)
     */
    function surrender() {
        if (gamePhase !== 'playing') return;
        const hand = playerHands[activeHandIdx];
        if (hand.cards.length !== 2) return; // 첫 2장에서만 가능
        if (playerHands.length > 1) return; // 스플릿 후 불가

        if (typeof SoundManager !== 'undefined') SoundManager.playClick();

        // 베팅의 절반 환불
        const refund = Math.floor(hand.bet / 2);
        ChipManager.addChips(refund);

        // 통계 업데이트
        stats.losses++;
        stats.hands++;
        _updateStats();

        // 결과 표시
        const resultEl = document.getElementById('bjResult');
        if (resultEl) {
            resultEl.className = 'result-display result-lose';
            resultEl.innerHTML = `SURRENDER<br><small style="font-size:0.75em;opacity:0.8">−${(hand.bet - refund).toLocaleString()} 칩 (절반 환불)</small>`;
        }

        // 딜러 카드 공개
        _revealDealer();
        _render();

        // 베팅 영역 표시
        _showBettingUI();
        gamePhase = 'betting';
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
                // 딜러 서스펜스: 카드마다 1초 딜레이
                await _delay(1000);
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
        /* const dealerBJ = _isBlackjack(dealerCards); -- v1.0 변수명 유지하되 아래에서 직접 사용 */
        const dealerBust = _isBust(dealerCards);

        let totalPayout = 0;
        const results = [];

        playerHands.forEach((hand, idx) => {
            const playerScore = _calcRealScore(hand.cards);
            const playerBJ = _isBlackjack(hand.cards);
            const dealerBJ = _isBlackjack(dealerCards);
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

        // v2.0: 통계 업데이트
        results.forEach(r => {
            stats.hands++;
            if (r.result === 'BLACKJACK!') {
                stats.wins++;
                stats.blackjacks++;
            } else if (r.result === 'WIN') {
                stats.wins++;
            } else if (r.result === 'LOSE' || r.result === 'BUST') {
                stats.losses++;
            } else if (r.result === 'PUSH') {
                stats.pushes++;
            }
        });
        _updateStats();

        // 사운드 + 이펙트
        const totalBet = playerHands.reduce((sum, h) => sum + h.bet, 0);
        const netWin = totalPayout - totalBet;
        if (netWin > 0) {
            if (typeof SoundManager !== 'undefined') {
                if (results.some(r => r.result === 'BLACKJACK!')) {
                    SoundManager.playBigWin();
                    if (typeof CoinShower !== 'undefined') CoinShower.start(3000, 'mega');
                    document.body.classList.add('shake');
                    setTimeout(() => document.body.classList.remove('shake'), 500);
                    _tableGlow('bj-glow'); /* v2.0: 블랙잭 골드 글로우 */
                } else {
                    SoundManager.playWin();
                    if (typeof CoinShower !== 'undefined') CoinShower.start(1500, 'big');
                    _tableGlow('win-glow'); /* v2.0: 승리 그린 글로우 */
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
        const colorClass = card.color === 'red' ? 'red' : 'black';

        /* v2.0: 페이스카드 클래스 + 중앙 아이콘 */
        const isFaceCard = ['J', 'Q', 'K'].includes(card.rank);
        const faceClass = isFaceCard ? ' face-card' : '';
        const centerSymbol = isFaceCard ? FACE_ICONS[card.rank] : card.suit;

        return `
            <div class="card-item face-up ${colorClass}${faceClass}" ${delay}>
                <div class="card-corner card-top-left">
                    <span class="card-corner-rank">${card.rank}</span>
                    <span class="card-corner-suit">${card.suit}</span>
                </div>
                <div class="card-center">
                    <span class="card-center-suit">${centerSymbol}</span>
                </div>
                <div class="card-corner card-bottom-right">
                    <span class="card-corner-rank">${card.rank}</span>
                    <span class="card-corner-suit">${card.suit}</span>
                </div>
            </div>
        `;
    }

    /**
     * v2.0: 점수 텍스트 생성 (Soft/Hard 포함)
     */
    function _scoreText(cards, hasFaceDown) {
        if (cards.length === 0) return '-';

        if (hasFaceDown) {
            const visible = _calcScore(cards);
            return `${visible} + ?`;
        }

        const { score, isSoft } = _calcSoftHard(cards);
        const typeLabel = isSoft ? '<span class="score-type">Soft</span>' : '';
        return `${score}${typeLabel}`;
    }

    /**
     * 메인 렌더링
     */
    function _render() {
        const tableEl = document.getElementById('bjTable');
        if (!tableEl) return;

        const hasFaceDown = dealerCards.some(c => c.faceDown);

        let dealerScoreClass = '';
        if (!hasFaceDown && dealerCards.length > 0) {
            const realScore = _calcRealScore(dealerCards);
            if (realScore > 21) dealerScoreClass = 'bust';
            else if (_isBlackjack(dealerCards)) dealerScoreClass = 'blackjack';
        }

        const dealerScoreDisplay = dealerCards.length > 0
            ? _scoreText(dealerCards, hasFaceDown)
            : '-';

        // 딜러 영역
        let html = `
            <div class="hand-area dealer-area">
                <div class="hand-label">
                    <span class="name"><span class="hand-icon">🎩</span> 딜러</span>
                    <span class="score ${dealerScoreClass}">${dealerScoreDisplay}</span>
                </div>
                <div class="cards-row">
                    ${dealerCards.map((c, i) => _cardHTML(c, i * 150)).join('')}
                </div>
            </div>
            <div class="table-divider"></div>
            <div class="insurance-line">INSURANCE PAYS 2:1</div>
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
                const scoreDisplay = _scoreText(hand.cards, false);

                html += `
                    <div class="split-hand ${isActive ? 'active-hand' : ''}">
                        <div class="hand-label">
                            <span class="name">핸드 ${idx + 1} (${ChipManager.formatBalance(hand.bet)})</span>
                            <span class="score ${scoreClass}">${scoreDisplay}</span>
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

            const scoreDisplay = hand.cards.length > 0
                ? _scoreText(hand.cards, false)
                : '-';

            html += `
                <div class="hand-area player-area">
                    <div class="hand-label">
                        <span class="name"><span class="hand-icon">👤</span> 플레이어 (베팅: ${ChipManager.formatBalance(hand.bet)})</span>
                        <span class="score ${scoreClass}">${scoreDisplay}</span>
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
        const surrenderBtn = document.getElementById('btnSurrender');
        const dealBtn = document.getElementById('btnDeal');
        const betArea = document.getElementById('betArea');
        const actionArea = document.getElementById('actionArea');
        const rebetBtn = document.getElementById('btnRebet');

        if (gamePhase === 'betting') {
            if (betArea) betArea.style.display = 'flex';
            if (actionArea) actionArea.style.display = 'none';
            // v2.0: 리벳 버튼 표시 (이전 베팅이 있을 때)
            if (rebetBtn) rebetBtn.style.display = lastBet > 0 ? 'inline-flex' : 'none';
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
            /* v2.0: 서렌더는 첫 2장, 스플릿 전에만 가능 */
            const canSurrender = hand && hand.cards.length === 2 && playerHands.length === 1;

            if (hitBtn) hitBtn.disabled = false;
            if (standBtn) standBtn.disabled = false;
            if (doubleBtn) doubleBtn.disabled = !canDouble;
            if (splitBtn) splitBtn.disabled = !canSplit;
            if (surrenderBtn) surrenderBtn.disabled = !canSurrender;
        } else if (gamePhase === 'insurance') {
            if (betArea) betArea.style.display = 'none';
            if (actionArea) actionArea.style.display = 'none';
        } else {
            if (actionArea) actionArea.style.display = 'none';
        }
    }

    /**
     * v2.0: 베팅 UI 표시 (서렌더/라운드 종료 후)
     */
    function _showBettingUI() {
        const betArea = document.getElementById('betArea');
        if (betArea) betArea.style.display = 'flex';

        const newGameBtn = document.getElementById('btnNewGame');
        if (newGameBtn) newGameBtn.style.display = 'inline-flex';

        const rebetBtn = document.getElementById('btnRebet');
        if (rebetBtn) rebetBtn.style.display = lastBet > 0 ? 'inline-flex' : 'none';
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
        if (results.some(r => r.result === 'BLACKJACK!')) {
            resultClass = 'result-blackjack';
            resultText = `BLACKJACK! +${netWin.toLocaleString()} 칩`;
        } else if (netWin > 0) {
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
        _showBettingUI();
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
        insuranceBet = 0;
        insuranceOffered = false;
        sideBetResults = [];

        if (typeof SoundManager !== 'undefined') SoundManager.playClick();

        const resultEl = document.getElementById('bjResult');
        if (resultEl) {
            resultEl.className = 'result-display';
            resultEl.textContent = '';
        }

        const newGameBtn = document.getElementById('btnNewGame');
        if (newGameBtn) newGameBtn.style.display = 'none';

        const insurancePanel = document.getElementById('insuranceOffer');
        if (insurancePanel) insurancePanel.classList.remove('active');

        const sideBetEl = document.getElementById('sideBetResult');
        if (sideBetEl) sideBetEl.innerHTML = '';

        // 테이블 글로우 제거
        const table = document.getElementById('bjTableOuter');
        if (table) table.classList.remove('win-glow', 'bj-glow');

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
        /* v2.0 신규 메서드 */
        rebet,
        allIn,
        surrender,
        acceptInsurance,
        declineInsurance,
        toggleSideBet,
        MIN_BET,
        MAX_BET
    };
})();
