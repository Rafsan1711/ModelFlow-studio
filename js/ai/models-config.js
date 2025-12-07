/**
 * ============================================
 * AI MODELS CONFIGURATION
 * Model definitions for each plan
 * ============================================
 */

export const AI_MODELS = {
    'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai': {
        id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai',
        name: 'DeepSeek 7B',
        displayName: 'DeepSeek 7B',
        description: 'Fast and efficient - Best for everyday use',
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai',
        type: 'chat',
        maxTokens: 4096,
        temperature: 0.7,
        plan: 'free',
        icon: '⚡'
    },
    'openai/gpt-oss-20b:novita': {
        id: 'openai/gpt-oss-20b:novita',
        name: 'GPT-OSS 20B',
        displayName: 'GPT-OSS 20B',
        description: 'Powerful and accurate - Best for complex tasks',
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        model: 'openai/gpt-oss-20b:novita',
        type: 'chat',
        maxTokens: 4096,
        temperature: 0.7,
        plan: 'pro',
        icon: '🚀'
    },
    'openai/gpt-oss-120b:novita': {
        id: 'openai/gpt-oss-120b:novita',
        name: 'GPT-OSS 120B',
        displayName: 'GPT-OSS 120B',
        description: 'Most powerful - Best for critical tasks',
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        model: 'openai/gpt-oss-120b:novita',
        type: 'chat',
        maxTokens: 8192,
        temperature: 0.8,
        plan: 'max',
        icon: '💎'
    }
};

/**
 * Get model config
 */
export function getModelConfig(modelId) {
    return AI_MODELS[modelId] || AI_MODELS['deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai'];
}

/**
 * Get model by plan
 */
export function getModelByPlan(plan) {
    const modelId = Object.keys(AI_MODELS).find(key => AI_MODELS[key].plan === plan);
    return AI_MODELS[modelId] || AI_MODELS['deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai'];
}

/**
 * Get all models
 */
export function getAllModels() {
    return Object.values(AI_MODELS);
}

console.log('📦 Models Config module loaded');
console.log('🤖 Available models:', Object.keys(AI_MODELS).length);
