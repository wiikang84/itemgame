/**
 * LevelManager - XP/레벨 시스템
 * ItemGame - 소셜 카지노
 *
 * 게임 플레이 시 XP 획득 (bet 금액의 10%)
 * 레벨업 공식: required_xp = level * 500
 * 레벨업 시 보너스 칩 (level * 200)
 * Firestore 동기화
 */

const LevelManager = (() => {
    const STORAGE_KEY_LEVEL = 'itemgame_level';
    const STORAGE_KEY_XP = 'itemgame_xp';
    const XP_RATE = 0.1; // bet 금액의 10%
    const XP_PER_LEVEL = 500; // 레벨당 필요 XP 계수
    const BONUS_PER_LEVEL = 200; // 레벨업 보너스 계수

    let _level = 1;
    let _xp = 0;
    let _listeners = [];

    /**
     * 초기화
     */
    function init() {
        _loadLocal();
        _syncFromFirestore();
        _updateUI();
    }

    /**
     * 로컬 데이터 로드
     */
    function _loadLocal() {
        const savedLevel = localStorage.getItem(STORAGE_KEY_LEVEL);
        const savedXP = localStorage.getItem(STORAGE_KEY_XP);
        _level = savedLevel ? parseInt(savedLevel, 10) : 1;
        _xp = savedXP ? parseInt(savedXP, 10) : 0;
        if (isNaN(_level) || _level < 1) _level = 1;
        if (isNaN(_xp) || _xp < 0) _xp = 0;
    }

    /**
     * Firestore 동기화
     */
    async function _syncFromFirestore() {
        if (typeof loadUserData !== 'function' || typeof isFirebaseConnected !== 'function') return;
        if (!isFirebaseConnected()) return;

        try {
            const data = await loadUserData();
            if (data) {
                if (typeof data.level === 'number' && data.level >= 1) {
                    _level = data.level;
                    localStorage.setItem(STORAGE_KEY_LEVEL, _level.toString());
                }
                if (typeof data.xp === 'number' && data.xp >= 0) {
                    _xp = data.xp;
                    localStorage.setItem(STORAGE_KEY_XP, _xp.toString());
                }
            }
        } catch (e) {
            // 무시 - 로컬 데이터 유지
        }
        _updateUI();
    }

    /**
     * 로컬 + Firestore 저장
     */
    function _save() {
        localStorage.setItem(STORAGE_KEY_LEVEL, _level.toString());
        localStorage.setItem(STORAGE_KEY_XP, _xp.toString());

        if (typeof saveUserData === 'function' && typeof isFirebaseConnected === 'function' && isFirebaseConnected()) {
            saveUserData({ level: _level, xp: _xp }).catch(() => {});
        }
    }

    /**
     * XP 획득 (베팅 시 호출)
     * @param {number} betAmount - 베팅 금액
     * @returns {Object|null} 레벨업 시 { newLevel, bonus }
     */
    function addXP(betAmount) {
        const gained = Math.max(1, Math.floor(betAmount * XP_RATE));
        _xp += gained;

        const requiredXP = getRequiredXP();
        let levelUpResult = null;

        if (_xp >= requiredXP) {
            _xp -= requiredXP;
            _level++;
            const bonus = _level * BONUS_PER_LEVEL;

            // 보너스 칩 지급
            if (typeof ChipManager !== 'undefined') {
                ChipManager.addChips(bonus);
            }

            levelUpResult = { newLevel: _level, bonus };

            // 레벨업 알림
            _notifyListeners({ type: 'levelup', level: _level, bonus });

            console.log(`[LevelManager] 레벨업! Lv.${_level} (보너스: +${bonus})`);
        }

        _save();
        _updateUI();

        return levelUpResult;
    }

    /**
     * 현재 레벨에 필요한 XP
     */
    function getRequiredXP() {
        return _level * XP_PER_LEVEL;
    }

    /**
     * XP 진행률 (0~1)
     */
    function getProgress() {
        const required = getRequiredXP();
        return required > 0 ? Math.min(_xp / required, 1) : 0;
    }

    /**
     * UI 업데이트 (헤더 XP 바)
     */
    function _updateUI() {
        const levelEl = document.getElementById('levelDisplay');
        if (levelEl) levelEl.textContent = `Lv.${_level}`;

        const xpBarFill = document.getElementById('xpBarFill');
        if (xpBarFill) {
            const progress = getProgress() * 100;
            xpBarFill.style.width = `${progress}%`;
        }

        const xpTextEl = document.getElementById('xpText');
        if (xpTextEl) {
            xpTextEl.textContent = `${_xp}/${getRequiredXP()}`;
        }
    }

    /**
     * 리스너 등록
     */
    function onEvent(callback) {
        _listeners.push(callback);
    }

    function _notifyListeners(event) {
        _listeners.forEach(cb => {
            try { cb(event); } catch (e) { console.error(e); }
        });
    }

    /**
     * Getters
     */
    function getLevel() { return _level; }
    function getXP() { return _xp; }

    return {
        init,
        addXP,
        getLevel,
        getXP,
        getRequiredXP,
        getProgress,
        onEvent
    };
})();
