/**
 * ============================================
 * APP INITIALIZATION
 * Initialize ModelFlow Studio
 * ============================================
 */

import { auth } from '../auth/firebase-config.js';
import { initAuthUI } from '../auth/auth-ui.js';
import { initChatUI } from '../chat/chat-ui.js';
import { initSidebar } from '../ui/sidebar-manager.js';
import { StateManager } from './state-manager.js';
import { checkAndResetLimits } from './plan-manager.js';

// Global state
window.ModelFlow = {
    state: new StateManager(),
    initialized: false
};

/**
 * Initialize application
 */
async function initApp() {
    console.log('🚀 ModelFlow Studio - Initializing...');

    try {
        // Show loader
        showLoader();

        // Wait for auth state
        const user = await checkAuth();

        if (user) {
            console.log('✅ User authenticated:', user.email);
            
            // Set user in state
            window.ModelFlow.state.setUser({
                uid: user.uid,
                email: user.email
            });
            
            // Check and reset daily limits
            await checkAndResetLimits(user.uid);
            
            // Initialize modules
            await initializeModules();
            showMainApp();
        } else {
            console.log('ℹ️ No user - showing auth screen');
            showAuthScreen();
            initAuthUI();
        }

        // Hide loader
        await hideLoader();
        
        window.ModelFlow.initialized = true;
        console.log('✅ ModelFlow Studio initialized successfully');

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
        initSidebar();
        await initChatUI();
        
        // Update usage indicator
        updateUsageIndicator();
        
        // Subscribe to plan changes
        window.ModelFlow.state.subscribe('plan', () => {
            updateUsageIndicator();
            updatePlanBadge();
        });
        
        console.log('✅ All modules initialized');
    } catch (error) {
        console.error('❌ Module initialization error:', error);
    }
}

/**
 * Update usage indicator
 */
function updateUsageIndicator() {
    const plan = window.ModelFlow.state.get('plan');
    const usageText = document.getElementById('usage-text');
    
    if (usageText) {
        if (window.ModelFlow.state.isOwner()) {
            usageText.textContent = '∞ Unlimited';
        } else {
            usageText.textContent = `${plan.responsesLeft}/${plan.maxResponses} left`;
        }
    }
}

/**
 * Update plan badge
 */
function updatePlanBadge() {
    const plan = window.ModelFlow.state.get('plan');
    const planBadge = document.getElementById('plan-badge');
    const planName = document.getElementById('plan-name');
    
    if (planBadge && planName) {
        planName.textContent = plan.name || 'Free Plan';
        
        // Update badge class
        planBadge.className = 'plan-badge';
        if (plan.type === 'pro') {
            planBadge.classList.add('pro');
        } else if (plan.type === 'max') {
            planBadge.classList.add('max');
        }
    }
    
    // Show upgrade button for non-max users
    const upgradeBtn = document.getElementById('upgrade-btn');
    if (upgradeBtn) {
        if (plan.type !== 'max' && !window.ModelFlow.state.isOwner()) {
            upgradeBtn.style.display = 'flex';
        } else {
            upgradeBtn.style.display = 'none';
        }
    }
    
    // Show admin button for owner
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn && window.ModelFlow.state.isOwner()) {
        adminBtn.style.display = 'flex';
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
    mainApp.style.opacity = '0';
    
    setTimeout(() => {
        mainApp.style.transition = 'opacity 0.5s ease';
        mainApp.style.opacity = '1';
    }, 50);
}

/**
 * Show auth screen
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
 * Show error message
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
 * Handle auth state changes
 */
export function setupAuthListener() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            if (!window.ModelFlow.initialized) {
                window.ModelFlow.state.setUser({
                    uid: user.uid,
                    email: user.email
                });
                await checkAndResetLimits(user.uid);
                showMainApp();
                await initializeModules();
                window.ModelFlow.initialized = true;
            }
        } else {
            showAuthScreen();
            initAuthUI();
            window.ModelFlow.initialized = false;
        }
    });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Setup auth listener
setupAuthListener();

console.log('📦 App Init module loaded');
