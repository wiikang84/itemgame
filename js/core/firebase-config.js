/**
 * Firebase 설정 및 초기화
 * ItemGame - 소셜 카지노
 */

// Firebase 설정 (GitHub Pages 배포 후 실제 값으로 교체)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase 초기화 상태
let firebaseApp = null;
let db = null;
let auth = null;
let isFirebaseReady = false;

/**
 * Firebase 초기화
 * - Firebase SDK가 로드되지 않았거나 설정이 없으면 로컬 모드로 동작
 */
function initFirebase() {
    try {
        if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            auth = firebase.auth();
            isFirebaseReady = true;
            console.log('[Firebase] 초기화 완료');
        } else {
            console.log('[Firebase] 로컬 모드로 동작 (Firebase 미설정)');
            isFirebaseReady = false;
        }
    } catch (e) {
        console.warn('[Firebase] 초기화 실패, 로컬 모드로 전환:', e);
        isFirebaseReady = false;
    }
}

/**
 * Firebase 준비 상태 확인
 */
function isFirebaseConnected() {
    return isFirebaseReady;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    initFirebase();
});
