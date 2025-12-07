/**
 * ============================================
 * ADMIN PANEL
 * Admin management interface (123@email.com only)
 * ============================================
 */

import { getPendingRequests, approveRequest, denyRequest } from '../core/plan-manager.js';
import { getAllReports, updateReportStatus } from './feedback-handler.js';
import { database } from '../auth/firebase-config.js';

/**
 * Open admin panel
 */
export async function openAdminPanel() {
    // Check if user is admin
    const user = window.ModelFlow.state.get('user');
    if (!user || user.email !== '123@email.com') {
        alert('Access denied. Admin only.');
        return;
    }

    const modal = document.getElementById('admin-modal');
    const adminContent = document.getElementById('admin-content');

    // Load admin content
    adminContent.innerHTML = '<div style="text-align: center; padding: 40px;">Loading...</div>';
    modal.classList.add('active');

    // Load data
    await loadAdminData(adminContent);
}

/**
 * Load admin data
 */
async function loadAdminData(container) {
    try {
        // Get statistics
        const stats = await getStatistics();
        
        // Get pending requests
        const requests = await getPendingRequests();
        
        // Get reports
        const reports = await getAllReports();

        // Render admin UI
        container.innerHTML = `
            <div class="admin-header">
                <h2>Admin Dashboard</h2>
                <p class="admin-subtitle">Manage users, permissions, and reports</p>
            </div>

            <!-- Statistics -->
            <div class="admin-stats">
                <div class="stat-card">
                    <div class="stat-label">Total Users</div>
                    <div class="stat-value">${stats.totalUsers}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Pending Requests</div>
                    <div class="stat-value">${requests.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Chats</div>
                    <div class="stat-value">${stats.totalChats}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Reports</div>
                    <div class="stat-value">${reports.length}</div>
                </div>
            </div>

            <!-- Permission Requests -->
            <div class="permission-requests">
                <div class="section-header">
                    <h3>Permission Requests</h3>
                </div>
                ${renderRequestsTable(requests)}
            </div>

            <!-- Reports -->
            <div class="permission-requests">
                <div class="section-header">
                    <h3>User Reports</h3>
                </div>
                ${renderReportsTable(reports)}
            </div>
        `;

        // Setup event listeners
        setupAdminEventListeners();

    } catch (error) {
        console.error('❌ Error loading admin data:', error);
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: red;">Error loading admin data</div>';
    }
}

/**
 * Get statistics
 */
async function getStatistics() {
    try {
        // Get total users
        const usersSnapshot = await database.ref('users').once('value');
        const totalUsers = usersSnapshot.numChildren();

        // Get total chats
        let totalChats = 0;
        usersSnapshot.forEach(userSnapshot => {
            const chats = userSnapshot.child('chats').numChildren();
            totalChats += chats;
        });

        return {
            totalUsers,
            totalChats
        };
    } catch (error) {
        console.error('❌ Error getting statistics:', error);
        return {
            totalUsers: 0,
            totalChats: 0
        };
    }
}

/**
 * Render requests table
 */
function renderRequestsTable(requests) {
    if (requests.length === 0) {
        return `
            <div class="admin-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p>No pending requests</p>
            </div>
        `;
    }

    return `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>User Email</th>
                    <th>Requested Plan</th>
                    <th>Current Plan</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${requests.map(req => `
                    <tr data-request-id="${req.id}">
                        <td>${req.userEmail}</td>
                        <td><span class="status-badge ${req.requestedPlan}">${req.requestedPlan.toUpperCase()}</span></td>
                        <td>${req.currentPlan}</td>
                        <td>${new Date(req.requestedAt).toLocaleDateString()}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn-small approve" data-action="approve" data-request-id="${req.id}">
                                    ✓ Approve
                                </button>
                                <button class="action-btn-small deny" data-action="deny" data-request-id="${req.id}">
                                    ✗ Deny
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Render reports table
 */
function renderReportsTable(reports) {
    if (reports.length === 0) {
        return `
            <div class="admin-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p>No pending reports</p>
            </div>
        `;
    }

    return `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>User Email</th>
                    <th>Reason</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${reports.map(report => `
                    <tr data-report-id="${report.id}">
                        <td>${report.userEmail}</td>
                        <td>${report.reason}</td>
                        <td>${new Date(report.timestamp).toLocaleDateString()}</td>
                        <td>
                            <button class="action-btn-small approve" data-action="resolve-report" data-report-id="${report.id}">
                                Resolve
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Setup admin event listeners
 */
function setupAdminEventListeners() {
    // Approve requests
    document.querySelectorAll('[data-action="approve"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const requestId = e.target.dataset.requestId;
            const confirmed = confirm('Approve this request?');
            
            if (confirmed) {
                btn.disabled = true;
                btn.textContent = 'Approving...';
                
                const result = await approveRequest(requestId);
                
                if (result.success) {
                    // Remove row
                    const row = document.querySelector(`tr[data-request-id="${requestId}"]`);
                    if (row) row.remove();
                    
                    showNotification('Request approved!', 'success');
                } else {
                    btn.disabled = false;
                    btn.textContent = '✓ Approve';
                    showNotification('Error approving request', 'error');
                }
            }
        });
    });

    // Deny requests
    document.querySelectorAll('[data-action="deny"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const requestId = e.target.dataset.requestId;
            const reason = prompt('Reason for denial (optional):');
            
            if (reason !== null) {
                btn.disabled = true;
                btn.textContent = 'Denying...';
                
                const result = await denyRequest(requestId, reason);
                
                if (result.success) {
                    // Remove row
                    const row = document.querySelector(`tr[data-request-id="${requestId}"]`);
                    if (row) row.remove();
                    
                    showNotification('Request denied', 'success');
                } else {
                    btn.disabled = false;
                    btn.textContent = '✗ Deny';
                    showNotification('Error denying request', 'error');
                }
            }
        });
    });

    // Resolve reports
    document.querySelectorAll('[data-action="resolve-report"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const reportId = e.target.dataset.reportId;
            const confirmed = confirm('Mark this report as resolved?');
            
            if (confirmed) {
                btn.disabled = true;
                btn.textContent = 'Resolving...';
                
                const result = await updateReportStatus(reportId, 'resolved');
                
                if (result.success) {
                    // Remove row
                    const row = document.querySelector(`tr[data-report-id="${reportId}"]`);
                    if (row) row.remove();
                    
                    showNotification('Report resolved!', 'success');
                } else {
                    btn.disabled = false;
                    btn.textContent = 'Resolve';
                    showNotification('Error resolving report', 'error');
                }
            }
        });
    });
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#58a6ff'};
        color: white;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transition = 'all 0.3s ease';
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close admin modal button
document.getElementById('close-admin-btn')?.addEventListener('click', () => {
    document.getElementById('admin-modal').classList.remove('active');
});

console.log('📦 Admin Panel module loaded');
