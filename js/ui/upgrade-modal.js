/**
 * ============================================
 * UPGRADE MODAL
 * Plan upgrade request interface
 * ============================================
 */

import { requestPlanUpgrade, PLANS } from '../core/plan-manager.js';

/**
 * Open upgrade modal
 */
export function openUpgradeModal() {
    const modal = document.getElementById('upgrade-modal');
    const upgradeContent = document.getElementById('upgrade-content');

    const currentPlan = window.ModelFlow.state.get('plan');

    upgradeContent.innerHTML = `
        <div style="margin-bottom: 24px;">
            <h2 style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
                Upgrade Your Plan
            </h2>
            <p style="color: var(--text-secondary);">
                Currently on: <strong>${currentPlan.name || 'Free Plan'}</strong>
            </p>
        </div>

        <!-- Plan Cards -->
        <div style="display: grid; gap: 20px;">
            ${renderPlanCard('pro')}
            ${renderPlanCard('max')}
        </div>

        <!-- Custom Request -->
        <div style="margin-top: 24px; padding: 20px; background: rgba(88, 166, 255, 0.05); border: 1px solid rgba(88, 166, 255, 0.2); border-radius: 12px;">
            <h3 style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px;">
                Need Custom Limits?
            </h3>
            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
                Request custom response limits or additional features
            </p>
            <button id="custom-request-btn" class="auth-btn primary" style="width: auto; padding: 12px 24px;">
                Request Custom Plan
            </button>
        </div>
    `;

    modal.classList.add('active');

    // Setup event listeners
    setupUpgradeListeners();
}

/**
 * Render plan card
 */
function renderPlanCard(planType) {
    const plan = PLANS[planType];
    const currentPlan = window.ModelFlow.state.get('plan');
    const isCurrentPlan = currentPlan.type === planType;

    return `
        <div class="plan-card" style="
            padding: 24px;
            background: ${isCurrentPlan ? 'rgba(88, 166, 255, 0.1)' : 'var(--bg-secondary)'};
            border: 2px solid ${isCurrentPlan ? 'var(--primary)' : 'var(--border-primary)'};
            border-radius: 16px;
        ">
            <div style="margin-bottom: 16px;">
                <h3 style="font-size: 20px; font-weight: 700; color: var(--primary); margin-bottom: 8px;">
                    ${plan.name}
                </h3>
                <p style="font-size: 14px; color: var(--text-secondary);">
                    ${plan.features[0]}
                </p>
            </div>

            <ul style="margin-bottom: 20px; list-style: none; padding: 0;">
                ${plan.features.map(feature => `
                    <li style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 8px;
                        font-size: 14px;
                        color: var(--text-primary);
                    ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        ${feature}
                    </li>
                `).join('')}
            </ul>

            ${isCurrentPlan ? `
                <button class="auth-btn primary" disabled style="opacity: 0.5; cursor: not-allowed;">
                    Current Plan
                </button>
            ` : `
                <button class="request-plan-btn auth-btn primary" data-plan="${planType}">
                    Request ${plan.name}
                </button>
            `}
        </div>
    `;
}

/**
 * Setup upgrade listeners
 */
function setupUpgradeListeners() {
    // Request plan buttons
    document.querySelectorAll('.request-plan-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const planType = e.target.dataset.plan;
            await handlePlanRequest(planType);
        });
    });

    // Custom request button
    const customBtn = document.getElementById('custom-request-btn');
    if (customBtn) {
        customBtn.addEventListener('click', handleCustomRequest);
    }
}

/**
 * Handle plan request
 */
async function handlePlanRequest(planType) {
    const user = window.ModelFlow.state.get('user');
    if (!user) return;

    const confirmed = confirm(`Request upgrade to ${PLANS[planType].name}?\n\nYour request will be reviewed by an admin.`);
    
    if (confirmed) {
        const result = await requestPlanUpgrade(user.uid, planType);
        
        if (result.success) {
            showNotification('Request submitted! You will be notified once approved.', 'success');
            document.getElementById('upgrade-modal').classList.remove('active');
        } else {
            showNotification('Error submitting request. Please try again.', 'error');
        }
    }
}

/**
 * Handle custom request
 */
async function handleCustomRequest() {
    const user = window.ModelFlow.state.get('user');
    if (!user) return;

    const responsesPerChat = prompt('How many responses per chat do you need?', '10');
    const chatsPerDay = prompt('How many chats per day do you need?', '5');
    
    if (responsesPerChat && chatsPerDay) {
        const customRequests = {
            responsesPerChat: parseInt(responsesPerChat),
            chatsPerDay: parseInt(chatsPerDay),
            additionalNotes: prompt('Any additional requirements?', '')
        };

        const result = await requestPlanUpgrade(user.uid, 'custom', customRequests);
        
        if (result.success) {
            showNotification('Custom request submitted! Admin will review it.', 'success');
            document.getElementById('upgrade-modal').classList.remove('active');
        } else {
            showNotification('Error submitting request. Please try again.', 'error');
        }
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#58a6ff'};
        color: white;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transition = 'all 0.3s ease';
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close upgrade modal button
document.getElementById('close-upgrade-btn')?.addEventListener('click', () => {
    document.getElementById('upgrade-modal').classList.remove('active');
});

console.log('📦 Upgrade Modal module loaded');
