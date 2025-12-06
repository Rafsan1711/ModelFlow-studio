/**
 * ============================================
 * USAGE DISPLAY
 * Show current usage stats in UI
 * ============================================
 */

import { getUsageStats } from '../utils/usage-tracker.js';
import { showPlanUpgradeModal } from './plan-upgrade.js';

/**
 * Update usage display
 */
export async function updateUsageDisplay() {
    try {
        const stats = await getUsageStats();

        // Update responses
        document.getElementById('responses-used').textContent = stats.responsesInCurrentChat;
        document.getElementById('responses-limit').textContent = stats.responsesLimit;

        // Update chats
        document.getElementById('chats-used').textContent = stats.chatsToday;
        document.getElementById('chats-limit').textContent = stats.chatsLimit;

        // Update plan badge
        const planBadge = document.getElementById('current-plan-badge');
        const planIcon = planBadge.querySelector('.usage-icon');
        const planText = planBadge.querySelector('.usage-text');

        planIcon.textContent = stats.plan.icon;
        planText.textContent = stats.plan.displayName;

        // Color coding based on usage
        const usageBar = document.getElementById('usage-stats-bar');
        
        if (!stats.canSendMessage || !stats.canCreateChat) {
            usageBar.style.background = 'rgba(239, 68, 68, 0.1)';
            usageBar.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        } else if (stats.responsesInCurrentChat / stats.responsesLimit > 0.8) {
            usageBar.style.background = 'rgba(245, 158, 11, 0.1)';
            usageBar.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        } else {
            usageBar.style.background = 'rgba(88, 166, 255, 0.05)';
            usageBar.style.borderColor = 'rgba(88, 166, 255, 0.2)';
        }

        console.log('✅ Usage display updated:', stats);

    } catch (error) {
        console.error('❌ Error updating usage:', error);
    }
}

/**
 * Initialize usage display
 */
export function initUsageDisplay() {
    // Upgrade button
    const upgradeBtn = document.getElementById('upgrade-plan-btn');
    if (upgradeBtn) {
        upgradeBtn.onclick = showPlanUpgradeModal;
    }

    // Update on message send
    window.addEventListener('message-sent', updateUsageDisplay);

    console.log('✅ Usage display initialized');
}

console.log('📦 Usage Display loaded');
