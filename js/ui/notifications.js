/**
 * ============================================
 * NOTIFICATIONS
 * Toast notifications for user feedback
 * ============================================
 */

/**
 * Show notification
 */
export function showNotification(message, type = 'info', duration = 3000) {
    const notification = createNotification(message, type);
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Hide and remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

/**
 * Create notification element
 */
function createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const colors = {
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)',
        info: 'var(--info)'
    };

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: ${colors[type] || colors.info};
        color: white;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        font-weight: 600;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 10000;
        max-width: 400px;
    `;

    notification.innerHTML = `
        <span style="font-size: 18px;">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;

    notification.classList.add('notification');

    return notification;
}

/**
 * Show success notification
 */
export function showSuccess(message, duration) {
    showNotification(message, 'success', duration);
}

/**
 * Show error notification
 */
export function showError(message, duration) {
    showNotification(message, 'error', duration);
}

/**
 * Show warning notification
 */
export function showWarning(message, duration) {
    showNotification(message, 'warning', duration);
}

/**
 * Show info notification
 */
export function showInfo(message, duration) {
    showNotification(message, 'info', duration);
}

// Add show class style
const style = document.createElement('style');
style.textContent = `
    .notification.show {
        transform: translateX(0) !important;
    }
`;
document.head.appendChild(style);

console.log('📦 Notifications module loaded');
