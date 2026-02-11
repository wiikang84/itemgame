/**
 * SoundManager v2.0 - Web Audio API 기반 프리미엄 사운드 시스템
 * ItemGame - 소셜 카지노
 *
 * [v1.0 코드는 git history에 보존됨 - commit fd342be]
 *
 * v2.0 주요 업그레이드:
 * - BGM 시스템 (메인/프리스핀 배경음악)
 * - 5단계 승리 사운드 (Small/Nice/Big/Mega/Epic Win)
 * - 릴 앤티시페이션/서스펜스 사운드
 * - 와일드/스캐터 출현 사운드
 * - 프리스핀 트리거/완료 사운드
 * - 멀티플라이어 증가 사운드
 * - 갬블(더블업) 사운드
 * - 코인 샤워 사운드
 */

const SoundManager = (() => {
    let audioCtx = null;
    let _muted = false;
    let _masterGain = null;
    let _bgmGain = null;
    let _sfxGain = null;
    let _bgmNodes = [];
    let _bgmInterval = null;
    let _bgmPlaying = false;
    let _coinInterval = null;
    const MUTE_KEY = 'itemgame_muted';
    const BGM_VOL = 0.06;
    const SFX_VOL = 0.25;

    // 이집트풍 스케일 (A Phrygian Dominant)
    const EGYPTIAN_SCALE = [220, 233.1, 277.2, 293.7, 329.6, 349.2, 392];
    const EGYPTIAN_HIGH = [440, 466.2, 554.4, 587.3, 659.3, 698.5, 784];

    // ─── AudioContext ───

    function _getCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            _masterGain = audioCtx.createGain();
            _masterGain.gain.value = 1.0;
            _masterGain.connect(audioCtx.destination);

            _bgmGain = audioCtx.createGain();
            _bgmGain.gain.value = BGM_VOL;
            _bgmGain.connect(_masterGain);

            _sfxGain = audioCtx.createGain();
            _sfxGain.gain.value = SFX_VOL;
            _sfxGain.connect(_masterGain);
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // ─── 초기화 ───

    function init() {
        _muted = localStorage.getItem(MUTE_KEY) === 'true';
        _updateMuteUI();

        const activate = () => {
            _getCtx();
            document.removeEventListener('click', activate);
            document.removeEventListener('touchstart', activate);
        };
        document.addEventListener('click', activate);
        document.addEventListener('touchstart', activate);
    }

    function _updateMuteUI() {
        const btn = document.getElementById('soundToggleBtn');
        if (btn) {
            btn.textContent = _muted ? '🔇' : '🔊';
            btn.title = _muted ? '소리 켜기' : '소리 끄기';
        }
    }

    function toggleMute() {
        _muted = !_muted;
        localStorage.setItem(MUTE_KEY, _muted.toString());
        _updateMuteUI();
        if (_muted) {
            stopBGM();
        } else {
            playClick();
        }
    }

    function isMuted() { return _muted; }

    // ─── 기본 톤 유틸리티 ───

    function _playTone(freq, duration, type = 'sine', volume = 0.15, detune = 0, dest = null) {
        if (_muted) return null;
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
            gain.connect(dest || _sfxGain || _masterGain || ctx.destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration + 0.05);
            return osc;
        } catch (e) { return null; }
    }

    function _playToneAt(freq, duration, type, volume, startTime, dest) {
        if (_muted) return null;
        try {
            const ctx = _getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type || 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.linearRampToValueAtTime(volume || 0.15, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(dest || _sfxGain || ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration + 0.05);
            return osc;
        } catch (e) { return null; }
    }

    function _playNoise(duration, volume = 0.05, dest = null) {
        if (_muted) return;
        try {
            const ctx = _getCtx();
            const bufferSize = Math.floor(ctx.sampleRate * duration);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1);
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 3000;
            filter.Q.value = 1;

            source.connect(filter);
            filter.connect(gain);
            gain.connect(dest || _sfxGain || ctx.destination);
            source.start(ctx.currentTime);
        } catch (e) { }
    }

    function _playChord(freqs, duration, type = 'sine', volume = 0.1, dest = null) {
        freqs.forEach(f => _playTone(f, duration, type, volume / freqs.length, 0, dest));
    }

    // ═══════════════════════════════════
    //  BGM 시스템
    // ═══════════════════════════════════

    function startBGM(type = 'main') {
        if (_muted) return;
        stopBGM();
        _getCtx();

        if (type === 'freespin') {
            _startFreeSpinBGM();
        } else {
            _startMainBGM();
        }
        _bgmPlaying = true;
    }

    function _startMainBGM() {
        const ctx = _getCtx();

        // 베이스 드론 (A2)
        const bass = ctx.createOscillator();
        bass.type = 'triangle';
        bass.frequency.value = 110;
        const bassGain = ctx.createGain();
        bassGain.gain.value = 0.25;
        bass.connect(bassGain);
        bassGain.connect(_bgmGain);
        bass.start();
        _bgmNodes.push(bass);

        // 패드 (Am 코드 톤)
        const padFreqs = [220, 261.6, 329.6]; // A3, C4, E4
        padFreqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 600;
            filter.Q.value = 1.5;

            // 느린 필터 스윕
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.08 + i * 0.02;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 300;
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            lfo.start();
            _bgmNodes.push(lfo);

            const padGain = ctx.createGain();
            padGain.gain.value = 0.12;
            osc.connect(filter);
            filter.connect(padGain);
            padGain.connect(_bgmGain);
            osc.start();
            _bgmNodes.push(osc);
        });

        // 주기적 스파클 노트
        _bgmInterval = setInterval(() => {
            if (_muted || !_bgmPlaying) return;
            const freq = EGYPTIAN_HIGH[Math.floor(Math.random() * EGYPTIAN_HIGH.length)];
            const dur = 0.8 + Math.random() * 1.2;
            _playTone(freq, dur, 'sine', 0.02, 0, _bgmGain);
            // 가끔 두 번째 노트
            if (Math.random() > 0.6) {
                setTimeout(() => {
                    const f2 = EGYPTIAN_HIGH[Math.floor(Math.random() * EGYPTIAN_HIGH.length)];
                    _playTone(f2, 0.6, 'sine', 0.015, 0, _bgmGain);
                }, 300 + Math.random() * 500);
            }
        }, 3000);
    }

    function _startFreeSpinBGM() {
        const ctx = _getCtx();

        // 더 강렬한 베이스 (E2)
        const bass = ctx.createOscillator();
        bass.type = 'sawtooth';
        bass.frequency.value = 82.4;
        const bassFilter = ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 200;
        const bassGain = ctx.createGain();
        bassGain.gain.value = 0.2;
        bass.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(_bgmGain);
        bass.start();
        _bgmNodes.push(bass);

        // 텐션 패드 (Bbm)
        const padFreqs = [233.1, 277.2, 349.2]; // Bb3, C#4, F4
        padFreqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 900;
            filter.Q.value = 2;

            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.15 + i * 0.05;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 500;
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            lfo.start();
            _bgmNodes.push(lfo);

            const padGain = ctx.createGain();
            padGain.gain.value = 0.15;
            osc.connect(filter);
            filter.connect(padGain);
            padGain.connect(_bgmGain);
            osc.start();
            _bgmNodes.push(osc);
        });

        // 빠른 리듬 스파클
        let tick = 0;
        _bgmInterval = setInterval(() => {
            if (_muted || !_bgmPlaying) return;
            tick++;
            // 리듬감 있는 펄스
            if (tick % 2 === 0) {
                _playTone(EGYPTIAN_HIGH[tick % EGYPTIAN_HIGH.length], 0.15, 'square', 0.02, 0, _bgmGain);
            }
            // 높은 스파클
            if (tick % 3 === 0) {
                const freq = EGYPTIAN_HIGH[Math.floor(Math.random() * EGYPTIAN_HIGH.length)] * 2;
                _playTone(freq, 0.4, 'sine', 0.015, 0, _bgmGain);
            }
        }, 500);
    }

    function stopBGM() {
        _bgmNodes.forEach(node => {
            try { node.stop(); } catch (e) { }
        });
        _bgmNodes = [];
        if (_bgmInterval) {
            clearInterval(_bgmInterval);
            _bgmInterval = null;
        }
        _bgmPlaying = false;
    }

    function switchBGM(type) {
        stopBGM();
        setTimeout(() => startBGM(type), 100);
    }

    // ═══════════════════════════════════
    //  UI 사운드
    // ═══════════════════════════════════

    function playClick() {
        _playTone(900, 0.06, 'sine', 0.06);
        _playTone(1200, 0.04, 'sine', 0.03);
    }

    function playChipPlace() {
        _playNoise(0.05, 0.08);
        _playTone(1400, 0.04, 'sine', 0.05);
    }

    function playChipRemove() {
        _playTone(700, 0.06, 'sine', 0.04);
    }

    // ═══════════════════════════════════
    //  슬롯 기본 사운드
    // ═══════════════════════════════════

    /** 스핀 시작 - 가속감 있는 상승음 */
    function playSpinStart() {
        if (_muted) return;
        const ctx = _getCtx();
        const now = ctx.currentTime;
        for (let i = 0; i < 5; i++) {
            _playToneAt(200 + i * 80, 0.08, 'square', 0.04, now + i * 0.04);
        }
        _playNoise(0.15, 0.06);
    }

    /** 릴 멈춤 - 묵직한 착지음 */
    function playReelStop(index) {
        if (_muted) return;
        // 낮은 쿵 소리
        _playTone(80 + index * 10, 0.2, 'sine', 0.12);
        // 메카니컬 클릭
        _playTone(300 + index * 60, 0.08, 'triangle', 0.08);
        _playNoise(0.04, 0.1);
    }

    /** 앤티시페이션 - 마지막 릴 서스펜스 */
    function playAnticipation() {
        if (_muted) return;
        const ctx = _getCtx();
        const now = ctx.currentTime;
        // 점점 높아지는 텐션 사운드
        for (let i = 0; i < 12; i++) {
            _playToneAt(200 + i * 40, 0.15, 'sine', 0.03 + i * 0.005, now + i * 0.1);
        }
        // 드럼롤 느낌의 노이즈
        for (let i = 0; i < 8; i++) {
            setTimeout(() => _playNoise(0.03, 0.04 + i * 0.005), i * 100);
        }
    }

    // ═══════════════════════════════════
    //  와일드 & 스캐터
    // ═══════════════════════════════════

    /** 와일드 출현 - 반짝이는 마법 사운드 */
    function playWildLand() {
        if (_muted) return;
        const ctx = _getCtx();
        const now = ctx.currentTime;
        // 상승 스윕
        _playToneAt(400, 0.3, 'sine', 0.1, now);
        _playToneAt(600, 0.25, 'sine', 0.08, now + 0.05);
        _playToneAt(900, 0.2, 'sine', 0.06, now + 0.1);
        _playToneAt(1200, 0.15, 'triangle', 0.04, now + 0.15);
        // 스파클
        _playNoise(0.1, 0.06);
    }

    /** 스캐터 출현 - 신비로운 차임 (출현 횟수에 따라 강도 증가) */
    function playScatterLand(count) {
        if (_muted) return;
        const ctx = _getCtx();
        const now = ctx.currentTime;
        const volume = 0.06 + count * 0.03;
        // 이집트풍 차임
        const notes = [440, 554.4, 659.3]; // A4, C#5, E5
        notes.forEach((f, i) => {
            _playToneAt(f, 0.4, 'sine', volume, now + i * 0.08);
            _playToneAt(f * 2, 0.3, 'sine', volume * 0.3, now + i * 0.08);
        });
        // 깊은 공명
        _playToneAt(110 * count, 0.5, 'triangle', volume * 0.5, now);
    }

    /** 확장 와일드 - 전체 릴을 덮는 웅장한 사운드 */
    function playExpandingWild() {
        if (_muted) return;
        const ctx = _getCtx();
        const now = ctx.currentTime;
        // 상승하는 코드
        const chord = [220, 277.2, 329.6, 440];
        chord.forEach((f, i) => {
            _playToneAt(f, 0.6, 'sine', 0.08, now + i * 0.05);
            _playToneAt(f * 2, 0.4, 'triangle', 0.04, now + i * 0.05);
        });
        // 파워 노이즈
        _playNoise(0.3, 0.08);
        // 클라이맥스
        setTimeout(() => {
            _playTone(880, 0.5, 'sine', 0.1);
            _playTone(1108.7, 0.4, 'sine', 0.06);
        }, 200);
    }

    // ═══════════════════════════════════
    //  5단계 승리 사운드
    // ═══════════════════════════════════

    /** Small Win (1x~5x) - 경쾌한 코인 사운드 */
    function playSmallWin() {
        if (_muted) return;
        const ctx = _getCtx();
        const now = ctx.currentTime;
        // 짧은 3음 아르페지오
        _playToneAt(523, 0.15, 'sine', 0.1, now);
        _playToneAt(659, 0.15, 'sine', 0.1, now + 0.08);
        _playToneAt(784, 0.2, 'sine', 0.12, now + 0.16);
        // 코인 클링크
        _playToneAt(2000, 0.05, 'sine', 0.04, now + 0.1);
        _playToneAt(2500, 0.04, 'sine', 0.03, now + 0.2);
    }

    /** Nice Win (5x~15x) - 팡파레 + 코인 */
    function playNiceWin() {
        if (_muted) return;
        const ctx = _getCtx();
        const now = ctx.currentTime;
        // 5음 팡파레
        const melody = [523, 659, 784, 659, 1047];
        melody.forEach((f, i) => {
            _playToneAt(f, 0.2, 'sine', 0.12, now + i * 0.1);
            _playToneAt(f * 0.5, 0.2, 'triangle', 0.04, now + i * 0.1);
        });
        // 코인 샤워
        for (let i = 0; i < 5; i++) {
            _playToneAt(1800 + Math.random() * 1200, 0.04, 'sine', 0.03, now + 0.3 + i * 0.08);
        }
    }

    /** Big Win (15x~50x) - 오케스트라 히트 + 확장 팡파레 */
    function playBigWin() {
        if (_muted) return;
        const ctx = _getCtx();
        const now = ctx.currentTime;
        // 오케스트라 히트
        [261.6, 329.6, 392, 523, 659].forEach(f => {
            _playToneAt(f, 0.8, 'sawtooth', 0.04, now);
        });
        _playNoise(0.15, 0.1);
        // 팡파레 멜로디
        const melody = [523, 659, 784, 1047, 784, 1047, 1319, 1047, 1319, 1568];
        melody.forEach((f, i) => {
            _playToneAt(f, 0.25, 'sine', 0.1, now + 0.3 + i * 0.12);
            _playToneAt(f * 0.5, 0.25, 'triangle', 0.04, now + 0.3 + i * 0.12);
        });
        // 대형 코인 샤워
        for (let i = 0; i < 15; i++) {
            _playToneAt(1500 + Math.random() * 2000, 0.04, 'sine', 0.02, now + 0.5 + i * 0.06);
        }
    }

    /** Mega Win (50x~100x) - 극적 연출 + 럼블 */
    function playMegaWin() {
        if (_muted) return;
        const ctx = _getCtx();
        const now = ctx.currentTime;
        // 저음 럼블
        _playToneAt(40, 1.5, 'sine', 0.15, now);
        _playToneAt(55, 1.5, 'sawtooth', 0.05, now);
        _playNoise(0.5, 0.12);
        // 임팩트 히트
        setTimeout(() => {
            [130.8, 261.6, 329.6, 392, 523, 659, 784].forEach(f => {
                _playTone(f, 1.0, 'sawtooth', 0.035);
            });
        }, 200);
        // 영웅적 멜로디
        const melody = [523, 784, 1047, 1319, 1568, 1319, 1568, 2093];
        melody.forEach((f, i) => {
            setTimeout(() => {
                _playTone(f, 0.35, 'sine', 0.1);
                _playTone(f * 0.75, 0.3, 'sine', 0.05); // 하모니
                _playTone(f * 0.5, 0.3, 'triangle', 0.04);
            }, 600 + i * 150);
        });
        // 코인 폭포
        for (let i = 0; i < 25; i++) {
            setTimeout(() => {
                _playTone(1200 + Math.random() * 3000, 0.05, 'sine', 0.02);
            }, 800 + i * 50);
        }
    }

    /** Epic Win (100x+) - 최고조 클라이맥스 */
    function playEpicWin() {
        if (_muted) return;
        const ctx = _getCtx();
        const now = ctx.currentTime;
        // 대지진 럼블
        _playToneAt(30, 2.5, 'sine', 0.18, now);
        _playToneAt(45, 2.0, 'sine', 0.12, now);
        _playNoise(0.8, 0.15);
        // 오케스트라 폭발
        setTimeout(() => {
            [65.4, 130.8, 196, 261.6, 329.6, 392, 523, 659, 784, 1047].forEach(f => {
                _playTone(f, 1.5, 'sawtooth', 0.025);
            });
            _playNoise(0.3, 0.15);
        }, 300);
        // 승리의 찬가
        const hymn = [
            523, 659, 784, 1047,  // 1절
            1047, 1319, 1568, 2093,  // 2절 (한 옥타브 위)
            1568, 2093, 1568, 2093, 2637  // 클라이맥스
        ];
        hymn.forEach((f, i) => {
            setTimeout(() => {
                _playTone(f, 0.4, 'sine', 0.1);
                _playTone(f * 0.75, 0.35, 'sine', 0.06);
                _playTone(f * 0.5, 0.35, 'triangle', 0.04);
                _playTone(f * 0.25, 0.35, 'triangle', 0.03);
                // 스파클
                if (i > 4) {
                    _playTone(f * 2, 0.2, 'sine', 0.02);
                }
            }, 800 + i * 180);
        });
        // 코인 쏟아짐
        for (let i = 0; i < 40; i++) {
            setTimeout(() => {
                _playTone(1000 + Math.random() * 4000, 0.04, 'sine', 0.015);
                if (i % 3 === 0) _playNoise(0.02, 0.02);
            }, 1000 + i * 40);
        }
    }

    // ═══════════════════════════════════
    //  프리스핀 사운드
    // ═══════════════════════════════════

    /** 프리스핀 트리거 - 극적인 시작 */
    function playFreeSpinTrigger() {
        if (_muted) return;
        const ctx = _getCtx();
        const now = ctx.currentTime;
        // 드라마틱 빌드업
        for (let i = 0; i < 8; i++) {
            _playToneAt(150 + i * 50, 0.3, 'sine', 0.06, now + i * 0.08);
        }
        // 폭발적 해소
        setTimeout(() => {
            [261.6, 329.6, 392, 523, 659].forEach(f => {
                _playTone(f, 0.8, 'sine', 0.08);
            });
            _playTone(1047, 1.0, 'sine', 0.12);
            _playNoise(0.2, 0.1);
        }, 700);
        // 이집트 멜로디
        const melody = [440, 466.2, 554.4, 659.3, 880];
        melody.forEach((f, i) => {
            setTimeout(() => {
                _playTone(f, 0.4, 'sine', 0.08);
                _playTone(f * 0.5, 0.4, 'triangle', 0.04);
            }, 1000 + i * 150);
        });
    }

    /** 프리스핀 완료 - 마무리 팡파레 */
    function playFreeSpinComplete() {
        if (_muted) return;
        const melody = [784, 659, 784, 1047, 784, 1047, 1319];
        melody.forEach((f, i) => {
            setTimeout(() => {
                _playTone(f, 0.3, 'sine', 0.1);
                _playTone(f * 0.5, 0.3, 'triangle', 0.04);
            }, i * 130);
        });
    }

    /** 멀티플라이어 증가 */
    function playMultiplierUp() {
        if (_muted) return;
        _playTone(800, 0.15, 'sine', 0.1);
        setTimeout(() => _playTone(1000, 0.15, 'sine', 0.1), 80);
        setTimeout(() => _playTone(1200, 0.2, 'sine', 0.12), 160);
        setTimeout(() => _playTone(1600, 0.25, 'triangle', 0.06), 240);
    }

    // ═══════════════════════════════════
    //  갬블(더블업) 사운드
    // ═══════════════════════════════════

    function playGambleSelect() {
        _playTone(600, 0.1, 'sine', 0.08);
        _playTone(800, 0.08, 'sine', 0.06);
    }

    function playGambleReveal() {
        if (_muted) return;
        // 드럼롤
        for (let i = 0; i < 6; i++) {
            setTimeout(() => _playNoise(0.04, 0.06 + i * 0.01), i * 60);
        }
        setTimeout(() => _playTone(500, 0.15, 'triangle', 0.1), 400);
    }

    function playGambleWin() {
        if (_muted) return;
        const notes = [523, 659, 784, 1047, 1319];
        notes.forEach((f, i) => {
            setTimeout(() => {
                _playTone(f, 0.2, 'sine', 0.1);
            }, i * 80);
        });
    }

    function playGambleLose() {
        if (_muted) return;
        _playTone(400, 0.4, 'sine', 0.1);
        setTimeout(() => _playTone(300, 0.4, 'sine', 0.08), 200);
        setTimeout(() => _playTone(200, 0.6, 'sine', 0.06), 400);
    }

    // ═══════════════════════════════════
    //  기타 효과음
    // ═══════════════════════════════════

    /** 코인 샤워 (지속 시간 지정) */
    function startCoinShower(durationMs = 2000) {
        if (_muted) return;
        stopCoinShower();
        let elapsed = 0;
        _coinInterval = setInterval(() => {
            elapsed += 50;
            if (elapsed >= durationMs) { stopCoinShower(); return; }
            _playTone(1500 + Math.random() * 2500, 0.04, 'sine', 0.02);
            if (Math.random() > 0.7) _playNoise(0.02, 0.015);
        }, 50);
    }

    function stopCoinShower() {
        if (_coinInterval) { clearInterval(_coinInterval); _coinInterval = null; }
    }

    /** 카운트업 틱 */
    function playCountTick() {
        _playTone(1200, 0.02, 'sine', 0.03);
    }

    /** 패배 (조용한 - 카지노 원칙) */
    function playLose() {
        // 카지노 원칙: 패배 시 거의 무음
        // 아주 미세한 하강 톤만
        if (_muted) return;
        _playTone(300, 0.15, 'sine', 0.03);
    }

    /** 보너스 수령 */
    function playBonus() {
        if (_muted) return;
        const notes = [392, 494, 587, 784]; // G4 B4 D5 G5
        notes.forEach((freq, i) => {
            setTimeout(() => _playTone(freq, 0.3, 'sine', 0.1), i * 150);
        });
    }

    // ─── 블랙잭/룰렛용 (기존 유지) ───

    function playCardDeal() {
        _playNoise(0.05, 0.12);
        _playTone(1000, 0.04, 'sine', 0.04);
    }

    function playCardFlip() {
        _playNoise(0.03, 0.08);
        _playTone(1500, 0.06, 'sine', 0.05);
    }

    function playRouletteSpinStart() {
        if (_muted) return;
        for (let i = 0; i < 8; i++) {
            setTimeout(() => _playTone(500, 0.03, 'square', 0.05), i * (80 - i * 5));
        }
    }

    function playRouletteTick() {
        _playTone(600, 0.02, 'square', 0.03);
    }

    function playBallLand() {
        _playNoise(0.08, 0.15);
        _playTone(300, 0.15, 'sine', 0.1);
    }

    /** 승리 (레거시 호환 - NiceWin으로 라우팅) */
    function playWin() {
        playNiceWin();
    }

    return {
        init,
        toggleMute,
        isMuted,
        // BGM
        startBGM,
        stopBGM,
        switchBGM,
        // UI
        playClick,
        playChipPlace,
        playChipRemove,
        // 슬롯 기본
        playSpinStart,
        playReelStop,
        playAnticipation,
        // 와일드/스캐터
        playWildLand,
        playScatterLand,
        playExpandingWild,
        // 5단계 승리
        playSmallWin,
        playNiceWin,
        playBigWin,
        playMegaWin,
        playEpicWin,
        // 프리스핀
        playFreeSpinTrigger,
        playFreeSpinComplete,
        playMultiplierUp,
        // 갬블
        playGambleSelect,
        playGambleReveal,
        playGambleWin,
        playGambleLose,
        // 기타
        startCoinShower,
        stopCoinShower,
        playCountTick,
        playLose,
        playBonus,
        // 레거시
        playWin,
        playCardDeal,
        playCardFlip,
        playRouletteSpinStart,
        playRouletteTick,
        playBallLand,
    };
})();
