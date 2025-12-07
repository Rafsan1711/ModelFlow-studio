/**
 * ============================================
 * SIDEBAR MANAGER
 * Manage sidebar, chat history, navigation
 * ============================================
 */

import { loadAllChats } from '../chat/chat-manager.js';
import { renderMessages, clearMessages } from '../chat/message-renderer.js';
import { showMessages, showEmptyState, setChatTitle } from '../chat/chat-ui.js';
import { handleSignOut } from '../auth/auth-handler.js';
import { formatTime } from '../utils/date-formatter.js';

let sidebar;
let toggleSidebarBtn;
let closeSidebarBtn;
let newChatBtn;
let upgradeBtn;
let adminBtn;
let logoutBtn;
let chatHistoryList;
let sidebarOverlay;

/**
 * Initialize sidebar
 */
export function initSidebar() {
    // Get elements
    sidebar = document.getElementById('sidebar');
    toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    closeSidebarBtn = document.getElementById('close-sidebar-btn');
    newChatBtn = document.getElementById('new-chat-btn');
    upgradeBtn = document.getElementById('upgrade-btn');
    adminBtn = document.getElementById('admin-btn');
    logoutBtn = document.getElementById('logout-btn');
    chatHistoryList = document.getElementById('chat-history-list');

    // Create overlay for mobile
    createSidebarOverlay();

    // Setup event listeners
    setupEventListeners();

    // Load chat history
    loadChatHistory();

    // Make reload function global
    window.ModelFlow.reloadSidebar = loadChatHistory;

    console.log('✅ Sidebar initialized');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    toggleSidebarBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    newChatBtn.addEventListener('click', handleNewChat);
    
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', showUpgradeModal);
    }
    
    if (adminBtn) {
        adminBtn.addEventListener('click', showAdminPanel);
    }

    logoutBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to logout?')) {
            await handleSignOut();
        }
    });

    sidebarOverlay.addEventListener('click', toggleSidebar);

    // Close sidebar on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        }
    });
}

/**
 * Create sidebar overlay for mobile
 */
function createSidebarOverlay() {
    sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
}

/**
 * Load chat history
 */
export async function loadChatHistory() {
    try {
        const chats = await loadAllChats();
        window.ModelFlow.state.set('chats', chats);
        renderChatHistory(chats);
    } catch (error) {
        console.error('❌ Error loading chat history:', error);
    }
}

/**
 * Render chat history
 */
function renderChatHistory(chats) {
    if (chats.length === 0) {
        chatHistoryList.innerHTML = `
            <div class="chat-history-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <p>No chats yet</p>
            </div>
        `;
        return;
    }

    chatHistoryList.innerHTML = '';

    chats.forEach(chat => {
        const chatItem = createChatItem(chat);
        chatHistoryList.appendChild(chatItem);
    });
}

/**
 * Create chat item
 */
function createChatItem(chat) {
    const item = document.createElement('div');
    item.className = 'chat-item';
    item.dataset.chatId = chat.id;

    const currentChatId = window.ModelFlow.state.get('currentChatId');
    if (chat.id === currentChatId) {
        item.classList.add('active');
    }

    item.innerHTML = `
        <div class="chat-item-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
        </div>
        <div class="chat-item-content">
            <div class="chat-item-title">${escapeHtml(chat.title)}</div>
            <div class="chat-item-time">${formatTime(chat.updatedAt)}</div>
        </div>
    `;

    item.addEventListener('click', () => {
        loadChat(chat);
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });

    return item;
}

/**
 * Load specific chat
 */
async function loadChat(chat) {
    try {
        // Set current chat
        window.ModelFlow.state.setCurrentChat(chat.id, chat.messages || []);

        // Update UI
        showMessages();
        setChatTitle(chat.title);
        clearMessages();
        renderMessages(chat.messages || []);

        // Update active state
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.toggle('active', item.dataset.chatId === chat.id);
        });

    } catch (error) {
        console.error('❌ Error loading chat:', error);
    }
}

/**
 * Handle new chat
 */
function handleNewChat() {
    // Check chat limit
    const canSend = window.ModelFlow.state.canSendMessage();
    if (!canSend.allowed && canSend.limitType === 'chats') {
        showLimitModal();
        return;
    }

    // Reset state
    window.ModelFlow.state.setCurrentChat(null, []);

    // Update UI
    showEmptyState();
    setChatTitle('New Chat');
    clearMessages();

    // Remove active state from all chats
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

/**
 * Show upgrade modal
 */
function showUpgradeModal() {
    import('./upgrade-modal.js').then(module => {
        module.openUpgradeModal();
    });

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

/**
 * Show admin panel
 */
function showAdminPanel() {
    import('./admin-panel.js').then(module => {
        module.openAdminPanel();
    });

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

/**
 * Show limit modal
 */
function showLimitModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    
    modal.innerHTML = `
        <div class="modal-content glass-effect" style="max-width: 500px;">
            <div class="modal-header">
                <h3 class="gradient-text">⚠️ Daily Limit Reached</h3>
                <button class="close-modal-btn" onclick="this.closest('.modal').remove()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p style="font-size: 16px; line-height: 1.6; color: var(--text-primary); margin-bottom: 24px;">
                    You've reached your daily chat limit. Upgrade to continue chatting!
                </p>
                <button class="auth-btn primary" onclick="document.getElementById('upgrade-btn').click(); this.closest('.modal').remove();">
                    Upgrade Plan
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('📦 Sidebar Manager module loaded');
