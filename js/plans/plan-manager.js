/**
 * ============================================
 * PLAN MANAGER
 * Professional 3-Tier Plan System
 * ============================================
 */

import { database } from '../auth/firebase-config.js';

// Plan Configurations
export const PLANS = {
    FREE: {
        id: 'free',
        name: 'Free',
        model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai',
        displayName: 'DeepSeek 7B',
        responsesPerChat: 5,
        chatsPerDay: 2,
        color: '#71717a',
        icon: '⚡',
        features: [
            '5 responses per chat',
            '2 chats per day',
            'DeepSeek 7B model',
            'Basic support'
        ]
    },
    PRO: {
        id: 'pro',
        name: 'ModelFlow Pro',
        model: 'openai/gpt-oss-20b:novita',
        displayName: 'GPT-OSS 20B',
        responsesPerChat: 8,
        chatsPerDay: 3,
        color: '#58a6ff',
        icon: '🚀',
        features: [
            '8 responses per chat',
            '3 chats per day',
            'GPT-OSS 20B model',
            'Priority support',
            'Request limit increase'
        ],
        requiresApproval: true
    },
    MAX: {
        id: 'max',
        name: 'ModelFlow Max',
        model: 'openai/gpt-oss-120b:novita',
        displayName: 'GPT-OSS 120B',
        responsesPerChat: 10, // 2 uses of 120B + 8 fallback to 20B
        gpt120bUsesPerChat: 2,
        chatsPerDay: 4,
        color: '#ffd700',
        icon: '👑',
        features: [
            '2 GPT-OSS 120B per chat',
            '8 GPT-OSS 20B fallback',
            '4 chats per day',
            'Premium support',
            'Request custom limits'
        ],
        requiresApproval: true
    }
};

// Owner email with infinite access
const OWNER_EMAIL = '123@email.com';

/**
 * Check and initialize user plan
 */
export async function checkUserPlan(user) {
    if (!user) return null;

    // Owner has infinite access
    if (user.email === OWNER_EMAIL) {
        const ownerPlan = {
            ...PLANS.MAX,
            id: 'owner',
            name: 'Owner (Unlimited)',
            responsesPerChat: Infinity,
            chatsPerDay: Infinity,
            gpt120bUsesPerChat: Infinity,
            isOwner: true,
            color: '#ff0080',
            icon: '👨‍💼'
        };
        window.NexusAI.state.set('userPlan', ownerPlan);
        window.NexusAI.state.set('isOwner', true);
        await resetDailyUsage(user.uid);
        return ownerPlan;
    }

    try {
        // Get user plan from database
        const planRef = database.ref(`users/${user.uid}/plan`);
        const snapshot = await planRef.once('value');
        const planData = snapshot.val();

        let userPlan;
        if (planData && planData.planId && PLANS[planData.planId.toUpperCase()]) {
            userPlan = {
                ...PLANS[planData.planId.toUpperCase()],
                approvedAt: planData.approvedAt,
                approvedBy: planData.approvedBy
            };
        } else {
            // Default to free plan
            userPlan = PLANS.FREE;
            await planRef.set({
                planId: 'free',
                activatedAt: Date.now()
            });
        }

        // Get usage data
        const usage = await getDailyUsage(user.uid);
        
        window.NexusAI.state.set('userPlan', userPlan);
        window.NexusAI.state.set('dailyUsage', usage);
        window.NexusAI.state.set('isOwner', false);

        return userPlan;
    } catch (error) {
        console.error('Error checking user plan:', error);
        return PLANS.FREE;
    }
}

/**
 * Get daily usage
 */
export async function getDailyUsage(userId) {
    const today = new Date().toISOString().split('T')[0];
    const usageRef = database.ref(`users/${userId}/usage/${today}`);
    
    try {
        const snapshot = await usageRef.once('value');
        const data = snapshot.val();
        
        return {
            chatsToday: data?.chats?.length || 0,
            currentChatResponses: 0,
            currentChat120bUses: 0,
            chats: data?.chats || [],
            lastReset: data?.lastReset || Date.now()
        };
    } catch (error) {
        console.error('Error getting usage:', error);
        return {
            chatsToday: 0,
            currentChatResponses: 0,
            currentChat120bUses: 0,
            chats: [],
            lastReset: Date.now()
        };
    }
}

/**
 * Reset daily usage
 */
export async function resetDailyUsage(userId) {
    const today = new Date().toISOString().split('T')[0];
    const usageRef = database.ref(`users/${userId}/usage/${today}`);
    
    try {
        await usageRef.set({
            chats: [],
            lastReset: Date.now()
        });
        
        window.NexusAI.state.set('dailyUsage', {
            chatsToday: 0,
            currentChatResponses: 0,
            currentChat120bUses: 0,
            chats: [],
            lastReset: Date.now()
        });
    } catch (error) {
        console.error('Error resetting usage:', error);
    }
}

/**
 * Check if user can send message
 */
export function canSendMessage(userId) {
    const plan = window.NexusAI.state.get('userPlan');
    const usage = window.NexusAI.state.get('dailyUsage');
    const isOwner = window.NexusAI.state.get('isOwner');

    if (isOwner) return { allowed: true };

    // Check daily chat limit
    if (usage.chatsToday >= plan.chatsPerDay) {
        return {
            allowed: false,
            reason: 'daily_limit',
            message: `You've reached your daily limit of ${plan.chatsPerDay} chats. Reset at midnight.`
        };
    }

    // Check responses per chat limit
    if (usage.currentChatResponses >= plan.responsesPerChat) {
        return {
            allowed: false,
            reason: 'chat_limit',
            message: `You've reached the limit of ${plan.responsesPerChat} responses for this chat. Start a new chat.`
        };
    }

    return { allowed: true };
}

/**
 * Increment usage
 */
export async function incrementUsage(userId, isNewChat = false) {
    const usage = window.NexusAI.state.get('dailyUsage');
    const plan = window.NexusAI.state.get('userPlan');
    const isOwner = window.NexusAI.state.get('isOwner');

    if (isOwner) return;

    const today = new Date().toISOString().split('T')[0];
    const usageRef = database.ref(`users/${userId}/usage/${today}`);

    try {
        if (isNewChat) {
            // New chat - increment chat count
            const newChats = [...usage.chats, {
                chatId: window.NexusAI.state.get('currentChatId'),
                startedAt: Date.now(),
                responses: 1
            }];
            
            await usageRef.child('chats').set(newChats);
            
            window.NexusAI.state.set('dailyUsage', {
                ...usage,
                chatsToday: newChats.length,
                currentChatResponses: 1,
                currentChat120bUses: 0,
                chats: newChats
            });
        } else {
            // Existing chat - increment response count
            const newResponseCount = usage.currentChatResponses + 1;
            
            window.NexusAI.state.set('dailyUsage', {
                ...usage,
                currentChatResponses: newResponseCount
            });
        }
    } catch (error) {
        console.error('Error incrementing usage:', error);
    }
}

/**
 * Get model for current request
 */
export function getModelForRequest() {
    const plan = window.NexusAI.state.get('userPlan');
    const usage = window.NexusAI.state.get('dailyUsage');
    const isOwner = window.NexusAI.state.get('isOwner');

    if (isOwner) {
        return PLANS.MAX.model; // Owner gets best model
    }

    // For MAX plan, check if 120B uses available
    if (plan.id === 'max' && usage.currentChat120bUses < plan.gpt120bUsesPerChat) {
        // Increment 120B usage
        const newUsage = {
            ...usage,
            currentChat120bUses: usage.currentChat120bUses + 1
        };
        window.NexusAI.state.set('dailyUsage', newUsage);
        
        return PLANS.MAX.model;
    } else if (plan.id === 'max') {
        // Fallback to 20B
        return PLANS.PRO.model;
    }

    return plan.model;
}

/**
 * Request plan upgrade
 */
export async function requestPlanUpgrade(userId, targetPlan, reason = '') {
    const user = window.NexusAI.state.get('user');
    
    try {
        const requestRef = database.ref(`planRequests/${userId}`);
        await requestRef.set({
            userId: userId,
            email: user.email,
            currentPlan: window.NexusAI.state.get('userPlan').id,
            requestedPlan: targetPlan,
            reason: reason,
            requestedAt: Date.now(),
            status: 'pending'
        });

        return { success: true };
    } catch (error) {
        console.error('Error requesting upgrade:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Show plan upgrade UI
 */
export function showPlanUpgrade() {
    import('../ui/plan-modal.js').then(module => {
        module.openPlanModal();
    });
}

console.log('📦 Plan Manager loaded');
