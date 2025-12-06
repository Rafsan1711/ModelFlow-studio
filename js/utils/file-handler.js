/**
 * ============================================
 * FILE UPLOAD HANDLER
 * Handle file uploads for messages
 * ============================================
 */

import { getUserPlan } from './usage-tracker.js';

let selectedFile = null;

/**
 * Initialize file upload
 */
export function initFileUpload() {
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const fileInput = document.getElementById('file-input');
    const removeFileBtn = document.getElementById('remove-file-btn');

    fileUploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleFileSelect(file);
        }
    };

    removeFileBtn.onclick = clearSelectedFile;

    console.log('✅ File upload initialized');
}

/**
 * Handle file selection
 */
async function handleFileSelect(file) {
    // Check plan limits
    const plan = await getUserPlan();
    
    if (plan.maxFileSize === 0) {
        alert('❌ File upload is not available on Free plan.\n\nUpgrade to Pro or Max to upload files.');
        return;
    }

    if (file.size > plan.maxFileSize) {
        const maxSizeMB = (plan.maxFileSize / (1024 * 1024)).toFixed(0);
        alert(`❌ File too large!\n\nMax size: ${maxSizeMB}MB\nYour file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
    }

    // Validate file type
    const allowedTypes = [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
        alert('❌ Unsupported file type!\n\nAllowed: TXT, PDF, DOC, DOCX');
        return;
    }

    selectedFile = file;
    showSelectedFile(file);
}

/**
 * Show selected file
 */
function showSelectedFile(file) {
    const display = document.getElementById('selected-file-display');
    const fileName = document.getElementById('file-name');

    fileName.textContent = file.name;
    display.style.display = 'flex';
}

/**
 * Clear selected file
 */
function clearSelectedFile() {
    selectedFile = null;
    const display = document.getElementById('selected-file-display');
    const fileInput = document.getElementById('file-input');
    
    display.style.display = 'none';
    fileInput.value = '';
}

/**
 * Get selected file
 */
export function getSelectedFile() {
    return selectedFile;
}

/**
 * Read file content
 */
export async function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            if (file.type === 'text/plain') {
                resolve(e.target.result);
            } else {
                // For PDF and DOC, we'll send base64
                const base64 = e.target.result.split(',')[1];
                resolve(`[File: ${file.name} (${file.type})]\nBase64: ${base64.substring(0, 100)}...`);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));

        if (file.type === 'text/plain') {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Clear after send
 */
export function clearFileAfterSend() {
    clearSelectedFile();
}

console.log('📦 File Handler loaded');
