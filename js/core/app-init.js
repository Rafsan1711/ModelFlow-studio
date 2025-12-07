/**
 * ============================================
 * APP INITIALIZATION - LOADER FIXED
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
        showLoader();

        // Wait for auth state
        const user = await waitForAuth();

        if (user) {
            console.log('✅ User authenticated:', user.email);
            
            // Check user plan
            try {
                const { checkUserPlan } = await import('../plans/plan-manager.js');
                await checkUserPlan(user);
            } catch (err) {
                console.warn('Plan manager not loaded:', err);
            }
            
            // Initialize modules
            await initializeModules();
            
            // Show main app
            await showMainApp();
            
            console.log('✅ Main app displayed');
        } else {
            console.log('ℹ️ No user - showing auth screen');
            await showAuthScreen();
            initAuthUI();
        }

        // Hide loader
        await hideLoader();
        
        window.NexusAI.initialized = true;
        console.log('✅ ModelFlow Studio initialized');

        initializeLibraries();

    } catch (error) {
        console.error('❌ Initialization error:', error);
        await hideLoader();
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
        
        setTimeout(() => {
            resolve(null);
        }, 5000);
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
async function showMainApp() {
    return new Promise((resolve) => {
        const authScreen = document.getElementById('auth-screen');
        const mainApp = document.getElementById('main-app');
        
        authScreen.style.display = 'none';
        mainApp.style.display = 'flex';
        mainApp.style.opacity = '1';
        
        setTimeout(resolve, 100);
    });
}

/**
 * Show auth screen
 */
async function showAuthScreen() {
    return new Promise((resolve) => {
        const mainApp = document.getElementById('main-app');
        const authScreen = document.getElementById('auth-screen');
        
        mainApp.style.display = 'none';
        authScreen.style.display = 'flex';
        authScreen.style.opacity = '1';
        
        setTimeout(resolve, 100);
    });
}

/**
 * Show loader
 */
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
        loader.style.opacity = '1';
        
        const progressBar = loader.querySelector('.loader-progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
            setTimeout(() => {
                progressBar.style.transition = 'width 1.5s ease';
                progressBar.style.width = '70%';
            }, 100);
        }
    }
}

/**
 * Hide loader
 */
function hideLoader() {
    return new Promise((resolve) => {
        const loader = document.getElementById('loader');
        if (loader) {
            const progressBar = loader.querySelector('.loader-progress-bar');
            if (progressBar) {
                progressBar.style.transition = 'width 0.3s ease';
                progressBar.style.width = '100%';
            }
            
            setTimeout(() => {
                loader.style.transition = 'opacity 0.5s ease';
                loader.style.opacity = '0';
                
                setTimeout(() => {
                    loader.style.display = 'none';
                    resolve();
                }, 500);
            }, 300);
        } else {
            resolve();
        }
    });
}

/**
 * Show error
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(239, 68, 68, 0.95);
        color: white;
        padding: 20px 40px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.style.transition = 'opacity 0.3s ease';
        errorDiv.style.opacity = '0';
        setTimeout(() => errorDiv.remove(), 300);
    }, 5000);
}

/**
 * Setup auth listener
 */
export function setupAuthListener() {
    auth.onAuthStateChanged(async (user) => {
        if (user && !window.NexusAI.initialized) {
            console.log('🔄 User state changed - initializing...');
            window.NexusAI.state.setUser(user);
            
            try {
                const { checkUserPlan } = await import('../plans/plan-manager.js');
                await checkUserPlan(user);
            } catch (err) {
                console.warn('Plan check failed:', err);
            }
            
            await showMainApp();
            await initializeModules();
            
            window.NexusAI.initialized = true;
        } else if (!user && window.NexusAI.initialized) {
            console.log('🔄 User logged out');
            await showAuthScreen();
            initAuthUI();
            window.NexusAI.initialized = false;
        }
    });
}

/**
 * Initialize libraries
 */
function initializeLibraries() {
    if (window.AOS) {
        window.AOS.init({
            duration: 800,
            once: true,
            offset: 100,
            easing: 'ease-out-cubic'
        });
    }

    if (window.tippy) {
        window.tippy('[data-tippy-content]', {
            placement: 'bottom',
            arrow: true,
            animation: 'scale',
            theme: 'custom',
            duration: [200, 150]
        });
    }

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const input = document.getElementById('message-input');
            if (input) input.focus();
        }
        
        if (e.key === 'Escape') {
            const modal = document.querySelector('.modal.active');
            if (modal) modal.classList.remove('active');
        }
    });

    console.log('✅ Libraries initialized');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Setup auth listener
setupAuthListener();

console.log('📦 App Init loaded');
