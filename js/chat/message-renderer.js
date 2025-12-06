/**
 * ============================================
 * MESSAGE RENDERER - WITH ACTION BUTTONS
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
    smoothScrollToBottom();
}

/**
 * Render AI message with actions
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
                    ${model || 'AI'}
                </span>
            </div>
            <div class="message-actions">
                <button class="action-btn" data-action="copy" title="Copy response">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy</span>
                </button>
                
                <button class="action-btn" data-action="regenerate" title="Regenerate response">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                    <span>Regenerate</span>
                </button>
                
                <button class="action-btn" data-action="feedback" title="Give feedback">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>Feedback</span>
                </button>
                
                <button class="action-btn" data-action="report" title="Report issue">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span>Report</span>
                </button>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    setupMessageActions(messageDiv);
    smoothScrollToBottom();
}

/**
 * Setup message action buttons
 */
function setupMessageActions(messageDiv) {
    const copyBtn = messageDiv.querySelector('[data-action="copy"]');
    const regenerateBtn = messageDiv.querySelector('[data-action="regenerate"]');
    const feedbackBtn = messageDiv.querySelector('[data-action="feedback"]');
    const reportBtn = messageDiv.querySelector('[data-action="report"]');

    // Copy
    copyBtn.onclick = () => {
        const content = messageDiv.querySelector('.ai-content').innerText;
        navigator.clipboard.writeText(content).then(() => {
            copyBtn.classList.add('copied');
            copyBtn.querySelector('span').textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.querySelector('span').textContent = 'Copy';
            }, 2000);
        });
    };

    // Regenerate
    regenerateBtn.onclick = () => {
        alert('Regenerate feature coming soon!');
    };

    // Feedback
    feedbackBtn.onclick = () => {
        const feedback = prompt('Your feedback (optional):');
        if (feedback !== null) {
            alert('Thank you for your feedback!');
        }
    };

    // Report
    reportBtn.onclick = () => {
        const issue = prompt('Describe the issue:');
        if (issue) {
            alert('Thank you for reporting. We will review this.');
        }
    };
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
    smoothScrollToBottom();
    
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
 * Smooth scroll to bottom - FIXED
 */
function smoothScrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
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

console.log('📦 Message Renderer (Enhanced) loaded');
