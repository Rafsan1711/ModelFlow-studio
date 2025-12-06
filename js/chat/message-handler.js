/**
 * ============================================
 * MESSAGE HANDLER (WITH USAGE LIMITS)
 * Send and receive messages with plan limits
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
import { canSendMessage, incrementResponseCount } from '../plans/usage-tracker.js';
import { getUserPlan } from '../plans/plans-config.js';
import { showUpgradeModal, showNewChatModal } from '../ui/modals.js';

let isSending = false;

/**
 * Handle send message
 */
export async function handleSendMessage() {
    if (isSending) return;

    const message = getInputValue();
    if (!message) return;

    // Get user plan
    const userPlanData = window.NexusAI.state.get('userPlanData');
    const userEmail = window.NexusAI.state.get('user')?.email;
    const userPlan = getUserPlan(userEmail, userPlanData);

    // Check if user can send message
    const canSend = await canSendMessage(userPlan);
    
    if (!canSend.allowed) {
        if (canSend.showUpgrade) {
            showUpgradeModal(canSend.reason);
        } else if (canSend.showNewChat) {
            showNewChatModal(canSend.reason);
        } else {
            alert(canSend.reason);
        }
        return;
    }

    isSending = true;
    disableInput(true);

    try {
        // Show messages container
        showMessages();

        // Get current state
        const state = window.NexusAI.state;
        const currentChatId = state.get('currentChatId');
        const currentMessages = state.get('currentMessages');

        // Determine which model to use
        let modelToUse = userPlan.model;
        if (canSend.useBasicModel) {
            // Fallback to 20B for MAX plan after 2 uses
            modelToUse = 'openai/gpt-oss-20b:novita';
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
        const response = await sendMessageToAI(message, history, modelToUse);

        // Remove typing indicator
        removeTypingIndicator(typingId);

        if (response.success) {
            // Add AI message to UI
            const aiMessage = {
                role: 'assistant',
                content: response.message,
                model: modelToUse,
                timestamp: Date.now()
            };

            renderAIMessage(response.message, modelToUse);
            state.addMessage(aiMessage);

            // Increment response count
            const isAdvanced = modelToUse.includes('120b');
            await incrementResponseCount(isAdvanced);

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
                modelToUse
            );
        }

    } catch (error) {
        console.error('❌ Error sending message:', error);
        removeTypingIndicator('typing-indicator');
        renderAIMessage(
            '❌ **Error**: Something went wrong. Please try again.',
            'error'
        );
    } finally {
        isSending = false;
        disableInput(false);
        focusInput();
    }
}

console.log('📦 Message Handler (with limits) module loaded');
