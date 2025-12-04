/**
 * ============================================
 * APP INITIALIZATION
 * Main entry point - checks auth & initializes app
 * ============================================
 */

import { auth } from '../auth/firebase-config.js';
import { initAuthUI } from '../auth/auth-ui.js';
import { initChatUI } from '../chat/chat-ui.js';
import { initSidebar } from '../ui/sidebar-manager.js';
import { initRouter } from './router.js';
import { StateManager } from './state-manager.js';

// Global state
window.NexusAI = {
    state: new StateManager(),
    initialized: false
};

/**
 * Initialize application
 */
async function initApp() {
    console.log('🚀 ModelFlow Studio - Initializing...');

    try {
        // Wait for auth state
        const user = await checkAuth();

        if (user) {
            console.log('✅ User authenticated:', user.email);
            showMainApp();
            await initializeModules();
        } else {
            console.log('ℹ️ No user - showing auth screen');
            showAuthScreen();
            initAuthUI();
        }

        hideLoader();
        window.NexusAI.initialized = true;
        console.log('✅ ModelFlow Studio initialized successfully');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        hideLoader();
        showError('Failed to initialize app. Please refresh.');
    }
}

/**
 * Check authentication state
 */
function checkAuth() {
    return new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

/**
 * Initialize all modules
 */
async function initializeModules() {
    try {
        initRouter();
        initSidebar();
        await initChatUI();
        
        console.log('✅ All modules initialized');
    } catch (error) {
        console.error('❌ Module initialization error:', error);
    }
}

/**
 * Show main app
 */
function showMainApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
}

/**
 * Show auth screen
 */
function showAuthScreen() {
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
}

/**
 * Hide loader
 */
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    }
}

/**
 * Show error message
 */
function showError(message) {
    alert(message); // Temporary - will be replaced with toast notification
}

/**
 * Handle auth state changes (for logout/login)
 */
export function setupAuthListener() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            if (!window.NexusAI.initialized) {
                showMainApp();
                initializeModules();
                window.NexusAI.initialized = true;
            }
        } else {
            showAuthScreen();
            initAuthUI();
            window.NexusAI.initialized = false;
        }
    });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Setup global auth listener
setupAuthListener();

console.log('📦 App Init module loaded');
