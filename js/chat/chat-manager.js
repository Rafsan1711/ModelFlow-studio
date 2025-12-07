/**
 * ============================================
 * CHAT MANAGER
 * CRUD operations for chats in Firebase
 * ============================================
 */

import { database, auth } from '../auth/firebase-config.js';

/**
 * Create new chat
 */
export async function createChat(title, messages = []) {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const chatId = `chat_${Date.now()}`;
    const plan = window.ModelFlow.state.get('plan');
    
    const chatData = {
        id: chatId,
        title: title,
        messages: messages,
        model: plan.model,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId: user.uid
    };

    try {
        await database.ref(`users/${user.uid}/chats/${chatId}`).set(chatData);
        console.log('✅ Chat created:', chatId);
        return chatData;
    } catch (error) {
        console.error('❌ Error creating chat:', error);
        throw error;
    }
}

/**
 * Save chat (update)
 */
export async function saveChat(chatId, title, messages) {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const chatData = {
        id: chatId,
        title: title,
        messages: messages,
        model: window.ModelFlow.state.get('plan').model,
        updatedAt: Date.now(),
        userId: user.uid
    };

    try {
        await database.ref(`users/${user.uid}/chats/${chatId}`).update(chatData);
        console.log('✅ Chat saved:', chatId);
        return chatData;
    } catch (error) {
        console.error('❌ Error saving chat:', error);
        throw error;
    }
}

/**
 * Load all user chats
 */
export async function loadAllChats() {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const snapshot = await database.ref(`users/${user.uid}/chats`)
            .orderByChild('updatedAt')
            .limitToLast(50)
            .once('value');

        const chats = [];
        snapshot.forEach(child => {
            chats.unshift({
                id: child.key,
                ...child.val()
            });
        });

        console.log('✅ Loaded chats:', chats.length);
        return chats;
    } catch (error) {
        console.error('❌ Error loading chats:', error);
        return [];
    }
}

/**
 * Load specific chat by ID
 */
export async function loadChatById(chatId) {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        const snapshot = await database.ref(`users/${user.uid}/chats/${chatId}`).once('value');
        const chat = snapshot.val();
        
        if (chat) {
            console.log('✅ Chat loaded:', chatId);
            return { id: chatId, ...chat };
        }
        
        console.warn('⚠️ Chat not found:', chatId);
        return null;
    } catch (error) {
        console.error('❌ Error loading chat:', error);
        return null;
    }
}

/**
 * Delete chat
 */
export async function deleteChat(chatId) {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    try {
        await database.ref(`users/${user.uid}/chats/${chatId}`).remove();
        console.log('✅ Chat deleted:', chatId);
        return true;
    } catch (error) {
        console.error('❌ Error deleting chat:', error);
        throw error;
    }
}

/**
 * Generate chat title from first message
 */
export function generateChatTitle(message) {
    if (!message) return 'New Chat';
    
    // Clean and truncate
    const cleaned = message.replace(/\n/g, ' ').trim();
    return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned;
}

console.log('📦 Chat Manager module loaded');
