/**
 * Admin Panel Main
 */
import { database } from '../../js/auth/firebase-config.js';

// Load requests
async function loadRequests() {
    const requestsRef = database.ref('planRequests');
    const snapshot = await requestsRef.once('value');
    const requests = [];
    
    snapshot.forEach(child => {
        requests.push({
            id: child.key,
            ...child.val()
        });
    });
    
    renderRequests(requests);
}

// Approve request
async function approveRequest(userId, requestedPlan) {
    await database.ref(`users/${userId}/plan`).set({
        planId: requestedPlan,
        approvedAt: Date.now(),
        approvedBy: 'owner'
    });
    
    await database.ref(`planRequests/${userId}/status`).set('approved');
    
    showSuccess('Plan upgraded successfully!');
    loadRequests();
}

// Deny request
async function denyRequest(userId, reason) {
    await database.ref(`planRequests/${userId}`).update({
        status: 'denied',
        deniedAt: Date.now(),
        deniedReason: reason
    });
    
    showSuccess('Request denied');
    loadRequests();
}

window.approveRequest = approveRequest;
window.denyRequest = denyRequest;
window.loadRequests = loadRequests;
window.refreshData = () => {
    loadRequests();
    loadUsers();
    loadStats();
};

loadRequests();
