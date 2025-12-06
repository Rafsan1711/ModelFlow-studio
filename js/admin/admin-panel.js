/**
 * ============================================
 * ADMIN PANEL
 * Manage users and permissions
 * ============================================
 */

import { auth, database } from '../auth/firebase-config.js';
import { getAllPermissionRequests, approveRequest, denyRequest } from '../plans/permission-manager.js';
import { OWNER_EMAIL, PLANS } from '../plans/plans-config.js';

let currentRequests = [];
let currentFilter = 'all';
let currentRequestForAction = null;

/**
 * Initialize admin panel
 */
async function initAdminPanel() {
    console.log('🚀 Initializing admin panel...');

    // Check authentication
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user && user.email === OWNER_EMAIL) {
            console.log('✅ Admin authenticated:', user.email);
            showAdminPanel();
            await loadAdminData();
        } else {
            console.log('❌ Unauthorized access attempt');
            showUnauthorized();
        }
    });
}

/**
 * Show admin panel
 */
function showAdminPanel() {
    document.getElementById('unauthorized-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    
    const adminEmail = document.getElementById('admin-email');
    adminEmail.textContent = auth.currentUser.email;

    // Setup event listeners
    setupEventListeners();
}

/**
 * Show unauthorized screen
 */
function showUnauthorized() {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('unauthorized-screen').style.display = 'flex';
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Logout
    document.getElementById('admin-logout-btn').addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            window.location.href = '/';
        });
    });

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            filterRequests();
        });
    });

    // User search
    document.getElementById('user-search').addEventListener('input', (e) => {
        searchUsers(e.target.value);
    });
}

/**
 * Load admin data
 */
async function loadAdminData() {
    await Promise.all([
        loadRequests(),
        loadUsers(),
        loadStats()
    ]);
}

/**
 * Load permission requests
 */
async function loadRequests() {
    try {
        currentRequests = await getAllPermissionRequests();
        renderRequests();
    } catch (error) {
        console.error('❌ Error loading requests:', error);
    }
}

/**
 * Render requests table
 */
function renderRequests() {
    const tbody = document.getElementById('requests-table-body');
    
    const filteredRequests = currentRequests.filter(req => {
        if (currentFilter === 'all') return true;
        return req.status === currentFilter;
    });

    if (filteredRequests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #71717a;">
                    No ${currentFilter === 'all' ? '' : currentFilter} requests found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredRequests.map(req => {
        const statusColors = {
            pending: '#f59e0b',
            approved: '#10b981',
            denied: '#ef4444'
        };

        const planColors = {
            pro: '#58a6ff',
            max: '#f59e0b'
        };

        return `
            <tr data-request-id="${req.id}">
                <td>
                    <div class="user-email">
                        <span class="email-icon">👤</span>
                        ${req.userEmail}
                    </div>
                </td>
                <td>
                    <span class="plan-badge" style="background: ${PLANS[req.currentPlan?.toUpperCase()]?.color || '#71717a'};">
                        ${PLANS[req.currentPlan?.toUpperCase()]?.displayName || 'Free'}
                    </span>
                </td>
                <td>
                    <span class="plan-badge" style="background: ${planColors[req.requestedPlan] || '#58a6ff'};">
                        ${PLANS[req.requestedPlan?.toUpperCase()]?.displayName}
                    </span>
                </td>
                <td>
                    <div class="request-reason">${req.reason || 'No reason provided'}</div>
                </td>
                <td>
                    <span class="status-badge" style="background: ${statusColors[req.status]};">
                        ${req.status.toUpperCase()}
                    </span>
                </td>
                <td>${new Date(req.createdAt).toLocaleDateString()}</td>
                <td>
                    ${req.status === 'pending' ? `
                        <div class="action-buttons">
                            <button class="btn-action btn-approve-action" onclick="window.openApprovalModal('${req.id}')">
                                ✓ Approve
                            </button>
                            <button class="btn-action btn-deny-action" onclick="window.openDenyModal('${req.id}')">
                                ✕ Deny
                            </button>
                        </div>
                    ` : `
                        <span style="color: #71717a; font-size: 12px;">
                            ${req.status === 'approved' ? 'Approved by ' + req.approvedBy : 'Denied'}
                        </span>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filter requests
 */
function filterRequests() {
    renderRequests();
}

/**
 * Load users
 */
async function loadUsers() {
    try {
        const snapshot = await database.ref('users').once('value');
        const users = [];
        
        snapshot.forEach(child => {
            const userData = child.val();
            users.push({
                uid: child.key,
                email: userData.email || 'Unknown',
                planData: userData.planData,
                usage: userData.usage,
                createdAt: userData.createdAt
            });
        });

        renderUsers(users);
    } catch (error) {
        console.error('❌ Error loading users:', error);
    }
}

/**
 * Render users table
 */
function renderUsers(users) {
    const tbody = document.getElementById('users-table-body');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #71717a;">
                    No users found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => {
        const plan = user.planData?.plan || 'free';
        const todayKey = new Date().toISOString().split('T')[0];
        const todayUsage = user.usage?.[todayKey]?.chatsToday || 0;

        return `
            <tr>
                <td>
                    <div class="user-email">
                        <span class="email-icon">👤</span>
                        ${user.email}
                    </div>
                </td>
                <td>
                    <span class="plan-badge" style="background: ${PLANS[plan.toUpperCase()]?.color || '#71717a'};">
                        ${PLANS[plan.toUpperCase()]?.displayName || 'Free'}
                    </span>
                </td>
                <td>${todayUsage}</td>
                <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</td>
                <td>
                    <button class="btn-action" onclick="window.viewUserDetails('${user.uid}')">
                        View Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Search users
 */
function searchUsers(query) {
    // Implement search functionality
    console.log('Searching for:', query);
}

/**
 * Load statistics
 */
async function loadStats() {
    try {
        const usersSnapshot = await database.ref('users').once('value');
        const totalUsers = usersSnapshot.numChildren();

        const pending = currentRequests.filter(r => r.status === 'pending').length;
        const approved = currentRequests.filter(r => r.status === 'approved').length;
        const denied = currentRequests.filter(r => r.status === 'denied').length;

        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('pending-requests').textContent = pending;
        document.getElementById('approved-requests').textContent = approved;
        document.getElementById('denied-requests').textContent = denied;
    } catch (error) {
        console.error('❌ Error loading stats:', error);
    }
}

/**
 * Open approval modal
 */
window.openApprovalModal = function(requestId) {
    const request = currentRequests.find(r => r.id === requestId);
    if (!request) return;

    currentRequestForAction = request;

    document.getElementById('approve-user-email').value = request.userEmail;
    document.getElementById('approve-plan').value = PLANS[request.requestedPlan.toUpperCase()].displayName;
    document.getElementById('custom-responses').value = '';
    document.getElementById('custom-chats').value = '';

    document.getElementById('approval-modal').classList.add('active');
};

/**
 * Close approval modal
 */
window.closeApprovalModal = function() {
    document.getElementById('approval-modal').classList.remove('active');
    currentRequestForAction = null;
};

/**
 * Confirm approval
 */
window.confirmApproval = async function() {
    if (!currentRequestForAction) return;

    const customResponses = document.getElementById('custom-responses').value;
    const customChats = document.getElementById('custom-chats').value;

    const customLimits = {};
    if (customResponses) customLimits.responsesPerChat = parseInt(customResponses);
    if (customChats) customLimits.chatsPerDay = parseInt(customChats);

    try {
        await approveRequest(
            currentRequestForAction.id,
            Object.keys(customLimits).length > 0 ? customLimits : null
        );

        window.closeApprovalModal();
        await loadAdminData();
        showNotification('Request approved successfully!', 'success');
    } catch (error) {
        console.error('❌ Error approving request:', error);
        showNotification('Failed to approve request', 'error');
    }
};

/**
 * Open deny modal
 */
window.openDenyModal = function(requestId) {
    const request = currentRequests.find(r => r.id === requestId);
    if (!request) return;

    currentRequestForAction = request;

    document.getElementById('deny-user-email').value = request.userEmail;
    document.getElementById('deny-reason').value = '';

    document.getElementById('deny-modal').classList.add('active');
};

/**
 * Close deny modal
 */
window.closeDenyModal = function() {
    document.getElementById('deny-modal').classList.remove('active');
    currentRequestForAction = null;
};

/**
 * Confirm denial
 */
window.confirmDeny = async function() {
    if (!currentRequestForAction) return;

    const reason = document.getElementById('deny-reason').value;

    try {
        await denyRequest(currentRequestForAction.id, reason);

        window.closeDenyModal();
        await loadAdminData();
        showNotification('Request denied', 'success');
    } catch (error) {
        console.error('❌ Error denying request:', error);
        showNotification('Failed to deny request', 'error');
    }
};

/**
 * Show notification
 */
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize
initAdminPanel();

console.log('📦 Admin Panel module loaded');
