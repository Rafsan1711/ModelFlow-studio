/**
 * ============================================
 * AUTH UI
 * Handle authentication UI interactions
 * ============================================
 */

import { signUpWithEmail, signInWithEmail, signInWithGoogle } from './auth-handler.js';

let loginForm, signupForm;
let loginEmailInput, loginPasswordInput;
let signupEmailInput, signupPasswordInput;
let loginError, signupError;
let showLoginBtn, showSignupBtn;
let googleSigninBtn;

/**
 * Initialize Auth UI
 */
export function initAuthUI() {
    // Get elements
    loginForm = document.getElementById('login-form');
    signupForm = document.getElementById('signup-form');
    
    loginEmailInput = document.getElementById('login-email');
    loginPasswordInput = document.getElementById('login-password');
    signupEmailInput = document.getElementById('signup-email');
    signupPasswordInput = document.getElementById('signup-password');
    
    loginError = document.getElementById('login-error');
    signupError = document.getElementById('signup-error');
    
    showLoginBtn = document.getElementById('show-login');
    showSignupBtn = document.getElementById('show-signup');
    googleSigninBtn = document.getElementById('google-signin-btn');

    // Setup event listeners
    setupEventListeners();

    console.log('✅ Auth UI initialized');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Tab switching
    showLoginBtn.addEventListener('click', showLoginForm);
    showSignupBtn.addEventListener('click', showSignupForm);

    // Form submissions
    loginForm.addEventListener('submit', handleLoginSubmit);
    signupForm.addEventListener('submit', handleSignupSubmit);

    // Google signin
    googleSigninBtn.addEventListener('click', handleGoogleSignin);
}

/**
 * Show login form
 */
function showLoginForm() {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    
    showLoginBtn.classList.add('active');
    showSignupBtn.classList.remove('active');
    
    clearErrors();
}

/**
 * Show signup form
 */
function showSignupForm() {
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
    
    showSignupBtn.classList.add('active');
    showLoginBtn.classList.remove('active');
    
    clearErrors();
}

/**
 * Handle login submit
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
        showError(loginError, 'Please fill in all fields');
        return;
    }

    setButtonLoading(e.submitter, true);
    clearErrors();

    const result = await signInWithEmail(email, password);

    setButtonLoading(e.submitter, false);

    if (!result.success) {
        showError(loginError, result.error);
    }
}

/**
 * Handle signup submit
 */
async function handleSignupSubmit(e) {
    e.preventDefault();
    
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value;

    if (!email || !password) {
        showError(signupError, 'Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showError(signupError, 'Password must be at least 6 characters');
        return;
    }

    setButtonLoading(e.submitter, true);
    clearErrors();

    const result = await signUpWithEmail(email, password);

    setButtonLoading(e.submitter, false);

    if (!result.success) {
        showError(signupError, result.error);
    }
}

/**
 * Handle Google signin
 */
async function handleGoogleSignin() {
    setButtonLoading(googleSigninBtn, true);
    clearErrors();

    const result = await signInWithGoogle();

    setButtonLoading(googleSigninBtn, false);

    if (!result.success) {
        showError(loginError, result.error);
    }
}

/**
 * Set button loading state
 */
function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    if (isLoading) {
        button.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'block';
    } else {
        button.disabled = false;
        if (btnText) btnText.style.display = 'block';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

/**
 * Show error message
 */
function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

/**
 * Clear all errors
 */
function clearErrors() {
    loginError.textContent = '';
    loginError.style.display = 'none';
    signupError.textContent = '';
    signupError.style.display = 'none';
}

console.log('📦 Auth UI module loaded');
