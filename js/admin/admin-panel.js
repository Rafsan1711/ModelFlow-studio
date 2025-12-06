/**
 * ============================================
 * ADMIN PANEL LOGIC
 * Manage users, permissions, and requests
 * ============================================
 */

import { auth, database } from '../auth/firebase-config.js';
import { OWNER_EMAIL } from '../../config/plans.js';

// Check if user is admin
auth.onAuthStateChanged(async (user) => {
    if (!user || user.email !== OWNER_EMAIL) {
        window.location.href = '/';
        return;
    }

    await initAdminPanel();
});

/**
 * Initialize admin panel
 */
async function initAdminPanel() {
    console.log('🛠️ Initializing Admin Panel...');

    // Load stats
    await loadStats();

    // Load permission requests
    await loadPermissionRequests();

    // Load users
    await loadUsers();

    // Setup event listeners
    setupEventListeners();

    console.log('✅ Admin Panel initialized');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    document.getElementById('admin-logout').onclick = () => {
        auth.signOut().then(() => window.location.href = '/');
    };

    document.getElementById('refresh-requests').onclick = loadPermissionRequests;

    document.getElementById('user-search').oninput = (e) => {
        filterUsers(e.target.value);
    };
}

/**
 * Load stats
 */
async function loadStats() {
    try {
        // Total users
        const usersSnapshot = await database.ref('users').once('value');
        const users = usersSnapshot.val() || {};
        document.getElementById('total-users').textContent = Object.keys(users).length;

        // Pending requests
        const requestsSnapshot = await database.ref('permissionRequests').once('value');
        const requests = requestsSnapshot.val() || {};
        const pendingCount = Object.values(requests).filter(r => r.status === 'pending').length;
        document.getElementById('pending-requests').textContent = pendingCount;

        // Approved users
        let approvedCount = 0;
        Object.values(users).forEach(user => {
            if (user.plan && user.plan.type !== 'free') {
                approvedCount++;
            }
        });
        document.getElementById('approved-users').textContent = approvedCount;

        // Total chats today
        const today = new Date().toISOString().split('T')[0];
        let totalChats = 0;
        Object.values(users).forEach(user => {
            if (user.usage && user.usage[today]) {
                totalChats += user.usage[today].chatsCreated || 0;
            }
        });
        document.getElementById('total-chats').textContent = totalChats;

    } catch (error) {
        console.error('❌ Error loading stats:', error);
    }
}

/**
 * Load permission requests
 */
async function loadPermissionRequests() {
    try {
        const snapshot = await database.ref('permissionRequests').once('value');
        const requests = snapshot.val() || {};

        const tbody = document.getElementById('requests-table-body');
        tbody.innerHTML = '';

        const requestArray = Object.entries(requests).map(([uid, req]) => ({
            uid,
            ...req
        }));

        // Sort by date (newest first)
        requestArray.sort((a, b) => b.requestedAt - a.requestedAt);

        if (requestArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No requests found</td></tr>';
            return;
        }

        requestArray.forEach(request => {
            const row = createRequestRow(request);
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('❌ Error loading requests:', error);
    }
}

/**
 * Create request table row
 */
function createRequestRow(request) {
    const tr = document.createElement('tr');
    
    const statusClass = request.status === 'pending' ? 'pending' : 
                       request.status === 'approved' ? 'approved' : 'rejected';

    const customLimits = request.customLimits?.responsesPerChat || request.customLimits?.chatsPerDay ?
        `<div class="custom-limits">
            ${request.customLimits.responsesPerChat ? `<span>Responses: ${request.customLimits.responsesPerChat}</span>` : ''}
            ${request.customLimits.chatsPerDay ? `<span>Chats: ${request.customLimits.chatsPerDay}</span>` : ''}
        </div>` : '<span style="color: var(--text-tertiary)">None</span>';

    tr.innerHTML = `
        <td>${request.email}</td>
        <td><span class="plan-badge ${request.requestedPlan}">${request.requestedPlan.toUpperCase()}</span></td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${request.reason}</td>
        <td>${customLimits}</td>
        <td>${new Date(request.requestedAt).toLocaleDateString()}</td>
        <td><span class="status-badge ${statusClass}">${request.status}</span></td>
        <td>
            <div class="table-actions">
                ${request.status === 'pending' ? `
                    <button class="admin-btn success approve-btn" data-uid="${request.uid}" data-plan="${request.requestedPlan}">
                        ✓ Approve
                    </button>
                    <button class="admin-btn danger reject-btn" data-uid="${request.uid}">
                        ✕ Reject
                    </button>
                ` : request.status === 'approved' ? `
                    <button class="admin-btn warning revoke-btn" data-uid="${request.uid}">
                        Revoke
                    </button>
                ` : '<span style="color: var(--text-tertiary)">—</span>'}
            </div>
        </td>
    `;

    // Approve button
    const approveBtn = tr.querySelector('.approve-btn');
    if (approveBtn) {
        approveBtn.onclick = () => approveRequest(request);
    }

    // Reject button
    const rejectBtn = tr.querySelector('.reject-btn');
    if (rejectBtn) {
        rejectBtn.onclick = () => rejectRequest(request.uid);
    }

    // Revoke button
    const revokeBtn = tr.querySelector('.revoke-btn');
    if (revokeBtn) {
        revokeBtn.onclick = () => revokeAccess(request.uid);
    }

    return tr;
}

/**
 * Approve request
 */
async function approveRequest(request) {
    if (!confirm(`Approve ${request.email} for ${request.requestedPlan.toUpperCase()} plan?`)) {
        return;
    }

    try {
        // Update user plan
        const planData = {
            type: request.requestedPlan,
            approvedAt: Date.now(),
            approvedBy: auth.currentUser.email
        };

        // Add custom limits if requested
        if (request.customLimits?.responsesPerChat || request.customLimits?.chatsPerDay) {
            planData.customLimits = {
                responsesPerChat: request.customLimits.responsesPerChat || null,
                chatsPerDay: request.customLimits.chatsPerDay || null,
                approved: true
            };
        }

        await database.ref(`users/${request.uid}/plan`).set(planData);

        // Update request status
        await database.ref(`permissionRequests/${request.uid}/status`).set('approved');
        await database.ref(`permissionRequests/${request.uid}/approvedAt`).set(Date.now());

        alert('✅ Request approved successfully!');
        await loadPermissionRequests();
        await loadStats();

    } catch (error) {
        console.error('❌ Error approving request:', error);
        alert('Failed to approve request');
    }
}

/**
 * Reject request
 */
async function rejectRequest(uid) {
    if (!confirm('Reject this request?')) {
        return;
    }

    try {
        await database.ref(`permissionRequests/${uid}/status`).set('rejected');
        await database.ref(`permissionRequests/${uid}/rejectedAt`).set(Date.now());

        alert('Request rejected');
        await loadPermissionRequests();
        await loadStats();

    } catch (error) {
        console.error('❌ Error rejecting request:', error);
        alert('Failed to reject request');
    }
}

/**
 * Revoke access
 */
async function revokeAccess(uid) {
    if (!confirm('Revoke access and reset to FREE plan?')) {
        return;
    }

    try {
        // Reset to free plan
        await database.ref(`users/${uid}/plan`).set({
            type: 'free',
            revokedAt: Date.now(),
            revokedBy: auth.currentUser.email
        });

        // Update request status
        await database.ref(`permissionRequests/${uid}/status`).set('revoked');

        alert('Access revoked');
        await loadPermissionRequests();
        await loadStats();

    } catch (error) {
        console.error('❌ Error revoking access:', error);
        alert('Failed to revoke access');
    }
}

/**
 * Load users
 */
async function loadUsers() {
    try {
        const snapshot = await database.ref('users').once('value');
        const users = snapshot.val() || {};

        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        const today = new Date().toISOString().split('T')[0];

        Object.entries(users).forEach(([uid, user]) => {
            const tr = document.createElement('tr');
            
            const plan = user.plan?.type || 'free';
            const chatsToday = user.usage?.[today]?.chatsCreated || 0;
            const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';

            tr.innerHTML = `
                <td>${user.email || 'N/A'}</td>
                <td><span class="plan-badge ${plan}">${plan.toUpperCase()}</span></td>
                <td>${chatsToday}</td>
                <td>${joinedDate}</td>
                <td>
                    <div class="table-actions">
                        <button class="admin-btn warning change-plan-btn" data-uid="${uid}" data-email="${user.email}">
                            Change Plan
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Setup change plan buttons
        document.querySelectorAll('.change-plan-btn').forEach(btn => {
            btn.onclick = () => showChangePlanModal(btn.dataset.uid, btn.dataset.email);
        });

    } catch (error) {
        console.error('❌ Error loading users:', error);
    }
}

/**
 * Show change plan modal
 */
function showChangePlanModal(uid, email) {
    const modal = document.getElementById('approval-modal');
    const body = document.getElementById('approval-modal-body');

    body.innerHTML = `
        <h4>Change Plan for: ${email}</h4>
        <form id="change-plan-form">
            <div class="form-group">
                <label>Plan</label>
                <select id="new-plan" required>
                    <option value="free">FREE</option>
                    <option value="pro">PRO</option>
                    <option value="max">MAX</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Custom Responses per Chat (optional)</label>
                <input type="number" id="new-responses" min="1" max="100">
            </div>
            
            <div class="form-group">
                <label>Custom Chats per Day (optional)</label>
                <input type="number" id="new-chats" min="1" max="50">
            </div>
            
            <button type="submit" class="admin-btn primary">Update Plan</button>
        </form>
    `;

    modal.classList.add('active');

    modal.querySelector('.close-modal-btn').onclick = () => {
        modal.classList.remove('active');
    };

    document.getElementById('change-plan-form').onsubmit = async (e) => {
        e.preventDefault();
        await updateUserPlan(uid, modal);
    };
}

/**
 * Update user plan
 */
async function updateUserPlan(uid, modal) {
    const newPlan = document.getElementById('new-plan').value;
    const newResponses = document.getElementById('new-responses').value;
    const newChats = document.getElementById('new-chats').value;

    try {
        const planData = {
            type: newPlan,
            updatedAt: Date.now(),
            updatedBy: auth.currentUser.email
        };

        if (newResponses || newChats) {
            planData.customLimits = {
                responsesPerChat: newResponses ? parseInt(newResponses) : null,
                chatsPerDay: newChats ? parseInt(newChats) : null,
                approved: true
            };
        }

        await database.ref(`users/${uid}/plan`).set(planData);

        alert('✅ Plan updated successfully!');
        modal.classList.remove('active');
        await loadUsers();
        await loadStats();

    } catch (error) {
        console.error('❌ Error updating plan:', error);
        alert('Failed to update plan');
    }
}

/**
 * Filter users
 */
function filterUsers(searchTerm) {
    const rows = document.querySelectorAll('#users-table-body tr');
    const term = searchTerm.toLowerCase();

    rows.forEach(row => {
        const email = row.children[0]?.textContent.toLowerCase() || '';
        row.style.display = email.includes(term) ? '' : 'none';
    });
}

console.log('🛠️ Admin Panel loaded');
