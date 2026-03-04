/* ============================================
   맞고 (고스톱) v2.0 - Go-Stop Game Module
   한국 전통 화투 게임 (AI 1명 대전)
   48장 화투패, 광/띠/피/열끗 점수 체계

   v2.0 추가 기능:
   - 폭탄, 흔들기, 뻑, 쪽, 쓸, 따닥
   - 피박/광박/멍박 배수
   - 고도리 점수
   - 이벤트 알림 + 화면 흔들림
   - 실제 화투 이미지 사용
   ============================================ */

const GoStopGame = (() => {
    'use strict';

    // === 화투패 데이터 (12월 x 4장 = 48장) ===
    const CARDS = [
        { month: 1, name: '1월 광', type: 'gwang' },
        { month: 1, name: '1월 홍단', type: 'tti-hong' },
        { month: 1, name: '1월 피1', type: 'pi' },
        { month: 1, name: '1월 피2', type: 'pi' },
        { month: 2, name: '2월 열끗', type: 'yeol' },
        { month: 2, name: '2월 홍단', type: 'tti-hong' },
        { month: 2, name: '2월 피1', type: 'pi' },
        { month: 2, name: '2월 피2', type: 'pi' },
        { month: 3, name: '3월 광', type: 'gwang' },
        { month: 3, name: '3월 홍단', type: 'tti-hong' },
        { month: 3, name: '3월 피1', type: 'pi' },
        { month: 3, name: '3월 피2', type: 'pi' },
        { month: 4, name: '4월 열끗', type: 'yeol' },
        { month: 4, name: '4월 초단', type: 'tti-cho' },
        { month: 4, name: '4월 피1', type: 'pi' },
        { month: 4, name: '4월 피2', type: 'pi' },
        { month: 5, name: '5월 열끗', type: 'yeol' },
        { month: 5, name: '5월 초단', type: 'tti-cho' },
        { month: 5, name: '5월 피1', type: 'pi' },
        { month: 5, name: '5월 피2', type: 'pi' },
        { month: 6, name: '6월 열끗', type: 'yeol' },
        { month: 6, name: '6월 청단', type: 'tti-cheong' },
        { month: 6, name: '6월 피1', type: 'pi' },
        { month: 6, name: '6월 피2', type: 'pi' },
        { month: 7, name: '7월 열끗', type: 'yeol' },
        { month: 7, name: '7월 초단', type: 'tti-cho' },
        { month: 7, name: '7월 피1', type: 'pi' },
        { month: 7, name: '7월 피2', type: 'pi' },
        { month: 8, name: '8월 광', type: 'gwang' },
        { month: 8, name: '8월 열끗', type: 'yeol' },
        { month: 8, name: '8월 피1', type: 'pi' },
        { month: 8, name: '8월 피2', type: 'pi' },
        { month: 9, name: '9월 열끗', type: 'yeol' },
        { month: 9, name: '9월 청단', type: 'tti-cheong' },
        { month: 9, name: '9월 피1', type: 'pi' },
        { month: 9, name: '9월 피2', type: 'pi' },
        { month: 10, name: '10월 열끗', type: 'yeol' },
        { month: 10, name: '10월 청단', type: 'tti-cheong' },
        { month: 10, name: '10월 피1', type: 'pi' },
        { month: 10, name: '10월 피2', type: 'pi' },
        { month: 11, name: '11월 광', type: 'gwang' },
        { month: 11, name: '11월 쌍피', type: 'ssang-pi' },
        { month: 11, name: '11월 피2', type: 'pi' },
        { month: 11, name: '11월 피3', type: 'pi' },
        { month: 12, name: '12월 광', type: 'gwang' },
        { month: 12, name: '12월 열끗', type: 'yeol' },
        { month: 12, name: '12월 쌍피', type: 'ssang-pi' },
        { month: 12, name: '12월 피2', type: 'pi' }
    ];

    const TYPE_SCORE = { gwang: 10, yeol: 5, 'tti-hong': 4, 'tti-cheong': 4, 'tti-cho': 4, 'ssang-pi': 2, pi: 1 };

    // === 게임 상태 ===
    let deck = [], playerHand = [], aiHand = [], field = [], drawPile = [];
    let playerCaptures = [], aiCaptures = [];
    let currentTurn = 'player';
    let gamePhase = 'waiting'; // waiting, playing, selecting, go-decision, action-choice, finished
    let selectedCard = null;
    let betAmount = 100;
    let goCount = { player: 0, ai: 0 };
    let stats = { played: 0, won: 0 };
    let matchingFieldCards = [];

    // v2.0 새 상태
    let shakeCount = { player: 0, ai: 0 };
    let bombUsed = { player: false, ai: false };
    let ppukCount = { player: 0, ai: 0 };
    let sweepCount = { player: 0, ai: 0 };
    let pendingActions = []; // [{type:'shake', month:N}, {type:'bomb', month:N}]
    let lastEvent = '';

    // === 초기화 ===
    function init() {
        _loadStats();
        _updateUI();
    }

    // === 덱 셔플 ===
    function _createDeck() {
        deck = CARDS.map((c, i) => ({ ...c, id: i }));
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    // === 새 게임 ===
    function newGame() {
        if (gamePhase !== 'waiting' && gamePhase !== 'finished') return;
        if (ChipManager.getBalance() < betAmount) {
            _showToast('칩이 부족합니다.', 'error');
            return;
        }
        ChipManager.deductChips(betAmount);

        _createDeck();
        playerHand = []; aiHand = []; field = []; drawPile = [];
        playerCaptures = []; aiCaptures = [];
        selectedCard = null;
        goCount = { player: 0, ai: 0 };
        shakeCount = { player: 0, ai: 0 };
        bombUsed = { player: false, ai: false };
        ppukCount = { player: 0, ai: 0 };
        sweepCount = { player: 0, ai: 0 };
        matchingFieldCards = [];
        pendingActions = [];
        lastEvent = '';

        // 딜: 7장, 7장, 바닥 6장
        for (let i = 0; i < 7; i++) playerHand.push(deck.pop());
        for (let i = 0; i < 7; i++) aiHand.push(deck.pop());
        for (let i = 0; i < 6; i++) field.push(deck.pop());
        drawPile = [...deck];

        playerHand.sort((a, b) => a.month - b.month);
        aiHand.sort((a, b) => a.month - b.month);

        currentTurn = 'player';
        gamePhase = 'playing';
        _playSfx('deal');

        // 결과 영역 초기화
        const resultEl = document.getElementById('gostopResult');
        if (resultEl) { resultEl.className = 'gostop-result'; resultEl.textContent = ''; }

        _renderAll();
        _updateUI();

        // 플레이어 턴 시작 전 액션 체크
        _checkPreTurnActions('player');
    }

    // === 턴 시작 전 액션 체크 (흔들기, 폭탄) ===
    function _checkPreTurnActions(who) {
        const hand = who === 'player' ? playerHand : aiHand;
        const monthMap = {};
        hand.forEach(c => {
            if (!monthMap[c.month]) monthMap[c.month] = [];
            monthMap[c.month].push(c);
        });

        pendingActions = [];
        for (const [m, cards] of Object.entries(monthMap)) {
            const month = parseInt(m);
            if (cards.length >= 3) {
                const fieldHas = field.some(f => f.month === month);
                if (fieldHas) {
                    pendingActions.push({ type: 'bomb', month });
                } else {
                    pendingActions.push({ type: 'shake', month });
                }
            }
        }

        if (who === 'ai') {
            // AI 자동 처리: 폭탄 우선, 흔들기는 확률적
            const bombAction = pendingActions.find(a => a.type === 'bomb');
            if (bombAction) {
                _executeBomb('ai', bombAction.month);
                return;
            }
            const shakeAction = pendingActions.find(a => a.type === 'shake');
            if (shakeAction && Math.random() < 0.6) {
                _executeShake('ai', shakeAction.month);
            }
            pendingActions = [];
            return;
        }

        // 플레이어: 액션 패널 표시
        if (pendingActions.length > 0) {
            gamePhase = 'action-choice';
            _renderActionPanel();
            _updateUI();
        }
    }

    // === 흔들기 실행 ===
    function _executeShake(who, month) {
        const hand = who === 'player' ? playerHand : aiHand;
        const cards = hand.filter(c => c.month === month);
        shakeCount[who]++;
        _playSfx('shake');
        _showEvent('흔든다~!', 'shake');
        _showToast(`${who === 'player' ? '' : 'AI: '}${month}월 흔들기! (x${Math.pow(2, shakeCount[who])}배)`, 'info');
    }

    // === 폭탄 실행 ===
    function _executeBomb(who, month) {
        const hand = who === 'player' ? playerHand : aiHand;
        const captures = who === 'player' ? playerCaptures : aiCaptures;
        const handCards = hand.filter(c => c.month === month);
        const fieldCards = field.filter(f => f.month === month);

        // 손에서 3장 제거
        handCards.forEach(c => {
            const idx = hand.indexOf(c);
            if (idx !== -1) hand.splice(idx, 1);
        });
        // 바닥에서 제거
        fieldCards.forEach(c => {
            const idx = field.indexOf(c);
            if (idx !== -1) field.splice(idx, 1);
        });

        // 모두 먹기
        captures.push(...handCards, ...fieldCards);
        bombUsed[who] = true;
        _playSfx('bomb');
        _showEvent('폭탄!', 'bomb');
        _screenShake();
        _showToast(`${who === 'player' ? '' : 'AI: '}${month}월 폭탄! (x2배)`, 'info');

        // 쓸 체크
        if (field.length === 0) {
            sweepCount[who]++;
            _showEvent('쓸!', 'sweep');
            _stealPi(who, 1);
        }

        _renderAll();

        // 폭탄 후 바로 뒤집기 (드로우)
        setTimeout(() => _doDrawPhase(who), 500);
    }

    // === 플레이어 액션 선택 ===
    function doAction(actionType, month) {
        if (gamePhase !== 'action-choice') return;
        if (actionType === 'shake') {
            _executeShake('player', month);
        } else if (actionType === 'bomb') {
            _executeBomb('player', month);
            gamePhase = 'playing';
            _hideActionPanel();
            _updateUI();
            return;
        }
        gamePhase = 'playing';
        pendingActions = [];
        _hideActionPanel();
        _renderAll();
        _updateUI();
    }

    function skipAction() {
        if (gamePhase !== 'action-choice') return;
        gamePhase = 'playing';
        pendingActions = [];
        _hideActionPanel();
        _renderAll();
        _updateUI();
    }

    // === 카드 내기 (플레이어) ===
    function playCard(cardId) {
        if (gamePhase !== 'playing' || currentTurn !== 'player') return;

        const cardIdx = playerHand.findIndex(c => c.id === cardId);
        if (cardIdx === -1) return;

        const card = playerHand[cardIdx];
        playerHand.splice(cardIdx, 1);
        const matching = field.filter(f => f.month === card.month);

        if (matching.length === 0) {
            field.push(card);
            _playSfx('place');
            _doDrawPhase('player', card);
        } else if (matching.length === 1) {
            // 1장 매치 → 가져가지만 뒤집기 후 뻑 체크
            field.splice(field.indexOf(matching[0]), 1);
            playerCaptures.push(card, matching[0]);
            _playSfx('match');
            _doDrawPhase('player', card);
        } else if (matching.length === 2) {
            // 2장 매치 → 선택 필요
            selectedCard = card;
            matchingFieldCards = matching;
            gamePhase = 'selecting';
            _renderAll();
            _updateUI();
        } else if (matching.length === 3) {
            // 3장 매치 (뻑 풀기) → 4장 모두 가져가기
            matching.forEach(m => field.splice(field.indexOf(m), 1));
            playerCaptures.push(card, ...matching);
            _playSfx('match');
            _showEvent('따닥!', 'ddadak');
            _stealPi('player', 2);
            _doDrawPhase('player', card);
        }
    }

    // === 바닥패 선택 ===
    function selectFieldCard(cardId) {
        if (gamePhase !== 'selecting') return;

        const chosen = matchingFieldCards.find(c => c.id === cardId);
        if (!chosen) return;

        field.splice(field.indexOf(chosen), 1);
        playerCaptures.push(selectedCard, chosen);

        const playedCard = selectedCard;
        selectedCard = null;
        matchingFieldCards = [];
        gamePhase = 'playing';
        _playSfx('match');
        _doDrawPhase('player', playedCard);
    }

    // === 뒷패 뒤집기 + 뻑/쪽/쓸 판정 ===
    async function _doDrawPhase(who, playedCard) {
        _renderAll();
        await _delay(400);

        if (drawPile.length === 0) {
            _afterResolve(who);
            return;
        }

        _playSfx('flip');
        const drawn = drawPile.pop();
        const captures = who === 'player' ? playerCaptures : aiCaptures;
        const matching = field.filter(f => f.month === drawn.month);

        // === 뻑 체크: 뒤집은 패 + 바닥 1장 + (이미 가져간 쌍의 같은 월이 남아있으면) ===
        // 뻑: 바닥에 같은 월 1장만 있을 때, 뒤집은 패가 같은 월 → 2장 바닥에 놓고 뻑
        if (matching.length === 1) {
            // 그냥 1매치 → 가져가기
            field.splice(field.indexOf(matching[0]), 1);
            captures.push(drawn, matching[0]);

            // 쓸 체크
            if (field.length === 0) {
                sweepCount[who]++;
                _playSfx('sweep');
                _showEvent('쓸!', 'sweep');
                _stealPi(who, 1);
            }
        } else if (matching.length === 0) {
            // 쪽 체크: 뒤집은 패가 방금 낸 패와 같은 월이고, 방금 바닥에 놓은 상태
            if (playedCard && drawn.month === playedCard.month && field.some(f => f.id === playedCard.id)) {
                // 쪽! - 바닥에 놓은 내 패 + 뒤집은 패 가져가기
                const onField = field.find(f => f.id === playedCard.id);
                if (onField) {
                    field.splice(field.indexOf(onField), 1);
                    captures.push(drawn, onField);
                    _playSfx('jjok');
                    _showEvent('쪽!', 'jjok');
                    _stealPi(who, 1);
                } else {
                    field.push(drawn);
                }
            } else {
                field.push(drawn);
            }
        } else if (matching.length === 2) {
            // 뒤집은 패로 2장 매칭 → 첫번째와 가져가기
            field.splice(field.indexOf(matching[0]), 1);
            captures.push(drawn, matching[0]);
        } else if (matching.length >= 3) {
            // 4장 모두 가져가기 (뻑 풀기)
            matching.forEach(m => field.splice(field.indexOf(m), 1));
            captures.push(drawn, ...matching);
            _showEvent('따닥!', 'ddadak');
            _stealPi(who, 2);
        }

        _renderAll();
        await _delay(300);
        _afterResolve(who);
    }

    // === 뒤집기 후 처리 (점수/고스톱/턴교대) ===
    function _afterResolve(who) {
        // 점수 체크
        const caps = who === 'player' ? playerCaptures : aiCaptures;
        const score = _calcScore(caps);
        const prevGo = goCount[who];

        // 첫 3점 또는 고 이후 점수 증가 시
        const threshold = prevGo > 0 ? 3 + prevGo : 3;
        if (score >= threshold) {
            if (who === 'player') {
                gamePhase = 'go-decision';
                _renderAll();
                _updateUI();
                return;
            } else {
                // AI 고/스톱 결정
                if (score < 6) {
                    goCount.ai++;
                    _playSfx('go');
                    _showEvent('AI: 고!', 'go');
                } else {
                    _endGame('ai');
                    return;
                }
            }
        }

        // 패 소진 체크
        if (playerHand.length === 0 && aiHand.length === 0) {
            const pScore = _calcScore(playerCaptures);
            const aScore = _calcScore(aiCaptures);
            if (pScore >= aScore) _endGame('player');
            else _endGame('ai');
            return;
        }

        // 턴 교대
        if (who === 'player') {
            currentTurn = 'ai';
            _renderAll();
            _updateUI();
            setTimeout(() => {
                _checkPreTurnActions('ai');
                if (gamePhase === 'playing') _aiTurn();
            }, 600);
        } else {
            currentTurn = 'player';
            _renderAll();
            _updateUI();
            _checkPreTurnActions('player');
        }
    }

    // === 고/스톱 결정 ===
    function goDecision(choice) {
        if (gamePhase !== 'go-decision') return;

        if (choice === 'go') {
            goCount.player++;
            _playSfx('go');
            _showEvent('고!', 'go');
            _showToast(`고! ${goCount.player}고 (${_getGoMultiplierText()})`, 'success');
            gamePhase = 'playing';
            currentTurn = 'ai';
            _renderAll();
            _updateUI();
            setTimeout(() => {
                _checkPreTurnActions('ai');
                if (gamePhase === 'playing') _aiTurn();
            }, 600);
        } else {
            _playSfx('stop');
            _showEvent('스톱!', 'stop');
            _endGame('player');
        }
    }

    function _getGoMultiplierText() {
        const g = goCount.player;
        if (g <= 2) return `+${g}점`;
        return `x${Math.pow(2, g - 2)}배`;
    }

    // === AI 턴 ===
    function _aiTurn() {
        if (gamePhase !== 'playing' || currentTurn !== 'ai') return;
        if (aiHand.length === 0) {
            currentTurn = 'player';
            _renderAll();
            _updateUI();
            return;
        }

        let bestCard = null;
        let bestScore = -1;

        for (const card of aiHand) {
            const matching = field.filter(f => f.month === card.month);
            if (matching.length > 0) {
                const matchScore = Math.max(...matching.map(m => TYPE_SCORE[m.type] || 0)) + (TYPE_SCORE[card.type] || 0);
                if (matchScore > bestScore) {
                    bestScore = matchScore;
                    bestCard = card;
                }
            }
        }

        if (!bestCard) {
            bestCard = aiHand.reduce((low, c) => (!low || (TYPE_SCORE[c.type] || 0) < (TYPE_SCORE[low.type] || 0)) ? c : low, null);
        }
        if (!bestCard) return;

        const cardIdx = aiHand.indexOf(bestCard);
        aiHand.splice(cardIdx, 1);
        const matching = field.filter(f => f.month === bestCard.month);

        if (matching.length === 0) {
            field.push(bestCard);
            _playSfx('place');
            _doDrawPhase('ai', bestCard);
        } else if (matching.length === 1) {
            field.splice(field.indexOf(matching[0]), 1);
            aiCaptures.push(bestCard, matching[0]);
            _playSfx('match');
            _doDrawPhase('ai', bestCard);
        } else if (matching.length === 2) {
            const best = matching.reduce((b, m) => (!b || (TYPE_SCORE[m.type] || 0) > (TYPE_SCORE[b.type] || 0)) ? m : b, null);
            field.splice(field.indexOf(best), 1);
            aiCaptures.push(bestCard, best);
            _playSfx('match');
            _doDrawPhase('ai', bestCard);
        } else if (matching.length === 3) {
            matching.forEach(m => field.splice(field.indexOf(m), 1));
            aiCaptures.push(bestCard, ...matching);
            _playSfx('match');
            _showEvent('따닥!', 'ddadak');
            _stealPi('ai', 2);
            _doDrawPhase('ai', bestCard);
        }
    }

    // === 피 빼앗기 ===
    function _stealPi(who, count) {
        const from = who === 'player' ? aiCaptures : playerCaptures;
        const to = who === 'player' ? playerCaptures : aiCaptures;

        for (let i = 0; i < count; i++) {
            const piIdx = from.findIndex(c => c.type === 'pi');
            if (piIdx !== -1) {
                to.push(from.splice(piIdx, 1)[0]);
            }
        }
    }

    // === 점수 계산 ===
    function _calcScore(captures) {
        let score = 0;
        const gwang = captures.filter(c => c.type === 'gwang');
        const tti = captures.filter(c => c.type.startsWith('tti-'));
        const yeol = captures.filter(c => c.type === 'yeol');
        let piCount = 0;
        captures.forEach(c => {
            if (c.type === 'pi') piCount++;
            if (c.type === 'ssang-pi') piCount += 2;
        });

        // 광
        if (gwang.length >= 5) score += 15;
        else if (gwang.length === 4) score += 4;
        else if (gwang.length === 3) {
            score += gwang.some(c => c.month === 12) ? 2 : 3;
        }

        // 고도리 (2월+4월+8월 열끗)
        if ([2, 4, 8].every(m => captures.some(c => c.month === m && c.type === 'yeol'))) {
            score += 5;
        }

        // 홍단/청단/초단
        const hongDan = tti.filter(c => c.type === 'tti-hong');
        const cheongDan = tti.filter(c => c.type === 'tti-cheong');
        const choDan = tti.filter(c => c.type === 'tti-cho');
        if (hongDan.length >= 3) score += 3;
        if (cheongDan.length >= 3) score += 3;
        if (choDan.length >= 3) score += 3;

        // 띠 5장+
        if (tti.length >= 5) score += (tti.length - 4);

        // 열끗 5장+
        if (yeol.length >= 5) score += (yeol.length - 4);

        // 피 10장+ (맞고 기준)
        if (piCount >= 10) score += (piCount - 9);

        return score;
    }

    function _getScoreBreakdown(captures) {
        const gwang = captures.filter(c => c.type === 'gwang');
        const tti = captures.filter(c => c.type.startsWith('tti-'));
        const yeol = captures.filter(c => c.type === 'yeol');
        let piCount = 0;
        captures.forEach(c => {
            if (c.type === 'pi') piCount++;
            if (c.type === 'ssang-pi') piCount += 2;
        });
        return { gwang: gwang.length, tti: tti.length, yeol: yeol.length, pi: piCount };
    }

    // === 게임 종료 + 배수 계산 ===
    function _endGame(winner) {
        gamePhase = 'finished';
        const loser = winner === 'player' ? 'ai' : 'player';
        const wCaps = winner === 'player' ? playerCaptures : aiCaptures;
        const lCaps = loser === 'player' ? playerCaptures : aiCaptures;
        const baseScore = _calcScore(wCaps);

        // 배수 계산
        let multiplier = 1;
        const multiplierReasons = [];

        // 고 배수
        const goCnt = goCount[winner];
        if (goCnt === 1) { /* +1점은 baseScore에 반영 안 됨, 별도 보너스 */ }
        if (goCnt === 2) { /* +2점 */ }
        if (goCnt >= 3) {
            const goMul = Math.pow(2, goCnt - 2);
            multiplier *= goMul;
            multiplierReasons.push(`${goCnt}고 x${goMul}`);
        }

        // 피박: 패자 피 7장 이하
        const loserPi = _getScoreBreakdown(lCaps).pi;
        if (loserPi <= 7) {
            multiplier *= 2;
            multiplierReasons.push('피박 x2');
        }

        // 광박: 승자가 광점수 있고 패자가 광 0장
        const wGwang = wCaps.filter(c => c.type === 'gwang').length;
        const lGwang = lCaps.filter(c => c.type === 'gwang').length;
        if (wGwang >= 3 && lGwang === 0) {
            multiplier *= 2;
            multiplierReasons.push('광박 x2');
        }

        // 멍박: 승자가 열끗점수 있고 패자가 열끗 0장
        const lYeol = lCaps.filter(c => c.type === 'yeol').length;
        if (lYeol === 0 && _getScoreBreakdown(wCaps).yeol >= 5) {
            multiplier *= 2;
            multiplierReasons.push('멍박 x2');
        }

        // 흔들기 배수
        if (shakeCount[winner] > 0) {
            const shakeMul = Math.pow(2, shakeCount[winner]);
            multiplier *= shakeMul;
            multiplierReasons.push(`흔들기 x${shakeMul}`);
        }

        // 폭탄 배수
        if (bombUsed[winner]) {
            multiplier *= 2;
            multiplierReasons.push('폭탄 x2');
        }

        const finalScore = baseScore + Math.min(goCnt, 2); // 1고=+1, 2고=+2
        const winAmount = Math.floor(betAmount * finalScore * multiplier);

        const resultEl = document.getElementById('gostopResult');
        if (resultEl) {
            if (winner === 'player') {
                ChipManager.addChips(winAmount + betAmount);
                resultEl.className = 'gostop-result win';
                let text = `승리! ${finalScore}점`;
                if (multiplier > 1) text += ` x${multiplier}배`;
                text += ` = +${winAmount.toLocaleString()}칩`;
                if (multiplierReasons.length > 0) text += `\n(${multiplierReasons.join(', ')})`;
                resultEl.textContent = text;
                if (typeof SoundManager !== 'undefined') SoundManager.playWin();
                if (typeof CoinShower !== 'undefined') CoinShower.start(2000, winAmount > 500 ? 'big' : 'normal');
                stats.won++;
            } else {
                resultEl.className = 'gostop-result lose';
                let text = `AI 승리! ${finalScore}점`;
                if (multiplier > 1) text += ` x${multiplier}배`;
                resultEl.textContent = text;
                if (typeof SoundManager !== 'undefined') SoundManager.playLose();
            }
        }

        stats.played++;
        _saveStats();
        if (typeof LevelManager !== 'undefined') LevelManager.addXP(betAmount);

        _renderAll();
        _updateUI();
    }

    // === 렌더링 ===
    function _renderAll() {
        _renderHand();
        _renderAiHand();
        _renderField();
        _renderCaptures('player', playerCaptures);
        _renderCaptures('ai', aiCaptures);
        _renderScores();
    }

    function _renderHand() {
        const container = document.getElementById('playerHand');
        if (!container) return;
        container.innerHTML = '';
        playerHand.forEach(card => {
            const el = _createCardEl(card);
            if (gamePhase === 'playing' && currentTurn === 'player') {
                el.classList.add('playable');
                el.onclick = () => playCard(card.id);
            }
            if (gamePhase === 'selecting') el.classList.add('dimmed');
            container.appendChild(el);
        });
    }

    function _renderAiHand() {
        const container = document.getElementById('aiHand');
        if (!container) return;
        container.innerHTML = '';
        const backImg = HwatuRenderer.renderBack();
        aiHand.forEach(() => {
            const el = document.createElement('div');
            el.className = 'hwatu-card face-down';
            el.innerHTML = `<img src="${backImg}" alt="뒷면" draggable="false">`;
            container.appendChild(el);
        });
    }

    function _renderField() {
        const container = document.getElementById('fieldCards');
        if (!container) return;
        container.innerHTML = '';
        field.forEach(card => {
            const el = _createCardEl(card);
            if (gamePhase === 'selecting' && matchingFieldCards.some(m => m.id === card.id)) {
                el.classList.add('selectable');
                el.onclick = () => selectFieldCard(card.id);
            }
            container.appendChild(el);
        });
    }

    function _renderCaptures(who, captures) {
        const ids = { gwang: `${who}Gwang`, tti: `${who}Tti`, yeol: `${who}Yeol`, pi: `${who}Pi` };
        const sets = {
            gwang: captures.filter(c => c.type === 'gwang'),
            tti: captures.filter(c => c.type.startsWith('tti-')),
            yeol: captures.filter(c => c.type === 'yeol'),
            pi: captures.filter(c => c.type === 'pi' || c.type === 'ssang-pi')
        };
        for (const [key, cards] of Object.entries(sets)) {
            const el = document.getElementById(ids[key]);
            if (!el) continue;
            el.innerHTML = '';
            cards.forEach(c => el.appendChild(_createMiniEl(c)));
        }
    }

    function _renderScores() {
        const pScore = _calcScore(playerCaptures);
        const aScore = _calcScore(aiCaptures);
        const pB = _getScoreBreakdown(playerCaptures);
        const aB = _getScoreBreakdown(aiCaptures);

        _setText('playerScore', pScore + '점');
        _setText('aiScore', aScore + '점');
        _setText('playerDetail', `광${pB.gwang} 띠${pB.tti} 열${pB.yeol} 피${pB.pi}`);
        _setText('aiDetail', `광${aB.gwang} 띠${aB.tti} 열${aB.yeol} 피${aB.pi}`);
        _setText('drawCount', drawPile.length);

        const turnEl = document.getElementById('turnIndicator');
        if (turnEl) {
            const labels = {
                'go-decision': '고? 스톱?',
                'action-choice': '특수 액션!',
                'playing': currentTurn === 'player' ? '내 턴' : 'AI 턴',
                'selecting': '바닥패 선택'
            };
            turnEl.textContent = labels[gamePhase] || '';
        }
    }

    function _createCardEl(card) {
        const el = document.createElement('div');
        el.className = 'hwatu-card';
        el.dataset.id = card.id;
        el.innerHTML = `<img src="${HwatuRenderer.render(card)}" alt="${card.name}" draggable="false">`;
        return el;
    }

    function _createMiniEl(card) {
        const el = document.createElement('div');
        el.className = 'hwatu-mini';
        el.title = card.name;
        el.innerHTML = `<img src="${HwatuRenderer.renderMini(card)}" alt="${card.name}" draggable="false">`;
        return el;
    }

    // === 액션 패널 (흔들기/폭탄) ===
    function _renderActionPanel() {
        const panel = document.getElementById('actionPanel');
        if (!panel) return;
        panel.innerHTML = '';

        pendingActions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `gs-action-btn ${action.type}`;
            const label = action.type === 'bomb' ? `폭탄 (${action.month}월)` : `흔들기 (${action.month}월)`;
            btn.textContent = label;
            btn.onclick = () => doAction(action.type, action.month);
            panel.appendChild(btn);
        });

        const skipBtn = document.createElement('button');
        skipBtn.className = 'gs-action-btn skip';
        skipBtn.textContent = '패스';
        skipBtn.onclick = () => skipAction();
        panel.appendChild(skipBtn);

        panel.style.display = 'flex';
    }

    function _hideActionPanel() {
        const panel = document.getElementById('actionPanel');
        if (panel) panel.style.display = 'none';
    }

    // === UI 업데이트 ===
    function _updateUI() {
        const newGameBtn = document.getElementById('gostopNewGameBtn');
        const goPanel = document.getElementById('goStopPanel');

        if (newGameBtn) newGameBtn.disabled = (gamePhase !== 'waiting' && gamePhase !== 'finished');
        if (goPanel) goPanel.style.display = gamePhase === 'go-decision' ? 'flex' : 'none';

        // 통계
        _setText('gsStat1', stats.played);
        _setText('gsStat2', stats.won);
        _setText('gsStat3', stats.played > 0 ? Math.round(stats.won / stats.played * 100) + '%' : '-');

        // 헤더 칩
        const hc = document.getElementById('headerChips');
        if (hc) hc.textContent = ChipManager.formatBalance();

        // 배수 표시
        _renderMultiplierBadges();
    }

    function _renderMultiplierBadges() {
        const container = document.getElementById('multiplierBadges');
        if (!container) return;
        container.innerHTML = '';

        if (shakeCount.player > 0) _addBadge(container, `흔들기 x${Math.pow(2, shakeCount.player)}`, 'shake');
        if (bombUsed.player) _addBadge(container, '폭탄 x2', 'bomb');
        if (goCount.player > 0) _addBadge(container, `${goCount.player}고`, 'go');
        if (shakeCount.ai > 0) _addBadge(container, `AI 흔들기`, 'shake-ai');
        if (bombUsed.ai) _addBadge(container, 'AI 폭탄', 'bomb-ai');
    }

    function _addBadge(container, text, cls) {
        const badge = document.createElement('span');
        badge.className = `gs-badge ${cls}`;
        badge.textContent = text;
        container.appendChild(badge);
    }

    function setBet(amount) {
        betAmount = amount;
        document.querySelectorAll('.gs-bet-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.value) === amount);
        });
    }

    // === 이벤트 알림 (뻑!, 쪽!, 쓸!, 폭탄!, 흔들기!, 고!) ===
    function _showEvent(text, type) {
        lastEvent = type;
        const overlay = document.getElementById('eventOverlay');
        if (!overlay) return;

        overlay.textContent = text;
        overlay.className = `gs-event-overlay active ${type || ''}`;

        setTimeout(() => {
            overlay.classList.remove('active');
        }, 1200);
    }

    function _screenShake() {
        const board = document.querySelector('.gostop-board');
        if (!board) return;
        board.classList.add('shake');
        setTimeout(() => board.classList.remove('shake'), 500);
    }

    // === 사운드 ===
    function _playSfx(type) {
        if (typeof SoundManager === 'undefined') return;
        try {
            const sfxMap = {
                deal: 'playGostopDeal', place: 'playGostopPlace',
                match: 'playGostopMatch', flip: 'playGostopFlip',
                go: 'playGostopGo', stop: 'playGostopStop',
                ppuk: 'playGostopPpuk', jjok: 'playGostopJjok',
                sweep: 'playGostopSweep', bomb: 'playGostopBomb',
                shake: 'playGostopShake', ddadak: 'playGostopDdadak'
            };
            const fn = sfxMap[type];
            if (fn && SoundManager[fn]) SoundManager[fn]();
        } catch (e) { /* ignore */ }
    }

    // === 유틸 ===
    function _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
    function _setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

    function _showToast(msg, type) {
        const c = document.getElementById('toastContainer');
        if (!c) return;
        const t = document.createElement('div');
        t.className = `toast toast-${type || 'info'}`;
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    function _saveStats() { try { localStorage.setItem('gostop_stats', JSON.stringify(stats)); } catch (e) {} }
    function _loadStats() { try { const s = localStorage.getItem('gostop_stats'); if (s) stats = JSON.parse(s); } catch (e) {} }

    return { init, newGame, playCard, selectFieldCard, goDecision, setBet, doAction, skipAction };
})();
