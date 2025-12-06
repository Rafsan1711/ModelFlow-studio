/**
 * ============================================
 * MESSAGE RENDERER - WITH ACTION BUTTONS
 * Fixed: Code blocks, Tables, Action buttons
 * ============================================
 */

import { parseMarkdown, initializeSyntaxHighlighting } from '../utils/markdown-parser.js';
import { formatTime } from '../utils/date-formatter.js';
import { showSuccess, showError } from '../ui/notifications.js';

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
 * Render AI message with action buttons
 */
export function renderAIMessage(content, model) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    messageDiv.dataset.messageId = `msg-${Date.now()}`;
    
    // Parse markdown
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
            ${createActionButtons(messageDiv.dataset.messageId)}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    
    // Initialize syntax highlighting for code blocks
    setTimeout(() => {
        initializeSyntaxHighlighting();
    }, 100);
    
    scrollToBottom();
}

/**
 * Create action buttons for AI messages
 */
function createActionButtons(messageId) {
    return `
        <div class="message-actions">
            <button class="message-action-btn" onclick="copyMessage('${messageId}')" title="Copy response">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy</span>
            </button>
            
            <button class="message-action-btn" onclick="regenerateMessage('${messageId}')" title="Regenerate">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
                </svg>
                <span>Regenerate</span>
            </button>
            
            <button class="message-action-btn" onclick="provideFeedback('${messageId}', 'good')" title="Good response">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
                </svg>
                <span>Good</span>
            </button>
            
            <button class="message-action-btn" onclick="provideFeedback('${messageId}', 'bad')" title="Bad response">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
                </svg>
                <span>Bad</span>
            </button>
            
            <button class="message-action-btn report-btn" onclick="reportMessage('${messageId}')" title="Report issue">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Report</span>
            </button>
        </div>
    `;
}

/**
 * Copy message (global function)
 */
window.copyMessage = function(messageId) {
    const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageDiv) return;
    
    const content = messageDiv.querySelector('.ai-content').textContent;
    
    navigator.clipboard.writeText(content).then(() => {
        showSuccess('Response copied to clipboard!');
    }).catch(() => {
        showError('Failed to copy');
    });
};

/**
 * Regenerate message (global function)
 */
window.regenerateMessage = function(messageId) {
    // Get last user message and resend
    const messages = window.NexusAI.state.get('currentMessages');
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    
    if (lastUserMessage) {
        // Remove last AI response
        const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageDiv) messageDiv.remove();
        
        // Remove from state
        const updatedMessages = messages.filter((m, i) => i !== messages.length - 1);
        window.NexusAI.state.set('currentMessages', updatedMessages);
        
        // Resend last user message
        import('./message-handler.js').then(module => {
            document.getElementById('message-input').value = lastUserMessage.content;
            module.handleSendMessage();
        });
        
        showSuccess('Regenerating response...');
    }
};

/**
 * Provide feedback (global function)
 */
window.provideFeedback = function(messageId, type) {
    const user = window.NexusAI.state.get('user');
    if (!user) return;
    
    const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
    const content = messageDiv.querySelector('.ai-content').textContent;
    
    // Save feedback to Firebase
    import('../auth/firebase-config.js').then(({ database }) => {
        database.ref('feedback').push({
            userId: user.uid,
            email: user.email,
            messageId: messageId,
            feedbackType: type,
            messageContent: content.substring(0, 500), // First 500 chars
            timestamp: Date.now()
        });
    });
    
    // Visual feedback
    const btn = messageDiv.querySelector(`button[onclick*="'${type}'"]`);
    if (btn) {
        btn.style.background = type === 'good' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        btn.style.color = type === 'good' ? '#10b981' : '#ef4444';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.style.background = '';
            btn.style.color = '';
            btn.disabled = false;
        }, 3000);
    }
    
    showSuccess(type === 'good' ? 'Thanks for the positive feedback!' : 'Thanks for the feedback. We\'ll improve!');
};

/**
 * Report message (global function)
 */
window.reportMessage = function(messageId) {
    const reason = prompt('Please describe the issue:\n\n(Examples: Harmful content, incorrect information, inappropriate response, etc.)');
    
    if (!reason || reason.trim() === '') return;
    
    const user = window.NexusAI.state.get('user');
    if (!user) return;
    
    const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
    const content = messageDiv.querySelector('.ai-content').textContent;
    
    // Save report to Firebase
    import('../auth/firebase-config.js').then(({ database }) => {
        database.ref('reports').push({
            userId: user.uid,
            email: user.email,
            messageId: messageId,
            reason: reason,
            messageContent: content,
            timestamp: Date.now(),
            status: 'pending'
        });
    });
    
    showSuccess('Report submitted. We\'ll review it soon.');
};

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

console.log('📦 Message Renderer (Final) loaded');
