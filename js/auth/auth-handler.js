/**
 * ============================================
 * AUTH HANDLER
 * Login, Signup, Logout functionality
 * ============================================
 */

import { auth } from './firebase-config.js';

/**
 * Sign up with email/password
 */
export async function signUpWithEmail(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log('✅ User created:', userCredential.user.email);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('❌ Signup error:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

/**
 * Sign in with email/password
 */
export async function signInWithEmail(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ User signed in:', userCredential.user.email);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('❌ Signin error:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        console.log('✅ Google signin successful:', result.user.email);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('❌ Google signin error:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

/**
 * Sign out
 */
export async function handleSignOut() {
    try {
        await auth.signOut();
        console.log('✅ User signed out');
        
        // Clear local state
        if (window.NexusAI && window.NexusAI.state) {
            window.NexusAI.state.reset();
        }
        
        // Reload page to show auth screen
        window.location.href = '/';
        
        return { success: true };
    } catch (error) {
        console.error('❌ Signout error:', error);
        return { success: false, error: 'Failed to sign out' };
    }
}

/**
 * Get current user
 */
export function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Get user error message
 */
function getErrorMessage(errorCode) {
    const errors = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/popup-closed-by-user': 'Sign-in cancelled',
        'auth/cancelled-popup-request': 'Sign-in cancelled'
    };

    return errors[errorCode] || 'An error occurred. Please try again';
}

console.log('📦 Auth Handler module loaded');
