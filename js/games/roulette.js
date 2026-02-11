/**
 * Roulette - 유럽식 룰렛 게임 엔진
 * ItemGame - 소셜 카지노
 *
 * - 유럽식 37칸 (0~36)
 * - Canvas 휠 애니메이션
 * - 다양한 인사이드/아웃사이드 베팅
 */

const Roulette = (() => {
    // 유럽식 룰렛 숫자 배치 (휠 순서)
    const WHEEL_ORDER = [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36,
        11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
        22, 18, 29, 7, 28, 12, 35, 3, 26
    ];

    // 빨간색 숫자들
    const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

    const MIN_BET = 10;
    const MAX_BET = 10000;

    let canvas, ctx;
    let currentAngle = 0;
    let isSpinning = false;
    let bets = {}; // { 'number_5': 100, 'red': 200, ... }
    let selectedChipValue = 100;
    let lastResult = null;
    let history = [];

    /**
     * 숫자의 색상
     */
    function getColor(num) {
        if (num === 0) return 'green';
        return RED_NUMBERS.includes(num) ? 'red' : 'black';
    }

    /**
     * 초기화
     */
    function init() {
        canvas = document.getElementById('wheelCanvas');
        if (canvas) {
            ctx = canvas.getContext('2d');
            canvas.width = 300;
            canvas.height = 300;
            _drawWheel(0);
        }
        _buildBettingTable();
        _render();
    }

    /**
     * 휠 그리기
     */
    function _drawWheel(angle) {
        if (!ctx) return;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = cx - 5;
        const sliceAngle = (2 * Math.PI) / WHEEL_ORDER.length;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 외곽 원
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#1a0a00';
        ctx.fill();

        // 각 슬라이스
        WHEEL_ORDER.forEach((num, i) => {
            const startAngle = angle + i * sliceAngle - Math.PI / 2;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius - 2, startAngle, endAngle);
            ctx.closePath();

            const color = getColor(num);
            if (color === 'green') ctx.fillStyle = '#006600';
            else if (color === 'red') ctx.fillStyle = '#cc0000';
            else ctx.fillStyle = '#1a1a1a';

            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // 숫자 텍스트
            const textAngle = startAngle + sliceAngle / 2;
            const textRadius = radius - 22;
            const tx = cx + Math.cos(textAngle) * textRadius;
            const ty = cy + Math.sin(textAngle) * textRadius;

            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(textAngle + Math.PI / 2);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(num.toString(), 0, 0);
            ctx.restore();
        });

        // 중앙 원
        ctx.beginPath();
        ctx.arc(cx, cy, 25, 0, 2 * Math.PI);
        ctx.fillStyle = '#2a1500';
        ctx.fill();
        ctx.strokeStyle = var_gold();
        ctx.lineWidth = 2;
        ctx.stroke();

        // 중앙 텍스트
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ITEM', cx, cy - 5);
        ctx.fillText('GAME', cx, cy + 7);
    }

    function var_gold() { return '#ffd700'; }

    /**
     * 베팅 테이블 생성
     */
    function _buildBettingTable() {
        const gridEl = document.getElementById('numberGrid');
        if (!gridEl) return;

        gridEl.innerHTML = '';

        // 0 (3행 차지)
        const zeroCell = document.createElement('div');
        zeroCell.className = 'bet-cell zero-cell';
        zeroCell.textContent = '0';
        zeroCell.onclick = () => _placeBet('number_0');
        zeroCell.dataset.betKey = 'number_0';
        gridEl.appendChild(zeroCell);

        // 1~36 (3행 x 12열)
        // 배치: 행1=[3,6,9,...,36], 행2=[2,5,8,...,35], 행3=[1,4,7,...,34]
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 12; col++) {
                const num = (col * 3) + (3 - row);
                const color = getColor(num);
                const cell = document.createElement('div');
                cell.className = `bet-cell ${color}-cell`;
                cell.textContent = num;
                cell.onclick = () => _placeBet(`number_${num}`);
                cell.dataset.betKey = `number_${num}`;
                gridEl.appendChild(cell);
            }
        }

        // 아웃사이드 베팅
        const outsideEl = document.getElementById('outsideBets');
        if (!outsideEl) return;

        const outsideBets = [
            { key: '1st12', label: '1st 12', desc: '(1-12)' },
            { key: '2nd12', label: '2nd 12', desc: '(13-24)' },
            { key: '3rd12', label: '3rd 12', desc: '(25-36)' },
            { key: '1to18', label: '1-18', desc: '' },
            { key: 'even', label: 'EVEN', desc: '짝수' },
            { key: 'red', label: '◆', desc: '빨강', cls: 'red-bg' },
            { key: 'black', label: '◆', desc: '검정', cls: 'black-bg' },
            { key: 'odd', label: 'ODD', desc: '홀수' },
            { key: '19to36', label: '19-36', desc: '' },
        ];

        outsideEl.innerHTML = '';
        outsideBets.forEach(b => {
            const cell = document.createElement('div');
            cell.className = `outside-bet ${b.cls || ''}`;
            cell.innerHTML = `${b.label}<br><small>${b.desc}</small>`;
            cell.onclick = () => _placeBet(b.key);
            cell.dataset.betKey = b.key;
            outsideEl.appendChild(cell);
        });

        // 컬럼 베팅
        const colEl = document.getElementById('columnBets');
        if (!colEl) return;
        colEl.innerHTML = '';
        for (let col = 1; col <= 3; col++) {
            const cell = document.createElement('div');
            cell.className = 'outside-bet';
            cell.textContent = `Col ${col} (2:1)`;
            cell.onclick = () => _placeBet(`col_${col}`);
            cell.dataset.betKey = `col_${col}`;
            colEl.appendChild(cell);
        }
    }

    /**
     * 베팅 놓기
     */
    function _placeBet(key) {
        if (isSpinning) return;

        const totalBet = _getTotalBet();
        if (totalBet + selectedChipValue > ChipManager.getBalance()) {
            _showStatus('칩이 부족합니다!');
            return;
        }

        if (!bets[key]) bets[key] = 0;
        bets[key] += selectedChipValue;

        _updateBetMarkers();
        _render();
    }

    /**
     * 총 베팅액
     */
    function _getTotalBet() {
        return Object.values(bets).reduce((sum, v) => sum + v, 0);
    }

    /**
     * 베팅 마커 업데이트
     */
    function _updateBetMarkers() {
        // 기존 마커 제거
        document.querySelectorAll('.chip-marker').forEach(el => el.remove());
        document.querySelectorAll('.bet-cell.selected, .outside-bet.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // 베팅된 셀에 마커 표시
        Object.keys(bets).forEach(key => {
            if (bets[key] <= 0) return;
            const cell = document.querySelector(`[data-bet-key="${key}"]`);
            if (cell) {
                cell.classList.add('selected');
                const marker = document.createElement('div');
                marker.className = 'chip-marker';
                marker.textContent = _formatShort(bets[key]);
                cell.appendChild(marker);
            }
        });
    }

    /**
     * 숫자 약어 포맷 (1000→1K)
     */
    function _formatShort(n) {
        if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
        return n.toString();
    }

    /**
     * 스핀
     */
    async function spin() {
        if (isSpinning) return;

        const totalBet = _getTotalBet();
        if (totalBet === 0) {
            _showStatus('베팅을 먼저 놓아주세요!');
            return;
        }

        // 칩 차감
        if (!ChipManager.deductChips(totalBet)) {
            _showStatus('칩이 부족합니다!');
            return;
        }

        isSpinning = true;
        _render();

        // 결과 숫자 결정
        const resultIdx = Math.floor(Math.random() * WHEEL_ORDER.length);
        const resultNumber = WHEEL_ORDER[resultIdx];

        // 휠 애니메이션
        await _animateWheel(resultIdx);

        lastResult = resultNumber;
        history.unshift(resultNumber);
        if (history.length > 20) history.pop();

        // 당첨 계산
        const winAmount = _calculateWinnings(resultNumber);

        if (winAmount > 0) {
            ChipManager.addChips(winAmount);
            _showResult(resultNumber, winAmount, true);
        } else {
            _showResult(resultNumber, 0, false);
        }

        isSpinning = false;
        bets = {};
        _updateBetMarkers();
        _render();
    }

    /**
     * 휠 스핀 애니메이션
     */
    function _animateWheel(targetIdx) {
        return new Promise(resolve => {
            const sliceAngle = (2 * Math.PI) / WHEEL_ORDER.length;
            // 목표 각도: 해당 슬라이스 중앙
            const targetAngle = -(targetIdx * sliceAngle + sliceAngle / 2);
            // 최소 5바퀴 + 목표 위치
            const totalRotation = Math.PI * 10 + targetAngle - currentAngle;

            const startAngle = currentAngle;
            const duration = 4000; // 4초
            const startTime = performance.now();

            function animate(time) {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // easeOutCubic
                const eased = 1 - Math.pow(1 - progress, 3);

                currentAngle = startAngle + totalRotation * eased;
                _drawWheel(currentAngle);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            }

            requestAnimationFrame(animate);
        });
    }

    /**
     * 당첨금 계산
     */
    function _calculateWinnings(resultNumber) {
        let totalWin = 0;
        const color = getColor(resultNumber);

        Object.keys(bets).forEach(key => {
            const betAmount = bets[key];
            if (betAmount <= 0) return;

            let multiplier = 0;

            if (key.startsWith('number_')) {
                const num = parseInt(key.split('_')[1]);
                if (num === resultNumber) multiplier = 36; // 35:1 + 원금
            } else if (key === 'red') {
                if (color === 'red') multiplier = 2;
            } else if (key === 'black') {
                if (color === 'black') multiplier = 2;
            } else if (key === 'even') {
                if (resultNumber !== 0 && resultNumber % 2 === 0) multiplier = 2;
            } else if (key === 'odd') {
                if (resultNumber !== 0 && resultNumber % 2 === 1) multiplier = 2;
            } else if (key === '1to18') {
                if (resultNumber >= 1 && resultNumber <= 18) multiplier = 2;
            } else if (key === '19to36') {
                if (resultNumber >= 19 && resultNumber <= 36) multiplier = 2;
            } else if (key === '1st12') {
                if (resultNumber >= 1 && resultNumber <= 12) multiplier = 3;
            } else if (key === '2nd12') {
                if (resultNumber >= 13 && resultNumber <= 24) multiplier = 3;
            } else if (key === '3rd12') {
                if (resultNumber >= 25 && resultNumber <= 36) multiplier = 3;
            } else if (key === 'col_1') {
                if (resultNumber !== 0 && resultNumber % 3 === 1) multiplier = 3;
            } else if (key === 'col_2') {
                if (resultNumber !== 0 && resultNumber % 3 === 2) multiplier = 3;
            } else if (key === 'col_3') {
                if (resultNumber !== 0 && resultNumber % 3 === 0) multiplier = 3;
            }

            totalWin += betAmount * multiplier;
        });

        return totalWin;
    }

    /**
     * 결과 표시
     */
    function _showResult(number, winAmount, isWin) {
        const resultEl = document.getElementById('rouletteResult');
        if (!resultEl) return;

        const color = getColor(number);
        const totalBet = _getTotalBet();

        if (isWin) {
            const net = winAmount - totalBet;
            resultEl.className = 'result-display result-win';
            resultEl.textContent = `${number} (${color === 'red' ? '빨강' : color === 'black' ? '검정' : '초록'}) - WIN! +${net.toLocaleString()} 칩`;
        } else {
            resultEl.className = 'result-display result-lose';
            resultEl.textContent = `${number} (${color === 'red' ? '빨강' : color === 'black' ? '검정' : '초록'}) - LOSE`;
        }

        // 결과 숫자 표시
        const numDisplay = document.getElementById('resultNumberDisplay');
        if (numDisplay) {
            numDisplay.className = `number-display ${color}`;
            numDisplay.textContent = number;
            numDisplay.parentElement.style.display = 'block';
        }

        // 히스토리 업데이트
        _updateHistory();
    }

    /**
     * 히스토리 바 업데이트
     */
    function _updateHistory() {
        const bar = document.getElementById('historyBar');
        if (!bar) return;

        bar.innerHTML = history.map(num => {
            const color = getColor(num);
            return `<div class="history-num h-${color}">${num}</div>`;
        }).join('');
    }

    /**
     * UI 렌더링
     */
    function _render() {
        const chipEl = document.getElementById('headerChips');
        if (chipEl) chipEl.textContent = ChipManager.formatBalance();

        const totalBetEl = document.getElementById('totalBet');
        if (totalBetEl) totalBetEl.textContent = _getTotalBet().toLocaleString();

        const spinBtn = document.getElementById('spinRouletteBtn');
        if (spinBtn) {
            spinBtn.disabled = isSpinning || _getTotalBet() === 0;
            spinBtn.textContent = isSpinning ? 'SPINNING...' : 'SPIN';
        }

        // 칩 선택 버튼 활성 상태
        document.querySelectorAll('.bet-chip-option').forEach(btn => {
            const val = parseInt(btn.dataset.value);
            btn.classList.toggle('active', val === selectedChipValue);
        });
    }

    /**
     * 칩 값 선택
     */
    function selectChip(value) {
        selectedChipValue = value;
        _render();
    }

    /**
     * 베팅 초기화
     */
    function clearBets() {
        if (isSpinning) return;
        bets = {};
        _updateBetMarkers();
        _render();

        const resultEl = document.getElementById('rouletteResult');
        if (resultEl) {
            resultEl.className = 'result-display';
            resultEl.textContent = '';
        }
    }

    /**
     * 상태 메시지
     */
    function _showStatus(text) {
        const el = document.getElementById('rouletteStatus');
        if (el) {
            el.textContent = text;
            setTimeout(() => { el.textContent = ''; }, 2000);
        }
    }

    return {
        init,
        spin,
        selectChip,
        clearBets,
        getColor,
        MIN_BET,
        MAX_BET
    };
})();
