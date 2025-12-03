/**
 * ============================================
 * MODEL SELECTOR
 * Select AI model for chat
 * ============================================
 */

import { getAllModels } from '../ai/models-config.js';

let modelButtons;
let modelSelector;

/**
 * Initialize model selector
 */
export function initModelSelector() {
    modelSelector = document.getElementById('model-selector');
    modelButtons = document.querySelectorAll('.model-btn');

    if (modelButtons.length === 0) {
        console.warn('⚠️ No model buttons found');
        return;
    }

    // Setup event listeners
    modelButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modelId = btn.dataset.model;
            selectModel(modelId);
        });
    });

    // Set default model (GPT-OSS 20B)
    const defaultModel = window.NexusAI.state.get('selectedModel') || 'gpt-oss-20b';
    selectModel(defaultModel);

    console.log('✅ Model selector initialized');
}

/**
 * Select model
 */
function selectModel(modelId) {
    // Update state
    window.NexusAI.state.setModel(modelId);

    // Update UI
    modelButtons.forEach(btn => {
        if (btn.dataset.model === modelId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    console.log('✅ Model selected:', modelId);
}

/**
 * Get current model
 */
export function getCurrentModel() {
    return window.NexusAI.state.get('selectedModel');
}

/**
 * Show/hide model selector
 */
export function toggleModelSelector(show) {
    if (modelSelector) {
        modelSelector.style.display = show ? 'flex' : 'none';
    }
}

console.log('📦 Model Selector module loaded');
