/**
 * ============================================
 * MODELS CONFIGURATION (Backend)
 * ============================================
 */

const MODELS = {
    'gpt-oss-20b': {
        id: 'gpt-oss-20b',
        name: 'GPT-OSS 20B',
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        model: 'openai/gpt-oss-20b:novita',
        type: 'chat',
        maxTokens: 4096,
        temperature: 0.7
    },
    'gpt-oss-120b': {
        id: 'gpt-oss-120b',
        name: 'GPT-OSS 120B',
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        model: 'openai/gpt-oss-120b:novita',
        type: 'chat',
        maxTokens: 8192,
        temperature: 0.8
    }
};

module.exports = {
    MODELS
};
