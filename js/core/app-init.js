/**
 * ============================================
 * APP INITIALIZATION - FIXED LOADER
 * ============================================
 */

import { auth } from '../auth/firebase-config.js';
import { initAuthUI } from '../auth/auth-ui.js';
import { initChatUI } from '../chat/chat-ui.js';
import { initSidebar } from '../ui/sidebar-manager.js';
import { initRouter } from './router.js';
import { StateManager } from './state-manager.js';
import { checkUserPlan } from '../plans/plan-manager.js';

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
        showLoader();

        // Wait for auth with timeout
        const user = await Promise.race([
            waitForAuth(),
            new Promise((resolve) => setTimeout(() => resolve(null), 3000))
        ]);

        if (user) {
            console.log('✅ User authenticated:', user.email);
            await checkUserPlan(user);
            await initializeModules();
            showMainApp();
        } else {
            console.log('ℹ️ No user - showing auth screen');
            showAuthScreen();
            initAuthUI();
        }

        hideLoader();
        window.NexusAI.initialized = true;
        console.log('✅ ModelFlow Studio initialized');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        hideLoader();
        showError('Failed to initialize app. Please refresh.');
    }
}

/**
 * Wait for authentication
 */
function waitForAuth() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            window.NexusAI.state.setUser(user);
            resolve(user);
        });
    });
}

/**
 * Initialize modules
 */
async function initializeModules() {
    try {
        initRouter();
        initSidebar();
        await initChatUI();
        console.log('✅ Modules initialized');
    } catch (error) {
        console.error('❌ Module error:', error);
    }
}

/**
 * Show main app
 */
function showMainApp() {
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app');
    
    authScreen.style.display = 'none';
    mainApp.style.display = 'flex';
}

/**
 * Show auth screen
 */
function showAuthScreen() {
    const mainApp = document.getElementById('main-app');
    const authScreen = document.getElementById('auth-screen');
    
    mainApp.style.display = 'none';
    authScreen.style.display = 'flex';
}

/**
 * Show loader
 */
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
    }
}

/**
 * Hide loader
 */
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }, 500);
    }
}

/**
 * Show error
 */
function showError(message) {
    alert(message);
}

/**
 * Setup auth listener
 */
export function setupAuthListener() {
    auth.onAuthStateChanged(async (user) => {
        if (user && !window.NexusAI.initialized) {
            window.NexusAI.state.setUser(user);
            await checkUserPlan(user);
            showMainApp();
            await initializeModules();
            window.NexusAI.initialized = true;
        } else if (!user && window.NexusAI.initialized) {
            showAuthScreen();
            initAuthUI();
            window.NexusAI.initialized = false;
        }
    });
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

setupAuthListener();

console.log('📦 App Init loaded');
