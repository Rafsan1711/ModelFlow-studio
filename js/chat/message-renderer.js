/**
 * ============================================
 * MESSAGE RENDERER
 * Render messages with feedback buttons
 * ============================================
 */

import { parseMarkdown, initializeSyntaxHighlighting } from '../utils/markdown-parser.js';
import { formatTime } from '../utils/date-formatter.js';
import { handleFeedback, handleReport } from '../ui/feedback-handler.js';

const messagesContainer = document.getElementById('messages-container');

/**
 * Render user message
 */
export function renderUserMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    
    const user = window.ModelFlow.state.get('user');
    const userInitial = user?.email?.[0]?.toUpperCase() || 'U';
    
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
 * Render AI message with formatting and feedback buttons
 */
export function renderAIMessage(content, model) {
    const messageId = `msg-${Date.now()}`;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    messageDiv.dataset.messageId = messageId;
    
    // Parse markdown to HTML
    const formattedContent = parseMarkdown(content);
    
    messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="ai-content">${formattedContent}</div>
            </div>
            <div class="message-actions">
                <button class="action-btn feedback-btn" data-type="positive" data-message-id="${messageId}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
                    </svg>
                    <span>Helpful</span>
                </button>
                <button class="action-btn feedback-btn" data-type="negative" data-message-id="${messageId}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
                    </svg>
                    <span>Not helpful</span>
                </button>
                <button class="action-btn report-btn" data-message-id="${messageId}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span>Report</span>
                </button>
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
    
    // Initialize syntax highlighting
    initializeSyntaxHighlighting();
    
    // Add feedback event listeners
    setupFeedbackListeners(messageDiv, messageId);
    
    scrollToBottom();
}

/**
 * Setup feedback listeners
 */
function setupFeedbackListeners(messageDiv, messageId) {
    // Feedback buttons
    const feedbackBtns = messageDiv.querySelectorAll('.feedback-btn');
    feedbackBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const type = btn.dataset.type;
            await handleFeedback(messageId, type);
            
            // Visual feedback
            feedbackBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            btn.style.background = 'rgba(88, 166, 255, 0.2)';
            btn.style.color = 'var(--primary)';
            
            showNotification('Thank you for your feedback!', 'success');
        });
    });
    
    // Report button
    const reportBtn = messageDiv.querySelector('.report-btn');
    if (reportBtn) {
        reportBtn.addEventListener('click', async () => {
            const reason = prompt('Please describe the issue:');
            if (reason) {
                await handleReport(messageId, reason);
                reportBtn.disabled = true;
                reportBtn.style.opacity = '0.5';
                showNotification('Report submitted. Thank you!', 'success');
            }
        });
    }
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
 * Scroll to bottom - FIX: Smooth and immediate
 */
function scrollToBottom() {
    requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
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
    return models[modelId] || 'AI Model';
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#58a6ff'};
        color: white;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transition = 'all 0.3s ease';
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

console.log('📦 Message Renderer module loaded');
