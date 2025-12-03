/**
 * ============================================
 * STATE MANAGER
 * Global state management for the app
 * ============================================
 */

export class StateManager {
    constructor() {
        this.state = {
            currentChatId: null,
            currentMessages: [],
            selectedModel: 'gpt-oss-20b', // Default model
            chats: [],
            settings: {
                defaultModel: 'gpt-oss-20b',
                theme: 'dark'
            },
            user: null
        };

        this.listeners = new Map();
    }

    /**
     * Get state value
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Set state value
     */
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;

        // Notify listeners
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                callback(value, oldValue);
            });
        }
    }

    /**
     * Update nested state
     */
    update(key, updates) {
        if (typeof this.state[key] === 'object') {
            this.state[key] = { ...this.state[key], ...updates };
            
            // Notify listeners
            if (this.listeners.has(key)) {
                this.listeners.get(key).forEach(callback => {
                    callback(this.state[key]);
                });
            }
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(key).delete(callback);
        };
    }

    /**
     * Get all state
     */
    getAll() {
        return { ...this.state };
    }

    /**
     * Reset state
     */
    reset() {
        this.state = {
            currentChatId: null,
            currentMessages: [],
            selectedModel: 'gpt-oss-20b',
            chats: [],
            settings: {
                defaultModel: 'gpt-oss-20b',
                theme: 'dark'
            },
            user: null
        };
    }

    /**
     * Set current chat
     */
    setCurrentChat(chatId, messages = []) {
        this.set('currentChatId', chatId);
        this.set('currentMessages', messages);
    }

    /**
     * Add message to current chat
     */
    addMessage(message) {
        const messages = [...this.state.currentMessages, message];
        this.set('currentMessages', messages);
    }

    /**
     * Update message
     */
    updateMessage(index, updates) {
        const messages = [...this.state.currentMessages];
        messages[index] = { ...messages[index], ...updates };
        this.set('currentMessages', messages);
    }

    /**
     * Set chats list
     */
    setChats(chats) {
        this.set('chats', chats);
    }

    /**
     * Add new chat
     */
    addChat(chat) {
        const chats = [chat, ...this.state.chats];
        this.set('chats', chats);
    }

    /**
     * Update chat
     */
    updateChat(chatId, updates) {
        const chats = this.state.chats.map(chat =>
            chat.id === chatId ? { ...chat, ...updates } : chat
        );
        this.set('chats', chats);
    }

    /**
     * Delete chat
     */
    deleteChat(chatId) {
        const chats = this.state.chats.filter(chat => chat.id !== chatId);
        this.set('chats', chats);
    }

    /**
     * Set selected model
     */
    setModel(model) {
        this.set('selectedModel', model);
    }

    /**
     * Set user
     */
    setUser(user) {
        this.set('user', user);
    }

    /**
     * Set settings
     */
    setSettings(settings) {
        this.set('settings', { ...this.state.settings, ...settings });
    }
}

console.log('📦 State Manager module loaded');
