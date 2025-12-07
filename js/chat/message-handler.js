/**
 * ============================================
 * MESSAGE HANDLER
 * Handle sending and receiving messages
 * ============================================
 */

import { sendMessageToAI } from '../ai/api-handler.js';
import { renderUserMessage, renderAIMessage, addTypingIndicator, removeTypingIndicator } from './message-renderer.js';
import { 
    getInputValue, 
    clearInput, 
    disableInput, 
    focusInput,
    showMessages 
} from './chat-ui.js';
import { createChat, saveChat, generateChatTitle } from './chat-manager.js';
import { decrementResponses, decrementChats } from '../core/plan-manager.js';

let isSending = false;

/**
 * Handle send message
 */
export async function handleSendMessage() {
    if (isSending) return;

    const message = getInputValue();
    if (!message) return;

    // Check plan limits
    const canSend = window.ModelFlow.state.canSendMessage();
    if (!canSend.allowed) {
        showLimitReachedModal(canSend);
        return;
    }

    isSending = true;
    disableInput(true);

    try {
        // Show messages container
        showMessages();

        // Get current state
        const state = window.ModelFlow.state;
        const currentChatId = state.get('currentChatId');
        const currentMessages = state.get('currentMessages');
        const plan = state.get('plan');
        const selectedModel = plan.model;

        // If new chat, decrement chat count
        if (!currentChatId) {
            const user = state.get('user');
            if (user) {
                await decrementChats(user.uid);
                state.startNewChat();
            }
        }

        // Add user message to UI
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: Date.now()
        };
        
        renderUserMessage(message);
        state.addMessage(userMessage);

        // Clear input
        clearInput();

        // Show typing indicator
        const typingId = addTypingIndicator();

        // Prepare history for API
        const history = currentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Send to AI
        const response = await sendMessageToAI(message, selectedModel, history);

        // Remove typing indicator
        removeTypingIndicator(typingId);

        if (response.success) {
            // Decrement responses
            const user = state.get('user');
            if (user) {
                await decrementResponses(user.uid);
            }

            // Add AI message to UI
            const aiMessage = {
                role: 'assistant',
                content: response.message,
                model: response.model,
                timestamp: Date.now()
            };

            renderAIMessage(response.message, response.model);
            state.addMessage(aiMessage);

            // Update usage indicator
            updateUsageIndicator();

            // Save chat to Firebase
            const updatedMessages = state.get('currentMessages');
            
            if (!currentChatId) {
                // Create new chat
                const title = generateChatTitle(message);
                const newChat = await createChat(title, updatedMessages);
                state.setCurrentChat(newChat.id, updatedMessages);
                
                // Reload sidebar
                if (window.ModelFlow.reloadSidebar) {
                    window.ModelFlow.reloadSidebar();
                }
            } else {
                // Update existing chat
                const chats = state.get('chats');
                const currentChat = chats.find(c => c.id === currentChatId);
                const title = currentChat?.title || 'Chat';
                await saveChat(currentChatId, title, updatedMessages);
            }

        } else {
            // Show error message
            renderAIMessage(
                `❌ **Error**: ${response.error}\n\nPlease try again.`,
                selectedModel
            );
        }

    } catch (error) {
        console.error('❌ Error sending message:', error);
        removeTypingIndicator('typing-indicator');
        renderAIMessage(
            '❌ **Error**: Something went wrong. Please try again.',
            window.ModelFlow.state.get('plan').model
        );
    } finally {
        isSending = false;
        disableInput(false);
        focusInput();
    }
}

/**
 * Update usage indicator
 */
function updateUsageIndicator() {
    const plan = window.ModelFlow.state.get('plan');
    const usageText = document.getElementById('usage-text');
    
    if (usageText) {
        if (window.ModelFlow.state.isOwner()) {
            usageText.textContent = '∞ Unlimited';
        } else {
            usageText.textContent = `${plan.responsesLeft}/${plan.maxResponses} left`;
        }
    }
}

/**
 * Show limit reached modal
 */
function showLimitReachedModal(limitInfo) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    
    let message = '';
    let buttonText = 'Upgrade Plan';
    
    if (limitInfo.limitType === 'chats') {
        message = `You've reached your daily chat limit (${window.ModelFlow.state.get('plan').maxChats} chats per day). Upgrade to continue chatting!`;
    } else {
        message = `You've reached your response limit for this chat (${window.ModelFlow.state.get('plan').maxResponses} responses per chat). Start a new chat or upgrade your plan!`;
    }
    
    modal.innerHTML = `
        <div class="modal-content glass-effect" style="max-width: 500px; animation: scaleUp 0.3s ease;">
            <div class="modal-header">
                <h3 class="gradient-text">⚠️ Limit Reached</h3>
                <button class="close-modal-btn" onclick="this.closest('.modal').remove()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p style="font-size: 16px; line-height: 1.6; color: var(--text-primary); margin-bottom: 24px;">
                    ${message}
                </p>
                <button class="auth-btn primary" onclick="document.getElementById('upgrade-btn').click(); this.closest('.modal').remove();">
                    ${buttonText}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

console.log('📦 Message Handler module loaded');
