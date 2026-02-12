/**
 * Firebase 설정 및 초기화 v2.0
 * ItemGame - 소셜 카지노
 *
 * - Firebase Auth (익명 로그인)
 * - Firestore (칩/레벨/XP 동기화)
 * - 오프라인 폴백 지원
 */

// Firebase 설정 (itemgame-casino 프로젝트)
// ※ Firebase 콘솔에서 웹앱 등록 후 실제 값으로 교체할 것
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "itemgame-casino.firebaseapp.com",
    projectId: "itemgame-casino",
    storageBucket: "itemgame-casino.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase 초기화 상태
let firebaseApp = null;
let db = null;
let auth = null;
let isFirebaseReady = false;
let currentUID = null;

/**
 * Firebase 초기화 + 익명 로그인
 * @returns {Promise<string|null>} uid 또는 null
 */
async function initFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.log('[Firebase] SDK 미로드 → 로컬 모드');
            isFirebaseReady = false;
            return null;
        }

        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            console.log('[Firebase] config 미설정 → 로컬 모드');
            isFirebaseReady = false;
            return null;
        }

        // 이미 초기화된 앱이 있으면 재사용
        if (firebase.apps.length > 0) {
            firebaseApp = firebase.apps[0];
        } else {
            firebaseApp = firebase.initializeApp(firebaseConfig);
        }

        db = firebase.firestore();
        auth = firebase.auth();

        // Firestore 오프라인 캐시 활성화
        try {
            await db.enablePersistence({ synchronizeTabs: true });
        } catch (e) {
            // 이미 활성화 or 미지원 브라우저 → 무시
            if (e.code !== 'failed-precondition' && e.code !== 'unimplemented') {
                console.warn('[Firebase] persistence 오류:', e);
            }
        }

        isFirebaseReady = true;
        console.log('[Firebase] 초기화 완료');

        // 익명 로그인
        const uid = await _signInAnonymously();
        return uid;

    } catch (e) {
        console.warn('[Firebase] 초기화 실패, 로컬 모드로 전환:', e);
        isFirebaseReady = false;
        return null;
    }
}

/**
 * 익명 로그인 (재방문 시 같은 uid 유지)
 */
async function _signInAnonymously() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUID = user.uid;
                console.log('[Firebase Auth] 기존 유저:', currentUID);
                resolve(currentUID);
            } else {
                try {
                    const result = await auth.signInAnonymously();
                    currentUID = result.user.uid;
                    console.log('[Firebase Auth] 익명 로그인 완료:', currentUID);
                    resolve(currentUID);
                } catch (e) {
                    console.warn('[Firebase Auth] 로그인 실패:', e);
                    resolve(null);
                }
            }
        });
    });
}

/**
 * Firebase 준비 상태 확인
 */
function isFirebaseConnected() {
    return isFirebaseReady && auth && auth.currentUser;
}

/**
 * 현재 uid 반환
 */
function getUID() {
    return currentUID;
}

/**
 * Firestore에서 유저 데이터 로드
 * @returns {Object|null}
 */
async function loadUserData() {
    if (!isFirebaseConnected()) return null;

    try {
        const doc = await db.collection('users').doc(currentUID).get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
    } catch (e) {
        console.warn('[Firebase] 유저 데이터 로드 실패:', e);
        return null;
    }
}

/**
 * Firestore에 유저 데이터 저장 (merge)
 * @param {Object} data - 저장할 데이터
 */
async function saveUserData(data) {
    if (!isFirebaseConnected()) return false;

    try {
        await db.collection('users').doc(currentUID).set({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
    } catch (e) {
        console.warn('[Firebase] 유저 데이터 저장 실패:', e);
        return false;
    }
}

/**
 * Firestore에 유저 최초 생성
 * @param {Object} defaultData - 기본 데이터
 */
async function createUserIfNotExists(defaultData) {
    if (!isFirebaseConnected()) return false;

    try {
        const doc = await db.collection('users').doc(currentUID).get();
        if (!doc.exists) {
            await db.collection('users').doc(currentUID).set({
                ...defaultData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('[Firebase] 신규 유저 생성:', currentUID);
            return true;
        }
        return false;
    } catch (e) {
        console.warn('[Firebase] 유저 생성 실패:', e);
        return false;
    }
}
