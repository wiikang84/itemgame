/**
 * ChipManager - 칩 잔액 관리 시스템
 * ItemGame - 소셜 카지노
 *
 * Firebase 연동 + 로컬 스토리지 폴백
 * 신규 유저 기본 지급: 10,000 칩
 */

const ChipManager = (() => {
    const STORAGE_KEY = 'itemgame_chips';
    const DEFAULT_CHIPS = 10000;
    const DAILY_BONUS = 1000;
    const DAILY_BONUS_KEY = 'itemgame_daily_bonus_date';

    let _chips = 0;
    let _listeners = [];

    /**
     * 초기화 - 칩 잔액 로드
     */
    function init() {
        _chips = _loadChips();
        _notifyListeners();
        console.log(`[ChipManager] 초기화 완료: ${_chips.toLocaleString()} 칩`);

        // BFCache 복원 시 (뒤로가기) 최신 잔액으로 동기화
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                _chips = _loadChips();
                _notifyListeners();
                console.log(`[ChipManager] BFCache 복원 → 잔액 동기화: ${_chips.toLocaleString()} 칩`);
            }
        });

        return _chips;
    }

    /**
     * 칩 잔액 로드 (Firebase 또는 로컬)
     */
    function _loadChips() {
        // 로컬 스토리지에서 로드
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
            const parsed = parseInt(saved, 10);
            return isNaN(parsed) ? DEFAULT_CHIPS : parsed;
        }
        // 최초 접속: 기본 칩 지급
        localStorage.setItem(STORAGE_KEY, DEFAULT_CHIPS.toString());
        return DEFAULT_CHIPS;
    }

    /**
     * 칩 잔액 저장
     */
    function _saveChips() {
        localStorage.setItem(STORAGE_KEY, _chips.toString());

        // Firebase 연동 (활성화 시)
        if (typeof isFirebaseConnected === 'function' && isFirebaseConnected() && auth && auth.currentUser) {
            db.collection('users').doc(auth.currentUser.uid).set({
                chips: _chips,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(e => console.warn('[ChipManager] Firebase 저장 실패:', e));
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

    /**
     * 데일리 보너스 수령 가능 여부
     */
    function canClaimDailyBonus() {
        const lastClaim = localStorage.getItem(DAILY_BONUS_KEY);
        if (!lastClaim) return true;
        const today = new Date().toDateString();
        return lastClaim !== today;
    }

    /**
     * 데일리 보너스 수령
     */
    function claimDailyBonus() {
        if (!canClaimDailyBonus()) return 0;
        const today = new Date().toDateString();
        localStorage.setItem(DAILY_BONUS_KEY, today);
        addChips(DAILY_BONUS);
        return DAILY_BONUS;
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
        formatBalance,
        reset,
        DEFAULT_CHIPS,
        DAILY_BONUS
    };
})();
