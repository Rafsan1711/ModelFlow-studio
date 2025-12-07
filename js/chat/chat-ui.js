/**
 * ============================================
 * CHAT UI - 100% COMPLETE
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
let usageDisplay;
let planBadge;
let fileUploadBtn;
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
    
    createUsageDisplay();
    createFileUpload();
    setupEventListeners();
    await loadChats();
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
    
    planBadge = document.createElement('div');
    planBadge.className = 'plan-badge';
    planBadge.style.cursor = 'pointer';
    planBadge.onclick = () => {
        import('../plans/plan-manager.js').then(m => m.showPlanUpgrade()).catch(e => console.log('Plan modal not loaded'));
    };
    
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
    
    fileUploadBtn = document.createElement('button');
    fileUploadBtn.type = 'button';
    fileUploadBtn.className = 'file-upload-btn';
    fileUploadBtn.title = 'Upload file';
    fileUploadBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
        </svg>
        <input type="file" accept=".txt,.pdf,.doc,.docx,.md,.json,.csv" style="display: none;" />
    `;
    
    const fileInput = fileUploadBtn.querySelector('input');
    fileInput.addEventListener('change', handleFileSelect);
    
    fileUploadBtn.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
            fileInput.click();
        }
    });
    
    inputWrapper.insertBefore(fileUploadBtn, messageInput);
    
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
        <button class="file-preview-remove" onclick="window.removeFile()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
        </button>
    `;
    
    filePreview.classList.add('active');
}

/**
 * Remove file
 */
window.removeFile = function() {
    currentFile = null;
    filePreview.classList.remove('active');
    const fileInput = fileUploadBtn.querySelector('input');
    if (fileInput) fileInput.value = '';
};

/**
 * Update usage display
 */
export function updateUsageDisplay() {
    const plan = window.NexusAI.state.get('userPlan');
    const usage = window.NexusAI.state.get('dailyUsage');
    const isOwner = window.NexusAI.state.get('isOwner');
    
    if (!plan || !planBadge || !usageDisplay) return;
    
    planBadge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        <span>${plan.name}</span>
    `;
    
    if (isOwner) {
        usageDisplay.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            <span>Unlimited</span>
        `;
    } else {
        usageDisplay.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span>${usage.currentChatResponses}/${plan.responsesPerChat} • ${usage.chatsToday}/${plan.chatsPerDay} chats</span>
        `;
    }
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
            }
        }
    });

    sendBtn.addEventListener('click', () => {
        if (!sendBtn.disabled) {
            handleSendMessage();
        }
    });

    document.querySelectorAll('.example-prompt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prompt = e.currentTarget.dataset.prompt;
            messageInput.value = prompt;
            handleInputChange();
            messageInput.focus();
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
    const maxLength = 4000;
    
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

export function showEmptyState() {
    messagesContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    chatTitle.textContent = 'New Chat';
}

export function showMessages() {
    emptyState.style.display = 'none';
    messagesContainer.style.display = 'flex';
}

export function clearInput() {
    messageInput.value = '';
    handleInputChange();
    messageInput.style.height = 'auto';
}

export function focusInput() {
    messageInput.focus();
}

export function setChatTitle(title) {
    chatTitle.textContent = title;
}

export function getInputValue() {
    return messageInput.value.trim();
}

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

function smoothScrollToBottom() {
    if (messagesContainer) {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }
}

console.log('📦 Chat UI loaded');
