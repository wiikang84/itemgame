/* ============================================
   맞고 (고스톱) v3.0 - Go-Stop Game Module
   한국 전통 화투 게임 (AI 1명 대전)
   48장 화투패, 광/띠/피/열끗 점수 체계

   v3.0 추가 기능:
   - 폭탄, 흔들기, 뻑, 쪽, 쓸, 따닥
   - 피박/광박/멍박 배수, 고도리 점수
   - 뻑 정식 구현 (뒤집기 뻑), 삼뻑 자동패배, 자뻑
   - 총통 (같은 월 4장 즉시 승리)
   - 나가리 (무승부 → 다음 판 배수)
   - 매칭 가능 카드 하이라이트
   - 상세 결과 내역 (점수 분석, 점당 칩)
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
    let gamePhase = 'waiting';
    let selectedCard = null;
    let betAmount = 100;
    let goCount = { player: 0, ai: 0 };
    let stats = { played: 0, won: 0 };
    let matchingFieldCards = [];

    // v2.0 상태
    let shakeCount = { player: 0, ai: 0 };
    let bombUsed = { player: false, ai: false };
    let ppukCount = { player: 0, ai: 0 };
    let sweepCount = { player: 0, ai: 0 };
    let pendingActions = [];
    let lastEvent = '';

    // v3.0 상태
    let nagariMultiplier = 1;

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

    // === 총통 체크 (4장 같은 월) ===
    function _checkChongtong(hand) {
        const monthMap = {};
        hand.forEach(c => {
            if (!monthMap[c.month]) monthMap[c.month] = 0;
            monthMap[c.month]++;
        });
        for (const [month, count] of Object.entries(monthMap)) {
            if (count >= 4) return parseInt(month);
        }
        return null;
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

        const resultEl = document.getElementById('gostopResult');
        if (resultEl) { resultEl.className = 'gostop-result'; resultEl.innerHTML = ''; }

        if (nagariMultiplier > 1) {
            _showToast(`나가리 ${nagariMultiplier}배 적용 중!`, 'info');
        }

        _renderAll();
        _updateUI();

        // 총통 체크
        const playerCT = _checkChongtong(playerHand);
        const aiCT = _checkChongtong(aiHand);

        if (playerCT) {
            setTimeout(() => {
                _showEvent('총통!', 'bomb');
                _screenShake();
                _showToast(`총통! ${playerCT}월 4장!`, 'success');
                setTimeout(() => _endGame('player', true), 1500);
            }, 500);
            return;
        }
        if (aiCT) {
            setTimeout(() => {
                _showEvent('AI 총통!', 'bomb');
                _screenShake();
                _showToast(`AI 총통! ${aiCT}월 4장!`, 'error');
                setTimeout(() => _endGame('ai', true), 1500);
            }, 500);
            return;
        }

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

        if (pendingActions.length > 0) {
            gamePhase = 'action-choice';
            _renderActionPanel();
            _updateUI();
        }
    }

    // === 흔들기 실행 ===
    function _executeShake(who, month) {
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

        handCards.forEach(c => {
            const idx = hand.indexOf(c);
            if (idx !== -1) hand.splice(idx, 1);
        });
        fieldCards.forEach(c => {
            const idx = field.indexOf(c);
            if (idx !== -1) field.splice(idx, 1);
        });

        captures.push(...handCards, ...fieldCards);
        bombUsed[who] = true;
        _playSfx('bomb');
        _showEvent('폭탄!', 'bomb');
        _screenShake();
        _showToast(`${who === 'player' ? '' : 'AI: '}${month}월 폭탄! (x2배)`, 'info');

        if (field.length === 0) {
            sweepCount[who]++;
            _showEvent('쓸!', 'sweep');
            _stealPi(who, 1);
        }

        _renderAll();
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
        _clearFieldHighlights();
        const matching = field.filter(f => f.month === card.month);

        if (matching.length === 0) {
            field.push(card);
            _playSfx('place');
            _doDrawPhase('player', card);
        } else if (matching.length === 1) {
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
            // 뻑 풀기 → 4장 모두 가져가기 (따닥)
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

        if (matching.length === 0) {
            // 쪽 체크: 뒤집은 패가 방금 낸 패와 같은 월이고, 방금 바닥에 놓은 상태
            if (playedCard && drawn.month === playedCard.month && field.some(f => f.id === playedCard.id)) {
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
        } else if (matching.length === 1) {
            field.splice(field.indexOf(matching[0]), 1);
            captures.push(drawn, matching[0]);

            if (field.length === 0) {
                sweepCount[who]++;
                _playSfx('sweep');
                _showEvent('쓸!', 'sweep');
                _stealPi(who, 1);
            }
        } else if (matching.length === 2) {
            // 뻑! 뒤집은 패 + 바닥 2장 = 3장 같은 월 → 바닥에 놓기
            field.push(drawn);
            ppukCount[who]++;
            _playSfx('ppuk');
            _showEvent('뻑!', 'ppuk');

            // 자뻑 체크: 방금 내가 낸 카드가 같은 월이면 자뻑
            if (playedCard && playedCard.month === drawn.month) {
                _showToast(`${who === 'player' ? '' : 'AI: '}자뻑! 피 1장 빼앗김`, 'error');
                const fromCaps = who === 'player' ? playerCaptures : aiCaptures;
                const toCaps = who === 'player' ? aiCaptures : playerCaptures;
                const piIdx = fromCaps.findIndex(c => c.type === 'pi');
                if (piIdx !== -1) {
                    toCaps.push(fromCaps.splice(piIdx, 1)[0]);
                }
            }

            // 삼뻑 체크
            if (ppukCount[who] >= 3) {
                _showToast(`${who === 'player' ? '' : 'AI: '}삼뻑! 자동 패배!`, 'error');
                _showEvent('삼뻑!', 'ppuk');
                setTimeout(() => _endGame(who === 'player' ? 'ai' : 'player'), 1000);
                return;
            }
        } else if (matching.length >= 3) {
            // 뻑 풀기/따닥
            matching.forEach(m => field.splice(field.indexOf(m), 1));
            captures.push(drawn, ...matching);
            _showEvent('따닥!', 'ddadak');
            _stealPi(who, 2);
        }

        _renderAll();
        await _delay(300);
        _afterResolve(who);
    }

    // === 뒤집기 후 처리 ===
    function _afterResolve(who) {
        const caps = who === 'player' ? playerCaptures : aiCaptures;
        const score = _calcScore(caps);
        const prevGo = goCount[who];

        const threshold = prevGo > 0 ? 3 + prevGo : 3;
        if (score >= threshold) {
            if (who === 'player') {
                gamePhase = 'go-decision';
                _renderAll();
                _updateUI();
                return;
            } else {
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

            // 나가리: 둘 다 3점 미만
            if (pScore < 3 && aScore < 3) {
                nagariMultiplier *= 2;
                gamePhase = 'finished';
                ChipManager.addChips(betAmount);
                const resultEl = document.getElementById('gostopResult');
                if (resultEl) {
                    resultEl.className = 'gostop-result';
                    resultEl.style.color = '#f0d078';
                    resultEl.style.background = 'rgba(240,208,120,0.1)';
                    resultEl.innerHTML = `<div class="gs-result-title">나가리! (무승부)</div>` +
                        `<div class="gs-result-detail">양쪽 모두 3점 미만 → 다음 판 ${nagariMultiplier}배</div>` +
                        `<div class="gs-result-detail">베팅금 ${betAmount.toLocaleString()}칩 반환</div>`;
                }
                _showEvent('나가리!', 'ppuk');
                stats.played++;
                _saveStats();
                _renderAll();
                _updateUI();
                return;
            }

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

        if (gwang.length >= 5) score += 15;
        else if (gwang.length === 4) score += 4;
        else if (gwang.length === 3) {
            score += gwang.some(c => c.month === 12) ? 2 : 3;
        }

        if ([2, 4, 8].every(m => captures.some(c => c.month === m && c.type === 'yeol'))) {
            score += 5;
        }

        const hongDan = tti.filter(c => c.type === 'tti-hong');
        const cheongDan = tti.filter(c => c.type === 'tti-cheong');
        const choDan = tti.filter(c => c.type === 'tti-cho');
        if (hongDan.length >= 3) score += 3;
        if (cheongDan.length >= 3) score += 3;
        if (choDan.length >= 3) score += 3;

        if (tti.length >= 5) score += (tti.length - 4);
        if (yeol.length >= 5) score += (yeol.length - 4);
        if (piCount >= 10) score += (piCount - 9);

        return score;
    }

    // === 점수 상세 내역 ===
    function _getScoreDetails(captures) {
        const details = [];
        const gwang = captures.filter(c => c.type === 'gwang');
        const tti = captures.filter(c => c.type.startsWith('tti-'));
        const yeol = captures.filter(c => c.type === 'yeol');
        let piCount = 0;
        captures.forEach(c => {
            if (c.type === 'pi') piCount++;
            if (c.type === 'ssang-pi') piCount += 2;
        });

        if (gwang.length >= 5) details.push({ label: `광 ${gwang.length}장`, score: 15 });
        else if (gwang.length === 4) details.push({ label: '광 4장', score: 4 });
        else if (gwang.length === 3) {
            const has12 = gwang.some(c => c.month === 12);
            details.push({ label: `광 3장${has12 ? '(비광)' : ''}`, score: has12 ? 2 : 3 });
        }

        if ([2, 4, 8].every(m => captures.some(c => c.month === m && c.type === 'yeol'))) {
            details.push({ label: '고도리', score: 5 });
        }

        const hongDan = tti.filter(c => c.type === 'tti-hong');
        const cheongDan = tti.filter(c => c.type === 'tti-cheong');
        const choDan = tti.filter(c => c.type === 'tti-cho');
        if (hongDan.length >= 3) details.push({ label: '홍단', score: 3 });
        if (cheongDan.length >= 3) details.push({ label: '청단', score: 3 });
        if (choDan.length >= 3) details.push({ label: '초단', score: 3 });

        if (tti.length >= 5) details.push({ label: `띠 ${tti.length}장`, score: tti.length - 4 });
        if (yeol.length >= 5) details.push({ label: `열끗 ${yeol.length}장`, score: yeol.length - 4 });
        if (piCount >= 10) details.push({ label: `피 ${piCount}장`, score: piCount - 9 });

        return details;
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

    // === 게임 종료 + 상세 결과 ===
    function _endGame(winner, isChongtong) {
        gamePhase = 'finished';
        const loser = winner === 'player' ? 'ai' : 'player';
        const wCaps = winner === 'player' ? playerCaptures : aiCaptures;
        const lCaps = loser === 'player' ? playerCaptures : aiCaptures;
        const baseScore = isChongtong ? 10 : _calcScore(wCaps);

        let multiplier = 1;
        const multiplierReasons = [];

        if (nagariMultiplier > 1) {
            multiplier *= nagariMultiplier;
            multiplierReasons.push(`나가리 x${nagariMultiplier}`);
        }

        if (isChongtong) {
            multiplier *= 10;
            multiplierReasons.push('총통 x10');
        } else {
            const goCnt = goCount[winner];
            if (goCnt >= 3) {
                const goMul = Math.pow(2, goCnt - 2);
                multiplier *= goMul;
                multiplierReasons.push(`${goCnt}고 x${goMul}`);
            }

            const loserPi = _getScoreBreakdown(lCaps).pi;
            if (loserPi <= 7) {
                multiplier *= 2;
                multiplierReasons.push('피박 x2');
            }

            const wGwang = wCaps.filter(c => c.type === 'gwang').length;
            const lGwang = lCaps.filter(c => c.type === 'gwang').length;
            if (wGwang >= 3 && lGwang === 0) {
                multiplier *= 2;
                multiplierReasons.push('광박 x2');
            }

            const lYeol = lCaps.filter(c => c.type === 'yeol').length;
            if (lYeol === 0 && _getScoreBreakdown(wCaps).yeol >= 5) {
                multiplier *= 2;
                multiplierReasons.push('멍박 x2');
            }

            if (shakeCount[winner] > 0) {
                const shakeMul = Math.pow(2, shakeCount[winner]);
                multiplier *= shakeMul;
                multiplierReasons.push(`흔들기 x${shakeMul}`);
            }

            if (bombUsed[winner]) {
                multiplier *= 2;
                multiplierReasons.push('폭탄 x2');
            }
        }

        const finalScore = isChongtong ? 10 : (baseScore + Math.min(goCount[winner], 2));
        const chipPerPoint = betAmount;
        const winAmount = Math.floor(chipPerPoint * finalScore * multiplier);

        const scoreDetails = isChongtong ? [{ label: '총통', score: 10 }] : _getScoreDetails(wCaps);
        const goBonus = isChongtong ? 0 : Math.min(goCount[winner], 2);

        const resultEl = document.getElementById('gostopResult');
        if (resultEl) {
            if (winner === 'player') {
                ChipManager.addChips(winAmount + betAmount);
                resultEl.className = 'gostop-result win';
                let html = `<div class="gs-result-title">승리!</div>`;
                html += `<div class="gs-result-scores">`;
                scoreDetails.forEach(d => {
                    html += `<span class="gs-result-score-item">${d.label}: ${d.score}점</span>`;
                });
                if (goBonus > 0) html += `<span class="gs-result-score-item">고 보너스: +${goBonus}점</span>`;
                html += `</div>`;
                html += `<div class="gs-result-calc">`;
                html += `${finalScore}점 × ${chipPerPoint.toLocaleString()}칩`;
                if (multiplier > 1) html += ` × ${multiplier}배`;
                html += ` = <strong>+${winAmount.toLocaleString()}칩</strong>`;
                html += `</div>`;
                if (multiplierReasons.length > 0) {
                    html += `<div class="gs-result-mult">${multiplierReasons.join(' · ')}</div>`;
                }
                resultEl.innerHTML = html;
                if (typeof SoundManager !== 'undefined') SoundManager.playWin();
                if (typeof CoinShower !== 'undefined') CoinShower.start(2000, winAmount > 500 ? 'big' : 'normal');
                stats.won++;
            } else {
                resultEl.className = 'gostop-result lose';
                let html = `<div class="gs-result-title">패배!</div>`;
                html += `<div class="gs-result-scores">`;
                scoreDetails.forEach(d => {
                    html += `<span class="gs-result-score-item">${d.label}: ${d.score}점</span>`;
                });
                if (goBonus > 0) html += `<span class="gs-result-score-item">AI 고 보너스: +${goBonus}점</span>`;
                html += `</div>`;
                html += `<div class="gs-result-calc">`;
                html += `AI ${finalScore}점`;
                if (multiplier > 1) html += ` × ${multiplier}배`;
                html += ` → -${betAmount.toLocaleString()}칩`;
                html += `</div>`;
                if (multiplierReasons.length > 0) {
                    html += `<div class="gs-result-mult">${multiplierReasons.join(' · ')}</div>`;
                }
                resultEl.innerHTML = html;
                if (typeof SoundManager !== 'undefined') SoundManager.playLose();
            }
        }

        nagariMultiplier = 1;
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
                const hasMatch = field.some(f => f.month === card.month);
                if (hasMatch) el.classList.add('has-match');
                el.onclick = () => playCard(card.id);
                el.addEventListener('mouseenter', () => _highlightFieldCards(card.month));
                el.addEventListener('mouseleave', () => _clearFieldHighlights());
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
            el.dataset.month = card.month;
            if (gamePhase === 'selecting' && matchingFieldCards.some(m => m.id === card.id)) {
                el.classList.add('selectable');
                el.onclick = () => selectFieldCard(card.id);
            }
            container.appendChild(el);
        });
    }

    // === 매칭 하이라이트 ===
    function _highlightFieldCards(month) {
        const container = document.getElementById('fieldCards');
        if (!container) return;
        container.querySelectorAll('.hwatu-card').forEach(el => {
            if (parseInt(el.dataset.month) === month) {
                el.classList.add('match-hint');
            }
        });
    }

    function _clearFieldHighlights() {
        const container = document.getElementById('fieldCards');
        if (!container) return;
        container.querySelectorAll('.match-hint').forEach(el => el.classList.remove('match-hint'));
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

    // === 액션 패널 ===
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

        _setText('gsStat1', stats.played);
        _setText('gsStat2', stats.won);
        _setText('gsStat3', stats.played > 0 ? Math.round(stats.won / stats.played * 100) + '%' : '-');

        const hc = document.getElementById('headerChips');
        if (hc) hc.textContent = ChipManager.formatBalance();

        _renderMultiplierBadges();
    }

    function _renderMultiplierBadges() {
        const container = document.getElementById('multiplierBadges');
        if (!container) return;
        container.innerHTML = '';

        if (nagariMultiplier > 1) _addBadge(container, `나가리 x${nagariMultiplier}`, 'nagari');
        if (shakeCount.player > 0) _addBadge(container, `흔들기 x${Math.pow(2, shakeCount.player)}`, 'shake');
        if (bombUsed.player) _addBadge(container, '폭탄 x2', 'bomb');
        if (goCount.player > 0) _addBadge(container, `${goCount.player}고`, 'go');
        if (ppukCount.player > 0) _addBadge(container, `뻑 ${ppukCount.player}회`, 'ppuk-badge');
        if (shakeCount.ai > 0) _addBadge(container, 'AI 흔들기', 'shake-ai');
        if (bombUsed.ai) _addBadge(container, 'AI 폭탄', 'bomb-ai');
        if (ppukCount.ai > 0) _addBadge(container, `AI 뻑 ${ppukCount.ai}회`, 'ppuk-badge');
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

    // === 이벤트 알림 ===
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
