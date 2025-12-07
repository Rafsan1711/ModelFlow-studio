/**
 * ============================================
 * MESSAGE HANDLER - 100% COMPLETE
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

let isSending = false;

/**
 * Handle send message
 */
export async function handleSendMessage() {
    if (isSending) return;

    const message = getInputValue();
    if (!message) return;

    const user = window.NexusAI.state.get('user');
    if (!user) {
        alert('Please log in to send messages');
        return;
    }

    // Check if plan manager is loaded
    let canSend = true;
    try {
        const { canSendMessage, incrementUsage, getModelForRequest } = await import('../plans/plan-manager.js');
        
        const permission = canSendMessage(user.uid);
        if (!permission.allowed) {
            // Show modal if available
            try {
                const { showLimitModal } = await import('../ui/limit-modal.js');
                showLimitModal(permission.reason, permission.message);
            } catch (e) {
                alert(permission.message);
            }
            return;
        }
    } catch (err) {
        console.warn('Plan manager not loaded, proceeding without limits');
    }

    isSending = true;
    disableInput(true);

    try {
        showMessages();

        const state = window.NexusAI.state;
        const currentChatId = state.get('currentChatId');
        const currentMessages = state.get('currentMessages');
        const isNewChat = !currentChatId || currentMessages.length === 0;

        // Get model
        let modelToUse = 'openai/gpt-oss-20b:novita';
        try {
            const { getModelForRequest } = await import('../plans/plan-manager.js');
            modelToUse = getModelForRequest();
        } catch (err) {
            console.warn('Using default model');
        }

        // Add user message
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: Date.now()
        };
        
        renderUserMessage(message);
        state.addMessage(userMessage);

        clearInput();

        // Show typing
        const typingId = addTypingIndicator();

        // Prepare history
        const history = currentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Send to AI
        const response = await sendMessageToAI(message, history, modelToUse);

        removeTypingIndicator(typingId);

        if (response.success) {
            const aiMessage = {
                role: 'assistant',
                content: response.message,
                model: response.model,
                timestamp: Date.now()
            };

            renderAIMessage(response.message, response.model);
            state.addMessage(aiMessage);

            // Increment usage if available
            try {
                const { incrementUsage } = await import('../plans/plan-manager.js');
                await incrementUsage(user.uid, isNewChat);
                updateUsageDisplay();
            } catch (err) {
                console.warn('Usage tracking not available');
            }

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

console.log('📦 Message Handler loaded');
