/**
 * ============================================
 * STATE MANAGER
 * Global state management with plan limits
 * ============================================
 */

export class StateManager {
    constructor() {
        this.state = {
            currentChatId: null,
            currentMessages: [],
            selectedModel: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai',
            chats: [],
            user: null,
            plan: {
                type: 'free', // 'free', 'pro', 'max'
                responsesLeft: 5,
                chatsLeft: 2,
                maxResponses: 5,
                maxChats: 2,
                model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai'
            },
            usage: {
                responses: 0,
                chats: 0,
                lastReset: Date.now()
            }
        };

        this.listeners = new Map();
        this.loadFromLocalStorage();
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

        // Save to localStorage
        this.saveToLocalStorage();

        // Notify listeners
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                callback(value, oldValue);
            });
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

        return () => {
            this.listeners.get(key).delete(callback);
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
     * Add message
     */
    addMessage(message) {
        const messages = [...this.state.currentMessages, message];
        this.set('currentMessages', messages);
        
        // Update usage
        if (message.role === 'assistant') {
            this.incrementResponses();
        }
    }

    /**
     * Set plan
     */
    setPlan(plan) {
        this.set('plan', { ...this.state.plan, ...plan });
    }

    /**
     * Check if can send message
     */
    canSendMessage() {
        const plan = this.state.plan;
        
        // Owner has infinite usage
        if (this.isOwner()) {
            return { allowed: true };
        }

        // Check chat limit
        if (plan.chatsLeft <= 0) {
            return {
                allowed: false,
                reason: 'Daily chat limit reached',
                limitType: 'chats'
            };
        }

        // Check response limit
        if (plan.responsesLeft <= 0) {
            return {
                allowed: false,
                reason: 'Response limit reached for this chat',
                limitType: 'responses'
            };
        }

        return { allowed: true };
    }

    /**
     * Increment responses
     */
    incrementResponses() {
        const plan = this.state.plan;
        if (!this.isOwner()) {
            this.setPlan({
                responsesLeft: Math.max(0, plan.responsesLeft - 1)
            });
        }
    }

    /**
     * Start new chat
     */
    startNewChat() {
        const plan = this.state.plan;
        if (!this.isOwner() && plan.chatsLeft > 0) {
            this.setPlan({
                chatsLeft: plan.chatsLeft - 1,
                responsesLeft: plan.maxResponses
            });
        }
    }

    /**
     * Is owner
     */
    isOwner() {
        return this.state.user?.email === '123@email.com';
    }

    /**
     * Reset daily limits
     */
    resetDailyLimits() {
        const now = Date.now();
        const lastReset = this.state.usage.lastReset;
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (now - lastReset >= oneDayMs) {
            const plan = this.state.plan;
            this.setPlan({
                responsesLeft: plan.maxResponses,
                chatsLeft: plan.maxChats
            });
            this.set('usage', {
                responses: 0,
                chats: 0,
                lastReset: now
            });
        }
    }

    /**
     * Load from localStorage
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('modelflow_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }

    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('modelflow_state', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    /**
     * Set user
     */
    setUser(user) {
        this.set('user', user);
        
        // Load user's plan from Firebase
        if (user) {
            this.loadUserPlan(user.uid);
        }
    }

    /**
     * Load user plan from Firebase
     */
    async loadUserPlan(userId) {
        try {
            const { database } = await import('../auth/firebase-config.js');
            const snapshot = await database.ref(`users/${userId}/plan`).once('value');
            const plan = snapshot.val();
            
            if (plan) {
                this.setPlan(plan);
            }
        } catch (error) {
            console.error('Error loading plan:', error);
        }
    }

    /**
     * Reset state
     */
    reset() {
        this.state = {
            currentChatId: null,
            currentMessages: [],
            selectedModel: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai',
            chats: [],
            user: null,
            plan: {
                type: 'free',
                responsesLeft: 5,
                chatsLeft: 2,
                maxResponses: 5,
                maxChats: 2,
                model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B:featherless-ai'
            },
            usage: {
                responses: 0,
                chats: 0,
                lastReset: Date.now()
            }
        };
        this.saveToLocalStorage();
    }
}

console.log('📦 State Manager module loaded');
