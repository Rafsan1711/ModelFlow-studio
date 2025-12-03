/**
 * ============================================
 * MESSAGE HANDLER
 * Send and receive messages
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
import { navigateToChat } from '../core/router.js';

let isSending = false;

/**
 * Handle send message
 */
export async function handleSendMessage() {
    if (isSending) return;

    const message = getInputValue();
    if (!message) return;

    isSending = true;
    disableInput(true);

    try {
        // Show messages container
        showMessages();

        // Get current state
        const state = window.NexusAI.state;
        const currentChatId = state.get('currentChatId');
        const currentMessages = state.get('currentMessages');
        const selectedModel = state.get('selectedModel');

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
        const response = await sendMessageToAI(message, history, selectedModel);

        // Remove typing indicator
        removeTypingIndicator(typingId);

        if (response.success) {
            // Add AI message to UI
            const aiMessage = {
                role: 'assistant',
                content: response.message,
                model: response.model,
                timestamp: Date.now()
            };

            renderAIMessage(response.message, response.model);
            state.addMessage(aiMessage);

            // Save chat to Firebase
            const updatedMessages = state.get('currentMessages');
            
            if (!currentChatId) {
                // Create new chat
                const title = generateChatTitle(message);
                const newChat = await createChat(title, updatedMessages);
                state.setCurrentChat(newChat.id, updatedMessages);
                
                // Update URL
                navigateToChat(newChat.id);
                
                // Reload sidebar
                if (window.NexusAI.reloadSidebar) {
                    window.NexusAI.reloadSidebar();
                }
            } else {
                // Update existing chat
                const title = state.get('chats').find(c => c.id === currentChatId)?.title || 'Chat';
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
            window.NexusAI.state.get('selectedModel')
        );
    } finally {
        isSending = false;
        disableInput(false);
        focusInput();
    }
}

console.log('📦 Message Handler module loaded');
