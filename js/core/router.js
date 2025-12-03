/**
 * ============================================
 * ROUTER
 * URL routing for /chat/:id
 * ============================================
 */

import { loadChatById } from '../chat/chat-manager.js';

/**
 * Initialize router
 */
export function initRouter() {
    // Handle initial URL
    handleRoute();

    // Listen for popstate (back/forward)
    window.addEventListener('popstate', handleRoute);

    console.log('✅ Router initialized');
}

/**
 * Handle current route
 */
async function handleRoute() {
    const path = window.location.pathname;
    const params = parsePath(path);

    if (params.chatId) {
        // Load specific chat
        await loadChatById(params.chatId);
    } else {
        // New chat (home)
        // Already handled by chat-ui
    }
}

/**
 * Parse URL path
 */
function parsePath(path) {
    // Match /chat/:id
    const chatMatch = path.match(/^\/chat\/([a-zA-Z0-9_-]+)$/);
    
    if (chatMatch) {
        return {
            chatId: chatMatch[1]
        };
    }

    return {};
}

/**
 * Navigate to chat
 */
export function navigateToChat(chatId) {
    const url = `/chat/${chatId}`;
    window.history.pushState({ chatId }, '', url);
    handleRoute();
}

/**
 * Navigate to home
 */
export function navigateToHome() {
    window.history.pushState({}, '', '/');
    handleRoute();
}

/**
 * Get current chat ID from URL
 */
export function getCurrentChatIdFromURL() {
    const path = window.location.pathname;
    const params = parsePath(path);
    return params.chatId || null;
}

console.log('📦 Router module loaded');
