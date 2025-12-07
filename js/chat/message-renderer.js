/**
 * ============================================
 * MESSAGE RENDERER - 100% COMPLETE
 * ============================================
 */

import { parseMarkdown } from '../utils/markdown-parser.js';
import { formatTime } from '../utils/date-formatter.js';

const messagesContainer = document.getElementById('messages-container');

/**
 * Render user message
 */
export function renderUserMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    
    const userInitial = window.NexusAI.state.get('user')?.email?.[0]?.toUpperCase() || 'U';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${userInitial}</div>
        <div class="message-content">
            <div class="message-bubble">${escapeHtml(content)}</div>
            <div class="message-meta">
                <span class="message-time">${formatTime(Date.now())}</span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

/**
 * Render AI message
 */
export function renderAIMessage(content, model) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    
    const formattedContent = parseMarkdown(content);
    
    messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="ai-content">${formattedContent}</div>
            </div>
            <div class="message-meta">
                <span class="message-time">${formatTime(Date.now())}</span>
                <span class="message-model">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                    </svg>
                    ${getModelDisplayName(model)}
                </span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

/**
 * Add typing indicator
 */
export function addTypingIndicator() {
    const typingId = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'message ai';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
    
    return typingId;
}

/**
 * Remove typing indicator
 */
export function removeTypingIndicator(typingId) {
    const element = document.getElementById(typingId);
    if (element) {
        element.remove();
    }
}

/**
 * Clear all messages
 */
export function clearMessages() {
    messagesContainer.innerHTML = '';
}

/**
 * Render existing messages
 */
export function renderMessages(messages) {
    clearMessages();
    
    messages.forEach(msg => {
        if (msg.role === 'user') {
            renderUserMessage(msg.content);
        } else if (msg.role === 'assistant') {
            renderAIMessage(msg.content, msg.model);
        }
    });
}

/**
 * Scroll to bottom
 */
function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get model display name
 */
function getModelDisplayName(modelId) {
    const models = {
        'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai': 'DeepSeek 7B',
        'openai/gpt-oss-20b:novita': 'GPT-OSS 20B',
        'openai/gpt-oss-120b:novita': 'GPT-OSS 120B'
    };
    return models[modelId] || modelId.split('/').pop().split(':')[0];
}

console.log('📦 Message Renderer loaded');
