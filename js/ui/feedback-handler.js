/**
 * ============================================
 * FEEDBACK HANDLER
 * Handle feedback and report submissions
 * ============================================
 */

import { database, auth } from '../auth/firebase-config.js';

/**
 * Handle feedback (thumbs up/down)
 */
export async function handleFeedback(messageId, type) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const feedbackData = {
            messageId: messageId,
            userId: user.uid,
            userEmail: user.email,
            type: type, // 'positive' or 'negative'
            chatId: window.ModelFlow.state.get('currentChatId'),
            timestamp: Date.now()
        };

        // Save to Firebase
        await database.ref('feedback').push(feedbackData);
        
        console.log('✅ Feedback submitted:', type);
        return { success: true };
    } catch (error) {
        console.error('❌ Error submitting feedback:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Handle report
 */
export async function handleReport(messageId, reason) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const reportData = {
            messageId: messageId,
            userId: user.uid,
            userEmail: user.email,
            reason: reason,
            chatId: window.ModelFlow.state.get('currentChatId'),
            status: 'pending',
            timestamp: Date.now()
        };

        // Save to Firebase
        await database.ref('reports').push(reportData);
        
        console.log('✅ Report submitted');
        return { success: true };
    } catch (error) {
        console.error('❌ Error submitting report:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all feedback (Admin only)
 */
export async function getAllFeedback() {
    try {
        const snapshot = await database.ref('feedback')
            .orderByChild('timestamp')
            .limitToLast(100)
            .once('value');
        
        const feedback = [];
        snapshot.forEach(child => {
            feedback.unshift({
                id: child.key,
                ...child.val()
            });
        });
        
        return feedback;
    } catch (error) {
        console.error('❌ Error getting feedback:', error);
        return [];
    }
}

/**
 * Get all reports (Admin only)
 */
export async function getAllReports() {
    try {
        const snapshot = await database.ref('reports')
            .orderByChild('status')
            .equalTo('pending')
            .once('value');
        
        const reports = [];
        snapshot.forEach(child => {
            reports.push({
                id: child.key,
                ...child.val()
            });
        });
        
        return reports;
    } catch (error) {
        console.error('❌ Error getting reports:', error);
        return [];
    }
}

/**
 * Update report status (Admin only)
 */
export async function updateReportStatus(reportId, status) {
    try {
        await database.ref(`reports/${reportId}`).update({
            status: status,
            resolvedAt: Date.now()
        });
        
        console.log('✅ Report status updated:', reportId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error updating report:', error);
        return { success: false, error: error.message };
    }
}

console.log('📦 Feedback Handler module loaded');
