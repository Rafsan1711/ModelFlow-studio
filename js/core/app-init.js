/**
 * ============================================
 * ENHANCED APP INITIALIZATION
 * With beautiful loading animations
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
        // Show loader animation
        showLoader();

        // Wait for auth state
        const user = await checkAuth();

        if (user) {
            console.log('✅ User authenticated:', user.email);
            await initializeModules();
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
 * Show main app with animation
 */
function showMainApp() {
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app');
    
    authScreen.style.display = 'none';
    mainApp.style.display = 'flex';
    mainApp.style.opacity = '0';
    
    setTimeout(() => {
        mainApp.style.transition = 'opacity 0.5s ease';
        mainApp.style.opacity = '1';
    }, 50);
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

    // Add custom Tippy theme
    const style = document.createElement('style');
    style.textContent = `
        .tippy-box[data-theme~='custom'] {
            background: rgba(24, 24, 27, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(37, 99, 235, 0.3);
            color: #fafafa;
            font-size: 14px;
            font-weight: 500;
            padding: 8px 12px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        .tippy-box[data-theme~='custom'][data-placement^='top'] > .tippy-arrow::before {
            border-top-color: rgba(24, 24, 27, 0.95);
        }
        .tippy-box[data-theme~='custom'][data-placement^='bottom'] > .tippy-arrow::before {
            border-bottom-color: rgba(24, 24, 27, 0.95);
        }
    `;
    document.head.appendChild(style);

    // Initialize GSAP ScrollTrigger if available
    if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
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

    // Add visibility change handler for better performance
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause animations when tab is hidden
            document.body.style.animationPlayState = 'paused';
        } else {
            // Resume animations
            document.body.style.animationPlayState = 'running';
        }
    });

    // Add online/offline indicators
    window.addEventListener('online', () => {
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.add('online');
            showSuccessNotification('Connection restored');
        }
    });

    window.addEventListener('offline', () => {
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.remove('online');
            showWarningNotification('No internet connection');
        }
    });

    console.log('✅ External libraries initialized');
}

/**
 * Show success notification
 */
function showSuccessNotification(message) {
    createNotification(message, 'success');
}

/**
 * Show warning notification
 */
function showWarningNotification(message) {
    createNotification(message, 'warning');
}

/**
 * Create notification
 */
function createNotification(message, type) {
    const colors = {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transition = 'all 0.3s ease';
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add slideInRight animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Setup global auth listener
setupAuthListener();

console.log('📦 Enhanced App Init module loaded');
