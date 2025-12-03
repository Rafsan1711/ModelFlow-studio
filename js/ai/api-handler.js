/**
 * ============================================
 * API HANDLER
 * Send messages to backend API
 * ============================================
 */

import { getModelConfig } from './models-config.js';

// Backend API URL
const API_URL = 'https://aiva-gwm9.onrender.com/api';

let backendAvailable = false;
let healthCheckDone = false;

/**
 * Check backend health
 */
async function checkBackendHealth() {
    if (healthCheckDone) return backendAvailable;

    try {
        console.log('🔍 Checking backend health...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend healthy:', data);
            backendAvailable = true;
        } else {
            console.warn('⚠️ Backend returned:', response.status);
            backendAvailable = false;
        }
    } catch (error) {
        console.warn('⚠️ Backend health check failed:', error.message);
        backendAvailable = false;
    }

    healthCheckDone = true;
    return backendAvailable;
}

/**
 * Send message to AI
 */
export async function sendMessageToAI(message, history = [], modelId = 'gpt-oss-20b') {
    // Check backend health first
    if (!healthCheckDone) {
        await checkBackendHealth();
    }

    try {
        console.log(`📤 Sending message to AI (${modelId})...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                history: history,
                model: modelId
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Backend error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ AI response received');

        backendAvailable = true;

        return {
            success: true,
            message: data.response,
            model: data.model || modelId,
            timestamp: Date.now()
        };

    } catch (error) {
        console.error('❌ API error:', error);

        if (error.name === 'AbortError') {
            return {
                success: false,
                error: 'Request timeout',
                message: 'The request took too long. Please try again.'
            };
        }

        return {
            success: false,
            error: error.message,
            message: `Failed to get response: ${error.message}`
        };
    }
}

/**
 * Format chat history for API
 */
export function formatChatHistory(messages) {
    return messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
    }));
}

/**
 * Get backend status
 */
export function getBackendStatus() {
    return {
        url: API_URL,
        available: backendAvailable,
        checked: healthCheckDone
    };
}

// Check backend health on load
checkBackendHealth();

console.log('📦 API Handler module loaded');
console.log('🔗 Backend URL:', API_URL);
