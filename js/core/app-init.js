/**
 * ============================================
 * APP INITIALIZATION - FIXED
 * No more redirect glitches!
 * ============================================
 */

import { auth } from '../auth/firebase-config.js';
import { initAuthUI } from '../auth/auth-ui.js';
import { initChatUI } from '../chat/chat-ui.js';
import { initSidebar } from '../ui/sidebar-manager.js';
import { initRouter } from './router.js';
import { StateManager } from './state-manager.js';
import { initFileUpload } from '../utils/file-handler.js';
import { updateUsageDisplay } from '../ui/usage-display.js';

// Global state
window.NexusAI = {
    state: new StateManager(),
    initialized: false
};

/**
 * Initialize application - FIXED
 */
async function initApp() {
    console.log('🚀 ModelFlow Studio - Initializing...');

    try {
        showLoader();

        // Wait for auth state - FIXED
        const user = await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });

        if (user) {
            console.log('✅ User authenticated:', user.email);
            window.NexusAI.state.setUser(user);
            
            // Initialize all modules
            await initializeModules();
            
            // Show main app - FIXED: No refresh needed
            showMainApp();
            
            // Update usage display
            await updateUsageDisplay();
        } else {
            console.log('ℹ️ No user - showing auth screen');
            showAuthScreen();
            initAuthUI();
        }

        await hideLoader();
        
        window.NexusAI.initialized = true;
        console.log('✅ ModelFlow Studio initialized successfully');

        initializeLibraries();

    } catch (error) {
        console.error('❌ Initialization error:', error);
        await hideLoader();
        showError('Failed to initialize app. Please refresh.');
    }
}

/**
 * Initialize all modules
 */
async function initializeModules() {
    try {
        initRouter();
        initSidebar();
        await initChatUI();
        initFileUpload();
        
        console.log('✅ All modules initialized');
    } catch (error) {
        console.error('❌ Module initialization error:', error);
    }
}

/**
 * Show main app - FIXED
 */
function showMainApp() {
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app');
    
    authScreen.style.display = 'none';
    mainApp.style.display = 'flex';
    
    // Smooth fade in - FIXED
    requestAnimationFrame(() => {
        mainApp.style.opacity = '0';
        mainApp.style.transition = 'opacity 0.5s ease';
        requestAnimationFrame(() => {
            mainApp.style.opacity = '1';
        });
    });
}

/**
 * Show auth screen
 */
function showAuthScreen() {
    const mainApp = document.getElementById('main-app');
    const authScreen = document.getElementById('auth-screen');
    
    mainApp.style.display = 'none';
    authScreen.style.display = 'flex';
    
    requestAnimationFrame(() => {
        authScreen.style.opacity = '0';
        authScreen.style.transition = 'opacity 0.5s ease';
        requestAnimationFrame(() => {
            authScreen.style.opacity = '1';
        });
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
                progressBar.style.transition = 'width 2s ease';
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
                loader.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                loader.style.opacity = '0';
                loader.style.transform = 'scale(0.95)';
                
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
        animation: shake 0.5s ease;
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
 * Setup auth listener - FIXED
 */
export function setupAuthListener() {
    auth.onAuthStateChanged(async (user) => {
        if (user && !window.NexusAI.initialized) {
            window.NexusAI.state.setUser(user);
            await initializeModules();
            showMainApp();
            await updateUsageDisplay();
            window.NexusAI.initialized = true;
        } else if (!user && window.NexusAI.initialized) {
            showAuthScreen();
            initAuthUI();
            window.NexusAI.initialized = false;
        }
    });
}

/**
 * Initialize external libraries
 */
function initializeLibraries() {
    // AOS
    if (window.AOS) {
        window.AOS.init({
            duration: 800,
            once: true,
            offset: 100,
            easing: 'ease-out-cubic'
        });
    }

    // Tippy.js
    if (window.tippy) {
        window.tippy('[data-tippy-content]', {
            placement: 'bottom',
            arrow: true,
            animation: 'scale',
            theme: 'custom',
            duration: [200, 150]
        });
    }

    // Global keyboard shortcuts
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

    console.log('✅ External libraries initialized');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

setupAuthListener();

console.log('📦 App Init (FIXED) loaded');
