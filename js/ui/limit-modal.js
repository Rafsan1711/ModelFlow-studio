/**
 * ============================================
 * LIMIT MODAL - Beautiful Modal for Limits
 * ============================================
 */

import { showPlanUpgrade } from '../plans/plan-manager.js';

let limitModal;

/**
 * Show limit reached modal
 */
export function showLimitModal(type, message) {
    if (!limitModal) {
        createLimitModal();
    }

    const plan = window.NexusAI.state.get('userPlan');
    
    // Update modal content
    const modalBody = limitModal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div class="limit-modal-content">
            <div class="limit-icon">
                ${type === 'daily_limit' ? '📅' : '💬'}
            </div>
            
            <h3 class="limit-title">Limit Reached</h3>
            
            <p class="limit-message">${message}</p>
            
            <div class="limit-info">
                <div class="limit-info-item">
                    <span class="limit-label">Current Plan:</span>
                    <span class="limit-value">${plan.name}</span>
                </div>
                
                ${type === 'daily_limit' ? `
                <div class="limit-info-item">
                    <span class="limit-label">Daily Chats:</span>
                    <span class="limit-value">${plan.chatsPerDay} chats</span>
                </div>
                ` : `
                <div class="limit-info-item">
                    <span class="limit-label">Responses per Chat:</span>
                    <span class="limit-value">${plan.responsesPerChat} responses</span>
                </div>
                `}
            </div>
            
            <div class="limit-actions">
                <button class="limit-btn upgrade-btn" onclick="window.upgradePlan()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                    Upgrade Plan
                </button>
                
                ${type === 'chat_limit' ? `
                <button class="limit-btn new-chat-btn" onclick="window.startNewChat()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Start New Chat
                </button>
                ` : `
                <button class="limit-btn wait-btn" onclick="window.closeLimitModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Wait Until Midnight
                </button>
                `}
            </div>
            
            <button class="close-modal-link" onclick="window.closeLimitModal()">
                Maybe Later
            </button>
        </div>
    `;
    
    limitModal.classList.add('active');
}

/**
 * Create limit modal
 */
function createLimitModal() {
    limitModal = document.createElement('div');
    limitModal.className = 'modal limit-modal';
    limitModal.id = 'limit-modal';
    
    limitModal.innerHTML = `
        <div class="modal-content glass-effect">
            <button class="close-modal-btn" onclick="window.closeLimitModal()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
            <div class="modal-body">
                <!-- Content will be inserted here -->
            </div>
        </div>
    `;
    
    document.body.appendChild(limitModal);
    
    // Close on overlay click
    limitModal.addEventListener('click', (e) => {
        if (e.target === limitModal) {
            closeLimitModal();
        }
    });
}

/**
 * Close limit modal (global)
 */
window.closeLimitModal = function() {
    if (limitModal) {
        limitModal.classList.remove('active');
    }
};

/**
 * Upgrade plan (global)
 */
window.upgradePlan = function() {
    closeLimitModal();
    showPlanUpgrade();
};

/**
 * Start new chat (global)
 */
window.startNewChat = function() {
    closeLimitModal();
    
    // Reset state
    window.NexusAI.state.setCurrentChat(null, []);
    
    // Update UI
    import('../chat/chat-ui.js').then(module => {
        module.showEmptyState();
        module.setChatTitle('New Chat');
    });
    
    // Clear messages
    import('../chat/message-renderer.js').then(module => {
        module.clearMessages();
    });
    
    // Navigate
    import('../core/router.js').then(module => {
        module.navigateToHome();
    });
};

console.log('📦 Limit Modal loaded');
