/**
 * NeonParticles - Canvas 기반 네온 파티클 배경 시스템
 * ItemGame v3.0 - 네온 사이버펑크
 *
 * 시안/핑크/퍼플/그린 부유 파티클 + 글로우 + 펄스
 */

const NeonParticles = (() => {
    let canvas = null;
    let ctx = null;
    let particles = [];
    let animId = null;

    const COLORS = [
        { r: 0, g: 255, b: 245 },    // 시안
        { r: 255, g: 45, b: 149 },    // 핑크
        { r: 179, g: 0, b: 255 },     // 퍼플
        { r: 0, g: 255, b: 65 },      // 그린
    ];

    const PARTICLE_COUNT = 30;

    function init() {
        canvas = document.getElementById('neonParticleCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'neonParticleCanvas';
            canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
            document.body.prepend(canvas);
        }
        ctx = canvas.getContext('2d');
        _resize();
        _createParticles();
        window.addEventListener('resize', _resize);
        _animate();
    }

    function _resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function _createParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const c = COLORS[Math.floor(Math.random() * COLORS.length)];
            particles.push({
                x: Math.random() * (canvas ? canvas.width : 1920),
                y: Math.random() * (canvas ? canvas.height : 1080),
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: 1.5 + Math.random() * 3,
                color: c,
                alpha: 0.2 + Math.random() * 0.4,
                pulseSpeed: 0.01 + Math.random() * 0.02,
                pulsePhase: Math.random() * Math.PI * 2,
                glowSize: 8 + Math.random() * 12,
            });
        }
    }

    function _animate() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const now = Date.now() * 0.001;

        for (const p of particles) {
            // 이동
            p.x += p.vx;
            p.y += p.vy;

            // 화면 래핑
            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = canvas.height + 10;
            if (p.y > canvas.height + 10) p.y = -10;

            // 펄스
            const pulse = Math.sin(now * p.pulseSpeed * 60 + p.pulsePhase) * 0.5 + 0.5;
            const alpha = p.alpha * (0.5 + pulse * 0.5);
            const { r, g, b } = p.color;

            // 글로우
            ctx.save();
            ctx.globalAlpha = alpha * 0.3;
            ctx.shadowBlur = p.glowSize;
            ctx.shadowColor = `rgb(${r},${g},${b})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size + pulse * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
            ctx.fill();
            ctx.restore();

            // 코어
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},1)`;
            ctx.fill();
            ctx.restore();
        }

        animId = requestAnimationFrame(_animate);
    }

    function stop() {
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    }

    return { init, stop };
})();
