/**
 * ============================================
 * PERMISSION MANAGER
 * Handle Pro and Max plan requests
 * ============================================
 */

import { database, auth } from '../auth/firebase-config.js';

/**
 * Request plan upgrade
 */
export async function requestPlanUpgrade(targetPlan, reason = '') {
    const user = auth.currentUser;
    if (!user) throw new Error('Not logged in');

    const requestId = `req_${Date.now()}_${user.uid.substr(0, 6)}`;
    const requestData = {
        id: requestId,
        userId: user.uid,
        userEmail: user.email,
        currentPlan: window.NexusAI.state.get('userPlan')?.id || 'free',
        requestedPlan: targetPlan,
        reason: reason,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    try {
        // Save to pending requests
        await database.ref(`permissionRequests/${requestId}`).set(requestData);
        
        // Save to user's requests
        await database.ref(`users/${user.uid}/planRequests/${requestId}`).set({
            plan: targetPlan,
            status: 'pending',
            createdAt: Date.now()
        });

        console.log('✅ Permission request sent:', requestId);
        return { success: true, requestId };
    } catch (error) {
        console.error('❌ Error requesting permission:', error);
        throw error;
    }
}

/**
 * Get user's permission requests
 */
export async function getUserRequests() {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const snapshot = await database.ref(`users/${user.uid}/planRequests`)
            .orderByChild('createdAt')
            .once('value');

        const requests = [];
        snapshot.forEach(child => {
            requests.unshift({
                id: child.key,
                ...child.val()
            });
        });

        return requests;
    } catch (error) {
        console.error('❌ Error getting requests:', error);
        return [];
    }
}

/**
 * Check if user has pending request for plan
 */
export async function hasPendingRequest(planId) {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        const snapshot = await database.ref(`users/${user.uid}/planRequests`)
            .orderByChild('status')
            .equalTo('pending')
            .once('value');

        let hasPending = false;
        snapshot.forEach(child => {
            const data = child.val();
            if (data.plan === planId) {
                hasPending = true;
            }
        });

        return hasPending;
    } catch (error) {
        console.error('❌ Error checking pending request:', error);
        return false;
    }
}

/**
 * Get all permission requests (Admin only)
 */
export async function getAllPermissionRequests() {
    try {
        const snapshot = await database.ref('permissionRequests')
            .orderByChild('createdAt')
            .once('value');

        const requests = [];
        snapshot.forEach(child => {
            requests.unshift({
                id: child.key,
                ...child.val()
            });
        });

        return requests;
    } catch (error) {
        console.error('❌ Error getting all requests:', error);
        return [];
    }
}

/**
 * Approve permission request (Admin only)
 */
export async function approveRequest(requestId, customLimits = null) {
    try {
        const requestRef = database.ref(`permissionRequests/${requestId}`);
        const snapshot = await requestRef.once('value');
        const request = snapshot.val();

        if (!request) throw new Error('Request not found');

        // Update request status
        await requestRef.update({
            status: 'approved',
            updatedAt: Date.now(),
            approvedBy: auth.currentUser.email
        });

        // Update user's plan
        const userPlanData = {
            plan: request.requestedPlan,
            approvedAt: Date.now(),
            approvedBy: auth.currentUser.email
        };

        // Add custom limits if provided
        if (customLimits) {
            userPlanData.customLimits = customLimits;
        }

        await database.ref(`users/${request.userId}/planData`).set(userPlanData);

        // Update user's request status
        await database.ref(`users/${request.userId}/planRequests/${requestId}`).update({
            status: 'approved',
            updatedAt: Date.now()
        });

        console.log('✅ Request approved:', requestId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error approving request:', error);
        throw error;
    }
}

/**
 * Deny permission request (Admin only)
 */
export async function denyRequest(requestId, reason = '') {
    try {
        const requestRef = database.ref(`permissionRequests/${requestId}`);
        const snapshot = await requestRef.once('value');
        const request = snapshot.val();

        if (!request) throw new Error('Request not found');

        // Update request status
        await requestRef.update({
            status: 'denied',
            updatedAt: Date.now(),
            deniedBy: auth.currentUser.email,
            denyReason: reason
        });

        // Update user's request status
        await database.ref(`users/${request.userId}/planRequests/${requestId}`).update({
            status: 'denied',
            updatedAt: Date.now(),
            reason: reason
        });

        console.log('✅ Request denied:', requestId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error denying request:', error);
        throw error;
    }
}

/**
 * Get user's current plan from database
 */
export async function getUserPlanData() {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        const snapshot = await database.ref(`users/${user.uid}/planData`).once('value');
        return snapshot.val();
    } catch (error) {
        console.error('❌ Error getting plan data:', error);
        return null;
    }
}

console.log('📦 Permission Manager module loaded');
