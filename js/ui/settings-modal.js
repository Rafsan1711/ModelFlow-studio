/**
 * ============================================
 * SETTINGS MODAL
 * User settings and preferences
 * ============================================
 */

import { auth } from '../auth/firebase-config.js';

let settingsModal;
let closeSettingsBtn;
let themeSelect;
let defaultModelSelect;
let userEmailDisplay;

/**
 * Open settings modal
 */
export function openSettingsModal() {
    if (!settingsModal) {
        initSettingsModal();
    }

    // Load current settings
    loadSettings();

    // Show modal
    settingsModal.classList.add('active');
}

/**
 * Initialize settings modal
 */
function initSettingsModal() {
    settingsModal = document.getElementById('settings-modal');
    closeSettingsBtn = document.getElementById('close-settings-btn');
    themeSelect = document.getElementById('theme-select');
    defaultModelSelect = document.getElementById('default-model-select');
    userEmailDisplay = document.getElementById('user-email');

    // Setup event listeners
    closeSettingsBtn.addEventListener('click', closeSettingsModal);
    
    // Close on overlay click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
    });

    // Save on change
    themeSelect.addEventListener('change', saveSettings);
    defaultModelSelect.addEventListener('change', saveSettings);

    console.log('✅ Settings modal initialized');
}

/**
 * Close settings modal
 */
function closeSettingsModal() {
    settingsModal.classList.remove('active');
}

/**
 * Load settings
 */
function loadSettings() {
    const state = window.NexusAI.state;
    const settings = state.get('settings');

    // Load user email
    const user = auth.currentUser;
    if (user) {
        userEmailDisplay.textContent = user.email;
    }

    // Load theme
    themeSelect.value = settings.theme || 'dark';

    // Load default model
    defaultModelSelect.value = settings.defaultModel || '';
}

/**
 * Save settings
 */
function saveSettings() {
    const settings = {
        theme: themeSelect.value,
        defaultModel: defaultModelSelect.value
    };

    // Update state
    window.NexusAI.state.setSettings(settings);

    // Apply theme (if implemented)
    if (settings.theme === 'light') {
        // document.body.setAttribute('data-theme', 'light');
        console.log('💡 Light theme coming soon');
    } else {
        // document.body.setAttribute('data-theme', 'dark');
    }

    // Update model selector visibility
    if (settings.defaultModel) {
        window.NexusAI.state.setModel(settings.defaultModel);
        // You can hide model selector if default is set
        // import('./model-selector.js').then(m => m.toggleModelSelector(false));
    }

    console.log('✅ Settings saved:', settings);
}

console.log('📦 Settings Modal module loaded');
