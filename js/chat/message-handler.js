/**
 * ============================================
 * MESSAGE HANDLER - FIXED WITH USAGE LIMITS
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
import { canSendMessage, incrementResponseCount, getUserPlan } from '../utils/usage-tracker.js';
import { showPlanUpgradeModal } from '../ui/plan-upgrade.js';

let isSending = false;

/**
 * Handle send message - WITH USAGE CHECKS
 */
export async function handleSendMessage() {
    if (isSending) return;

    const message = getInputValue();
    if (!message) return;

    // Check if user can send message
    const state = window.NexusAI.state;
    const currentChatId = state.get('currentChatId');
    
    if (currentChatId) {
        const canSend = await canSendMessage(currentChatId);
        if (!canSend.allowed) {
            alert(`❌ ${canSend.reason}\n\nUpgrade your plan to continue.`);
            showPlanUpgradeModal();
            return;
        }
    }

    isSending = true;
    disableInput(true);

    try {
        // Show messages container
        showMessages();

        // Get current state
        const currentMessages = state.get('currentMessages');
        const plan = await getUserPlan();

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

        // Send to AI with user's plan model
        const response = await sendMessageToAI(message, history, plan.model);

        // Remove typing indicator
        removeTypingIndicator(typingId);

        if (response.success) {
            // Increment response count
            if (currentChatId) {
                await incrementResponseCount(currentChatId);
            }

            // Add AI message to UI
            const aiMessage = {
                role: 'assistant',
                content: response.message,
                model: plan.modelDisplayName,
                timestamp: Date.now()
            };

            renderAIMessage(response.message, plan.modelDisplayName);
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
                plan.modelDisplayName
            );
        }

    } catch (error) {
        console.error('❌ Error sending message:', error);
        removeTypingIndicator('typing-indicator');
        const plan = await getUserPlan();
        renderAIMessage(
            '❌ **Error**: Something went wrong. Please try again.',
            plan.modelDisplayName
        );
    } finally {
        isSending = false;
        disableInput(false);
        focusInput();
        
        // Scroll to bottom smoothly
        setTimeout(() => {
            const container = document.getElementById('messages-container');
            if (container) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }
}

console.log('📦 Message Handler (FIXED) loaded');
