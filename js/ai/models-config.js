/**
 * ============================================
 * AI MODELS CONFIGURATION
 * Model definitions and settings
 * ============================================
 */

export const AI_MODELS = {
    'gpt-oss-20b': {
        id: 'gpt-oss-20b',
        name: 'GPT-OSS 20B',
        displayName: 'GPT-OSS 20B',
        description: 'Fast and efficient - Best for everyday use',
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        model: 'openai/gpt-oss-20b:novita',
        type: 'chat',
        maxTokens: 4096,
        temperature: 0.7,
        default: true,
        icon: '⚡'
    },
    'gpt-oss-120b': {
        id: 'gpt-oss-120b',
        name: 'GPT-OSS 120B',
        displayName: 'GPT-OSS 120B',
        description: 'Most powerful - Best for complex tasks',
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        model: 'openai/gpt-oss-120b:novita',
        type: 'chat',
        maxTokens: 8192,
        temperature: 0.8,
        default: false,
        icon: '🚀'
    }
};

/**
 * Get model config
 */
export function getModelConfig(modelId) {
    return AI_MODELS[modelId] || AI_MODELS['gpt-oss-20b'];
}

/**
 * Get default model
 */
export function getDefaultModel() {
    return Object.values(AI_MODELS).find(m => m.default) || AI_MODELS['gpt-oss-20b'];
}

/**
 * Get all models
 */
export function getAllModels() {
    return Object.values(AI_MODELS);
}

console.log('📦 Models Config module loaded');
console.log('🤖 Available models:', Object.keys(AI_MODELS));
