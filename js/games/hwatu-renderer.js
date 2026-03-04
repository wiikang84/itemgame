/* ============================================
   화투패 Canvas 렌더러 v2.0
   전통 한국 화투 디자인 - 빨간 테두리 + 굵은 전통 그래픽
   참조: 실제 화투패 (빨간 배경, 흰 내부, 굵은 검정/빨강/파랑)
   ============================================ */

const HwatuRenderer = (() => {
    'use strict';

    const W = 80, H = 116;
    const S = 2; // retina
    const CW = W * S, CH = H * S; // 160 x 232
    const MW = 36, MH = 52;
    const cache = new Map();

    // === Colors (전통 화투 팔레트) ===
    const C = {
        border: '#E05040',      // 카드 테두리 빨강
        inner:  '#FEFEFA',      // 흰색 내부
        black:  '#1A1A1A',
        red:    '#CC2233',
        darkRed:'#8B1122',
        crimson:'#DC143C',
        blue:   '#2060C0',
        darkBlue:'#1A4890',
        yellow: '#E8C830',
        gold:   '#DAA520',
        green:  '#2D6830',
        darkGreen:'#1A4020',
        brown:  '#5C3A20',
        darkBrown:'#3A2010',
        pink:   '#E890A0',
        lightPink:'#FFB8C8',
        white:  '#FFFFFF',
        orange: '#D06020',
        purple: '#6830A0',
        gray:   '#888888',
        lightGray:'#CCCCCC',
        cream:  '#FFF5E0',
    };

    // Border inset
    const BX = 10, BY = 10;
    const IW = CW - BX * 2;
    const IH = CH - BY * 2;

    // ===== Canvas Helpers =====
    function createCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w || CW; c.height = h || CH;
        return c;
    }

    function roundRect(ctx, x, y, w, h, r) {
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
        ctx.fill();
    }

    function drawCardBase(ctx) {
        ctx.fillStyle = C.border;
        roundRect(ctx, 0, 0, CW, CH, 12);
        ctx.fillStyle = C.inner;
        roundRect(ctx, BX, BY, IW, IH, 6);
    }

    function clipInner(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(BX, BY, IW, IH, 6) : ctx.rect(BX, BY, IW, IH);
        ctx.clip();
    }

    // ===== Drawing Helpers =====

    // 별/단풍잎 (pointed star)
    function drawStar(ctx, cx, cy, outerR, innerR, points, color) {
        ctx.fillStyle = color || C.red;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const a = (i * Math.PI / points) - Math.PI / 2;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    // 5잎 꽃 (매화, 벚꽃 등)
    function drawFlower5(ctx, cx, cy, size, color, centerColor) {
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.ellipse(
                cx + Math.cos(a) * size * 0.35,
                cy + Math.sin(a) * size * 0.35,
                size * 0.35, size * 0.28, a, 0, Math.PI * 2
            );
            ctx.fill();
        }
        if (centerColor) {
            ctx.fillStyle = centerColor;
            ctx.beginPath();
            ctx.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 모란꽃 (layered peonies)
    function drawPeony(ctx, cx, cy, size) {
        // 외곽 꽃잎 (빨강)
        ctx.fillStyle = C.red;
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(
                cx + Math.cos(a) * size * 0.45,
                cy + Math.sin(a) * size * 0.45,
                size * 0.4, 0, Math.PI * 2
            );
            ctx.fill();
        }
        // 내부 꽃잎 (밝은 빨강)
        ctx.fillStyle = C.crimson;
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 + 0.4;
            ctx.beginPath();
            ctx.arc(
                cx + Math.cos(a) * size * 0.25,
                cy + Math.sin(a) * size * 0.25,
                size * 0.3, 0, Math.PI * 2
            );
            ctx.fill();
        }
        // 중심 (노랑)
        ctx.fillStyle = C.yellow;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    // 국화꽃 (많은 가는 꽃잎)
    function drawChrysanthemum(ctx, cx, cy, size) {
        ctx.fillStyle = C.yellow;
        for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(a);
            ctx.beginPath();
            ctx.ellipse(0, -size * 0.4, size * 0.12, size * 0.38, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.fillStyle = C.gold;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    // 검정 잎 (타원형)
    function drawBlackLeaf(ctx, cx, cy, w, h, angle) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle || 0);
        ctx.fillStyle = C.black;
        ctx.beginPath();
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // 잎맥
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -h / 2 + 2);
        ctx.lineTo(0, h / 2 - 2);
        ctx.stroke();
        ctx.restore();
    }

    // 가지/줄기
    function drawBranch(ctx, points, width, color) {
        ctx.strokeStyle = color || C.black;
        ctx.lineWidth = width || 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.stroke();
    }

    // 곡선 가지
    function drawCurvedBranch(ctx, x1, y1, cpx, cpy, x2, y2, w, color) {
        ctx.strokeStyle = color || C.black;
        ctx.lineWidth = w || 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        ctx.stroke();
    }

    // 둥근 언덕/덤불 (싸리 등)
    function drawMound(ctx, cx, cy, w, h, color) {
        ctx.fillStyle = color || C.black;
        ctx.beginPath();
        ctx.ellipse(cx, cy + h * 0.3, w / 2, h / 2, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
    }

    // 리본 (띠)
    function drawRibbon(ctx, x, y, w, h, color, text) {
        // 그림자
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 3, y + 3, w, h);
        // 리본 본체
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        // 테두리
        ctx.strokeStyle = color === C.blue ? C.darkBlue : C.darkRed;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        // 텍스트 (세로)
        if (text) {
            ctx.fillStyle = C.white;
            ctx.font = 'bold 20px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const chars = text.split('');
            const gap = h / (chars.length + 1);
            chars.forEach((ch, i) => {
                ctx.fillText(ch, x + w / 2, y + gap * (i + 1));
            });
        }
    }

    // 광 마크
    function drawGwangMark(ctx) {
        const cx = CW - BX - 30;
        const cy = CH - BY - 30;
        // 노란 원 + 빨간 테두리
        ctx.fillStyle = C.yellow;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.red;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.white;
        ctx.font = 'bold 24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('광', cx, cy + 1);
    }

    // 소나무 바늘 클러스터
    function drawPineCluster(ctx, cx, cy, size) {
        ctx.fillStyle = C.darkGreen;
        for (let i = 0; i < 7; i++) {
            const a = (i / 7) * Math.PI - Math.PI / 2 - 0.3;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(a);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-size * 0.08, -size);
            ctx.lineTo(size * 0.08, -size);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    // ===== 월별 그리기 함수 =====
    // 모든 좌표는 캔버스 기준 (160x232)

    // --- 1월: 소나무 + 학 ---
    function draw_1(ctx, type) {
        // 줄기
        ctx.fillStyle = C.darkBrown;
        ctx.beginPath();
        ctx.moveTo(50, CH); ctx.lineTo(35, CH - 60);
        ctx.quadraticCurveTo(30, CH - 100, 40, CH - 150);
        ctx.quadraticCurveTo(50, CH - 180, 55, CH - 170);
        ctx.quadraticCurveTo(60, CH - 100, 70, CH - 60);
        ctx.lineTo(65, CH);
        ctx.fill();

        // 소나무 잎 클러스터
        drawPineCluster(ctx, 40, 30, 35);
        drawPineCluster(ctx, 90, 50, 30);
        drawPineCluster(ctx, 30, 80, 28);
        drawPineCluster(ctx, 100, 90, 32);
        drawPineCluster(ctx, 55, 55, 25);

        if (type === 'gwang') {
            // 태양
            ctx.fillStyle = '#FF3333';
            ctx.beginPath();
            ctx.arc(125, 35, 26, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF6644';
            ctx.beginPath();
            ctx.arc(125, 35, 18, 0, Math.PI * 2);
            ctx.fill();
            // 학 (흰 몸체)
            ctx.fillStyle = C.white;
            ctx.beginPath();
            ctx.ellipse(80, 160, 28, 20, -0.2, 0, Math.PI * 2);
            ctx.fill();
            // 목
            ctx.strokeStyle = C.white;
            ctx.lineWidth = 8;
            drawCurvedBranch(ctx, 80, 145, 95, 120, 105, 105, 8, C.white);
            // 머리 빨간 점
            ctx.fillStyle = C.red;
            ctx.beginPath();
            ctx.arc(105, 100, 6, 0, Math.PI * 2);
            ctx.fill();
            // 부리
            ctx.fillStyle = C.yellow;
            ctx.beginPath();
            ctx.moveTo(105, 97);
            ctx.lineTo(120, 93);
            ctx.lineTo(105, 103);
            ctx.fill();
            // 꼬리 (검정)
            ctx.fillStyle = C.black;
            ctx.beginPath();
            ctx.ellipse(55, 165, 15, 10, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // 다리
            ctx.strokeStyle = C.black;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(75, 178); ctx.lineTo(70, 205);
            ctx.moveTo(85, 178); ctx.lineTo(90, 205);
            ctx.stroke();
        } else if (type === 'tti-hong') {
            drawRibbon(ctx, 55, 55, 50, 110, C.red, '홍단');
        }
    }

    // --- 2월: 매화 + 꾀꼬리 ---
    function draw_2(ctx, type) {
        // 매화 가지 (곡선)
        drawCurvedBranch(ctx, 15, CH, 20, CH - 80, 80, 40, 6, C.darkBrown);
        drawCurvedBranch(ctx, 60, 100, 100, 60, 145, 30, 4, C.darkBrown);
        drawCurvedBranch(ctx, 40, 130, 30, 100, 25, 50, 3, C.darkBrown);

        // 매화꽃 (빨강/분홍)
        const flowers = [[75, 45, 16], [35, 55, 14], [110, 35, 13],
                         [55, 90, 12], [95, 75, 15], [25, 120, 11],
                         [120, 100, 13], [80, 130, 12]];
        flowers.forEach(([fx, fy, fs]) => {
            drawFlower5(ctx, fx, fy, fs, C.red, C.yellow);
        });

        if (type === 'yeol') {
            // 꾀꼬리 (노란-초록 새)
            ctx.fillStyle = '#7CB342';
            ctx.beginPath();
            ctx.ellipse(95, 140, 18, 14, 0.2, 0, Math.PI * 2);
            ctx.fill();
            // 머리
            ctx.beginPath();
            ctx.arc(108, 128, 10, 0, Math.PI * 2);
            ctx.fill();
            // 부리
            ctx.fillStyle = C.yellow;
            ctx.beginPath();
            ctx.moveTo(116, 125);
            ctx.lineTo(128, 124);
            ctx.lineTo(116, 130);
            ctx.fill();
            // 눈
            ctx.fillStyle = C.black;
            ctx.beginPath();
            ctx.arc(112, 126, 2, 0, Math.PI * 2);
            ctx.fill();
            // 꼬리
            ctx.fillStyle = '#558B2F';
            ctx.beginPath();
            ctx.moveTo(78, 140);
            ctx.lineTo(55, 155);
            ctx.lineTo(60, 145);
            ctx.lineTo(78, 145);
            ctx.fill();
        } else if (type === 'tti-hong') {
            drawRibbon(ctx, 55, 55, 50, 110, C.red, '홍단');
        }
    }

    // --- 3월: 벚꽃 + 만막 ---
    function draw_3(ctx, type) {
        // 벚꽃 가지
        drawCurvedBranch(ctx, 10, CH - 30, 40, CH - 80, 80, 20, 5, C.darkBrown);
        drawCurvedBranch(ctx, 50, 80, 90, 50, 140, 25, 3, C.darkBrown);

        // 벚꽃 (분홍)
        const blossoms = [[65, 30, 15], [30, 50, 14], [105, 25, 13],
                          [45, 75, 12], [90, 60, 14], [120, 50, 11],
                          [70, 100, 13], [25, 100, 12], [110, 85, 11]];
        blossoms.forEach(([bx, by, bs]) => {
            drawFlower5(ctx, bx, by, bs, C.lightPink, C.pink);
        });

        if (type === 'gwang') {
            // 만막 (커튼)
            const curtainY = 100;
            // 커튼 상단 바
            ctx.fillStyle = C.red;
            ctx.fillRect(BX, curtainY, IW, 12);
            // 커튼 본체 (빨강 + 검정 줄무늬)
            for (let i = 0; i < 6; i++) {
                const sx = BX + i * (IW / 6);
                const sw = IW / 6;
                ctx.fillStyle = i % 2 === 0 ? C.red : C.darkRed;
                ctx.fillRect(sx, curtainY + 12, sw, CH - curtainY - BY - 12);
            }
            // 커튼 술 (하단)
            ctx.fillStyle = C.yellow;
            for (let i = 0; i < 8; i++) {
                const tx = BX + 10 + i * 16;
                ctx.beginPath();
                ctx.arc(tx, CH - BY - 10, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'tti-hong') {
            drawRibbon(ctx, 55, 80, 50, 110, C.red, '홍단');
        }
    }

    // --- 4월: 등나무 + 두견 ---
    function draw_4(ctx, type) {
        // 등나무 줄기 (위에서 아래로)
        drawCurvedBranch(ctx, 40, BY, 35, 60, 50, 120, 5, C.black);
        drawCurvedBranch(ctx, 100, BY, 110, 50, 95, 110, 4, C.black);
        drawCurvedBranch(ctx, 65, BY, 70, 80, 75, 150, 3, C.black);

        // 등나무 꽃 (보라/검정 덩이)
        const clusters = [[40, 70, 20, 35], [100, 60, 18, 30],
                          [65, 100, 22, 38], [45, 140, 16, 28],
                          [110, 120, 15, 25]];
        clusters.forEach(([cx, cy, w, h]) => {
            ctx.fillStyle = '#4A2080';
            ctx.beginPath();
            ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
            ctx.fill();
            // 내부 점 텍스처
            ctx.fillStyle = '#3A1060';
            for (let i = 0; i < 5; i++) {
                const dx = (Math.random() - 0.5) * w;
                const dy = (Math.random() - 0.5) * h * 0.8;
                ctx.beginPath();
                ctx.arc(cx + dx, cy + dy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        if (type === 'yeol') {
            // 두견새 (작은 새)
            ctx.fillStyle = C.black;
            ctx.beginPath();
            ctx.ellipse(90, 170, 16, 12, -0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(102, 160, 9, 0, Math.PI * 2);
            ctx.fill();
            // 부리
            ctx.fillStyle = C.orange;
            ctx.beginPath();
            ctx.moveTo(109, 157); ctx.lineTo(120, 158); ctx.lineTo(109, 163);
            ctx.fill();
            // 눈
            ctx.fillStyle = C.white;
            ctx.beginPath();
            ctx.arc(105, 158, 2, 0, Math.PI * 2);
            ctx.fill();
            // 꼬리
            ctx.beginPath();
            ctx.moveTo(75, 172); ctx.lineTo(55, 180); ctx.lineTo(58, 170); ctx.lineTo(75, 168);
            ctx.fillStyle = C.black; ctx.fill();
        } else if (type === 'tti-cho') {
            drawRibbon(ctx, 55, 65, 50, 100, C.red, '');
        }
    }

    // --- 5월: 난초(창포) + 다리 ---
    function draw_5(ctx, type) {
        // 난초 잎 (길고 가느다란)
        const leaves = [
            [50, CH, 30, 20, -0.2], [70, CH, 40, 22, 0.1],
            [90, CH, 35, 18, 0.3], [60, CH, 45, 20, -0.1],
            [80, CH, 38, 16, 0.25], [40, CH, 32, 19, -0.35]
        ];
        leaves.forEach(([lx, ly, lh, lw]) => {
            ctx.fillStyle = C.darkGreen;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.quadraticCurveTo(lx - lw, ly - lh * 2, lx - lw * 0.5, ly - lh * 4);
            ctx.quadraticCurveTo(lx, ly - lh * 3.5, lx + 3, ly);
            ctx.fill();
        });

        // 난초 꽃 (보라/파랑)
        drawFlower5(ctx, 55, 60, 18, '#6A3DAD', C.yellow);
        drawFlower5(ctx, 95, 45, 16, '#6A3DAD', C.yellow);
        drawFlower5(ctx, 40, 100, 14, '#7B4DB8', C.yellow);

        if (type === 'yeol') {
            // 팔교 (나무 다리)
            ctx.fillStyle = C.brown;
            ctx.fillRect(20, 145, 120, 10);
            // 다리 기둥
            ctx.fillRect(35, 145, 8, 35);
            ctx.fillRect(75, 145, 8, 35);
            ctx.fillRect(115, 145, 8, 35);
            // 난간
            ctx.fillRect(20, 135, 120, 6);
            // 물결
            ctx.strokeStyle = C.blue;
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                const wy = 190 + i * 12;
                ctx.moveTo(BX, wy);
                ctx.quadraticCurveTo(50, wy - 6, 80, wy);
                ctx.quadraticCurveTo(110, wy + 6, CW - BX, wy);
                ctx.stroke();
            }
        } else if (type === 'tti-cho') {
            drawRibbon(ctx, 55, 65, 50, 100, C.red, '');
        }
    }

    // --- 6월: 모란 + 나비 ---
    function draw_6(ctx, type) {
        // 큰 검정 잎들 (모란 특유의 큰 잎)
        drawBlackLeaf(ctx, 30, 50, 45, 55, -0.4);
        drawBlackLeaf(ctx, 130, 60, 42, 50, 0.5);
        drawBlackLeaf(ctx, 25, 140, 40, 50, -0.3);
        drawBlackLeaf(ctx, 135, 150, 38, 48, 0.4);
        drawBlackLeaf(ctx, 80, 200, 50, 40, 0);
        drawBlackLeaf(ctx, 30, 195, 35, 35, -0.2);
        drawBlackLeaf(ctx, 130, 200, 35, 35, 0.2);

        // 모란꽃 (크고 화려하게)
        drawPeony(ctx, 80, 95, 45);
        drawPeony(ctx, 45, 155, 35);
        drawPeony(ctx, 115, 160, 32);

        if (type === 'yeol') {
            // 나비 2마리
            _drawButterfly(ctx, 60, 40, 18);
            _drawButterfly(ctx, 110, 30, 15);
        } else if (type === 'tti-cheong') {
            drawRibbon(ctx, 55, 55, 50, 110, C.blue, '청단');
        }
    }

    function _drawButterfly(ctx, cx, cy, size) {
        // 날개 (노란 + 검정)
        ctx.fillStyle = C.yellow;
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.6, cy - size * 0.3, size * 0.7, size * 0.5, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + size * 0.6, cy - size * 0.3, size * 0.7, size * 0.5, 0.4, 0, Math.PI * 2);
        ctx.fill();
        // 아래 날개
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.4, cy + size * 0.3, size * 0.45, size * 0.35, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + size * 0.4, cy + size * 0.3, size * 0.45, size * 0.35, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // 몸통
        ctx.fillStyle = C.black;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 3, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        // 더듬이
        ctx.strokeStyle = C.black;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy - size * 0.5);
        ctx.quadraticCurveTo(cx - size * 0.4, cy - size, cx - size * 0.5, cy - size * 1.1);
        ctx.moveTo(cx + 2, cy - size * 0.5);
        ctx.quadraticCurveTo(cx + size * 0.4, cy - size, cx + size * 0.5, cy - size * 1.1);
        ctx.stroke();
    }

    // --- 7월: 싸리 + 멧돼지 ---
    function draw_7(ctx, type) {
        // 검정 덤불/언덕 (하단)
        drawMound(ctx, 80, CH - 30, 150, 80, C.black);

        // 싸리 줄기 (가는 검정 선)
        const stems = [
            [[45, CH - 55], [40, CH - 100], [35, 60]],
            [[65, CH - 55], [60, CH - 110], [55, 50]],
            [[85, CH - 55], [90, CH - 95], [95, 55]],
            [[105, CH - 55], [110, CH - 90], [120, 65]],
            [[55, CH - 55], [48, CH - 105], [42, 80]],
            [[95, CH - 55], [100, CH - 100], [108, 70]],
        ];
        stems.forEach(pts => {
            ctx.strokeStyle = C.black;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
            ctx.stroke();
        });

        // 작은 잎들 (줄기를 따라)
        stems.forEach(pts => {
            for (let t = 0.2; t < 0.9; t += 0.2) {
                const x = pts[0][0] + (pts[2][0] - pts[0][0]) * t + (Math.random() - 0.5) * 8;
                const y = pts[0][1] + (pts[2][1] - pts[0][1]) * t;
                ctx.fillStyle = C.black;
                ctx.beginPath();
                ctx.ellipse(x - 5, y, 5, 3, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(x + 5, y, 5, 3, 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // 파란 꽃 (별 모양)
        const blueFlowers = [[35, 65, 8], [55, 50, 7], [95, 58, 8],
                             [120, 68, 7], [42, 85, 6], [108, 75, 7]];
        blueFlowers.forEach(([fx, fy, fs]) => {
            drawStar(ctx, fx, fy, fs, fs * 0.4, 5, C.blue);
        });

        if (type === 'yeol') {
            // 멧돼지 (검정)
            ctx.fillStyle = '#2A2A2A';
            ctx.beginPath();
            ctx.ellipse(80, 160, 32, 22, 0, 0, Math.PI * 2);
            ctx.fill();
            // 머리
            ctx.beginPath();
            ctx.ellipse(115, 155, 16, 14, 0.2, 0, Math.PI * 2);
            ctx.fill();
            // 코
            ctx.fillStyle = C.pink;
            ctx.beginPath();
            ctx.ellipse(128, 158, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            // 눈
            ctx.fillStyle = C.white;
            ctx.beginPath();
            ctx.arc(118, 150, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = C.black;
            ctx.beginPath();
            ctx.arc(118, 150, 1.5, 0, Math.PI * 2);
            ctx.fill();
            // 다리
            ctx.fillStyle = '#2A2A2A';
            [60, 72, 88, 100].forEach(lx => {
                ctx.fillRect(lx, 178, 6, 16);
            });
            // 엄니
            ctx.fillStyle = C.white;
            ctx.beginPath();
            ctx.moveTo(128, 155); ctx.lineTo(135, 148); ctx.lineTo(130, 152);
            ctx.fill();
        } else if (type === 'tti-cho') {
            drawRibbon(ctx, 55, 55, 50, 100, C.red, '');
        }
    }

    // --- 8월: 억새 + 달/기러기 ---
    function draw_8(ctx, type) {
        if (type === 'gwang') {
            // 밤하늘 배경
            ctx.fillStyle = '#1A1A3A';
            ctx.fillRect(BX, BY, IW, IH);

            // 달 (큰 원)
            ctx.fillStyle = '#FFE87C';
            ctx.beginPath();
            ctx.arc(80, 80, 45, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFF5B0';
            ctx.beginPath();
            ctx.arc(80, 80, 38, 0, Math.PI * 2);
            ctx.fill();
        }

        // 억새 (갈색/금색 줄기)
        const grassColor = type === 'gwang' ? '#B89040' : C.darkBrown;
        const plumeColor = type === 'gwang' ? '#E8D090' : C.gold;

        for (let i = 0; i < 7; i++) {
            const gx = 20 + i * 20;
            const topY = 40 + (i % 3) * 20;
            ctx.strokeStyle = grassColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(gx, CH - BY);
            ctx.quadraticCurveTo(gx + (i % 2 ? 5 : -5), CH - 80, gx, topY);
            ctx.stroke();

            // 이삭 (plume)
            ctx.fillStyle = plumeColor;
            ctx.beginPath();
            ctx.ellipse(gx, topY, 6, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (type === 'yeol') {
            // 기러기 3마리 (V자)
            const geese = [[50, 60], [80, 45], [110, 60]];
            geese.forEach(([gx, gy]) => {
                ctx.strokeStyle = C.black;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(gx - 12, gy + 5);
                ctx.quadraticCurveTo(gx, gy - 5, gx + 12, gy + 5);
                ctx.stroke();
                // 몸통
                ctx.fillStyle = C.black;
                ctx.beginPath();
                ctx.ellipse(gx, gy + 2, 5, 3, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    // --- 9월: 국화 + 잔 ---
    function draw_9(ctx, type) {
        // 국화 잎 (검정)
        drawBlackLeaf(ctx, 35, 130, 40, 50, -0.3);
        drawBlackLeaf(ctx, 125, 140, 38, 45, 0.3);
        drawBlackLeaf(ctx, 80, 190, 45, 35, 0);
        drawBlackLeaf(ctx, 30, 190, 32, 35, -0.2);
        drawBlackLeaf(ctx, 130, 195, 30, 32, 0.2);

        // 국화꽃 (노란색 방사형)
        drawChrysanthemum(ctx, 80, 80, 38);
        drawChrysanthemum(ctx, 45, 140, 28);
        drawChrysanthemum(ctx, 115, 130, 25);

        // 줄기
        drawCurvedBranch(ctx, 80, 110, 60, 140, 45, 155, 3, C.darkGreen);
        drawCurvedBranch(ctx, 80, 110, 100, 130, 115, 145, 3, C.darkGreen);

        if (type === 'yeol') {
            // 국잔 (술잔)
            ctx.fillStyle = C.red;
            ctx.beginPath();
            ctx.moveTo(60, 45); ctx.lineTo(100, 45);
            ctx.lineTo(95, 70); ctx.lineTo(65, 70);
            ctx.closePath();
            ctx.fill();
            // 잔 받침
            ctx.fillStyle = C.darkRed;
            ctx.fillRect(70, 70, 20, 5);
            ctx.fillRect(65, 75, 30, 4);
            // 잔 안 무늬
            ctx.fillStyle = C.yellow;
            ctx.beginPath();
            ctx.arc(80, 55, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'tti-cheong') {
            drawRibbon(ctx, 55, 55, 50, 110, C.blue, '청단');
        }
    }

    // --- 10월: 단풍 + 사슴 ---
    function draw_10(ctx, type) {
        // 검정 가지들
        drawCurvedBranch(ctx, 15, CH, 30, CH - 70, 80, 30, 5, C.black);
        drawCurvedBranch(ctx, 60, 80, 100, 50, 140, 25, 3, C.black);
        drawCurvedBranch(ctx, 50, 100, 30, 70, 20, 40, 3, C.black);

        // 단풍잎 (빨간 6각 별)
        const mapleLeaves = [
            [40, 40, 16, C.red], [80, 30, 18, C.red],
            [120, 35, 15, C.red], [30, 75, 14, C.crimson],
            [100, 55, 17, C.red], [55, 55, 13, C.orange],
            [130, 70, 14, C.red], [70, 90, 16, C.crimson],
            [20, 110, 12, C.red], [110, 90, 15, C.red],
            [45, 120, 13, C.yellow], [90, 115, 14, C.red],
            [140, 105, 12, C.orange], [65, 145, 11, C.red],
        ];
        mapleLeaves.forEach(([mx, my, ms, mc]) => {
            drawStar(ctx, mx, my, ms, ms * 0.4, 6, mc);
            // 중심 줄기
            ctx.strokeStyle = C.black;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mx, my - ms * 0.3);
            ctx.lineTo(mx, my + ms * 0.3);
            ctx.stroke();
        });

        if (type === 'yeol') {
            // 사슴 (갈색/흰색)
            ctx.fillStyle = C.brown;
            // 몸통
            ctx.beginPath();
            ctx.ellipse(75, 170, 30, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            // 머리
            ctx.beginPath();
            ctx.ellipse(110, 150, 14, 12, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // 흰 점무늬
            ctx.fillStyle = C.white;
            [[65, 165], [75, 175], [85, 165], [70, 172]].forEach(([dx, dy]) => {
                ctx.beginPath();
                ctx.arc(dx, dy, 2, 0, Math.PI * 2);
                ctx.fill();
            });
            // 눈
            ctx.fillStyle = C.black;
            ctx.beginPath();
            ctx.arc(115, 147, 2, 0, Math.PI * 2);
            ctx.fill();
            // 뿔 (Y자)
            ctx.strokeStyle = C.darkBrown;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(108, 142);
            ctx.lineTo(105, 120);
            ctx.moveTo(105, 128);
            ctx.lineTo(95, 115);
            ctx.moveTo(105, 132);
            ctx.lineTo(115, 118);
            ctx.stroke();
            // 다리
            ctx.strokeStyle = C.brown;
            ctx.lineWidth = 4;
            [[62, 188], [72, 188], [82, 188], [90, 186]].forEach(([lx, ly]) => {
                ctx.beginPath();
                ctx.moveTo(lx, ly);
                ctx.lineTo(lx, ly + 20);
                ctx.stroke();
            });
        } else if (type === 'tti-cheong') {
            drawRibbon(ctx, 55, 55, 50, 110, C.blue, '청단');
        }
    }

    // --- 11월: 오동 + 봉황 ---
    function draw_11(ctx, type) {
        // 오동 잎 (큰 부채꼴 잎)
        function drawPaulowniaLeaf(cx, cy, size, angle) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.fillStyle = C.black;
            ctx.beginPath();
            ctx.moveTo(0, size * 0.8);
            ctx.quadraticCurveTo(-size, size * 0.2, -size * 0.8, -size * 0.5);
            ctx.quadraticCurveTo(-size * 0.3, -size, 0, -size);
            ctx.quadraticCurveTo(size * 0.3, -size, size * 0.8, -size * 0.5);
            ctx.quadraticCurveTo(size, size * 0.2, 0, size * 0.8);
            ctx.fill();
            ctx.restore();
        }

        drawPaulowniaLeaf(50, 80, 40, -0.2);
        drawPaulowniaLeaf(110, 90, 38, 0.2);
        drawPaulowniaLeaf(80, 150, 42, 0);
        drawPaulowniaLeaf(35, 170, 30, -0.3);
        drawPaulowniaLeaf(125, 165, 28, 0.3);

        // 줄기
        drawBranch(ctx, [[80, BY + 10], [80, 60], [50, 90]], 4, C.black);
        drawBranch(ctx, [[80, 60], [110, 100]], 3, C.black);
        drawBranch(ctx, [[80, 90], [80, 155]], 3, C.black);

        // 오동 꽃 (작은 보라/노란 방울)
        [[60, 40, 8], [100, 35, 7], [45, 55, 6], [115, 50, 7], [80, 30, 8]].forEach(([fx, fy, fs]) => {
            ctx.fillStyle = C.purple;
            ctx.beginPath();
            ctx.arc(fx, fy, fs, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = C.yellow;
            ctx.beginPath();
            ctx.arc(fx, fy + fs * 0.3, fs * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });

        if (type === 'gwang') {
            // 봉황 (화려한 새)
            // 몸통 (빨강/금)
            ctx.fillStyle = C.red;
            ctx.beginPath();
            ctx.ellipse(80, 135, 20, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            // 날개
            ctx.fillStyle = C.yellow;
            ctx.beginPath();
            ctx.ellipse(60, 128, 18, 10, -0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(100, 128, 18, 10, 0.5, 0, Math.PI * 2);
            ctx.fill();
            // 머리
            ctx.fillStyle = C.green;
            ctx.beginPath();
            ctx.arc(80, 115, 10, 0, Math.PI * 2);
            ctx.fill();
            // 볏
            ctx.fillStyle = C.red;
            ctx.beginPath();
            ctx.moveTo(80, 105); ctx.lineTo(75, 95); ctx.lineTo(80, 100);
            ctx.lineTo(85, 92); ctx.lineTo(80, 100);
            ctx.fill();
            // 꼬리 (화려한 깃)
            [C.red, C.yellow, C.green, C.blue].forEach((tc, i) => {
                ctx.fillStyle = tc;
                ctx.beginPath();
                ctx.moveTo(80, 148);
                ctx.quadraticCurveTo(65 - i * 5, 170 + i * 8, 50 - i * 8, 200 + i * 5);
                ctx.lineTo(55 - i * 8, 198 + i * 5);
                ctx.quadraticCurveTo(68 - i * 3, 168 + i * 6, 82, 148);
                ctx.fill();
            });
            // 눈
            ctx.fillStyle = C.black;
            ctx.beginPath();
            ctx.arc(83, 113, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'ssang-pi') {
            // 쌍피 표시 (빨간 동그라미 2개)
            ctx.fillStyle = C.red;
            ctx.beginPath();
            ctx.arc(70, CH - 35, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(90, CH - 35, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- 12월: 비/버들 + 우산/제비 ---
    function draw_12(ctx, type) {
        // 비 배경
        ctx.fillStyle = '#D0D4D8';
        ctx.fillRect(BX, BY, IW, IH);

        // 빗줄기
        ctx.strokeStyle = 'rgba(100,110,120,0.5)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 15; i++) {
            const rx = BX + 10 + i * 10;
            ctx.beginPath();
            ctx.moveTo(rx, BY);
            ctx.lineTo(rx - 8, CH - BY);
            ctx.stroke();
        }

        // 버들 가지 (늘어지는)
        for (let i = 0; i < 5; i++) {
            const bx = 25 + i * 28;
            ctx.strokeStyle = '#556B2F';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bx, BY + 20);
            ctx.quadraticCurveTo(bx - 10, BY + 80, bx - 15, BY + 150);
            ctx.stroke();
            // 잎
            for (let j = 0; j < 4; j++) {
                const ly = BY + 40 + j * 30;
                const lx = bx - 3 - j * 3;
                ctx.fillStyle = '#556B2F';
                ctx.beginPath();
                ctx.ellipse(lx, ly, 3, 8, -0.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (type === 'gwang') {
            // 비를 맞는 사람 (우산)
            // 우산
            ctx.fillStyle = C.red;
            ctx.beginPath();
            ctx.arc(80, 100, 35, Math.PI, 0);
            ctx.closePath();
            ctx.fill();
            // 우산 살
            ctx.strokeStyle = C.darkRed;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 5; i++) {
                const a = Math.PI + (i / 4) * Math.PI;
                ctx.beginPath();
                ctx.moveTo(80, 100);
                ctx.lineTo(80 + Math.cos(a) * 35, 100 + Math.sin(a) * 35);
                ctx.stroke();
            }
            // 우산 막대
            ctx.strokeStyle = C.darkBrown;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(80, 65); ctx.lineTo(80, 190);
            ctx.stroke();
            // 우산 꼭대기
            ctx.fillStyle = C.yellow;
            ctx.beginPath();
            ctx.arc(80, 63, 4, 0, Math.PI * 2);
            ctx.fill();
            // 사람 (검정 실루엣)
            ctx.fillStyle = C.black;
            // 몸통
            ctx.beginPath();
            ctx.ellipse(80, 150, 18, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            // 머리
            ctx.beginPath();
            ctx.arc(80, 118, 12, 0, Math.PI * 2);
            ctx.fill();
            // 갓 (모자)
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.ellipse(80, 112, 16, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'yeol') {
            // 제비 (검은 새)
            ctx.fillStyle = C.black;
            // 몸통
            ctx.beginPath();
            ctx.ellipse(80, 80, 12, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            // 날개
            ctx.beginPath();
            ctx.moveTo(70, 78);
            ctx.quadraticCurveTo(45, 65, 35, 55);
            ctx.lineTo(40, 60);
            ctx.quadraticCurveTo(50, 68, 72, 82);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(90, 78);
            ctx.quadraticCurveTo(115, 65, 125, 55);
            ctx.lineTo(120, 60);
            ctx.quadraticCurveTo(110, 68, 88, 82);
            ctx.fill();
            // 꼬리 (갈라진)
            ctx.beginPath();
            ctx.moveTo(80, 88);
            ctx.lineTo(70, 110);
            ctx.lineTo(80, 100);
            ctx.lineTo(90, 110);
            ctx.closePath();
            ctx.fill();
            // 배 (흰색)
            ctx.fillStyle = C.white;
            ctx.beginPath();
            ctx.ellipse(80, 82, 6, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // 빨간 턱
            ctx.fillStyle = C.red;
            ctx.beginPath();
            ctx.arc(80, 74, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'ssang-pi') {
            ctx.fillStyle = C.red;
            ctx.beginPath();
            ctx.arc(70, CH - 40, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(90, CH - 40, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ===== Month Dispatcher =====
    const DRAWERS = {
        1: draw_1, 2: draw_2, 3: draw_3, 4: draw_4,
        5: draw_5, 6: draw_6, 7: draw_7, 8: draw_8,
        9: draw_9, 10: draw_10, 11: draw_11, 12: draw_12
    };

    // ===== 메인 렌더 함수 =====
    function render(card) {
        const key = 'card_' + card.id;
        if (cache.has(key)) return cache.get(key);

        const canvas = createCanvas();
        const ctx = canvas.getContext('2d');

        drawCardBase(ctx);
        clipInner(ctx);

        if (DRAWERS[card.month]) {
            DRAWERS[card.month](ctx, card.type);
        }

        ctx.restore(); // unclip

        // 광 마크
        if (card.type === 'gwang') {
            drawGwangMark(ctx);
        }

        // 월 표시 (좌상단)
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(card.month + '월', BX + 6, BY + 5);

        const url = canvas.toDataURL();
        cache.set(key, url);
        return url;
    }

    // ===== 뒷면 렌더 =====
    function renderBack() {
        if (cache.has('back')) return cache.get('back');

        const canvas = createCanvas();
        const ctx = canvas.getContext('2d');

        // 빨간 테두리
        ctx.fillStyle = C.border;
        roundRect(ctx, 0, 0, CW, CH, 12);

        // 검은 내부
        ctx.fillStyle = '#2A1A10';
        roundRect(ctx, BX, BY, IW, IH, 6);

        // 중앙 장식 원
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(CW / 2, CH / 2, 30, 0, Math.PI * 2);
        ctx.stroke();

        // 花 글자
        ctx.fillStyle = C.gold;
        ctx.font = 'bold 36px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('花', CW / 2, CH / 2 + 2);

        // 모서리 장식
        const corners = [[BX + 15, BY + 15], [CW - BX - 15, BY + 15],
                         [BX + 15, CH - BY - 15], [CW - BX - 15, CH - BY - 15]];
        corners.forEach(([cx, cy]) => {
            ctx.fillStyle = C.red;
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
        });

        // 테두리 라인
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(BX + 8, BY + 8, IW - 16, IH - 16);

        const url = canvas.toDataURL();
        cache.set('back', url);
        return url;
    }

    // ===== 미니 카드 렌더 =====
    function renderMini(card) {
        const key = 'mini_' + card.id;
        if (cache.has(key)) return cache.get(key);

        const mw = MW * S, mh = MH * S; // 72 x 104
        const canvas = createCanvas(mw, mh);
        const ctx = canvas.getContext('2d');

        // 빨간 테두리
        ctx.fillStyle = C.border;
        roundRect(ctx, 0, 0, mw, mh, 8);

        // 흰 내부
        const mbx = 5, mby = 5;
        ctx.fillStyle = C.inner;
        roundRect(ctx, mbx, mby, mw - mbx * 2, mh - mby * 2, 4);

        // 월별 색상 배경 (살짝)
        const monthColors = {
            1: '#E8F0E0', 2: '#F5E6E8', 3: '#FCE4EC', 4: '#E8DFF0',
            5: '#E0E8F5', 6: '#F5E0E0', 7: '#E0F0E8', 8: '#F5F0D0',
            9: '#F5F0D8', 10: '#F5E0D0', 11: '#E8D8F0', 12: '#D8DCE0'
        };
        ctx.fillStyle = monthColors[card.month] || '#F0F0F0';
        roundRect(ctx, mbx + 2, mby + 2, mw - mbx * 2 - 4, mh - mby * 2 - 4, 3);

        // 타입별 아이콘/색상
        const typeSymbols = {
            'gwang': { symbol: '광', color: C.red, bg: C.yellow },
            'tti-hong': { symbol: '홍', color: C.white, bg: C.red },
            'tti-cheong': { symbol: '청', color: C.white, bg: C.blue },
            'tti-cho': { symbol: '초', color: C.white, bg: C.red },
            'yeol': { symbol: '열', color: C.white, bg: C.darkGreen },
            'pi': { symbol: '', color: C.black, bg: null },
            'ssang-pi': { symbol: '쌍', color: C.red, bg: null },
        };

        const ts = typeSymbols[card.type] || typeSymbols['pi'];

        // 월 표시
        ctx.fillStyle = C.black;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(card.month + '월', mw / 2, mby + 4);

        // 타입 뱃지
        if (ts.bg) {
            ctx.fillStyle = ts.bg;
            ctx.beginPath();
            ctx.arc(mw / 2, mh / 2 + 8, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = ts.color;
            ctx.font = 'bold 18px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ts.symbol, mw / 2, mh / 2 + 9);
        } else if (ts.symbol) {
            ctx.fillStyle = ts.color;
            ctx.font = 'bold 18px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ts.symbol, mw / 2, mh / 2 + 8);
        }

        // 광 카드 특별 표시
        if (card.type === 'gwang') {
            ctx.strokeStyle = C.gold;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(mw / 2, mh / 2 + 8, 18, 0, Math.PI * 2);
            ctx.stroke();
        }

        const url = canvas.toDataURL();
        cache.set(key, url);
        return url;
    }

    // ===== Public API =====
    return { render, renderBack, renderMini };
})();
