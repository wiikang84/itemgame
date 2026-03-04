/* ============================================
   화투패 Canvas 렌더러 v1.0
   전통 한국 화투 디자인 - 12월 48장
   Canvas API로 실제 화투 느낌 구현
   ============================================ */

const HwatuRenderer = (() => {
    'use strict';

    const W = 80, H = 116;
    const S = 2; // retina scale
    const CW = W * S, CH = H * S;
    const MW = 36, MH = 52; // mini card
    const cache = new Map();

    // === 월별 테마 색상 ===
    const THEMES = {
        1:  { bg: '#e8f0e0', sky: '#d4e6c8', ground: '#3a6b35', name: '松' },
        2:  { bg: '#f5e6e8', sky: '#f0dde0', ground: '#8b4050', name: '梅' },
        3:  { bg: '#fce4ec', sky: '#f8d0d8', ground: '#c0607a', name: '桜' },
        4:  { bg: '#e8dff0', sky: '#ddd0ea', ground: '#7040a0', name: '藤' },
        5:  { bg: '#e0e8f5', sky: '#d8e0f0', ground: '#4050a0', name: '菖蒲' },
        6:  { bg: '#f5e0e0', sky: '#f0d5d5', ground: '#b04050', name: '牡丹' },
        7:  { bg: '#e0f0e8', sky: '#d5ead5', ground: '#408050', name: '萩' },
        8:  { bg: '#f5f0d0', sky: '#28284a', ground: '#8a7030', name: '芒' },
        9:  { bg: '#f5f0d8', sky: '#f0ebd0', ground: '#b09030', name: '菊' },
        10: { bg: '#f5e0d0', sky: '#f0d8c8', ground: '#c06020', name: '楓' },
        11: { bg: '#e8d8f0', sky: '#e0d0e8', ground: '#6a3090', name: '桐' },
        12: { bg: '#d8dce0', sky: '#9098a0', ground: '#506068', name: '雨' }
    };

    // === 타입별 리본 색상 ===
    const RIBBON_COLORS = {
        'tti-hong': '#c41e3a',
        'tti-cheong': '#1a5fb4',
        'tti-cho': '#2d7d46'
    };

    // === 메인 렌더 함수 ===
    function render(card) {
        const key = 'card_' + card.id;
        if (cache.has(key)) return cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = CW;
        canvas.height = CH;
        const ctx = canvas.getContext('2d');
        ctx.scale(S, S);

        _drawCard(ctx, card);

        const url = canvas.toDataURL('image/png');
        cache.set(key, url);
        return url;
    }

    function renderBack() {
        if (cache.has('back')) return cache.get('back');

        const canvas = document.createElement('canvas');
        canvas.width = CW;
        canvas.height = CH;
        const ctx = canvas.getContext('2d');
        ctx.scale(S, S);

        _drawCardBack(ctx);

        const url = canvas.toDataURL('image/png');
        cache.set('back', url);
        return url;
    }

    function renderMini(card) {
        const key = 'mini_' + card.id;
        if (cache.has(key)) return cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = MW * S;
        canvas.height = MH * S;
        const ctx = canvas.getContext('2d');
        ctx.scale(S, S);

        // 축소 버전
        ctx.save();
        ctx.scale(MW / W, MH / H);
        _drawCard(ctx, card);
        ctx.restore();

        const url = canvas.toDataURL('image/png');
        cache.set(key, url);
        return url;
    }

    // === 카드 그리기 ===
    function _drawCard(ctx, card) {
        const theme = THEMES[card.month];

        // 카드 배경 (아이보리)
        _roundRect(ctx, 0, 0, W, H, 5);
        ctx.fillStyle = '#FFFEF0';
        ctx.fill();

        // 내부 테두리
        _roundRect(ctx, 2, 2, W - 4, H - 4, 3);
        ctx.fillStyle = theme.bg;
        ctx.fill();

        // 월별 아트
        ctx.save();
        ctx.beginPath();
        _roundRect(ctx, 3, 3, W - 6, H - 6, 2);
        ctx.clip();
        _drawMonthArt(ctx, card);
        ctx.restore();

        // 외부 테두리
        _roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 5);
        ctx.strokeStyle = card.type === 'gwang' ? '#b8860b' : '#5c3a1e';
        ctx.lineWidth = card.type === 'gwang' ? 2 : 1.2;
        ctx.stroke();

        // 광 카드: 금색 이중 테두리
        if (card.type === 'gwang') {
            _roundRect(ctx, 2, 2, W - 4, H - 4, 3.5);
            ctx.strokeStyle = 'rgba(184, 134, 11, 0.4)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }

        // 월 표시
        _drawMonthLabel(ctx, card);

        // 타입 뱃지
        _drawTypeBadge(ctx, card);
    }

    function _drawMonthArt(ctx, card) {
        switch (card.month) {
            case 1: _drawMonth1(ctx, card); break;
            case 2: _drawMonth2(ctx, card); break;
            case 3: _drawMonth3(ctx, card); break;
            case 4: _drawMonth4(ctx, card); break;
            case 5: _drawMonth5(ctx, card); break;
            case 6: _drawMonth6(ctx, card); break;
            case 7: _drawMonth7(ctx, card); break;
            case 8: _drawMonth8(ctx, card); break;
            case 9: _drawMonth9(ctx, card); break;
            case 10: _drawMonth10(ctx, card); break;
            case 11: _drawMonth11(ctx, card); break;
            case 12: _drawMonth12(ctx, card); break;
        }
    }

    // ========================================
    //  1월 - 소나무 / 학 (Pine / Crane)
    // ========================================
    function _drawMonth1(ctx, card) {
        // 하늘
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#c8dcc0');
        sky.addColorStop(1, '#a0c090');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // 소나무 줄기
        ctx.fillStyle = '#5a3a20';
        ctx.fillRect(32, 30, 6, H - 30);
        ctx.fillRect(28, 28, 4, 50);

        // 소나무 가지 (녹색 뭉치)
        ctx.fillStyle = '#2a5a20';
        _drawPineCluster(ctx, 20, 20, 24, 16);
        _drawPineCluster(ctx, 38, 35, 22, 14);
        _drawPineCluster(ctx, 15, 48, 20, 12);
        _drawPineCluster(ctx, 42, 55, 18, 11);

        // 진한 녹색 레이어
        ctx.fillStyle = '#1a4a15';
        _drawPineCluster(ctx, 22, 24, 18, 10);
        _drawPineCluster(ctx, 40, 40, 16, 9);

        if (card.type === 'gwang') {
            // 태양
            _drawSun(ctx, 60, 14);
            // 학 (두루미)
            _drawCrane(ctx, 25, 65);
        } else if (card.type === 'tti-hong') {
            _drawRibbon(ctx, '#c41e3a', '松');
        }
        // 피: 소나무만
    }

    function _drawPineCluster(ctx, x, y, w, h) {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function _drawCrane(ctx, x, y) {
        // 몸통 (흰색)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x + 15, y + 18, 14, 10, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // 날개 (검은색/회색)
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 14, 10, 5, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // 목
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 26, y + 12);
        ctx.quadraticCurveTo(x + 32, y + 2, x + 28, y - 6);
        ctx.stroke();

        // 머리
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 28, y - 6, 4, 0, Math.PI * 2);
        ctx.fill();

        // 정수리 (빨간 점)
        ctx.fillStyle = '#e00';
        ctx.beginPath();
        ctx.arc(x + 28, y - 8, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 부리
        ctx.fillStyle = '#d4a030';
        ctx.beginPath();
        ctx.moveTo(x + 32, y - 7);
        ctx.lineTo(x + 38, y - 6);
        ctx.lineTo(x + 32, y - 5);
        ctx.fill();

        // 다리
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 28);
        ctx.lineTo(x + 10, y + 40);
        ctx.moveTo(x + 18, y + 28);
        ctx.lineTo(x + 20, y + 40);
        ctx.stroke();
    }

    // ========================================
    //  2월 - 매화 / 꾀꼬리 (Plum / Warbler)
    // ========================================
    function _drawMonth2(ctx, card) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#f0dde0');
        sky.addColorStop(1, '#e8c8d0');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // 매화 가지
        ctx.strokeStyle = '#4a2a1a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-5, H - 20);
        ctx.quadraticCurveTo(20, H - 40, 35, 50);
        ctx.quadraticCurveTo(45, 30, 60, 20);
        ctx.stroke();

        // 얇은 가지
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(35, 50);
        ctx.quadraticCurveTo(15, 35, 10, 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(45, 38);
        ctx.quadraticCurveTo(60, 45, 70, 40);
        ctx.stroke();

        // 매화꽃
        _drawPlumBlossom(ctx, 30, 42, 7);
        _drawPlumBlossom(ctx, 50, 28, 6);
        _drawPlumBlossom(ctx, 15, 25, 5);
        _drawPlumBlossom(ctx, 55, 50, 6);
        _drawPlumBlossom(ctx, 38, 60, 5);
        _drawPlumBlossom(ctx, 65, 35, 4);

        if (card.type === 'yeol') {
            _drawWarbler(ctx, 40, 55);
        } else if (card.type === 'tti-hong') {
            _drawRibbon(ctx, '#c41e3a', '梅');
        }
    }

    function _drawPlumBlossom(ctx, x, y, r) {
        // 5장 꽃잎
        ctx.fillStyle = '#e84060';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.ellipse(
                x + Math.cos(angle) * r * 0.6,
                y + Math.sin(angle) * r * 0.6,
                r * 0.55, r * 0.45, angle, 0, Math.PI * 2
            );
            ctx.fill();
        }
        // 꽃술
        ctx.fillStyle = '#ffe060';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    function _drawWarbler(ctx, x, y) {
        // 몸통 (연두색)
        ctx.fillStyle = '#7ab030';
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 머리
        ctx.fillStyle = '#8ac040';
        ctx.beginPath();
        ctx.arc(x + 8, y - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // 눈
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 9.5, y - 3.5, 1, 0, Math.PI * 2);
        ctx.fill();

        // 부리
        ctx.fillStyle = '#d4a030';
        ctx.beginPath();
        ctx.moveTo(x + 12, y - 3);
        ctx.lineTo(x + 16, y - 2.5);
        ctx.lineTo(x + 12, y - 1.5);
        ctx.fill();

        // 꼬리
        ctx.fillStyle = '#5a9020';
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x - 14, y - 3);
        ctx.lineTo(x - 12, y + 2);
        ctx.fill();
    }

    // ========================================
    //  3월 - 벚꽃 / 막 (Cherry / Curtain)
    // ========================================
    function _drawMonth3(ctx, card) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#fce4ec');
        sky.addColorStop(1, '#f8bbd0');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // 벚꽃 나무줄기
        ctx.fillStyle = '#5a3525';
        ctx.fillRect(34, 20, 5, H - 20);

        // 가지
        ctx.strokeStyle = '#5a3525';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(36, 35);
        ctx.quadraticCurveTo(20, 25, 10, 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(38, 45);
        ctx.quadraticCurveTo(55, 35, 65, 30);
        ctx.stroke();

        // 벚꽃 구름
        ctx.fillStyle = '#ffb0c8';
        _drawFlowerCloud(ctx, 25, 15, 20, 14);
        _drawFlowerCloud(ctx, 50, 25, 18, 12);
        _drawFlowerCloud(ctx, 15, 35, 16, 10);
        _drawFlowerCloud(ctx, 55, 45, 15, 10);

        // 하이라이트
        ctx.fillStyle = '#ffc8d8';
        _drawFlowerCloud(ctx, 28, 12, 12, 8);
        _drawFlowerCloud(ctx, 52, 22, 10, 7);

        // 떨어지는 꽃잎
        ctx.fillStyle = '#ffb0c8';
        _drawPetal(ctx, 20, 70, 3);
        _drawPetal(ctx, 50, 80, 2.5);
        _drawPetal(ctx, 65, 65, 2);

        if (card.type === 'gwang') {
            // 막 (커튼)
            _drawCurtain(ctx);
        } else if (card.type === 'tti-hong') {
            _drawRibbon(ctx, '#c41e3a', '桜');
        }
    }

    function _drawFlowerCloud(ctx, x, y, w, h) {
        ctx.beginPath();
        ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function _drawPetal(ctx, x, y, size) {
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    function _drawCurtain(ctx) {
        const y = H - 50;
        // 커튼 본체
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#c0203a' : '#ffffff';
            ctx.fillRect(3, y + i * 8, W - 6, 8);
        }
        // 상단 봉
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(3, y - 3, W - 6, 4);
        // 술
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(8, y - 8, 2, 8);
        ctx.fillRect(W - 10, y - 8, 2, 8);
        // 둥근 장식
        ctx.beginPath();
        ctx.arc(9, y - 8, 3, 0, Math.PI * 2);
        ctx.arc(W - 9, y - 8, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // ========================================
    //  4월 - 등나무 / 두견 (Wisteria / Cuckoo)
    // ========================================
    function _drawMonth4(ctx, card) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#d5c8e8');
        sky.addColorStop(1, '#c0b0d8');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // 등나무 줄기
        ctx.strokeStyle = '#5a3a25';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.quadraticCurveTo(30, 10, 50, 5);
        ctx.quadraticCurveTo(70, 0, W, 8);
        ctx.stroke();

        // 등나무 꽃 (늘어지는 보라색 꽃송이)
        _drawWisteriaCluster(ctx, 15, 8, 35);
        _drawWisteriaCluster(ctx, 35, 5, 42);
        _drawWisteriaCluster(ctx, 55, 10, 38);
        _drawWisteriaCluster(ctx, 70, 6, 30);

        // 잎
        ctx.fillStyle = '#4a8040';
        _drawLeaf(ctx, 8, 5, 8, 4, -0.3);
        _drawLeaf(ctx, 45, 3, 7, 3, 0.2);
        _drawLeaf(ctx, 65, 8, 8, 3.5, 0.4);

        if (card.type === 'yeol') {
            _drawCuckoo(ctx, 30, 65);
        } else if (card.type === 'tti-cho') {
            _drawRibbon(ctx, '#2d7d46', '');
        }
    }

    function _drawWisteriaCluster(ctx, x, y, len) {
        const colors = ['#8040a0', '#9050b0', '#a060c0', '#b080d0'];
        for (let i = 0; i < len; i += 3) {
            const ci = Math.floor(i / len * colors.length);
            ctx.fillStyle = colors[Math.min(ci, colors.length - 1)];
            const w = Math.max(4, 10 - i * 0.15);
            ctx.beginPath();
            ctx.ellipse(x + Math.sin(i * 0.3) * 2, y + i, w / 2, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function _drawCuckoo(ctx, x, y) {
        // 몸통
        ctx.fillStyle = '#5a4540';
        ctx.beginPath();
        ctx.ellipse(x, y, 7, 5, -0.1, 0, Math.PI * 2);
        ctx.fill();
        // 머리
        ctx.fillStyle = '#6a5550';
        ctx.beginPath();
        ctx.arc(x + 7, y - 3, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // 눈
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 8.5, y - 3.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 9, y - 3.5, 0.6, 0, Math.PI * 2);
        ctx.fill();
        // 부리
        ctx.fillStyle = '#c0a030';
        ctx.beginPath();
        ctx.moveTo(x + 10.5, y - 3);
        ctx.lineTo(x + 14, y - 2.5);
        ctx.lineTo(x + 10.5, y - 1.5);
        ctx.fill();
        // 꼬리
        ctx.fillStyle = '#4a3530';
        ctx.beginPath();
        ctx.moveTo(x - 5, y);
        ctx.lineTo(x - 13, y + 2);
        ctx.lineTo(x - 11, y - 2);
        ctx.fill();
    }

    // ========================================
    //  5월 - 창포 / 다리 (Iris / Bridge)
    // ========================================
    function _drawMonth5(ctx, card) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#d0d8f0');
        sky.addColorStop(1, '#b0c0e0');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // 물
        ctx.fillStyle = 'rgba(100,140,200,0.3)';
        ctx.fillRect(0, H - 35, W, 35);

        // 창포 잎
        ctx.strokeStyle = '#308040';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const bx = 10 + i * 11;
            ctx.beginPath();
            ctx.moveTo(bx, H - 30);
            ctx.quadraticCurveTo(bx + (i % 2 ? 3 : -3), H - 70, bx + (i % 2 ? 5 : -5), 20);
            ctx.stroke();
        }

        // 창포 꽃
        _drawIrisFlower(ctx, 18, 30, 8);
        _drawIrisFlower(ctx, 50, 25, 7);
        _drawIrisFlower(ctx, 35, 40, 6);

        if (card.type === 'yeol') {
            _drawBridge(ctx);
        } else if (card.type === 'tti-cho') {
            _drawRibbon(ctx, '#2d7d46', '');
        }
    }

    function _drawIrisFlower(ctx, x, y, size) {
        // 꽃잎 3장
        ctx.fillStyle = '#6040b0';
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.ellipse(
                x + Math.cos(angle) * size * 0.4,
                y + Math.sin(angle) * size * 0.4,
                size * 0.5, size * 0.3, angle + 0.3, 0, Math.PI * 2
            );
            ctx.fill();
        }
        // 안쪽 꽃잎
        ctx.fillStyle = '#8060d0';
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(
                x + Math.cos(angle) * size * 0.2,
                y + Math.sin(angle) * size * 0.2,
                size * 0.3, size * 0.2, angle, 0, Math.PI * 2
            );
            ctx.fill();
        }
        // 중심
        ctx.fillStyle = '#ffe060';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    function _drawBridge(ctx) {
        const y = H - 45;
        ctx.fillStyle = '#8b6914';
        // 판자
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(8, y + i * 5, W - 16, 4);
        }
        // 난간
        ctx.fillRect(8, y - 4, 3, 34);
        ctx.fillRect(W - 11, y - 4, 3, 34);
        ctx.fillRect(6, y - 6, W - 12, 3);
    }

    // ========================================
    //  6월 - 모란 / 나비 (Peony / Butterfly)
    // ========================================
    function _drawMonth6(ctx, card) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#f0d8d8');
        sky.addColorStop(1, '#e0c0c0');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // 잎
        ctx.fillStyle = '#308038';
        _drawLeaf(ctx, 15, 70, 15, 8, -0.5);
        _drawLeaf(ctx, 55, 75, 14, 7, 0.4);
        _drawLeaf(ctx, 10, 55, 12, 6, -0.3);
        _drawLeaf(ctx, 60, 60, 11, 6, 0.5);

        // 모란 (큰 겹꽃)
        _drawPeony(ctx, 38, 48, 18);

        if (card.type === 'yeol') {
            _drawButterfly(ctx, 50, 20);
        } else if (card.type === 'tti-cheong') {
            _drawRibbon(ctx, '#1a5fb4', '牡丹');
        }
    }

    function _drawPeony(ctx, x, y, size) {
        // 바깥 꽃잎 (진한 빨강)
        ctx.fillStyle = '#c02040';
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(
                x + Math.cos(a) * size * 0.4,
                y + Math.sin(a) * size * 0.4,
                size * 0.45, size * 0.3, a, 0, Math.PI * 2
            );
            ctx.fill();
        }
        // 중간 꽃잎
        ctx.fillStyle = '#e04060';
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + 0.3;
            ctx.beginPath();
            ctx.ellipse(
                x + Math.cos(a) * size * 0.2,
                y + Math.sin(a) * size * 0.2,
                size * 0.35, size * 0.22, a, 0, Math.PI * 2
            );
            ctx.fill();
        }
        // 안쪽
        ctx.fillStyle = '#f06080';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        // 꽃술
        ctx.fillStyle = '#ffe060';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    function _drawButterfly(ctx, x, y) {
        // 날개
        ctx.fillStyle = '#ff8040';
        ctx.beginPath();
        ctx.ellipse(x - 5, y - 2, 7, 5, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 5, y - 2, 7, 5, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // 아래 날개
        ctx.fillStyle = '#ffA060';
        ctx.beginPath();
        ctx.ellipse(x - 4, y + 3, 5, 3.5, -0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 4, y + 3, 5, 3.5, 0.6, 0, Math.PI * 2);
        ctx.fill();

        // 날개 무늬
        ctx.fillStyle = '#a04020';
        ctx.beginPath();
        ctx.arc(x - 5, y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 5, y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 몸통
        ctx.fillStyle = '#333';
        ctx.fillRect(x - 0.8, y - 6, 1.6, 12);

        // 더듬이
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.quadraticCurveTo(x - 4, y - 12, x - 6, y - 10);
        ctx.moveTo(x, y - 6);
        ctx.quadraticCurveTo(x + 4, y - 12, x + 6, y - 10);
        ctx.stroke();
    }

    // ========================================
    //  7월 - 싸리 / 멧돼지 (Bush Clover / Boar)
    // ========================================
    function _drawMonth7(ctx, card) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#d8e8d0');
        sky.addColorStop(1, '#c0d8b0');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // 풀밭
        ctx.fillStyle = '#70a060';
        ctx.fillRect(0, H - 20, W, 20);

        // 싸리 줄기 (아치형)
        ctx.strokeStyle = '#4a6030';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            const sx = 10 + i * 18;
            ctx.beginPath();
            ctx.moveTo(sx, H - 20);
            ctx.quadraticCurveTo(sx + 5, 20, sx + 15, 15 + i * 5);
            ctx.stroke();
        }

        // 싸리꽃 (작은 붉은 점들)
        ctx.fillStyle = '#c04060';
        for (let i = 0; i < 30; i++) {
            const fx = 10 + Math.random() * 60;
            const fy = 20 + Math.random() * 60;
            ctx.beginPath();
            ctx.arc(fx, fy, 1.5 + Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }

        // 잎
        ctx.fillStyle = '#508040';
        for (let i = 0; i < 15; i++) {
            const lx = 8 + Math.random() * 64;
            const ly = 25 + Math.random() * 55;
            _drawLeaf(ctx, lx, ly, 5, 2, Math.random() * Math.PI);
        }

        if (card.type === 'yeol') {
            _drawBoar(ctx, 30, H - 38);
        } else if (card.type === 'tti-cho') {
            _drawRibbon(ctx, '#2d7d46', '');
        }
    }

    function _drawBoar(ctx, x, y) {
        // 몸통
        ctx.fillStyle = '#3a3030';
        ctx.beginPath();
        ctx.ellipse(x + 10, y + 5, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // 머리
        ctx.fillStyle = '#4a3838';
        ctx.beginPath();
        ctx.ellipse(x + 26, y + 2, 8, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 코
        ctx.fillStyle = '#b08080';
        ctx.beginPath();
        ctx.ellipse(x + 33, y + 3, 3, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 눈
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 28, y - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 28.5, y - 1, 0.7, 0, Math.PI * 2);
        ctx.fill();

        // 다리
        ctx.fillStyle = '#2a2020';
        ctx.fillRect(x + 2, y + 12, 3, 8);
        ctx.fillRect(x + 8, y + 12, 3, 8);
        ctx.fillRect(x + 14, y + 12, 3, 8);
        ctx.fillRect(x + 20, y + 12, 3, 8);

        // 엄니
        ctx.fillStyle = '#eee';
        ctx.beginPath();
        ctx.moveTo(x + 32, y + 1);
        ctx.lineTo(x + 36, y - 2);
        ctx.lineTo(x + 33, y + 0);
        ctx.fill();
    }

    // ========================================
    //  8월 - 억새 / 달 (Pampas / Moon)
    // ========================================
    function _drawMonth8(ctx, card) {
        const isGwang = card.type === 'gwang';

        // 밤하늘 (광) / 저녁하늘 (기타)
        if (isGwang) {
            const sky = ctx.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0, '#1a1a3a');
            sky.addColorStop(0.6, '#2a2a5a');
            sky.addColorStop(1, '#3a3a40');
            ctx.fillStyle = sky;
        } else {
            const sky = ctx.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0, '#e8d8a0');
            sky.addColorStop(1, '#c0b070');
            ctx.fillStyle = sky;
        }
        ctx.fillRect(0, 0, W, H);

        // 언덕
        ctx.fillStyle = isGwang ? '#2a3020' : '#8a7830';
        ctx.beginPath();
        ctx.moveTo(0, H - 25);
        ctx.quadraticCurveTo(W / 2, H - 40, W, H - 20);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.fill();

        // 억새
        const grassColor = isGwang ? '#a09040' : '#c0a850';
        ctx.strokeStyle = grassColor;
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const gx = 8 + i * 9;
            ctx.beginPath();
            ctx.moveTo(gx, H - 25);
            ctx.quadraticCurveTo(gx + (i % 2 ? 3 : -3), H - 60, gx + (i % 2 ? 8 : -8), H - 80 + i * 3);
            ctx.stroke();
            // 이삭
            ctx.fillStyle = grassColor;
            ctx.beginPath();
            ctx.ellipse(gx + (i % 2 ? 8 : -8), H - 82 + i * 3, 2, 5, i % 2 ? 0.3 : -0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        if (isGwang) {
            // 보름달
            ctx.fillStyle = '#ffffd0';
            ctx.beginPath();
            ctx.arc(W / 2, 30, 18, 0, Math.PI * 2);
            ctx.fill();
            // 달 그림자
            ctx.fillStyle = 'rgba(200,180,100,0.3)';
            ctx.beginPath();
            ctx.arc(W / 2 + 3, 28, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(W / 2 - 5, 34, 3, 0, Math.PI * 2);
            ctx.fill();
            // 달 빛
            ctx.fillStyle = 'rgba(255,255,200,0.08)';
            ctx.beginPath();
            ctx.arc(W / 2, 30, 28, 0, Math.PI * 2);
            ctx.fill();
        } else if (card.type === 'yeol') {
            // 기러기
            _drawGeese(ctx, 30, 20);
        }
    }

    function _drawGeese(ctx, x, y) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        // 기러기 3마리 (V자)
        for (let i = 0; i < 3; i++) {
            const gx = x + i * 12;
            const gy = y + (i === 1 ? -5 : 3);
            ctx.beginPath();
            ctx.moveTo(gx - 5, gy + 2);
            ctx.quadraticCurveTo(gx, gy - 2, gx, gy);
            ctx.quadraticCurveTo(gx, gy - 2, gx + 5, gy + 2);
            ctx.stroke();
        }
    }

    // ========================================
    //  9월 - 국화 / 잔 (Chrysanthemum / Cup)
    // ========================================
    function _drawMonth9(ctx, card) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#f5ecd0');
        sky.addColorStop(1, '#e8d8a0');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // 잎
        ctx.fillStyle = '#408838';
        _drawLeaf(ctx, 15, 80, 14, 7, -0.4);
        _drawLeaf(ctx, 55, 85, 13, 6, 0.3);
        _drawLeaf(ctx, 30, 90, 12, 6, 0.1);

        // 줄기
        ctx.strokeStyle = '#408838';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(35, H);
        ctx.quadraticCurveTo(33, 60, 35, 40);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(50, H);
        ctx.quadraticCurveTo(52, 55, 50, 35);
        ctx.stroke();

        // 국화 (노란 겹꽃)
        _drawChrysanthemum(ctx, 35, 35, 14);
        _drawChrysanthemum(ctx, 55, 45, 11);

        if (card.type === 'yeol') {
            _drawSakeCup(ctx, 50, 75);
        } else if (card.type === 'tti-cheong') {
            _drawRibbon(ctx, '#1a5fb4', '菊');
        }
    }

    function _drawChrysanthemum(ctx, x, y, size) {
        // 바깥 꽃잎 (길쭉한 꽃잎)
        ctx.fillStyle = '#e0a020';
        for (let i = 0; i < 14; i++) {
            const a = (i / 14) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(
                x + Math.cos(a) * size * 0.45,
                y + Math.sin(a) * size * 0.45,
                size * 0.4, size * 0.12, a, 0, Math.PI * 2
            );
            ctx.fill();
        }
        // 안쪽
        ctx.fillStyle = '#f0c030';
        for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 + 0.2;
            ctx.beginPath();
            ctx.ellipse(
                x + Math.cos(a) * size * 0.2,
                y + Math.sin(a) * size * 0.2,
                size * 0.25, size * 0.08, a, 0, Math.PI * 2
            );
            ctx.fill();
        }
        // 중심
        ctx.fillStyle = '#c08018';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    function _drawSakeCup(ctx, x, y) {
        // 잔 (빨간 술잔)
        ctx.fillStyle = '#c03030';
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.quadraticCurveTo(x - 6, y + 8, x, y + 10);
        ctx.quadraticCurveTo(x + 6, y + 8, x + 8, y);
        ctx.quadraticCurveTo(x + 4, y + 2, x, y + 2);
        ctx.quadraticCurveTo(x - 4, y + 2, x - 8, y);
        ctx.fill();

        // 잔 안쪽 (술)
        ctx.fillStyle = '#f0e0a0';
        ctx.beginPath();
        ctx.ellipse(x, y + 1, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // ========================================
    //  10월 - 단풍 / 사슴 (Maple / Deer)
    // ========================================
    function _drawMonth10(ctx, card) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#f0d8c0');
        sky.addColorStop(1, '#e0c0a0');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // 가지
        ctx.strokeStyle = '#5a3a20';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-5, 30);
        ctx.quadraticCurveTo(30, 20, 50, 25);
        ctx.quadraticCurveTo(70, 30, W + 5, 20);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(25, 22);
        ctx.quadraticCurveTo(20, 40, 15, 55);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(55, 27);
        ctx.quadraticCurveTo(60, 45, 65, 55);
        ctx.stroke();

        // 단풍잎
        const mapleColors = ['#d04020', '#e06030', '#c03010', '#e8803c', '#b02818'];
        for (let i = 0; i < 18; i++) {
            const mx = 5 + Math.random() * 70;
            const my = 10 + Math.random() * 70;
            ctx.fillStyle = mapleColors[i % mapleColors.length];
            _drawMapleLeaf(ctx, mx, my, 5 + Math.random() * 3);
        }

        if (card.type === 'yeol') {
            _drawDeer(ctx, 22, 60);
        } else if (card.type === 'tti-cheong') {
            _drawRibbon(ctx, '#1a5fb4', '楓');
        }
    }

    function _drawMapleLeaf(ctx, x, y, size) {
        ctx.beginPath();
        // 5갈래 단풍잎 (간략화)
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(a) * size;
            const py = y + Math.sin(a) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
            // 갈래 사이
            const a2 = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
            ctx.lineTo(x + Math.cos(a2) * size * 0.4, y + Math.sin(a2) * size * 0.4);
        }
        ctx.closePath();
        ctx.fill();
    }

    function _drawDeer(ctx, x, y) {
        // 몸통
        ctx.fillStyle = '#b07040';
        ctx.beginPath();
        ctx.ellipse(x + 10, y + 5, 12, 8, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // 머리/목
        ctx.fillStyle = '#c08050';
        ctx.beginPath();
        ctx.ellipse(x + 24, y - 8, 5, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 목
        ctx.fillStyle = '#b07040';
        ctx.beginPath();
        ctx.moveTo(x + 18, y);
        ctx.quadraticCurveTo(x + 22, y - 5, x + 22, y - 8);
        ctx.lineTo(x + 26, y - 6);
        ctx.quadraticCurveTo(x + 24, y - 2, x + 20, y + 2);
        ctx.fill();

        // 눈
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 26, y - 9, 1, 0, Math.PI * 2);
        ctx.fill();

        // 뿔
        ctx.strokeStyle = '#5a3a20';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + 22, y - 12);
        ctx.lineTo(x + 18, y - 22);
        ctx.lineTo(x + 15, y - 18);
        ctx.moveTo(x + 18, y - 22);
        ctx.lineTo(x + 20, y - 26);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 25, y - 11);
        ctx.lineTo(x + 28, y - 20);
        ctx.lineTo(x + 31, y - 17);
        ctx.moveTo(x + 28, y - 20);
        ctx.lineTo(x + 27, y - 24);
        ctx.stroke();

        // 다리
        ctx.fillStyle = '#906030';
        ctx.fillRect(x + 3, y + 12, 2.5, 10);
        ctx.fillRect(x + 9, y + 12, 2.5, 10);
        ctx.fillRect(x + 14, y + 12, 2.5, 10);
        ctx.fillRect(x + 19, y + 11, 2.5, 10);

        // 반점
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(x + 6, y + 3, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 12, y + 1, 1.2, 0, Math.PI * 2);
        ctx.arc(x + 9, y + 7, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // ========================================
    //  11월 - 오동 / 봉황 (Paulownia / Phoenix)
    // ========================================
    function _drawMonth11(ctx, card) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#d8c8e8');
        sky.addColorStop(1, '#c0b0d0');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // 오동 줄기
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(36, 30, 5, H - 30);

        // 오동잎 (하트 모양)
        ctx.fillStyle = '#4a8050';
        _drawPaulowniaLeaf(ctx, 20, 40, 15);
        _drawPaulowniaLeaf(ctx, 52, 38, 14);
        _drawPaulowniaLeaf(ctx, 15, 60, 12);
        _drawPaulowniaLeaf(ctx, 58, 58, 11);

        // 오동꽃 (보라 종 모양)
        _drawPaulowniaFlowers(ctx, 30, 20);
        _drawPaulowniaFlowers(ctx, 48, 25);

        if (card.type === 'gwang') {
            _drawPhoenix(ctx, 25, 60);
        }
    }

    function _drawPaulowniaLeaf(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.1);
        ctx.quadraticCurveTo(x - size * 0.6, y - size * 0.5, x, y - size);
        ctx.quadraticCurveTo(x + size * 0.6, y - size * 0.5, x, y - size * 0.1);
        ctx.fill();
    }

    function _drawPaulowniaFlowers(ctx, x, y) {
        ctx.fillStyle = '#8050a0';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.ellipse(x + i * 5 - 7, y + Math.abs(i - 1.5) * 2, 3, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        // 꽃 끝
        ctx.fillStyle = '#a070c0';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(x + i * 5 - 7, y + Math.abs(i - 1.5) * 2 + 4, 2.5, 0, Math.PI);
            ctx.fill();
        }
    }

    function _drawPhoenix(ctx, x, y) {
        // 꼬리깃
        const tailColors = ['#e04040', '#ff8040', '#e0c020', '#40c040', '#4080e0'];
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = tailColors[i];
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 5, y + 5);
            ctx.quadraticCurveTo(x - 15 - i * 3, y + 15 + i * 5, x - 10 - i * 5, y + 30 + i * 4);
            ctx.stroke();
        }

        // 몸통
        ctx.fillStyle = '#c04040';
        ctx.beginPath();
        ctx.ellipse(x + 5, y, 10, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // 날개
        ctx.fillStyle = '#e06040';
        ctx.beginPath();
        ctx.ellipse(x - 2, y - 5, 8, 4, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // 머리
        ctx.fillStyle = '#d04040';
        ctx.beginPath();
        ctx.arc(x + 16, y - 6, 5, 0, Math.PI * 2);
        ctx.fill();

        // 볏
        ctx.fillStyle = '#ffe040';
        ctx.beginPath();
        ctx.moveTo(x + 16, y - 11);
        ctx.lineTo(x + 14, y - 18);
        ctx.lineTo(x + 18, y - 14);
        ctx.lineTo(x + 16, y - 20);
        ctx.lineTo(x + 20, y - 15);
        ctx.fill();

        // 눈
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 18, y - 7, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 18.5, y - 7, 0.8, 0, Math.PI * 2);
        ctx.fill();

        // 부리
        ctx.fillStyle = '#e0a020';
        ctx.beginPath();
        ctx.moveTo(x + 21, y - 6);
        ctx.lineTo(x + 27, y - 5);
        ctx.lineTo(x + 21, y - 4);
        ctx.fill();
    }

    // ========================================
    //  12월 - 비/버들 (Willow / Rain)
    // ========================================
    function _drawMonth12(ctx, card) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#707880');
        sky.addColorStop(1, '#505860');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // 비 (대각선)
        ctx.strokeStyle = 'rgba(180,200,220,0.4)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 25; i++) {
            const rx = Math.random() * W;
            const ry = Math.random() * H;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 3, ry + 8);
            ctx.stroke();
        }

        // 버들 줄기
        ctx.fillStyle = '#4a5040';
        ctx.fillRect(10, 0, 4, H);

        // 버들 가지 (늘어지는 녹색)
        ctx.strokeStyle = '#5a7050';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const sx = 12;
            const sy = 10 + i * 12;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(sx + 20 + i * 5, sy + 20, sx + 15 + i * 8, sy + 40 + i * 5);
            ctx.stroke();
        }

        if (card.type === 'gwang') {
            // 우산 쓴 사람
            _drawRainMan(ctx, 45, 50);
            // 제비
            _drawSwallow(ctx, 55, 20);
        } else if (card.type === 'yeol') {
            // 제비
            _drawSwallow(ctx, 45, 35);
            _drawSwallow(ctx, 55, 50);
        }
    }

    function _drawRainMan(ctx, x, y) {
        // 우산
        ctx.fillStyle = '#c03030';
        ctx.beginPath();
        ctx.arc(x, y - 15, 16, Math.PI, 0);
        ctx.fill();
        // 우산 꼭지
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(x - 1, y - 32, 2, 5);
        ctx.beginPath();
        ctx.arc(x, y - 32, 2, 0, Math.PI * 2);
        ctx.fill();
        // 우산 살대
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 5; i++) {
            const a = Math.PI + (i / 4) * Math.PI;
            ctx.beginPath();
            ctx.moveTo(x, y - 15);
            ctx.lineTo(x + Math.cos(a) * 16, y - 15 + Math.sin(a) * 16);
            ctx.stroke();
        }
        // 우산대
        ctx.strokeStyle = '#5a3a20';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y - 15);
        ctx.lineTo(x, y + 10);
        ctx.quadraticCurveTo(x, y + 15, x - 3, y + 15);
        ctx.stroke();

        // 몸
        ctx.fillStyle = '#2a3a5a';
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x + 6, y);
        ctx.lineTo(x + 5, y + 25);
        ctx.lineTo(x - 5, y + 25);
        ctx.fill();

        // 다리
        ctx.fillRect(x - 5, y + 25, 3, 10);
        ctx.fillRect(x + 2, y + 25, 3, 10);
    }

    function _drawSwallow(ctx, x, y) {
        // 몸통
        ctx.fillStyle = '#1a1a2a';
        ctx.beginPath();
        ctx.ellipse(x, y, 5, 3, 0.1, 0, Math.PI * 2);
        ctx.fill();
        // 날개
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 1);
        ctx.lineTo(x - 12, y - 6);
        ctx.lineTo(x - 4, y + 1);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 3, y - 1);
        ctx.lineTo(x + 12, y - 6);
        ctx.lineTo(x + 4, y + 1);
        ctx.fill();
        // 꼬리 (갈라진)
        ctx.beginPath();
        ctx.moveTo(x - 3, y + 2);
        ctx.lineTo(x - 8, y + 8);
        ctx.lineTo(x - 1, y + 4);
        ctx.lineTo(x + 1, y + 4);
        ctx.lineTo(x + 8, y + 8);
        ctx.lineTo(x + 3, y + 2);
        ctx.fill();
        // 배 (흰색)
        ctx.fillStyle = '#e0d0c0';
        ctx.beginPath();
        ctx.ellipse(x, y + 1, 3, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // ========================================
    //  공통 요소 그리기
    // ========================================

    function _drawSun(ctx, x, y) {
        // 태양 빛살
        ctx.fillStyle = 'rgba(255,200,50,0.15)';
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
        // 태양
        ctx.fillStyle = '#e04020';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        // 하이라이트
        ctx.fillStyle = '#f06030';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    function _drawRibbon(ctx, color, text) {
        const ry = H * 0.52;
        const rh = 18;

        // 리본 본체
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(4, ry);
        ctx.lineTo(W - 4, ry);
        ctx.lineTo(W - 4, ry + rh);
        ctx.lineTo(4, ry + rh);
        ctx.closePath();
        ctx.fill();

        // 리본 광택
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(4, ry, W - 8, rh * 0.4);

        // 리본 테두리
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(4, ry, W - 8, rh);

        // 텍스트 (한자)
        if (text) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, W / 2, ry + rh / 2 + 0.5);
        }
    }

    function _drawLeaf(ctx, x, y, w, h, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle || 0);
        ctx.beginPath();
        ctx.moveTo(-w / 2, 0);
        ctx.quadraticCurveTo(0, -h, w / 2, 0);
        ctx.quadraticCurveTo(0, h, -w / 2, 0);
        ctx.fill();
        ctx.restore();
    }

    function _drawMonthLabel(ctx, card) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(card.month + '월', 5, 4);
    }

    function _drawTypeBadge(ctx, card) {
        let label = '';
        let bgColor = '';

        switch (card.type) {
            case 'gwang':
                label = '光';
                bgColor = '#b8860b';
                break;
            case 'yeol':
                label = '열';
                bgColor = '#6a3aad';
                break;
            case 'tti-hong':
                label = '홍';
                bgColor = '#c41e3a';
                break;
            case 'tti-cheong':
                label = '청';
                bgColor = '#1a5fb4';
                break;
            case 'tti-cho':
                label = '초';
                bgColor = '#2d7d46';
                break;
            case 'ssang-pi':
                label = '쌍';
                bgColor = '#666';
                break;
            default:
                return; // 일반 피는 뱃지 없음
        }

        const bx = W - 15;
        const by = 3;

        // 뱃지 배경
        ctx.fillStyle = bgColor;
        _roundRect(ctx, bx, by, 12, 12, 3);
        ctx.fill();

        // 뱃지 테두리
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 0.5;
        _roundRect(ctx, bx, by, 12, 12, 3);
        ctx.stroke();

        // 뱃지 텍스트
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, bx + 6, by + 6.5);
    }

    // === 카드 뒷면 ===
    function _drawCardBack(ctx) {
        // 배경 (짙은 붉은색)
        _roundRect(ctx, 0, 0, W, H, 5);
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#8b0000');
        bg.addColorStop(0.5, '#600000');
        bg.addColorStop(1, '#8b0000');
        ctx.fillStyle = bg;
        ctx.fill();

        // 테두리
        _roundRect(ctx, 2, 2, W - 4, H - 4, 3);
        ctx.strokeStyle = '#b04040';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 장식 패턴 (격자)
        ctx.strokeStyle = 'rgba(180,60,60,0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(6 + i * 7, 6);
            ctx.lineTo(6 + i * 7, H - 6);
            ctx.stroke();
        }
        for (let i = 0; i < 14; i++) {
            ctx.beginPath();
            ctx.moveTo(6, 6 + i * 7.5);
            ctx.lineTo(W - 6, 6 + i * 7.5);
            ctx.stroke();
        }

        // 중앙 장식 원
        ctx.fillStyle = 'rgba(180,60,60,0.3)';
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b04040';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 16, 0, Math.PI * 2);
        ctx.stroke();

        // 花 글자
        ctx.fillStyle = 'rgba(200,80,80,0.6)';
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('花', W / 2, H / 2 + 1);
    }

    // === 유틸 ===
    function _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    return { render, renderBack, renderMini };
})();
