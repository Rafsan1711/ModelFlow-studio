/**
 * ============================================
 * FIXED APP INITIALIZATION
 * With proper redirect after login
 * ============================================
 */

import { auth } from '../auth/firebase-config.js';
import { initAuthUI } from '../auth/auth-ui.js';
import { initChatUI } from '../chat/chat-ui.js';
import { initSidebar } from '../ui/sidebar-manager.js';
import { initRouter } from './router.js';
import { StateManager } from './state-manager.js';
import { getUserPlanData } from '../plans/permission-manager.js';

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
        // Show loader animation
        showLoader();

        // Wait for auth state (FIXED: proper auth check)
        const user = await waitForAuthState();

        if (user) {
            console.log('✅ User authenticated:', user.email);
            
            // Store user in state
            window.NexusAI.state.setUser(user);

            // Load user plan
            const planData = await getUserPlanData();
            window.NexusAI.state.set('userPlanData', planData);

            // Initialize modules
            await initializeModules();
            
            // Show main app (FIXED: immediate show)
            showMainApp();
        } else {
            console.log('ℹ️ No user - showing auth screen');
            showAuthScreen();
            initAuthUI();
        }

        // Hide loader with animation
        await hideLoader();
        
        window.NexusAI.initialized = true;
        console.log('✅ ModelFlow Studio initialized successfully');

        // Initialize libraries
        initializeLibraries();

    } catch (error) {
        console.error('❌ Initialization error:', error);
        await hideLoader();
        showError('Failed to initialize app. Please refresh.');
    }
}

/**
 * Wait for auth state (FIXED)
 */
function waitForAuthState() {
    return new Promise((resolve) => {
        // Check if already signed in
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
            resolve(currentUser);
            return;
        }

        // Wait for auth state change
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
 * Show main app with animation (FIXED: no delay)
 */
function showMainApp() {
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app');
    
    authScreen.style.display = 'none';
    mainApp.style.display = 'flex';
    
    // Immediate show without delay
    mainApp.style.opacity = '1';
    
    console.log('✅ Main app displayed');
}

/**
 * Show auth screen with animation
 */
function showAuthScreen() {
    const mainApp = document.getElementById('main-app');
    const authScreen = document.getElementById('auth-screen');
    
    mainApp.style.display = 'none';
    authScreen.style.display = 'flex';
    authScreen.style.opacity = '0';
    
    setTimeout(() => {
        authScreen.style.transition = 'opacity 0.5s ease';
        authScreen.style.opacity = '1';
    }, 50);
}

/**
 * Show loader with progress animation
 */
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
        loader.style.opacity = '1';
        
        // Animate progress bar
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
 * Hide loader with smooth animation
 */
function hideLoader() {
    return new Promise((resolve) => {
        const loader = document.getElementById('loader');
        if (loader) {
            // Complete progress
            const progressBar = loader.querySelector('.loader-progress-bar');
            if (progressBar) {
                progressBar.style.transition = 'width 0.3s ease';
                progressBar.style.width = '100%';
            }
            
            // Fade out
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
 * Show error message with animation
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
 * Handle auth state changes (FIXED: immediate redirect)
 */
export function setupAuthListener() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            if (!window.NexusAI.initialized) {
                console.log('✅ User logged in, initializing app...');
                
                // Store user
                window.NexusAI.state.setUser(user);

                // Load user plan
                const planData = await getUserPlanData();
                window.NexusAI.state.set('userPlanData', planData);

                // Initialize and show immediately
                await initializeModules();
                showMainApp();
                window.NexusAI.initialized = true;
            }
        } else {
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
    // Initialize AOS (Animate On Scroll)
    if (window.AOS) {
        window.AOS.init({
            duration: 800,
            once: true,
            offset: 100,
            easing: 'ease-out-cubic'
        });
    }

    // Initialize Tippy.js for tooltips
    if (window.tippy) {
        window.tippy('[data-tippy-content]', {
            placement: 'bottom',
            arrow: true,
            animation: 'scale',
            theme: 'custom',
            duration: [200, 150]
        });
    }

    // Add global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search/input
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const input = document.getElementById('message-input');
            if (input) input.focus();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const modal = document.querySelector('.modal.active');
            if (modal) {
                modal.classList.remove('active');
            }
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

// Setup global auth listener
setupAuthListener();

console.log('📦 Fixed App Init module loaded');
