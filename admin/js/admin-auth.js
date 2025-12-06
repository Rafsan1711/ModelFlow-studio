/**
 * Admin Authentication
 */
import { auth } from '../../js/auth/firebase-config.js';

const OWNER_EMAIL = 'samiulhaquerafsan@email.com';

async function checkAccess() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            const authCheck = document.getElementById('auth-check');
            const accessDenied = document.getElementById('access-denied');
            const adminPanel = document.getElementById('admin-panel');

            if (user && user.email === OWNER_EMAIL) {
                // Grant access
                authCheck.style.display = 'none';
                adminPanel.style.display = 'block';
                resolve(true);
            } else {
                // Deny access
                authCheck.style.display = 'none';
                accessDenied.style.display = 'flex';
                resolve(false);
            }
        });
    });
}

checkAccess();
