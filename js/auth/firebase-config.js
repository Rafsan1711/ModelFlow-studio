/**
 * ============================================
 * FIREBASE CONFIGURATION
 * Initialize Firebase with your config
 * ============================================
 */

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCnwkLtBgf1OipNSIjomAfWrq9yInkfbls",
    authDomain: "ghost-story-hub.firebaseapp.com",
    databaseURL: "https://ghost-story-hub-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ghost-story-hub",
    storageBucket: "ghost-story-hub.firebasestorage.app",
    messagingSenderId: "94885063393",
    appId: "1:94885063393:web:b55d29d12663528fe9a5a0"
};

// Initialize Firebase
let app;
let auth;
let database;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    database = firebase.database();
    
    console.log('✅ Firebase initialized');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

// Export Firebase instances
export { app, auth, database };

// Export Firebase methods
export const {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} = firebase.auth;

console.log('📦 Firebase Config module loaded');
