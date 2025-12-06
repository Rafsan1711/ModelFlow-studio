/**
 * ============================================
 * PLANS CONFIGURATION
 * Free, Pro, and Max plans with limits
 * ============================================
 */

export const PLANS = {
    FREE: {
        id: 'free',
        name: 'Free Plan',
        displayName: 'ModelFlow Free',
        model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai',
        responsesPerChat: 5,
        chatsPerDay: 2,
        color: '#71717a',
        icon: '🆓',
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
        displayName: 'ModelFlow Pro',
        model: 'openai/gpt-oss-20b:novita',
        responsesPerChat: 8,
        chatsPerDay: 3,
        color: '#58a6ff',
        icon: '⚡',
        requiresPermission: true,
        features: [
            '8 responses per chat',
            '3 chats per day',
            'GPT OSS 20B model',
            'Priority support',
            'Permission required'
        ]
    },
    MAX: {
        id: 'max',
        name: 'ModelFlow Max',
        displayName: 'ModelFlow Max',
        model: 'openai/gpt-oss-120b:novita',
        responsesPerChat: 10, // Can use 120B 2 times per chat
        chatsPerDay: 4,
        maxAdvancedUsage: 2, // 120B usage limit per chat
        color: '#f59e0b',
        icon: '🚀',
        requiresPermission: true,
        features: [
            '10 responses per chat',
            '4 chats per day',
            'GPT OSS 120B model (2x per chat)',
            'Pro features included',
            'Premium support',
            'Permission required'
        ]
    },
    OWNER: {
        id: 'owner',
        name: 'Owner',
        displayName: 'Owner (Unlimited)',
        model: 'openai/gpt-oss-120b:novita',
        responsesPerChat: Infinity,
        chatsPerDay: Infinity,
        maxAdvancedUsage: Infinity,
        color: '#10b981',
        icon: '👑',
        features: [
            'Unlimited everything',
            'All models access',
            'Admin panel access'
        ]
    }
};

export const OWNER_EMAIL = '123@email.com';

/**
 * Get user plan
 */
export function getUserPlan(userEmail, userPlanData) {
    // Owner gets unlimited
    if (userEmail === OWNER_EMAIL) {
        return PLANS.OWNER;
    }

    // Check user's plan from database
    if (userPlanData?.plan) {
        return PLANS[userPlanData.plan.toUpperCase()] || PLANS.FREE;
    }

    // Default to free
    return PLANS.FREE;
}

/**
 * Check if plan requires permission
 */
export function requiresPermission(planId) {
    const plan = PLANS[planId.toUpperCase()];
    return plan?.requiresPermission || false;
}

console.log('📦 Plans Config module loaded');
