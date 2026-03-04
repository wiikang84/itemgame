/* ============================================
   화투패 이미지 렌더러 v3.0
   실제 화투 PNG 이미지 사용 (MIT License)
   Source: github.com/aaronrwang/HwaTu
   ============================================ */

const HwatuRenderer = (() => {
    'use strict';

    const BASE = 'images/hwatu/';

    function render(card) {
        const m = String(card.month).padStart(2, '0');
        const c = (card.id % 4) + 1;
        return `${BASE}${m}${c}.png`;
    }

    function renderBack() {
        return `${BASE}back.png`;
    }

    function renderMini(card) {
        return render(card);
    }

    function preload() {
        const paths = [renderBack()];
        for (let m = 1; m <= 12; m++)
            for (let c = 1; c <= 4; c++)
                paths.push(`${BASE}${String(m).padStart(2, '0')}${c}.png`);
        paths.forEach(src => { const img = new Image(); img.src = src; });
    }

    // 초기 프리로드
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', preload);
    } else {
        preload();
    }

    return { render, renderBack, renderMini, preload };
})();
