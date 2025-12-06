/**
 * ============================================
 * PLAN MODAL
 * Plan upgrade and information modal
 * ============================================
 */

import { PLANS, requestPlanUpgrade } from '../plans/plan-manager.js';
import { showSuccess, showError } from './notifications.js';

let planModal;

/**
 * Open plan modal
 */
export function openPlanModal() {
    if (!planModal) {
        createPlanModal();
    }

    const currentPlan = window.NexusAI.state.get('userPlan');
    const isOwner = window.NexusAI.state.get('isOwner');
    
    renderPlans(currentPlan, isOwner);
    planModal.classList.add('active');
}

/**
 * Close plan modal
 */
function closePlanModal() {
    if (planModal) {
        planModal.classList.remove('active');
    }
}

/**
 * Create plan modal
 */
function createPlanModal() {
    planModal = document.createElement('div');
    planModal.className = 'modal plan-modal';
    planModal.id = 'plan-modal';
    
    planModal.innerHTML = `
        <div class="modal-content glass-effect">
            <div class="modal-header">
                <h3 class="gradient-text">Choose Your Plan</h3>
                <button class="close-modal-btn" id="close-plan-modal">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body" id="plan-modal-body">
                <!-- Plans will be inserted here -->
            </div>
        </div>
    `;
    
    document.body.appendChild(planModal);
    
    // Event listeners
    document.getElementById('close-plan-modal').addEventListener('click', closePlanModal);
    planModal.addEventListener('click', (e) => {
        if (e.target === planModal) closePlanModal();
    });
}

/**
 * Render plans
 */
function renderPlans(currentPlan, isOwner) {
    const container = document.getElementById('plan-modal-body');
    
    let html = '<div class="plans-grid">';
    
    Object.values(PLANS).forEach(plan => {
        const isCurrent = currentPlan.id === plan.id;
        const isUpgrade = getPlanTier(plan.id) > getPlanTier(currentPlan.id);
        
        html += `
            <div class="plan-card ${isCurrent ? 'current' : ''}" style="--plan-color: ${plan.color}">
                <div class="plan-icon">${plan.icon}</div>
                <h4 class="plan-name">${plan.name}</h4>
                <div class="plan-model">${plan.displayName}</div>
                
                <div class="plan-limits">
                    <div class="plan-limit-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        <span>${plan.responsesPerChat} responses per chat</span>
                    </div>
                    <div class="plan-limit-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>${plan.chatsPerDay} chats per day</span>
                    </div>
                </div>
                
                <ul class="plan-features">
                    ${plan.features.map(f => `
                        <li>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            ${f}
                        </li>
                    `).join('')}
                </ul>
                
                ${isCurrent ? `
                    <button class="plan-btn current" disabled>
                        <span>Current Plan</span>
                    </button>
                ` : isUpgrade ? `
                    <button class="plan-btn upgrade" onclick="requestUpgrade('${plan.id}')">
                        <span>${plan.requiresApproval ? 'Request Upgrade' : 'Upgrade Now'}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                ` : `
                    <button class="plan-btn" disabled>
                        <span>Not Available</span>
                    </button>
                `}
            </div>
        `;
    });
    
    html += '</div>';
    
    if (isOwner) {
        html += `
            <div class="owner-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                <span>You have unlimited access as owner</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Get plan tier for comparison
 */
function getPlanTier(planId) {
    const tiers = {
        'free': 1,
        'pro': 2,
        'max': 3,
        'owner': 4
    };
    return tiers[planId] || 0;
}

/**
 * Request upgrade (global function)
 */
window.requestUpgrade = async function(targetPlan) {
    const user = window.NexusAI.state.get('user');
    const plan = PLANS[targetPlan.toUpperCase()];
    
    if (!plan) return;
    
    if (plan.requiresApproval) {
        // Show request form
        showRequestForm(targetPlan);
    } else {
        // Direct upgrade (if implemented)
        showError('Direct upgrades coming soon. Please contact support.');
    }
};

/**
 * Show request form
 */
function showRequestForm(targetPlan) {
    const container = document.getElementById('plan-modal-body');
    const plan = PLANS[targetPlan.toUpperCase()];
    
    container.innerHTML = `
        <div class="request-form">
            <button class="back-btn" onclick="location.reload()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Plans
            </button>
            
            <h3>Request ${plan.name}</h3>
            <p>Tell us why you need ${plan.name} and any custom requirements.</p>
            
            <form id="upgrade-request-form">
                <div class="form-group">
                    <label>Reason for Upgrade</label>
                    <textarea 
                        id="upgrade-reason" 
                        rows="4" 
                        placeholder="e.g., I need more responses for my research project..."
                        required
                    ></textarea>
                </div>
                
                <div class="form-group">
                    <label>Custom Requirements (Optional)</label>
                    <textarea 
                        id="custom-requirements" 
                        rows="3" 
                        placeholder="e.g., I need 15 responses per chat instead of 8..."
                    ></textarea>
                </div>
                
                <button type="submit" class="plan-btn upgrade">
                    <span>Submit Request</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                </button>
            </form>
        </div>
    `;
    
    // Form submission
    document.getElementById('upgrade-request-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const reason = document.getElementById('upgrade-reason').value;
        const custom = document.getElementById('custom-requirements').value;
        const fullReason = custom ? `${reason}\n\nCustom Requirements:\n${custom}` : reason;
        
        const user = window.NexusAI.state.get('user');
        const result = await requestPlanUpgrade(user.uid, targetPlan, fullReason);
        
        if (result.success) {
            showSuccess('Request submitted! Owner will review soon.');
            closePlanModal();
        } else {
            showError('Failed to submit request. Please try again.');
        }
    });
}

console.log('📦 Plan Modal loaded');
