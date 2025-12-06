/**
 * ============================================
 * PRICING PLANS CONFIGURATION
 * Free, Pro, Max tiers with limits
 * ============================================
 */

export const PLANS = {
    FREE: {
        id: 'free',
        name: 'Free Plan',
        displayName: 'Free',
        model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai',
        modelDisplayName: 'DeepSeek R1 7B',
        responsesPerChat: 5,
        chatsPerDay: 2,
        maxFileSize: 0, // No file upload
        color: '#71717a',
        icon: '🆓',
        features: [
            '5 responses per chat',
            '2 chats per day',
            'DeepSeek R1 7B model',
            'Basic support'
        ]
    },
    PRO: {
        id: 'pro',
        name: 'ModelFlow Pro',
        displayName: 'Pro',
        model: 'openai/gpt-oss-20b:novita',
        modelDisplayName: 'GPT-OSS 20B',
        responsesPerChat: 8,
        chatsPerDay: 3,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        color: '#58a6ff',
        icon: '⚡',
        features: [
            '8 responses per chat',
            '3 chats per day',
            'GPT-OSS 20B model',
            'File upload (5MB)',
            'Priority support',
            'Request custom limits'
        ],
        requiresPermission: true
    },
    MAX: {
        id: 'max',
        name: 'ModelFlow Max',
        displayName: 'Max',
        model: 'openai/gpt-oss-120b:novita',
        modelDisplayName: 'GPT-OSS 120B',
        responsesPerChat: 2, // 120B can be used 2 times per chat
        chatsPerDay: 4,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        color: '#f59e0b',
        icon: '🚀',
        features: [
            'GPT-OSS 120B (2 uses/chat)',
            'Fallback to GPT-OSS 20B',
            '4 chats per day',
            'File upload (10MB)',
            'Premium support',
            'All Pro features'
        ],
        requiresPermission: true
    }
};

export const OWNER_EMAIL = '123@email.com';

/**
 * Get plan config
 */
export function getPlan(planId) {
    return PLANS[planId.toUpperCase()] || PLANS.FREE;
}

/**
 * Check if user is owner
 */
export function isOwner(email) {
    return email === OWNER_EMAIL;
}

/**
 * Get all plans
 */
export function getAllPlans() {
    return Object.values(PLANS);
}

console.log('📦 Plans Configuration loaded');
