/**
 * CoinShower - Canvas 기반 코인 파티클 시스템
 * ItemGame - 소셜 카지노
 *
 * 빅윈 시 동전이 하늘에서 쏟아지는 효과
 * 중력 + 회전 + 페이드 아웃
 */

const CoinShower = (() => {
    let canvas = null;
    let ctx = null;
    let particles = [];
    let animationId = null;
    let isActive = false;

    /* v2.0 골드 코인 (주석처리 보존)
    const COIN_COLORS = [
        { face: '#ffd700', edge: '#b8960f', highlight: '#fff5b0' },
        { face: '#ffaa00', edge: '#996600', highlight: '#ffdd66' },
        { face: '#ff8800', edge: '#885500', highlight: '#ffbb44' },
    ];
    */
    // v3.0: 네온 사이버펑크 코인 (시안/핑크/퍼플/그린)
    const COIN_COLORS = [
        { face: '#00fff5', edge: '#00b8b0', highlight: '#aafff9' },
        { face: '#ff2d95', edge: '#cc2477', highlight: '#ff88c4' },
        { face: '#b300ff', edge: '#8800cc', highlight: '#d466ff' },
        { face: '#00ff41', edge: '#00cc33', highlight: '#88ffa8' },
    ];

    /**
     * 초기화 - Canvas 엘리먼트 바인딩
     */
    function init() {
        canvas = document.getElementById('coinShowerCanvas');
        if (!canvas) return;

        ctx = canvas.getContext('2d');
        _resize();

        window.addEventListener('resize', _resize);
    }

    function _resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    /**
     * 코인 샤워 시작
     * @param {number} duration - 지속 시간 (ms)
     * @param {string} tier - 'big' | 'mega' | 'epic'
     */
    function start(duration = 3000, tier = 'big') {
        if (!canvas || !ctx) {
            init();
            if (!canvas || !ctx) return;
        }

        _resize();
        isActive = true;
        particles = [];
        canvas.style.display = 'block';
        canvas.style.pointerEvents = 'none';

        const coinCount = tier === 'epic' ? 80 : tier === 'mega' ? 50 : 30;
        const spawnInterval = duration * 0.6 / coinCount;

        // 코인 점진적 생성
        for (let i = 0; i < coinCount; i++) {
            setTimeout(() => {
                if (!isActive) return;
                _spawnCoin();
            }, i * spawnInterval);
        }

        // 종료 타이머
        setTimeout(() => {
            isActive = false;
        }, duration);

        // 애니메이션 루프
        if (!animationId) {
            _animate();
        }
    }

    /**
     * 코인 파티클 생성
     */
    function _spawnCoin() {
        const colorSet = COIN_COLORS[Math.floor(Math.random() * COIN_COLORS.length)];
        const size = 12 + Math.random() * 12;

        particles.push({
            x: Math.random() * canvas.width,
            y: -size,
            vx: (Math.random() - 0.5) * 4,
            vy: 1 + Math.random() * 3,
            gravity: 0.12 + Math.random() * 0.08,
            size: size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.15,
            tilt: Math.random() * Math.PI,
            tiltSpeed: 0.02 + Math.random() * 0.04,
            opacity: 1,
            fadeStart: 0.7 + Math.random() * 0.2,
            color: colorSet,
            lifetime: 0,
            maxLifetime: 150 + Math.random() * 100
        });
    }

    /**
     * 애니메이션 루프
     */
    function _animate() {
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 파티클 업데이트 & 렌더링
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            // 물리 업데이트
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.tilt += p.tiltSpeed;
            p.lifetime++;

            // 페이드 아웃
            const lifeProgress = p.lifetime / p.maxLifetime;
            if (lifeProgress > p.fadeStart) {
                p.opacity = Math.max(0, 1 - (lifeProgress - p.fadeStart) / (1 - p.fadeStart));
            }

            // 화면 밖이거나 투명해지면 제거
            if (p.y > canvas.height + p.size || p.opacity <= 0) {
                particles.splice(i, 1);
                continue;
            }

            // 렌더링
            _drawCoin(p);
        }

        // 활성 상태이거나 파티클 남아있으면 계속
        if (isActive || particles.length > 0) {
            animationId = requestAnimationFrame(_animate);
        } else {
            animationId = null;
            if (canvas) canvas.style.display = 'none';
        }
    }

    /**
     * 코인 그리기 (3D 느낌의 타원)
     */
    function _drawCoin(p) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // 3D 회전 효과: tilt로 타원 비율 조절
        const scaleX = Math.abs(Math.cos(p.tilt));
        const halfSize = p.size / 2;

        // 동전 엣지 (두께감)
        if (scaleX > 0.1) {
            ctx.beginPath();
            ctx.ellipse(0, 1, halfSize * scaleX, halfSize, 0, 0, Math.PI * 2);
            ctx.fillStyle = p.color.edge;
            ctx.fill();
        }

        // 동전 면
        ctx.beginPath();
        ctx.ellipse(0, 0, halfSize * Math.max(scaleX, 0.1), halfSize, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.color.face;
        ctx.fill();

        // 하이라이트
        if (scaleX > 0.3) {
            ctx.beginPath();
            ctx.ellipse(-halfSize * 0.2 * scaleX, -halfSize * 0.2, halfSize * 0.3 * scaleX, halfSize * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = p.color.highlight;
            ctx.globalAlpha = p.opacity * 0.6;
            ctx.fill();
        }

        // $ 마크
        if (scaleX > 0.4) {
            ctx.globalAlpha = p.opacity * 0.8;
            ctx.fillStyle = p.color.edge;
            ctx.font = `bold ${Math.floor(p.size * 0.45)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);
        }

        ctx.restore();
    }

    /**
     * 즉시 중단
     */
    function stop() {
        isActive = false;
        particles = [];
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        if (canvas) {
            canvas.style.display = 'none';
        }
    }

    return {
        init,
        start,
        stop
    };
})();
