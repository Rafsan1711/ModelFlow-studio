/**
 * ============================================
 * CHAT UI - WITH USAGE DISPLAY & FILE UPLOAD
 * ============================================
 */

import { handleSendMessage } from './message-handler.js';
import { loadAllChats } from './chat-manager.js';
import { showPlanUpgrade } from '../plans/plan-manager.js';

let messageInput;
let sendBtn;
let messagesContainer;
let emptyState;
let chatTitle;
let charCount;
let usageDisplay;
let planBadge;
let fileUploadInput;
let filePreview;
let currentFile = null;

/**
 * Initialize Chat UI
 */
export async function initChatUI() {
    messageInput = document.getElementById('message-input');
    sendBtn = document.getElementById('send-btn');
    messagesContainer = document.getElementById('messages-container');
    emptyState = document.getElementById('empty-state');
    chatTitle = document.getElementById('current-chat-title');
    charCount = document.querySelector('.char-count');
    
    // Create usage display
    createUsageDisplay();
    
    // Create file upload
    createFileUpload();
    
    setupEventListeners();
    await loadChats();
    initAnimations();
    
    // Update usage display
    updateUsageDisplay();

    console.log('✅ Chat UI initialized');
}

/**
 * Create usage display
 */
function createUsageDisplay() {
    const inputFooter = document.querySelector('.input-footer');
    if (!inputFooter) return;
    
    const leftSection = document.createElement('div');
    leftSection.className = 'input-footer-left';
    
    // Plan badge
    planBadge = document.createElement('div');
    planBadge.className = 'plan-badge';
    planBadge.style.cursor = 'pointer';
    planBadge.onclick = showPlanUpgrade;
    
    // Usage counter
    usageDisplay = document.createElement('div');
    usageDisplay.className = 'usage-counter';
    
    leftSection.appendChild(planBadge);
    leftSection.appendChild(usageDisplay);
    
    inputFooter.insertBefore(leftSection, inputFooter.firstChild);
}

/**
 * Create file upload
 */
function createFileUpload() {
    const inputWrapper = document.querySelector('.input-wrapper');
    if (!inputWrapper) return;
    
    // File upload button
    const fileWrapper = document.createElement('div');
    fileWrapper.className = 'file-upload-wrapper';
    fileWrapper.innerHTML = `
        <button type="button" class="file-upload-btn" title="Upload file">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
            <input type="file" id="file-upload" accept=".txt,.pdf,.doc,.docx,.md,.json,.csv" />
        </button>
    `;
    
    fileUploadInput = fileWrapper.querySelector('input');
    fileUploadInput.addEventListener('change', handleFileSelect);
    
    inputWrapper.insertBefore(fileWrapper, messageInput);
    
    // File preview
    const inputArea = document.querySelector('.input-area');
    filePreview = document.createElement('div');
    filePreview.className = 'file-preview';
    inputArea.insertBefore(filePreview, inputArea.firstChild);
}

/**
 * Handle file select
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Maximum size is 5MB.');
        return;
    }
    
    currentFile = file;
    showFilePreview(file);
}

/**
 * Show file preview
 */
function showFilePreview(file) {
    const sizeKB = (file.size / 1024).toFixed(1);
    
    filePreview.innerHTML = `
        <div class="file-preview-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
            </svg>
        </div>
        <div class="file-preview-info">
            <div class="file-preview-name">${file.name}</div>
            <div class="file-preview-size">${sizeKB} KB</div>
        </div>
        <button class="file-preview-remove" onclick="removeFile()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
        </button>
    `;
    
    filePreview.classList.add('active');
}

/**
 * Remove file (global function)
 */
window.removeFile = function() {
    currentFile = null;
    filePreview.classList.remove('active');
    fileUploadInput.value = '';
};

/**
 * Update usage display
 */
export function updateUsageDisplay() {
    const plan = window.NexusAI.state.get('userPlan');
    const usage = window.NexusAI.state.get('dailyUsage');
    const isOwner = window.NexusAI.state.get('isOwner');
    
    if (!plan || !planBadge || !usageDisplay) return;
    
    // Plan badge
    planBadge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        <span>${plan.name}</span>
    `;
    planBadge.style.borderColor = plan.color;
    planBadge.style.color = plan.color;
    planBadge.style.background = `rgba(${hexToRgb(plan.color)}, 0.1)`;
    
    // Usage counter
    if (isOwner) {
        usageDisplay.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            <span>Unlimited</span>
        `;
    } else {
        const chatPercent = (usage.chatsToday / plan.chatsPerDay) * 100;
        const responsePercent = (usage.currentChatResponses / plan.responsesPerChat) * 100;
        
        usageDisplay.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span>${usage.currentChatResponses}/${plan.responsesPerChat} • ${usage.chatsToday}/${plan.chatsPerDay} chats</span>
        `;
        
        if (responsePercent >= 80 || chatPercent >= 80) {
            usageDisplay.classList.add('warning');
        }
        if (responsePercent >= 100 || chatPercent >= 100) {
            usageDisplay.classList.add('danger');
        }
    }
}

/**
 * Hex to RGB
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '88, 166, 255';
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    messageInput.addEventListener('input', handleInputChange);
    
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) {
                handleSendMessage();
                addSendAnimation();
            }
        }
    });

    sendBtn.addEventListener('click', () => {
        if (!sendBtn.disabled) {
            handleSendMessage();
            addSendAnimation();
        }
    });

    document.querySelectorAll('.example-prompt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prompt = e.currentTarget.dataset.prompt;
            messageInput.value = prompt;
            handleInputChange();
            messageInput.focus();
            
            e.currentTarget.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.currentTarget.style.transform = '';
            }, 200);
        });
    });

    if (messagesContainer) {
        const observer = new MutationObserver(() => {
            smoothScrollToBottom();
        });
        observer.observe(messagesContainer, { childList: true });
    }
}

/**
 * Handle input change
 */
function handleInputChange() {
    const value = messageInput.value.trim();
    const length = messageInput.value.length;
    const maxLength = parseInt(messageInput.getAttribute('maxlength')) || 4000;
    
    sendBtn.disabled = value.length === 0;
    
    if (charCount) {
        charCount.textContent = `${length} / ${maxLength}`;
        
        charCount.classList.remove('warning', 'danger');
        if (length > maxLength * 0.9) {
            charCount.classList.add('danger');
        } else if (length > maxLength * 0.75) {
            charCount.classList.add('warning');
        }
    }

    messageInput.style.height = 'auto';
    const newHeight = Math.min(messageInput.scrollHeight, 200);
    messageInput.style.height = newHeight + 'px';
    
    if (value.length > 0 && !sendBtn.disabled) {
        sendBtn.classList.add('pulse');
    } else {
        sendBtn.classList.remove('pulse');
    }
}

/**
 * Load chats
 */
async function loadChats() {
    try {
        const chats = await loadAllChats();
        window.NexusAI.state.setChats(chats);
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
    
    if (window.AOS) {
        window.AOS.refresh();
    }
}

/**
 * Show messages
 */
export function showMessages() {
    emptyState.style.display = 'none';
    messagesContainer.style.display = 'flex';
    
    messagesContainer.style.opacity = '0';
    setTimeout(() => {
        messagesContainer.style.transition = 'opacity 0.3s ease';
        messagesContainer.style.opacity = '1';
    }, 10);
}

/**
 * Clear input
 */
export function clearInput() {
    messageInput.value = '';
    handleInputChange();
    messageInput.style.height = 'auto';
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
    chatTitle.style.opacity = '0';
    chatTitle.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
        chatTitle.textContent = title;
        chatTitle.style.transition = 'all 0.3s ease';
        chatTitle.style.opacity = '1';
        chatTitle.style.transform = 'translateY(0)';
    }, 150);
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
 * Add send animation
 */
function addSendAnimation() {
    sendBtn.style.transform = 'scale(0.9) rotate(45deg)';
    setTimeout(() => {
        sendBtn.style.transform = '';
    }, 200);
}

/**
 * Smooth scroll to bottom
 */
function smoothScrollToBottom() {
    if (messagesContainer) {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }
}

/**
 * Initialize animations
 */
function initAnimations() {
    document.querySelectorAll('.ripple-effect').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    if (window.tippy) {
        window.tippy('[data-tippy-content]', {
            placement: 'bottom',
            arrow: true,
            animation: 'scale',
            theme: 'custom'
        });
    }

    document.documentElement.style.scrollBehavior = 'smooth';
}

console.log('📦 Chat UI (Enhanced) loaded');
