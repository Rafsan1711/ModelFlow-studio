/**
 * ============================================
 * AI CONTROLLER
 * Handle AI model requests with multi-model support
 * ============================================
 */

const fetch = require('node-fetch');

// Model configurations
const MODELS = {
    'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai': {
        id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai',
        name: 'DeepSeek 7B',
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai',
        maxTokens: 4096,
        temperature: 0.7
    },
    'openai/gpt-oss-20b:novita': {
        id: 'openai/gpt-oss-20b:novita',
        name: 'GPT-OSS 20B',
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        model: 'openai/gpt-oss-20b:novita',
        maxTokens: 4096,
        temperature: 0.7
    },
    'openai/gpt-oss-120b:novita': {
        id: 'openai/gpt-oss-120b:novita',
        name: 'GPT-OSS 120B',
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        model: 'openai/gpt-oss-120b:novita',
        maxTokens: 8192,
        temperature: 0.8
    }
};

/**
 * Get AI response
 */
async function getAIResponse(userMessage, modelId, history = []) {
    const modelConfig = MODELS[modelId] || MODELS['deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai'];

    try {
        console.log(`🤖 Getting response from ${modelConfig.name}...`);

        const response = await callChatAPI(userMessage, modelConfig, history);

        console.log('✅ AI response received');

        return {
            response: response,
            model: modelId,
            timestamp: Date.now()
        };

    } catch (error) {
        console.error(`❌ ${modelConfig.name} Error:`, error.message);
        
        // Try fallback to DeepSeek if not already using it
        if (modelId !== 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai') {
            console.log('🔄 Falling back to DeepSeek 7B...');
            try {
                const fallbackResponse = await callChatAPI(
                    userMessage, 
                    MODELS['deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai'], 
                    history
                );
                
                return {
                    response: `⚠️ **${modelConfig.name} unavailable. Using DeepSeek 7B.**\n\n${fallbackResponse}`,
                    model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai',
                    fallback: true,
                    timestamp: Date.now()
                };
            } catch (fallbackError) {
                console.error('❌ Fallback failed:', fallbackError.message);
            }
        }
        
        throw error;
    }
}

/**
 * Call Chat API
 */
async function callChatAPI(userMessage, modelConfig, history) {
    const messages = [
        {
            role: 'system',
            content: `You are ModelFlow Studio AI, a helpful and intelligent assistant.

FORMAT YOUR RESPONSES PROFESSIONALLY:
- Use **bold** for important terms
- Use proper headings with ## for main topics
- Use bullet points with - for lists
- Use numbered lists with 1. 2. 3. for steps
- Use \`code\` for technical terms
- Use code blocks with \`\`\`language for multi-line code
- Use tables when presenting structured data
- Structure your response with clear sections

Always provide clear, concise, and accurate information.`
        }
    ];

    // Add history
    history.forEach(msg => {
        messages.push({
            role: msg.role,
            content: msg.content
        });
    });

    // Add current message
    messages.push({
        role: 'user',
        content: userMessage
    });

    const response = await fetch(modelConfig.endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.HF_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: modelConfig.model,
            messages: messages,
            max_tokens: modelConfig.maxTokens || 4096,
            temperature: modelConfig.temperature || 0.7
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
    }

    throw new Error('Invalid response format');
}

module.exports = {
    getAIResponse
};
