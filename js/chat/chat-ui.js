/**
 * ============================================
 * CHAT UI
 * Main chat interface management
 * ============================================
 */

import { handleSendMessage } from './message-handler.js';
import { loadAllChats } from './chat-manager.js';
import { initModelSelector } from '../ui/model-selector.js';

let messageInput;
let sendBtn;
let messagesContainer;
let emptyState;
let chatTitle;

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

    // Setup event listeners
    setupEventListeners();

    // Initialize model selector
    initModelSelector();

    // Load chats
    await loadChats();

    console.log('✅ Chat UI initialized');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Input changes
    messageInput.addEventListener('input', handleInputChange);
    
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
        handleSendMessage();
    });

    // Example prompts
    document.querySelectorAll('.example-prompt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prompt = e.currentTarget.dataset.prompt;
            messageInput.value = prompt;
            handleInputChange();
            messageInput.focus();
        });
    });
}

/**
 * Handle input change
 */
function handleInputChange() {
    const value = messageInput.value.trim();
    sendBtn.disabled = value.length === 0;

    // Auto-resize textarea
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
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
}

/**
 * Show messages
 */
export function showMessages() {
    emptyState.style.display = 'none';
    messagesContainer.style.display = 'flex';
}

/**
 * Clear input
 */
export function clearInput() {
    messageInput.value = '';
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
}

console.log('📦 Chat UI module loaded');
