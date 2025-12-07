/**
 * ============================================
 * PLAN MANAGER
 * Handle subscription plans and limits
 * ============================================
 */

import { database, auth } from '../auth/firebase-config.js';

// Plan Configurations
export const PLANS = {
    free: {
        type: 'free',
        name: 'Free Plan',
        responsesPerChat: 5,
        chatsPerDay: 2,
        model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai',
        features: ['5 responses per chat', '2 chats per day', 'DeepSeek 7B model']
    },
    pro: {
        type: 'pro',
        name: 'ModelFlow Pro',
        responsesPerChat: 8,
        chatsPerDay: 3,
        model: 'openai/gpt-oss-20b:novita',
        features: ['8 responses per chat', '3 chats per day', 'GPT-OSS 20B model', 'Priority support'],
        requiresPermission: true
    },
    max: {
        type: 'max',
        name: 'ModelFlow Max',
        responsesPerChat: 2, // For GPT-OSS 120B usage
        chatsPerDay: 4,
        model: 'openai/gpt-oss-120b:novita',
        features: ['2 GPT-OSS 120B per chat', '4 chats per day', 'All Pro features', 'Premium support'],
        requiresPermission: true
    }
};

/**
 * Get user's current plan
 */
export async function getUserPlan(userId) {
    try {
        const snapshot = await database.ref(`users/${userId}/plan`).once('value');
        const plan = snapshot.val();
        
        if (!plan) {
            // Return default free plan
            return {
                ...PLANS.free,
                responsesLeft: PLANS.free.responsesPerChat,
                chatsLeft: PLANS.free.chatsPerDay
            };
        }
        
        return plan;
    } catch (error) {
        console.error('Error getting user plan:', error);
        return {
            ...PLANS.free,
            responsesLeft: PLANS.free.responsesPerChat,
            chatsLeft: PLANS.free.chatsPerDay
        };
    }
}

/**
 * Request plan upgrade
 */
export async function requestPlanUpgrade(userId, requestedPlan, customRequests = {}) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');

        const request = {
            userId: userId,
            userEmail: user.email,
            requestedPlan: requestedPlan,
            currentPlan: window.ModelFlow.state.get('plan').type,
            customRequests: customRequests,
            status: 'pending',
            requestedAt: Date.now()
        };

        // Save to Firebase
        const requestRef = database.ref('planRequests').push();
        await requestRef.set(request);

        console.log('✅ Plan upgrade requested');
        return { success: true, requestId: requestRef.key };
    } catch (error) {
        console.error('❌ Error requesting upgrade:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update user plan (Admin only)
 */
export async function updateUserPlan(userId, newPlan) {
    try {
        const planConfig = PLANS[newPlan];
        if (!planConfig) throw new Error('Invalid plan');

        const planData = {
            type: newPlan,
            name: planConfig.name,
            responsesPerChat: planConfig.responsesPerChat,
            chatsPerDay: planConfig.chatsPerDay,
            model: planConfig.model,
            responsesLeft: planConfig.responsesPerChat,
            chatsLeft: planConfig.chatsPerDay,
            updatedAt: Date.now()
        };

        await database.ref(`users/${userId}/plan`).set(planData);
        
        console.log('✅ Plan updated for user:', userId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error updating plan:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if user can access plan
 */
export async function canAccessPlan(userId, planType) {
    if (planType === 'free') return true;
    
    const user = auth.currentUser;
    if (!user) return false;
    
    // Owner can access all plans
    if (user.email === '123@email.com') return true;
    
    // Check if user has permission
    const snapshot = await database.ref(`users/${userId}/plan/type`).once('value');
    const currentPlan = snapshot.val();
    
    return currentPlan === planType;
}

/**
 * Reset daily limits for user
 */
export async function resetDailyLimits(userId) {
    try {
        const planSnapshot = await database.ref(`users/${userId}/plan`).once('value');
        const plan = planSnapshot.val();
        
        if (!plan) return;
        
        const planConfig = PLANS[plan.type] || PLANS.free;
        
        await database.ref(`users/${userId}/plan`).update({
            responsesLeft: planConfig.responsesPerChat,
            chatsLeft: planConfig.chatsPerDay,
            lastReset: Date.now()
        });
        
        console.log('✅ Daily limits reset for user:', userId);
    } catch (error) {
        console.error('❌ Error resetting limits:', error);
    }
}

/**
 * Check and reset daily limits if needed
 */
export async function checkAndResetLimits(userId) {
    try {
        const snapshot = await database.ref(`users/${userId}/plan/lastReset`).once('value');
        const lastReset = snapshot.val() || 0;
        
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        if (now - lastReset >= oneDayMs) {
            await resetDailyLimits(userId);
        }
    } catch (error) {
        console.error('❌ Error checking limits:', error);
    }
}

/**
 * Decrement responses left
 */
export async function decrementResponses(userId) {
    try {
        const user = auth.currentUser;
        
        // Owner has infinite usage
        if (user && user.email === '123@email.com') {
            return { success: true };
        }
        
        const snapshot = await database.ref(`users/${userId}/plan/responsesLeft`).once('value');
        const responsesLeft = snapshot.val() || 0;
        
        if (responsesLeft > 0) {
            await database.ref(`users/${userId}/plan/responsesLeft`).set(responsesLeft - 1);
            return { success: true, responsesLeft: responsesLeft - 1 };
        }
        
        return { success: false, reason: 'No responses left' };
    } catch (error) {
        console.error('❌ Error decrementing responses:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Decrement chats left
 */
export async function decrementChats(userId) {
    try {
        const user = auth.currentUser;
        
        // Owner has infinite usage
        if (user && user.email === '123@email.com') {
            return { success: true };
        }
        
        const snapshot = await database.ref(`users/${userId}/plan/chatsLeft`).once('value');
        const chatsLeft = snapshot.val() || 0;
        
        if (chatsLeft > 0) {
            await database.ref(`users/${userId}/plan/chatsLeft`).set(chatsLeft - 1);
            return { success: true, chatsLeft: chatsLeft - 1 };
        }
        
        return { success: false, reason: 'No chats left' };
    } catch (error) {
        console.error('❌ Error decrementing chats:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all pending plan requests (Admin only)
 */
export async function getPendingRequests() {
    try {
        const snapshot = await database.ref('planRequests')
            .orderByChild('status')
            .equalTo('pending')
            .once('value');
        
        const requests = [];
        snapshot.forEach(child => {
            requests.push({
                id: child.key,
                ...child.val()
            });
        });
        
        return requests;
    } catch (error) {
        console.error('❌ Error getting requests:', error);
        return [];
    }
}

/**
 * Approve plan request (Admin only)
 */
export async function approveRequest(requestId, customPlan = null) {
    try {
        const snapshot = await database.ref(`planRequests/${requestId}`).once('value');
        const request = snapshot.val();
        
        if (!request) throw new Error('Request not found');
        
        const planToApprove = customPlan || request.requestedPlan;
        
        // Update user plan
        await updateUserPlan(request.userId, planToApprove);
        
        // Update request status
        await database.ref(`planRequests/${requestId}`).update({
            status: 'approved',
            approvedAt: Date.now(),
            approvedPlan: planToApprove
        });
        
        console.log('✅ Request approved:', requestId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error approving request:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Deny plan request (Admin only)
 */
export async function denyRequest(requestId, reason = '') {
    try {
        await database.ref(`planRequests/${requestId}`).update({
            status: 'denied',
            deniedAt: Date.now(),
            denialReason: reason
        });
        
        console.log('✅ Request denied:', requestId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error denying request:', error);
        return { success: false, error: error.message };
    }
}

console.log('📦 Plan Manager module loaded');
