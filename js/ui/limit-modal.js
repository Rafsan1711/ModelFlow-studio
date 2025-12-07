/**
 * ============================================
 * LIMIT MODAL - SIMPLE VERSION
 * ============================================
 */

let limitModal;

/**
 * Show limit modal
 */
export function showLimitModal(type, message) {
    if (!limitModal) {
        createLimitModal();
    }

    const modalBody = limitModal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div class="limit-modal-content">
            <div class="limit-icon">⚠️</div>
            <h3 class="limit-title">Limit Reached</h3>
            <p class="limit-message">${message}</p>
            <button class="limit-btn upgrade-btn" onclick="window.closeLimitModal()">OK</button>
        </div>
    `;
    
    limitModal.classList.add('active');
}

/**
 * Create limit modal
 */
function createLimitModal() {
    limitModal = document.createElement('div');
    limitModal.className = 'modal limit-modal';
    limitModal.id = 'limit-modal';
    
    limitModal.innerHTML = `
        <div class="modal-content glass-effect">
            <button class="close-modal-btn" onclick="window.closeLimitModal()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
            <div class="modal-body"></div>
        </div>
    `;
    
    document.body.appendChild(limitModal);
    
    limitModal.addEventListener('click', (e) => {
        if (e.target === limitModal) {
            closeLimitModal();
        }
    });
}

/**
 * Close limit modal
 */
window.closeLimitModal = function() {
    if (limitModal) {
        limitModal.classList.remove('active');
    }
};

console.log('📦 Limit Modal loaded');
