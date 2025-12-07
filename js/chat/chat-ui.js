/**
 * ============================================
 * CHAT UI - Complete Interface Handler
 * ============================================
 */

import { handleSendMessage } from './message-handler.js';
import { loadAllChats } from './chat-manager.js';

let messageInput;
let sendBtn;
let messagesContainer;
let emptyState;
let chatTitle;
let charCount;
let fileUploadBtn;
let fileInput;

/**
 * Initialize Chat UI
 */
export async function initChatUI() {
    // Get elements
    messageInput = document.getElementById('message-input');
    sendBtn = document.getElementById('send-btn');
    messagesContainer = document.getElementById('messages-container');
    emptyState = document.getElementById('empty-state');
    chatTitle = document.getElementById('current-chat-title');
    charCount = document.querySelector('.char-count');
    fileUploadBtn = document.getElementById('file-upload-btn');
    fileInput = document.getElementById('file-input');

    // Setup event listeners
    setupEventListeners();

    // Load chats
    await loadChats();

    console.log('✅ Chat UI initialized');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Input changes - FIX: Center placeholder
    messageInput.addEventListener('input', handleInputChange);
    
    // Auto-resize textarea
    messageInput.addEventListener('input', autoResizeTextarea);
    
    // Send on Enter (without Shift)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) {
                handleSendMessage();
            }
        }
    });

    // Send button click
    sendBtn.addEventListener('click', () => {
        if (!sendBtn.disabled) {
            handleSendMessage();
        }
    });

    // File upload
    if (fileUploadBtn) {
        fileUploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // Example prompts
    document.querySelectorAll('.example-prompt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prompt = e.currentTarget.dataset.prompt;
            messageInput.value = prompt;
            handleInputChange();
            messageInput.focus();
        });
    });

    // Auto-scroll on new messages - FIX: No blank space
    if (messagesContainer) {
        const observer = new MutationObserver(() => {
            scrollToBottom();
        });
        observer.observe(messagesContainer, { childList: true });
    }
}

/**
 * Handle input change - FIX: Character counter
 */
function handleInputChange() {
    const value = messageInput.value.trim();
    const length = messageInput.value.length;
    const maxLength = parseInt(messageInput.getAttribute('maxlength')) || 4000;
    
    // Update send button
    sendBtn.disabled = value.length === 0;
    
    // Update character count
    if (charCount) {
        charCount.textContent = `${length} / ${maxLength}`;
        
        // Color coding
        charCount.classList.remove('warning', 'danger');
        if (length > maxLength * 0.9) {
            charCount.classList.add('danger');
        } else if (length > maxLength * 0.75) {
            charCount.classList.add('warning');
        }
    }
}

/**
 * Auto-resize textarea - FIX: Dynamic height
 */
function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    const newHeight = Math.min(messageInput.scrollHeight, 200);
    messageInput.style.height = newHeight + 'px';
}

/**
 * Handle file upload
 */
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type (only text files)
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
        showNotification('Only text, PDF, and Word documents are allowed', 'error');
        return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error');
        return;
    }

    try {
        const content = await readFile(file);
        messageInput.value = `File: ${file.name}\n\n${content}`;
        handleInputChange();
        showNotification('File uploaded successfully', 'success');
    } catch (error) {
        console.error('Error reading file:', error);
        showNotification('Error reading file', 'error');
    }

    // Reset input
    fileInput.value = '';
}

/**
 * Read file content
 */
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        
        reader.onerror = reject;
        
        reader.readAsText(file);
    });
}

/**
 * Load chats
 */
async function loadChats() {
    try {
        const chats = await loadAllChats();
        window.ModelFlow.state.set('chats', chats);
    } catch (error) {
        console.error('❌ Error loading chats:', error);
    }
}

/**
 * Show empty state
 */
export function showEmptyState() {
    messagesContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    chatTitle.textContent = 'New Chat';
}

/**
 * Show messages - FIX: No blank space
 */
export function showMessages() {
    emptyState.style.display = 'none';
    messagesContainer.style.display = 'flex';
    
    // Ensure proper scrolling
    setTimeout(() => {
        scrollToBottom();
    }, 100);
}

/**
 * Clear input
 */
export function clearInput() {
    messageInput.value = '';
    messageInput.style.height = 'auto';
    handleInputChange();
}

/**
 * Focus input
 */
export function focusInput() {
    messageInput.focus();
}

/**
 * Set chat title
 */
export function setChatTitle(title) {
    chatTitle.textContent = title;
}

/**
 * Get input value
 */
export function getInputValue() {
    return messageInput.value.trim();
}

/**
 * Disable input
 */
export function disableInput(disabled = true) {
    messageInput.disabled = disabled;
    sendBtn.disabled = disabled;
    
    if (disabled) {
        messageInput.style.opacity = '0.6';
        sendBtn.style.opacity = '0.6';
    } else {
        messageInput.style.opacity = '1';
        sendBtn.style.opacity = '1';
    }
}

/**
 * Scroll to bottom - FIX: Proper smooth scroll
 */
function scrollToBottom() {
    if (messagesContainer) {
        requestAnimationFrame(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    }
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

console.log('📦 Chat UI module loaded');
