/**
 * ============================================
 * MESSAGE RENDERER
 * Render messages with professional formatting
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
 * Render AI message with formatting
 */
export function renderAIMessage(content, model) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    
    // Parse markdown to HTML
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
    
    // Add copy buttons to code blocks
    addCopyButtons(messageDiv);
    
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
 * Render existing messages (on load)
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
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
        'gpt-oss-20b': 'GPT-OSS 20B',
        'gpt-oss-120b': 'GPT-OSS 120B',
        'gpt-4': 'GPT-4',
        'claude': 'Claude',
        'gemini': 'Gemini'
    };
    return models[modelId] || modelId;
}

/**
 * Add copy buttons to code blocks
 */
function addCopyButtons(messageDiv) {
    const codeBlocks = messageDiv.querySelectorAll('pre code');
    
    codeBlocks.forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        
        // Create header with copy button
        const header = document.createElement('div');
        header.className = 'code-block-header';
        
        const language = codeBlock.className.replace('language-', '') || 'code';
        header.innerHTML = `
            <span class="code-language">${language}</span>
            <button class="copy-code-btn" data-code="${escapeHtml(codeBlock.textContent)}">
                Copy
            </button>
        `;
        
        pre.insertBefore(header, codeBlock);
        
        // Add click handler
        const copyBtn = header.querySelector('.copy-code-btn');
        copyBtn.addEventListener('click', () => {
            copyToClipboard(codeBlock.textContent);
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
            }, 2000);
        });
    });
}

/**
 * Copy to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy:', err);
    });
}

console.log('📦 Message Renderer module loaded');
