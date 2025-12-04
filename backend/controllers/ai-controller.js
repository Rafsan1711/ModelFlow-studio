/**
 * ============================================
 * AI CONTROLLER
 * Handle AI model requests
 * ============================================
 */

const fetch = require('node-fetch');
const { MODELS } = require('../config/models');

/**
 * Get AI response
 */
async function getAIResponse(userMessage, modelId = 'gpt-oss-20b', history = []) {
    const modelConfig = MODELS[modelId] || MODELS['gpt-oss-20b'];

    try {
        console.log(`🤖 Getting response from ${modelId}...`);

        const response = await callChatAPI(userMessage, modelConfig, history);

        console.log('✅ AI response received');

        return {
            response: response,
            model: modelId,
            timestamp: Date.now()
        };

    } catch (error) {
        console.error(`❌ ${modelId} Error:`, error.message);
        
        // Try fallback to GPT-OSS 20B if not already using it
        if (modelId !== 'gpt-oss-20b') {
            console.log('🔄 Falling back to GPT-OSS 20B...');
            try {
                const fallbackResponse = await callChatAPI(
                    userMessage, 
                    MODELS['gpt-oss-20b'], 
                    history
                );
                
                return {
                    response: `⚠️ **${modelConfig.name} unavailable. Using GPT-OSS 20B.**\n\n${fallbackResponse}`,
                    model: 'gpt-oss-20b',
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
            content: `You are ModelFlow Studio, a helpful and intelligent assistant. 

FORMAT YOUR RESPONSES PROFESSIONALLY:
- Use **bold** for important terms
- Use proper headings with ## for main topics
- Use bullet points with - for lists
- Use numbered lists with 1. 2. 3. for steps
- Use \`code\` for technical terms
- Structure your response with clear sections
- Be accurate, helpful, and well-formatted

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
