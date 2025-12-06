/**
 * ============================================
 * MESSAGE HANDLER - WITH MODAL WARNINGS
 * ============================================
 */

import { sendMessageToAI } from '../ai/api-handler.js';
import { renderUserMessage, renderAIMessage, addTypingIndicator, removeTypingIndicator } from './message-renderer.js';
import { 
    getInputValue, 
    clearInput, 
    disableInput, 
    focusInput,
    showMessages,
    updateUsageDisplay
} from './chat-ui.js';
import { createChat, saveChat, generateChatTitle } from './chat-manager.js';
import { navigateToChat } from '../core/router.js';
import { canSendMessage, incrementUsage, getModelForRequest } from '../plans/plan-manager.js';
import { showLimitModal } from '../ui/limit-modal.js';

let isSending = false;

/**
 * Handle send message - WITH MODAL WARNINGS
 */
export async function handleSendMessage() {
    if (isSending) return;

    const message = getInputValue();
    if (!message) return;

    const user = window.NexusAI.state.get('user');
    if (!user) {
        showLimitModal('error', 'Please log in to send messages');
        return;
    }

    // Check if user can send message
    const permission = canSendMessage(user.uid);
    if (!permission.allowed) {
        // Show modal instead of alert
        showLimitModal(permission.reason, permission.message);
        return;
    }

    isSending = true;
    disableInput(true);

    try {
        showMessages();

        const state = window.NexusAI.state;
        const currentChatId = state.get('currentChatId');
        const currentMessages = state.get('currentMessages');
        const isNewChat = !currentChatId || currentMessages.length === 0;

        // Get model based on plan
        const modelToUse = getModelForRequest();

        // Add user message
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: Date.now()
        };
        
        renderUserMessage(message);
        state.addMessage(userMessage);

        clearInput();

        // Show typing indicator
        const typingId = addTypingIndicator();

        // Prepare history
        const history = currentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Send to AI with correct model
        const response = await sendMessageToAI(message, history, modelToUse);

        removeTypingIndicator(typingId);

        if (response.success) {
            // Add AI message
            const aiMessage = {
                role: 'assistant',
                content: response.message,
                model: response.model,
                timestamp: Date.now()
            };

            renderAIMessage(response.message, response.model);
            state.addMessage(aiMessage);

            // Increment usage
            await incrementUsage(user.uid, isNewChat);

            // Update usage display
            updateUsageDisplay();

            // Save chat
            const updatedMessages = state.get('currentMessages');
            
            if (!currentChatId) {
                const title = generateChatTitle(message);
                const newChat = await createChat(title, updatedMessages);
                state.setCurrentChat(newChat.id, updatedMessages);
                navigateToChat(newChat.id);
                
                if (window.NexusAI.reloadSidebar) {
                    window.NexusAI.reloadSidebar();
                }
            } else {
                const title = state.get('chats').find(c => c.id === currentChatId)?.title || 'Chat';
                await saveChat(currentChatId, title, updatedMessages);
            }

        } else {
            renderAIMessage(
                `❌ **Error**: ${response.error}\n\nPlease try again.`,
                modelToUse
            );
        }

    } catch (error) {
        console.error('❌ Error sending message:', error);
        removeTypingIndicator('typing-indicator');
        renderAIMessage(
            '❌ **Error**: Something went wrong. Please try again.',
            'unknown'
        );
    } finally {
        isSending = false;
        disableInput(false);
        focusInput();
    }
}

console.log('📦 Message Handler (Modal) loaded');
