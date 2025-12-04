/**
 * ============================================
 * ENHANCED CHAT UI
 * Main chat interface with animations
 * ============================================
 */

import { handleSendMessage } from './message-handler.js';
import { loadAllChats } from './chat-manager.js';

let messageInput;
let sendBtn;
let messagesContainer;
let emptyState;
let chatTitle;
let charCount;

/**
 * Initialize Chat UI
 */
export async function initChatUI() {
    // Get elements
    messageInput = document.getElementById('message-input');
    sendBtn = document.getElementById('send-btn');
    messagesContainer = document.getElementById('messages-container');
    emptyState = document.getElementById('empty-state');
    chatTitle = document.getElementById('current-chat-title');
    charCount = document.querySelector('.char-count');

    // Setup event listeners
    setupEventListeners();

    // Load chats
    await loadChats();

    // Initialize animations
    initAnimations();

    console.log('✅ Chat UI initialized');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Input changes
    messageInput.addEventListener('input', handleInputChange);
    
    // Send on Enter (without Shift)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) {
                handleSendMessage();
                addSendAnimation();
            }
        }
    });

    // Send button click with animation
    sendBtn.addEventListener('click', () => {
        if (!sendBtn.disabled) {
            handleSendMessage();
            addSendAnimation();
        }
    });

    // Example prompts with animations
    document.querySelectorAll('.example-prompt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prompt = e.currentTarget.dataset.prompt;
            messageInput.value = prompt;
            handleInputChange();
            messageInput.focus();
            
            // Add animation
            e.currentTarget.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.currentTarget.style.transform = '';
            }, 200);
        });
    });

    // Auto-scroll on new messages
    if (messagesContainer) {
        const observer = new MutationObserver(() => {
            smoothScrollToBottom();
        });
        observer.observe(messagesContainer, { childList: true });
    }
}

/**
 * Handle input change with character counter
 */
function handleInputChange() {
    const value = messageInput.value.trim();
    const length = messageInput.value.length;
    const maxLength = parseInt(messageInput.getAttribute('maxlength')) || 4000;
    
    // Update send button
    sendBtn.disabled = value.length === 0;
    
    // Update character count
    if (charCount) {
        charCount.textContent = `${length} / ${maxLength}`;
        
        // Color coding
        charCount.classList.remove('warning', 'danger');
        if (length > maxLength * 0.9) {
            charCount.classList.add('danger');
        } else if (length > maxLength * 0.75) {
            charCount.classList.add('warning');
        }
    }

    // Auto-resize textarea with smooth animation
    messageInput.style.height = 'auto';
    const newHeight = Math.min(messageInput.scrollHeight, 200);
    messageInput.style.height = newHeight + 'px';
    
    // Add typing animation
    if (value.length > 0 && !sendBtn.disabled) {
        sendBtn.classList.add('pulse');
    } else {
        sendBtn.classList.remove('pulse');
    }
}

/**
 * Load chats
 */
async function loadChats() {
    try {
        const chats = await loadAllChats();
        window.NexusAI.state.setChats(chats);
    } catch (error) {
        console.error('❌ Error loading chats:', error);
    }
}

/**
 * Show empty state with animation
 */
export function showEmptyState() {
    messagesContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    chatTitle.textContent = 'New Chat';
    
    // Trigger AOS animations
    if (window.AOS) {
        window.AOS.refresh();
    }
}

/**
 * Show messages with animation
 */
export function showMessages() {
    emptyState.style.display = 'none';
    messagesContainer.style.display = 'flex';
    
    // Smooth fade in
    messagesContainer.style.opacity = '0';
    setTimeout(() => {
        messagesContainer.style.transition = 'opacity 0.3s ease';
        messagesContainer.style.opacity = '1';
    }, 10);
}

/**
 * Clear input with animation
 */
export function clearInput() {
    messageInput.value = '';
    handleInputChange();
    
    // Reset height
    messageInput.style.height = 'auto';
}

/**
 * Focus input
 */
export function focusInput() {
    messageInput.focus();
}

/**
 * Set chat title with animation
 */
export function setChatTitle(title) {
    chatTitle.style.opacity = '0';
    chatTitle.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
        chatTitle.textContent = title;
        chatTitle.style.transition = 'all 0.3s ease';
        chatTitle.style.opacity = '1';
        chatTitle.style.transform = 'translateY(0)';
    }, 150);
}

/**
 * Get input value
 */
export function getInputValue() {
    return messageInput.value.trim();
}

/**
 * Disable input with visual feedback
 */
export function disableInput(disabled = true) {
    messageInput.disabled = disabled;
    sendBtn.disabled = disabled;
    
    if (disabled) {
        messageInput.style.opacity = '0.6';
        sendBtn.style.opacity = '0.6';
    } else {
        messageInput.style.opacity = '1';
        sendBtn.style.opacity = '1';
    }
}

/**
 * Add send button animation
 */
function addSendAnimation() {
    sendBtn.style.transform = 'scale(0.9) rotate(45deg)';
    setTimeout(() => {
        sendBtn.style.transform = '';
    }, 200);
}

/**
 * Smooth scroll to bottom
 */
function smoothScrollToBottom() {
    if (messagesContainer) {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }
}

/**
 * Initialize animations
 */
function initAnimations() {
    // Add ripple effect to buttons
    document.querySelectorAll('.ripple-effect').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Initialize tooltips with Tippy.js
    if (window.tippy) {
        window.tippy('[data-tippy-content]', {
            placement: 'bottom',
            arrow: true,
            animation: 'scale',
            theme: 'custom'
        });
    }

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Parallax effect on scroll
    if (messagesContainer) {
        messagesContainer.addEventListener('scroll', () => {
            const scrolled = messagesContainer.scrollTop;
            const messages = messagesContainer.querySelectorAll('.message');
            
            messages.forEach((message, index) => {
                const speed = 0.1 + (index * 0.01);
                const yPos = -(scrolled * speed);
                message.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    // Add GSAP animations if available
    if (window.gsap) {
        // Animate header on scroll
        window.gsap.to('.chat-header', {
            scrollTrigger: {
                trigger: '.messages-container',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            },
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        });
    }
}

/**
 * Add particle effect (optional, for celebration)
 */
export function addParticleEffect(x, y) {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.animationDelay = (i * 0.1) + 's';
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 3000);
    }
}

/**
 * Show notification (if notifications module is loaded)
 */
export function showNotification(message, type = 'info') {
    // This will be handled by notifications.js module
    if (window.NexusAI && window.NexusAI.showNotification) {
        window.NexusAI.showNotification(message, type);
    }
}

console.log('📦 Enhanced Chat UI module loaded');
