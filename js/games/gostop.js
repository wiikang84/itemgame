/* ============================================
   맞고 (고스톱) v1.0 - Go-Stop Game Module
   한국 전통 화투 게임 (AI 1명 대전)
   48장 화투패, 광/띠/피/열끗 점수 체계
   ============================================ */

const GoStopGame = (() => {
    'use strict';

    // === 화투패 데이터 (12월 x 4장) ===
    // type: 'gwang'(광), 'tti-hong'(홍단), 'tti-cheong'(청단), 'tti-cho'(초단), 'yeol'(열끗), 'pi'(피), 'ssang-pi'(쌍피)
    const CARDS = [
        // 1월 - 송학 (소나무/학)
        { month: 1, name: '1월 광', type: 'gwang', emoji: '🌸', label: '松鶴' },
        { month: 1, name: '1월 홍단', type: 'tti-hong', emoji: '🌸', label: '松' },
        { month: 1, name: '1월 피1', type: 'pi', emoji: '🌸', label: '' },
        { month: 1, name: '1월 피2', type: 'pi', emoji: '🌸', label: '' },
        // 2월 - 매조 (매화/꾀꼬리)
        { month: 2, name: '2월 열끗', type: 'yeol', emoji: '🌺', label: '梅鳥' },
        { month: 2, name: '2월 홍단', type: 'tti-hong', emoji: '🌺', label: '梅' },
        { month: 2, name: '2월 피1', type: 'pi', emoji: '🌺', label: '' },
        { month: 2, name: '2월 피2', type: 'pi', emoji: '🌺', label: '' },
        // 3월 - 벚꽃
        { month: 3, name: '3월 광', type: 'gwang', emoji: '🌷', label: '桜幕' },
        { month: 3, name: '3월 홍단', type: 'tti-hong', emoji: '🌷', label: '桜' },
        { month: 3, name: '3월 피1', type: 'pi', emoji: '🌷', label: '' },
        { month: 3, name: '3월 피2', type: 'pi', emoji: '🌷', label: '' },
        // 4월 - 흑싸리 (등나무/두견)
        { month: 4, name: '4월 열끗', type: 'yeol', emoji: '🌿', label: '藤鳥' },
        { month: 4, name: '4월 초단', type: 'tti-cho', emoji: '🌿', label: '藤' },
        { month: 4, name: '4월 피1', type: 'pi', emoji: '🌿', label: '' },
        { month: 4, name: '4월 피2', type: 'pi', emoji: '🌿', label: '' },
        // 5월 - 난초 (창포/나비)
        { month: 5, name: '5월 열끗', type: 'yeol', emoji: '🌻', label: '蘭橋' },
        { month: 5, name: '5월 초단', type: 'tti-cho', emoji: '🌻', label: '蘭' },
        { month: 5, name: '5월 피1', type: 'pi', emoji: '🌻', label: '' },
        { month: 5, name: '5월 피2', type: 'pi', emoji: '🌻', label: '' },
        // 6월 - 목단 (모란/나비)
        { month: 6, name: '6월 열끗', type: 'yeol', emoji: '🦋', label: '牧丹蝶' },
        { month: 6, name: '6월 청단', type: 'tti-cheong', emoji: '🦋', label: '牧丹' },
        { month: 6, name: '6월 피1', type: 'pi', emoji: '🦋', label: '' },
        { month: 6, name: '6월 피2', type: 'pi', emoji: '🦋', label: '' },
        // 7월 - 홍싸리 (싸리/멧돼지)
        { month: 7, name: '7월 열끗', type: 'yeol', emoji: '🐗', label: '萩猪' },
        { month: 7, name: '7월 초단', type: 'tti-cho', emoji: '🐗', label: '萩' },
        { month: 7, name: '7월 피1', type: 'pi', emoji: '🐗', label: '' },
        { month: 7, name: '7월 피2', type: 'pi', emoji: '🐗', label: '' },
        // 8월 - 공산 (억새/기러기/달)
        { month: 8, name: '8월 광', type: 'gwang', emoji: '🌕', label: '芒月' },
        { month: 8, name: '8월 열끗', type: 'yeol', emoji: '🌕', label: '芒雁' },
        { month: 8, name: '8월 피1', type: 'pi', emoji: '🌕', label: '' },
        { month: 8, name: '8월 피2', type: 'pi', emoji: '🌕', label: '' },
        // 9월 - 국진 (국화/잔)
        { month: 9, name: '9월 열끗', type: 'yeol', emoji: '🍶', label: '菊盃' },
        { month: 9, name: '9월 청단', type: 'tti-cheong', emoji: '🍶', label: '菊' },
        { month: 9, name: '9월 피1', type: 'pi', emoji: '🍶', label: '' },
        { month: 9, name: '9월 피2', type: 'pi', emoji: '🍶', label: '' },
        // 10월 - 단풍 (단풍/사슴)
        { month: 10, name: '10월 열끗', type: 'yeol', emoji: '🍁', label: '楓鹿' },
        { month: 10, name: '10월 청단', type: 'tti-cheong', emoji: '🍁', label: '楓' },
        { month: 10, name: '10월 피1', type: 'pi', emoji: '🍁', label: '' },
        { month: 10, name: '10월 피2', type: 'pi', emoji: '🍁', label: '' },
        // 11월 - 오동 (오동/봉황)
        { month: 11, name: '11월 광', type: 'gwang', emoji: '🌳', label: '桐鳳' },
        { month: 11, name: '11월 피1', type: 'ssang-pi', emoji: '🌳', label: '' },  // 쌍피
        { month: 11, name: '11월 피2', type: 'pi', emoji: '🌳', label: '' },
        { month: 11, name: '11월 피3', type: 'pi', emoji: '🌳', label: '' },
        // 12월 - 비 (비/사람)
        { month: 12, name: '12월 광', type: 'gwang', emoji: '☔', label: '雨人' },
        { month: 12, name: '12월 열끗', type: 'yeol', emoji: '☔', label: '雨鳥' },
        { month: 12, name: '12월 피1', type: 'ssang-pi', emoji: '☔', label: '' },  // 쌍피
        { month: 12, name: '12월 피2', type: 'pi', emoji: '☔', label: '' }
    ];

    const MONTH_NAMES = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const MONTH_COLORS = ['', '#ff6b9d', '#ff8fa3', '#ffb3c1', '#90e0a8', '#a0d995', '#8ecae6', '#d4a843', '#f0d078', '#ffd166', '#e07b39', '#8b6914', '#607d8b'];

    // === 상태 ===
    let deck = [];
    let playerHand = [];  // 내 패
    let aiHand = [];       // AI 패
    let field = [];        // 바닥 패
    let drawPile = [];     // 뒷패 (남은 덱)
    let playerCaptures = []; // 내가 먹은 패
    let aiCaptures = [];     // AI가 먹은 패
    let currentTurn = 'player'; // 'player' | 'ai'
    let gamePhase = 'waiting'; // waiting, playing, selecting, go-decision, finished
    let selectedCard = null;
    let betAmount = 100;
    let goCount = { player: 0, ai: 0 };
    let stats = { played: 0, won: 0 };
    let matchingFieldCards = []; // 선택할 바닥패 목록
    let pendingAction = null;

    // === 초기화 ===
    function init() {
        _loadStats();
        _updateUI();
    }

    // === 덱 생성 & 셔플 ===
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
        playerHand = [];
        aiHand = [];
        field = [];
        drawPile = [];
        playerCaptures = [];
        aiCaptures = [];
        selectedCard = null;
        goCount = { player: 0, ai: 0 };
        matchingFieldCards = [];
        pendingAction = null;

        // 딜: 플레이어 7장, AI 7장, 바닥 6장, 나머지는 뒷패
        for (let i = 0; i < 7; i++) playerHand.push(deck.pop());
        for (let i = 0; i < 7; i++) aiHand.push(deck.pop());
        for (let i = 0; i < 6; i++) field.push(deck.pop());
        drawPile = [...deck];

        // 패 정렬
        playerHand.sort((a, b) => a.month - b.month);
        aiHand.sort((a, b) => a.month - b.month);

        currentTurn = 'player';
        gamePhase = 'playing';
        _playSfx('deal');
        _renderAll();
        _updateUI();
    }

    // === 카드 내기 (플레이어) ===
    function playCard(cardId) {
        if (gamePhase !== 'playing' || currentTurn !== 'player') return;

        const cardIdx = playerHand.findIndex(c => c.id === cardId);
        if (cardIdx === -1) return;

        const card = playerHand[cardIdx];
        const matching = field.filter(f => f.month === card.month);

        if (matching.length === 0) {
            // 바닥에 놓기
            playerHand.splice(cardIdx, 1);
            field.push(card);
            _playSfx('place');
            _afterPlay('player');
        } else if (matching.length === 1) {
            // 1장 매치 → 자동 가져가기
            playerHand.splice(cardIdx, 1);
            const matched = matching[0];
            field.splice(field.indexOf(matched), 1);
            playerCaptures.push(card, matched);
            _playSfx('match');
            _afterPlay('player');
        } else {
            // 2장 이상 매치 → 선택 필요
            selectedCard = card;
            matchingFieldCards = matching;
            gamePhase = 'selecting';
            _renderAll();
            _updateUI();
        }
    }

    // === 바닥패 선택 (2장 이상 매치 시) ===
    function selectFieldCard(cardId) {
        if (gamePhase !== 'selecting') return;

        const chosen = matchingFieldCards.find(c => c.id === cardId);
        if (!chosen) return;

        const cardIdx = playerHand.indexOf(selectedCard);
        if (cardIdx !== -1) playerHand.splice(cardIdx, 1);
        field.splice(field.indexOf(chosen), 1);
        playerCaptures.push(selectedCard, chosen);

        selectedCard = null;
        matchingFieldCards = [];
        gamePhase = 'playing';
        _playSfx('match');
        _afterPlay('player');
    }

    // === 카드 내기 후 처리 (뒷패 뒤집기) ===
    async function _afterPlay(who) {
        _renderAll();
        await _delay(400);

        // 뒷패에서 1장 뒤집기
        if (drawPile.length > 0) {
            _playSfx('flip');
            const drawn = drawPile.pop();
            const matching = field.filter(f => f.month === drawn.month);
            const captures = who === 'player' ? playerCaptures : aiCaptures;

            if (matching.length === 0) {
                field.push(drawn);
            } else if (matching.length === 1) {
                field.splice(field.indexOf(matching[0]), 1);
                captures.push(drawn, matching[0]);
            } else if (matching.length >= 2) {
                // 뒷패로 뒤집은 카드가 2장 이상 매치 → 첫번째 것과 매칭
                field.splice(field.indexOf(matching[0]), 1);
                captures.push(drawn, matching[0]);
            }
        }

        _renderAll();
        await _delay(300);

        // 점수 체크 → 고/스톱 판단
        const score = _calcScore(who === 'player' ? playerCaptures : aiCaptures);
        if (score >= 3 && (who === 'player' ? goCount.player : goCount.ai) === 0) {
            // 처음으로 3점 이상 달성
            if (who === 'player') {
                gamePhase = 'go-decision';
                _renderAll();
                _updateUI();
                return; // 플레이어가 고/스톱 결정
            } else {
                // AI는 5점 미만이면 GO
                if (score < 5) {
                    goCount.ai++;
                    _showToast('AI: 고! 🔥', 'info');
                } else {
                    _endGame('ai');
                    return;
                }
            }
        }

        // 추가 고 체크 (이미 고 한 상태에서 점수 증가)
        const prevGo = who === 'player' ? goCount.player : goCount.ai;
        if (prevGo > 0) {
            const prevScore = _calcScore(who === 'player' ? playerCaptures : aiCaptures);
            if (prevScore > (3 + prevGo)) {
                if (who === 'player') {
                    gamePhase = 'go-decision';
                    _renderAll();
                    _updateUI();
                    return;
                } else {
                    if (prevScore < 7) {
                        goCount.ai++;
                        _showToast('AI: 고! 🔥🔥', 'info');
                    } else {
                        _endGame('ai');
                        return;
                    }
                }
            }
        }

        // 패가 없으면 종료
        if (playerHand.length === 0 && aiHand.length === 0) {
            // 무승부 또는 점수 높은 사람 승
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
            setTimeout(() => _aiTurn(), 600);
        } else {
            currentTurn = 'player';
            _renderAll();
            _updateUI();
        }
    }

    // === 고/스톱 결정 ===
    function goDecision(choice) {
        if (gamePhase !== 'go-decision') return;

        if (choice === 'go') {
            goCount.player++;
            _playSfx('go');
            _showToast('고! 🔥 배당 ' + (goCount.player + 1) + '배', 'success');
            gamePhase = 'playing';
            currentTurn = 'ai';
            _renderAll();
            _updateUI();
            setTimeout(() => _aiTurn(), 600);
        } else {
            _playSfx('stop');
            _endGame('player');
        }
    }

    // === AI 턴 ===
    function _aiTurn() {
        if (gamePhase !== 'playing' || currentTurn !== 'ai') return;
        if (aiHand.length === 0) {
            // AI 패가 없으면 턴 넘기기
            currentTurn = 'player';
            _renderAll();
            _updateUI();
            return;
        }

        // AI 전략: 매칭 가능한 카드 우선, 그중 높은 타입 우선
        const typeScore = { 'gwang': 10, 'yeol': 5, 'tti-hong': 4, 'tti-cheong': 4, 'tti-cho': 4, 'ssang-pi': 2, 'pi': 1 };

        let bestCard = null;
        let bestMatchScore = -1;

        for (const card of aiHand) {
            const matching = field.filter(f => f.month === card.month);
            if (matching.length > 0) {
                // 매칭 가능 → 가져올 수 있는 패 중 가장 높은 점수
                const matchScore = Math.max(...matching.map(m => typeScore[m.type] || 0)) + (typeScore[card.type] || 0);
                if (matchScore > bestMatchScore) {
                    bestMatchScore = matchScore;
                    bestCard = card;
                }
            }
        }

        // 매칭 가능한 카드가 없으면 가장 낮은 가치 카드 버리기
        if (!bestCard) {
            bestCard = aiHand.reduce((low, c) => (!low || (typeScore[c.type] || 0) < (typeScore[low.type] || 0)) ? c : low, null);
        }

        if (!bestCard) return;

        const cardIdx = aiHand.indexOf(bestCard);
        const matching = field.filter(f => f.month === bestCard.month);

        if (matching.length === 0) {
            aiHand.splice(cardIdx, 1);
            field.push(bestCard);
            _playSfx('place');
        } else {
            aiHand.splice(cardIdx, 1);
            // 가장 가치 높은 매칭 카드 선택
            const bestMatch = matching.reduce((best, m) => (!best || (typeScore[m.type] || 0) > (typeScore[best.type] || 0)) ? m : best, null);
            field.splice(field.indexOf(bestMatch), 1);
            aiCaptures.push(bestCard, bestMatch);
            _playSfx('match');
        }

        _afterPlay('ai');
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

        // 광 점수
        if (gwang.length >= 5) score += 15;
        else if (gwang.length === 4) score += 4;
        else if (gwang.length === 3) {
            // 비광(12월 광) 포함 여부
            const hasRain = gwang.some(c => c.month === 12);
            score += hasRain ? 2 : 3;
        }

        // 띠 점수
        const hongDan = tti.filter(c => c.type === 'tti-hong');
        const cheongDan = tti.filter(c => c.type === 'tti-cheong');
        const choDan = tti.filter(c => c.type === 'tti-cho');

        if (hongDan.length >= 3) score += 3;
        if (cheongDan.length >= 3) score += 3;
        if (choDan.length >= 3) score += 3;
        if (tti.length >= 5) score += (tti.length - 4);

        // 열끗 점수
        if (yeol.length >= 5) score += (yeol.length - 4);

        // 피 점수
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

    // === 게임 종료 ===
    function _endGame(winner) {
        gamePhase = 'finished';

        const multiplier = 1 + (winner === 'player' ? goCount.player : goCount.ai);
        const score = _calcScore(winner === 'player' ? playerCaptures : aiCaptures);
        const winAmount = Math.floor(betAmount * score * multiplier);

        const resultEl = document.getElementById('gostopResult');
        if (resultEl) {
            if (winner === 'player') {
                ChipManager.addChips(winAmount + betAmount); // 원금 + 상금
                resultEl.className = 'gostop-result win';
                resultEl.textContent = `승리! ${score}점 x${multiplier}배 = +${winAmount.toLocaleString()}칩`;
                if (typeof SoundManager !== 'undefined') SoundManager.playWin();
                if (typeof CoinShower !== 'undefined') CoinShower.start(2000, winAmount > 500 ? 'big' : 'normal');
                stats.won++;
            } else {
                resultEl.className = 'gostop-result lose';
                resultEl.textContent = `AI 승리! ${score}점 x${multiplier}배`;
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
            const el = _createCardElement(card);
            if (gamePhase === 'playing' && currentTurn === 'player') {
                el.classList.add('playable');
                el.onclick = () => playCard(card.id);
            }
            if (gamePhase === 'selecting' && matchingFieldCards.length > 0) {
                el.classList.add('dimmed');
            }
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
            const el = _createCardElement(card);
            if (gamePhase === 'selecting' && matchingFieldCards.some(m => m.id === card.id)) {
                el.classList.add('selectable');
                el.onclick = () => selectFieldCard(card.id);
            }
            container.appendChild(el);
        });
    }

    function _renderCaptures(who, captures) {
        const gwangEl = document.getElementById(`${who}Gwang`);
        const ttiEl = document.getElementById(`${who}Tti`);
        const yeolEl = document.getElementById(`${who}Yeol`);
        const piEl = document.getElementById(`${who}Pi`);

        if (gwangEl) {
            gwangEl.innerHTML = '';
            captures.filter(c => c.type === 'gwang').forEach(c => {
                gwangEl.appendChild(_createMiniCard(c));
            });
        }
        if (ttiEl) {
            ttiEl.innerHTML = '';
            captures.filter(c => c.type.startsWith('tti-')).forEach(c => {
                ttiEl.appendChild(_createMiniCard(c));
            });
        }
        if (yeolEl) {
            yeolEl.innerHTML = '';
            captures.filter(c => c.type === 'yeol').forEach(c => {
                yeolEl.appendChild(_createMiniCard(c));
            });
        }
        if (piEl) {
            piEl.innerHTML = '';
            captures.filter(c => c.type === 'pi' || c.type === 'ssang-pi').forEach(c => {
                piEl.appendChild(_createMiniCard(c));
            });
        }
    }

    function _renderScores() {
        const pScore = _calcScore(playerCaptures);
        const aScore = _calcScore(aiCaptures);
        const pBreak = _getScoreBreakdown(playerCaptures);
        const aBreak = _getScoreBreakdown(aiCaptures);

        const pScoreEl = document.getElementById('playerScore');
        const aScoreEl = document.getElementById('aiScore');
        if (pScoreEl) pScoreEl.textContent = pScore + '점';
        if (aScoreEl) aScoreEl.textContent = aScore + '점';

        const pDetailEl = document.getElementById('playerDetail');
        const aDetailEl = document.getElementById('aiDetail');
        if (pDetailEl) pDetailEl.textContent = `광${pBreak.gwang} 띠${pBreak.tti} 열${pBreak.yeol} 피${pBreak.pi}`;
        if (aDetailEl) aDetailEl.textContent = `광${aBreak.gwang} 띠${aBreak.tti} 열${aBreak.yeol} 피${aBreak.pi}`;

        // 뒷패 수
        const drawEl = document.getElementById('drawCount');
        if (drawEl) drawEl.textContent = drawPile.length;

        // 턴 표시
        const turnEl = document.getElementById('turnIndicator');
        if (turnEl) {
            if (gamePhase === 'go-decision') turnEl.textContent = '고? 스톱?';
            else if (gamePhase === 'playing') turnEl.textContent = currentTurn === 'player' ? '내 턴' : 'AI 턴';
            else if (gamePhase === 'selecting') turnEl.textContent = '바닥패 선택';
            else turnEl.textContent = '';
        }
    }

    function _createCardElement(card) {
        const el = document.createElement('div');
        el.className = `hwatu-card`;
        el.dataset.id = card.id;

        const imgSrc = HwatuRenderer.render(card);
        el.innerHTML = `<img src="${imgSrc}" alt="${card.name}" draggable="false">`;
        return el;
    }

    function _createMiniCard(card) {
        const el = document.createElement('div');
        el.className = 'hwatu-mini';
        el.title = card.name;

        const imgSrc = HwatuRenderer.renderMini(card);
        el.innerHTML = `<img src="${imgSrc}" alt="${card.name}" draggable="false">`;
        return el;
    }

    // === UI 업데이트 ===
    function _updateUI() {
        const newGameBtn = document.getElementById('gostopNewGameBtn');
        const goBtn = document.getElementById('goBtn');
        const stopBtn = document.getElementById('stopBtn');
        const goPanel = document.getElementById('goStopPanel');

        if (newGameBtn) newGameBtn.disabled = (gamePhase !== 'waiting' && gamePhase !== 'finished');
        if (goPanel) goPanel.style.display = gamePhase === 'go-decision' ? 'flex' : 'none';

        // 통계
        const sp = document.getElementById('gsStat1');
        const sw = document.getElementById('gsStat2');
        const swr = document.getElementById('gsStat3');
        if (sp) sp.textContent = stats.played;
        if (sw) sw.textContent = stats.won;
        if (swr) swr.textContent = stats.played > 0 ? Math.round(stats.won / stats.played * 100) + '%' : '-';

        // 헤더 칩
        const hc = document.getElementById('headerChips');
        if (hc) hc.textContent = ChipManager.formatBalance();
    }

    // === 베팅 금액 변경 ===
    function setBet(amount) {
        betAmount = amount;
        document.querySelectorAll('.gs-bet-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.value) === amount);
        });
    }

    // === 유틸 ===
    function _delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    // === 사운드 ===
    function _playSfx(type) {
        if (typeof SoundManager === 'undefined') return;
        try {
            switch (type) {
                case 'deal': SoundManager.playGostopDeal(); break;
                case 'place': SoundManager.playGostopPlace(); break;
                case 'match': SoundManager.playGostopMatch(); break;
                case 'flip': SoundManager.playGostopFlip(); break;
                case 'go': SoundManager.playGostopGo(); break;
                case 'stop': SoundManager.playGostopStop(); break;
                default: SoundManager.playCardDeal(); break;
            }
        } catch (e) { /* ignore */ }
    }

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

    return { init, newGame, playCard, selectFieldCard, goDecision, setBet };
})();
