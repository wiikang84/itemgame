/**
 * SoundManager - Web Audio API 기반 사운드 매니저
 * ItemGame - 소셜 카지노
 *
 * 외부 파일 없이 프로그래매틱으로 톤/효과음 생성
 * 음소거 토글 지원
 */

const SoundManager = (() => {
    let audioCtx = null;
    let _muted = false;
    const MUTE_KEY = 'itemgame_muted';

    /**
     * AudioContext 가져오기 (lazy init)
     */
    function _getCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    /**
     * 초기화
     */
    function init() {
        _muted = localStorage.getItem(MUTE_KEY) === 'true';
        _updateMuteUI();

        // 첫 사용자 인터랙션 시 AudioContext 활성화
        const activate = () => {
            _getCtx();
            document.removeEventListener('click', activate);
            document.removeEventListener('touchstart', activate);
        };
        document.addEventListener('click', activate);
        document.addEventListener('touchstart', activate);
    }

    /**
     * 음소거 UI 업데이트
     */
    function _updateMuteUI() {
        const btn = document.getElementById('soundToggleBtn');
        if (btn) {
            btn.textContent = _muted ? '🔇' : '🔊';
            btn.title = _muted ? '소리 켜기' : '소리 끄기';
        }
    }

    /**
     * 음소거 토글
     */
    function toggleMute() {
        _muted = !_muted;
        localStorage.setItem(MUTE_KEY, _muted.toString());
        _updateMuteUI();
        if (!_muted) playClick();
    }

    function isMuted() {
        return _muted;
    }

    // ─── 기본 톤 생성 유틸 ───

    function _playTone(freq, duration, type = 'sine', volume = 0.15, detune = 0) {
        if (_muted) return;
        try {
            const ctx = _getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.value = freq;
            if (detune) osc.detune.value = detune;

            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            // 무시 (브라우저 제한 등)
        }
    }

    function _playNoise(duration, volume = 0.05) {
        if (_muted) return;
        try {
            const ctx = _getCtx();
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * volume;
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 3000;

            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            source.start(ctx.currentTime);
        } catch (e) { }
    }

    // ─── 효과음 ───

    /** 버튼 클릭 */
    function playClick() {
        _playTone(800, 0.08, 'sine', 0.08);
    }

    /** 칩 놓기 */
    function playChipPlace() {
        _playNoise(0.06, 0.1);
        _playTone(1200, 0.05, 'sine', 0.06);
    }

    /** 칩 제거 */
    function playChipRemove() {
        _playTone(600, 0.08, 'sine', 0.05);
    }

    /** 슬롯 스핀 시작 */
    function playSpinStart() {
        if (_muted) return;
        for (let i = 0; i < 3; i++) {
            setTimeout(() => _playTone(300 + i * 100, 0.1, 'square', 0.06), i * 50);
        }
    }

    /** 슬롯 릴 멈춤 */
    function playReelStop(index) {
        _playTone(200 + index * 50, 0.12, 'triangle', 0.1);
        _playNoise(0.04, 0.08);
    }

    /** 승리 (일반) */
    function playWin() {
        if (_muted) return;
        const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
        notes.forEach((freq, i) => {
            setTimeout(() => _playTone(freq, 0.2, 'sine', 0.12), i * 100);
        });
    }

    /** 큰 승리 */
    function playBigWin() {
        if (_muted) return;
        const melody = [523, 659, 784, 659, 784, 1047, 784, 1047, 1319];
        melody.forEach((freq, i) => {
            setTimeout(() => {
                _playTone(freq, 0.25, 'sine', 0.15);
                _playTone(freq * 0.5, 0.25, 'triangle', 0.06);
            }, i * 120);
        });
    }

    /** 패배 */
    function playLose() {
        if (_muted) return;
        _playTone(400, 0.3, 'sine', 0.08);
        setTimeout(() => _playTone(300, 0.4, 'sine', 0.06), 200);
    }

    /** 카드 딜 */
    function playCardDeal() {
        _playNoise(0.05, 0.12);
        _playTone(1000, 0.04, 'sine', 0.04);
    }

    /** 카드 뒤집기 */
    function playCardFlip() {
        _playNoise(0.03, 0.08);
        _playTone(1500, 0.06, 'sine', 0.05);
    }

    /** 룰렛 스핀 시작 */
    function playRouletteSpinStart() {
        if (_muted) return;
        // 점점 빨라지는 틱 소리
        for (let i = 0; i < 8; i++) {
            setTimeout(() => _playTone(500, 0.03, 'square', 0.05), i * (80 - i * 5));
        }
    }

    /** 룰렛 틱 (회전 중) */
    function playRouletteTick() {
        _playTone(600, 0.02, 'square', 0.03);
    }

    /** 룰렛 볼 착지 */
    function playBallLand() {
        _playNoise(0.08, 0.15);
        _playTone(300, 0.15, 'sine', 0.1);
    }

    /** 보너스 수령 */
    function playBonus() {
        if (_muted) return;
        const notes = [392, 494, 587, 784]; // G4 B4 D5 G5
        notes.forEach((freq, i) => {
            setTimeout(() => _playTone(freq, 0.3, 'sine', 0.1), i * 150);
        });
    }

    /** 카운트업 틱 */
    function playCountTick() {
        _playTone(1000, 0.02, 'sine', 0.04);
    }

    return {
        init,
        toggleMute,
        isMuted,
        playClick,
        playChipPlace,
        playChipRemove,
        playSpinStart,
        playReelStop,
        playWin,
        playBigWin,
        playLose,
        playCardDeal,
        playCardFlip,
        playRouletteSpinStart,
        playRouletteTick,
        playBallLand,
        playBonus,
        playCountTick
    };
})();
