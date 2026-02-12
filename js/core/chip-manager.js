/**
 * ChipManager v2.0 - 칩 잔액 관리 시스템
 * ItemGame - 소셜 카지노
 *
 * Firebase Firestore 동기화 + 로컬 스토리지 폴백
 * 7일 프로그레시브 출석 보너스
 * 신규 유저 기본 지급: 10,000 칩
 */

const ChipManager = (() => {
    const STORAGE_KEY = 'itemgame_chips';
    const DEFAULT_CHIPS = 10000;
    // const DAILY_BONUS = 1000; // v1 단일 보너스 → v2 프로그레시브로 대체
    const DAILY_BONUS_KEY = 'itemgame_daily_bonus_date';
    const DAILY_STREAK_KEY = 'itemgame_daily_streak';

    // 7일 프로그레시브 보너스 금액
    const STREAK_BONUSES = [1000, 1500, 2000, 3000, 5000, 7000, 10000];

    let _chips = 0;
    let _listeners = [];
    let _dailyStreak = 0;
    let _lastBonusDate = null;

    /**
     * 초기화 - Firestore 우선, localStorage 폴백
     */
    async function init() {
        // 먼저 로컬에서 로드 (빠른 UI 표시)
        _chips = _loadChipsLocal();
        _loadStreakLocal();
        _notifyListeners();

        // Firebase 초기화 & Firestore 동기화 시도
        if (typeof initFirebase === 'function') {
            const uid = await initFirebase();
            if (uid) {
                await _syncFromFirestore();
            }
        }

        _notifyListeners();
        console.log(`[ChipManager] 초기화 완료: ${_chips.toLocaleString()} 칩 (streak: ${_dailyStreak})`);

        // BFCache 복원 시 (뒤로가기) 최신 잔액으로 동기화
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                _chips = _loadChipsLocal();
                _notifyListeners();
                console.log(`[ChipManager] BFCache 복원 → 잔액 동기화: ${_chips.toLocaleString()} 칩`);
            }
        });

        return _chips;
    }

    /**
     * Firestore에서 데이터 동기화
     */
    async function _syncFromFirestore() {
        if (typeof loadUserData !== 'function') return;

        try {
            const data = await loadUserData();
            if (data) {
                // Firestore 데이터가 있으면 우선 사용
                if (typeof data.chips === 'number') {
                    _chips = data.chips;
                    localStorage.setItem(STORAGE_KEY, _chips.toString());
                }
                if (typeof data.dailyBonusStreak === 'number') {
                    _dailyStreak = data.dailyBonusStreak;
                    localStorage.setItem(DAILY_STREAK_KEY, _dailyStreak.toString());
                }
                if (data.dailyBonusDate) {
                    _lastBonusDate = data.dailyBonusDate;
                    localStorage.setItem(DAILY_BONUS_KEY, _lastBonusDate);
                }
                console.log('[ChipManager] Firestore 동기화 완료');
            } else {
                // Firestore에 데이터 없음 → 신규 유저 생성
                if (typeof createUserIfNotExists === 'function') {
                    await createUserIfNotExists({
                        chips: _chips,
                        level: 1,
                        xp: 0,
                        dailyBonusDate: null,
                        dailyBonusStreak: 0
                    });
                }
            }
        } catch (e) {
            console.warn('[ChipManager] Firestore 동기화 실패, 로컬 유지:', e);
        }
    }

    /**
     * 칩 잔액 로드 (로컬)
     */
    function _loadChipsLocal() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
            const parsed = parseInt(saved, 10);
            return isNaN(parsed) ? DEFAULT_CHIPS : parsed;
        }
        localStorage.setItem(STORAGE_KEY, DEFAULT_CHIPS.toString());
        return DEFAULT_CHIPS;
    }

    /**
     * streak 로드 (로컬)
     */
    function _loadStreakLocal() {
        const streak = localStorage.getItem(DAILY_STREAK_KEY);
        _dailyStreak = streak ? parseInt(streak, 10) : 0;
        _lastBonusDate = localStorage.getItem(DAILY_BONUS_KEY) || null;
    }

    /**
     * 칩 잔액 저장 (로컬 + Firestore)
     */
    function _saveChips() {
        localStorage.setItem(STORAGE_KEY, _chips.toString());

        // Firestore 비동기 저장
        if (typeof saveUserData === 'function' && typeof isFirebaseConnected === 'function' && isFirebaseConnected()) {
            saveUserData({ chips: _chips }).catch(e =>
                console.warn('[ChipManager] Firestore 저장 실패:', e)
            );
        }
    }

    /**
     * 보너스 데이터 저장 (로컬 + Firestore)
     */
    function _saveBonusData() {
        localStorage.setItem(DAILY_BONUS_KEY, _lastBonusDate || '');
        localStorage.setItem(DAILY_STREAK_KEY, _dailyStreak.toString());

        if (typeof saveUserData === 'function' && typeof isFirebaseConnected === 'function' && isFirebaseConnected()) {
            saveUserData({
                dailyBonusDate: _lastBonusDate,
                dailyBonusStreak: _dailyStreak
            }).catch(e =>
                console.warn('[ChipManager] Firestore 보너스 저장 실패:', e)
            );
        }
    }

    /**
     * 현재 칩 잔액 반환
     */
    function getBalance() {
        return _chips;
    }

    /**
     * 칩 추가 (보너스, 승리 등)
     */
    function addChips(amount) {
        if (amount <= 0) return false;
        _chips += amount;
        _saveChips();
        _notifyListeners();
        return true;
    }

    /**
     * 칩 차감 (베팅)
     * @returns {boolean} 성공 여부
     */
    function deductChips(amount) {
        if (amount <= 0 || amount > _chips) return false;
        _chips -= amount;
        _saveChips();
        _notifyListeners();
        return true;
    }

    /**
     * 칩 설정 (직접 지정)
     */
    function setChips(amount) {
        _chips = Math.max(0, amount);
        _saveChips();
        _notifyListeners();
    }

    /**
     * 잔액 변경 리스너 등록
     */
    function onBalanceChange(callback) {
        _listeners.push(callback);
    }

    /**
     * 리스너에 잔액 변경 알림
     */
    function _notifyListeners() {
        _listeners.forEach(cb => {
            try { cb(_chips); } catch (e) { console.error(e); }
        });
    }

    // ═══════════════════════════════════
    //  7일 프로그레시브 출석 보너스
    // ═══════════════════════════════════

    /**
     * 데일리 보너스 수령 가능 여부
     */
    function canClaimDailyBonus() {
        if (!_lastBonusDate) return true;
        const today = new Date().toDateString();
        return _lastBonusDate !== today;
    }

    /**
     * 현재 streak 일수 (0~6)
     */
    function getDailyStreak() {
        return _dailyStreak;
    }

    /**
     * 오늘의 보너스 금액 (streak 기반)
     */
    function getTodayBonusAmount() {
        const idx = Math.min(_dailyStreak, STREAK_BONUSES.length - 1);
        return STREAK_BONUSES[idx];
    }

    /**
     * streak이 유효한지 확인 (어제 수령했는지)
     */
    function _isStreakValid() {
        if (!_lastBonusDate) return false;
        const lastDate = new Date(_lastBonusDate);
        const today = new Date();
        const diffMs = today.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        // 어제 수령했으면 streak 유지 (1일 차이)
        return diffDays <= 1;
    }

    /**
     * 데일리 보너스 수령
     * @returns {Object} { amount, streak, isDay7 }
     */
    function claimDailyBonus() {
        if (!canClaimDailyBonus()) return { amount: 0, streak: _dailyStreak, isDay7: false };

        const today = new Date().toDateString();

        // streak 유효성 검사 → 유효하면 +1, 아니면 리셋
        if (_isStreakValid()) {
            _dailyStreak = Math.min(_dailyStreak + 1, STREAK_BONUSES.length - 1);
        } else {
            _dailyStreak = 0;
        }

        const amount = STREAK_BONUSES[_dailyStreak];
        const isDay7 = _dailyStreak === STREAK_BONUSES.length - 1;

        _lastBonusDate = today;
        addChips(amount);
        _saveBonusData();

        return { amount, streak: _dailyStreak, isDay7 };
    }

    /**
     * 7일 보너스 배열 반환 (캘린더 UI용)
     */
    function getStreakBonuses() {
        return STREAK_BONUSES;
    }

    /**
     * 잔액 포맷 (1,000 형태)
     */
    function formatBalance(amount) {
        return (amount !== undefined ? amount : _chips).toLocaleString();
    }

    /**
     * 칩 리셋 (테스트용)
     */
    function reset() {
        _chips = DEFAULT_CHIPS;
        _saveChips();
        _notifyListeners();
    }

    return {
        init,
        getBalance,
        addChips,
        deductChips,
        setChips,
        onBalanceChange,
        canClaimDailyBonus,
        claimDailyBonus,
        getDailyStreak,
        getTodayBonusAmount,
        getStreakBonuses,
        formatBalance,
        reset,
        DEFAULT_CHIPS,
        STREAK_BONUSES
    };
})();
