/**
 * ============================================
 * SIDEBAR MANAGER - 100% COMPLETE
 * ============================================
 */

import { loadAllChats } from '../chat/chat-manager.js';
import { renderMessages, clearMessages } from '../chat/message-renderer.js';
import { showMessages, showEmptyState, setChatTitle } from '../chat/chat-ui.js';
import { handleSignOut } from '../auth/auth-handler.js';
import { formatTime } from '../utils/date-formatter.js';
import { navigateToChat, navigateToHome } from '../core/router.js';

let sidebar;
let toggleSidebarBtn;
let closeSidebarBtn;
let newChatBtn;
let requestPremiumBtn;
let settingsBtn;
let logoutBtn;
let chatHistoryList;
let sidebarOverlay;

/**
 * Initialize sidebar
 */
export function initSidebar() {
    sidebar = document.getElementById('sidebar');
    toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    closeSidebarBtn = document.getElementById('close-sidebar-btn');
    newChatBtn = document.getElementById('new-chat-btn');
    settingsBtn = document.getElementById('settings-btn');
    logoutBtn = document.getElementById('logout-btn');
    chatHistoryList = document.getElementById('chat-history-list');

    createRequestPremiumButton();
    createSidebarOverlay();
    setupEventListeners();
    loadChatHistory();

    window.NexusAI.reloadSidebar = loadChatHistory;

    console.log('✅ Sidebar initialized');
}

/**
 * Create request premium button
 */
function createRequestPremiumButton() {
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (!sidebarFooter) return;

    requestPremiumBtn = document.createElement('button');
    requestPremiumBtn.className = 'request-premium-btn';
    requestPremiumBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        <span>Request Premium</span>
    `;
    
    sidebarFooter.insertBefore(requestPremiumBtn, settingsBtn);
    
    requestPremiumBtn.addEventListener('click', () => {
        import('../plans/plan-manager.js')
            .then(m => m.showPlanUpgrade())
            .catch(e => console.log('Plan modal not available'));
        
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    toggleSidebarBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    newChatBtn.addEventListener('click', handleNewChat);
    settingsBtn.addEventListener('click', openSettings);
    
    const headerSettingsBtn = document.getElementById('header-settings-btn');
    if (headerSettingsBtn) {
        headerSettingsBtn.addEventListener('click', openSettings);
    }

    logoutBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to logout?')) {
            await handleSignOut();
        }
    });

    sidebarOverlay.addEventListener('click', toggleSidebar);

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        }
    });
}

/**
 * Create sidebar overlay
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
        window.NexusAI.state.setChats(chats);
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

    const currentChatId = window.NexusAI.state.get('currentChatId');
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
        window.NexusAI.state.setCurrentChat(chat.id, chat.messages || []);

        showMessages();
        setChatTitle(chat.title);
        clearMessages();
        renderMessages(chat.messages || []);

        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.toggle('active', item.dataset.chatId === chat.id);
        });

        navigateToChat(chat.id);
    } catch (error) {
        console.error('❌ Error loading chat:', error);
    }
}

/**
 * Handle new chat
 */
function handleNewChat() {
    window.NexusAI.state.setCurrentChat(null, []);

    showEmptyState();
    setChatTitle('New Chat');
    clearMessages();

    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });

    navigateToHome();

    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

/**
 * Open settings
 */
function openSettings() {
    import('./settings-modal.js')
        .then(module => module.openSettingsModal())
        .catch(e => console.log('Settings modal not available'));

    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('📦 Sidebar Manager loaded');
