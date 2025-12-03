/**
 * ============================================
 * DATE FORMATTER
 * Format timestamps for display
 * ============================================
 */

/**
 * Format timestamp to relative time
 */
export function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    // Less than 1 minute
    if (diff < 60000) {
        return 'Just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
    }

    // More than 7 days - show date
    const date = new Date(timestamp);
    return date.toLocaleDateString();
}

/**
 * Format timestamp to full date
 */
export function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

/**
 * Format timestamp to time only
 */
export function formatTimeOnly(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

console.log('📦 Date Formatter module loaded');
