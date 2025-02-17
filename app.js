import firebaseConfig from './config.js';

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const elements = {
    nameInput: () => document.getElementById('nameInput'),
    emailInput: () => document.getElementById('emailInput'),
    passwordInput: () => document.getElementById('passwordInput'),
    errorMessage: () => document.getElementById('errorMessage'),
    rememberMe: () => document.getElementById('rememberMe')
};

// Error Messages
const errorMessages = {
    invalidEmail: 'Please enter a valid email address',
    weakPassword: 'Password must be at least 6 characters',
    emptyFields: 'Please fill in all fields',
    emailInUse: 'Email already in use',
    userNotFound: 'User not found',
    wrongPassword: 'Incorrect password'
};

// Auth Persistence
const setPersistence = async (remember) => {
    const persistence = remember ? 
        firebase.auth.Auth.Persistence.LOCAL : 
        firebase.auth.Auth.Persistence.SESSION;
    try {
        await auth.setPersistence(persistence);
    } catch (error) {
        console.error('Error setting persistence:', error);
    }
};

// Input Validation for Registration
const validateRegistrationForm = () => {
    const email = elements.emailInput().value.trim();
    const password = elements.passwordInput().value;
    const name = elements.nameInput().value.trim();
    
    if (!name || !email || !password) {
        showError(errorMessages.emptyFields);
        return false;
    }
    
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        showError(errorMessages.invalidEmail);
        return false;
    }
    
    if (password.length < 6) {
        showError(errorMessages.weakPassword);
        return false;
    }
    
    return true;
};

// Input Validation for Login
const validateLoginForm = () => {
    const email = elements.emailInput().value.trim();
    const password = elements.passwordInput().value;
    
    if (!email || !password) {
        showError(errorMessages.emptyFields);
        return false;
    }
    
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        showError(errorMessages.invalidEmail);
        return false;
    }
    
    return true;
};

function showError(message) {
    const errorElement = elements.errorMessage();
    if (errorElement) {
        errorElement.textContent = message;
    }
}

async function signUp() {
    elements.errorMessage().textContent = '';
    if (!validateRegistrationForm()) return;

    const submitButton = document.querySelector('button[onclick="signUp()"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Account...';
    }

    try {
        const email = elements.emailInput().value.trim();
        const password = elements.passwordInput().value;
        const displayName = elements.nameInput().value.trim();

        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update profile with display name
        await userCredential.user.updateProfile({
            displayName: displayName
        });

        // Store additional user data in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            displayName: displayName,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('User registered successfully');
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Registration error:', error);
        handleAuthError(error);
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create Account';
        }
    }
}

async function signIn() {
    elements.errorMessage().textContent = '';
    if (!validateLoginForm()) return;

    try {
        const email = elements.emailInput().value.trim();
        const password = elements.passwordInput().value;
        const remember = elements.rememberMe()?.checked || false;

        // Set persistence first
        await setPersistence(remember);

        // Attempt to sign in
        await auth.signInWithEmailAndPassword(email, password);
        
        console.log('Sign in successful');
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Login error:', error);
        handleAuthError(error);
    }
}

function handleAuthError(error) {
    const errorMap = {
        'auth/email-already-in-use': errorMessages.emailInUse,
        'auth/user-not-found': errorMessages.userNotFound,
        'auth/wrong-password': errorMessages.wrongPassword,
        'auth/invalid-email': errorMessages.invalidEmail
    };
    
    const errorMessage = errorMap[error.code] || error.message;
    showError(errorMessage);
    console.error('Firebase Auth Error:', error.code, error.message);
}

// Check auth state
auth.onAuthStateChanged(user => {
    if (user) {
        const currentPath = window.location.pathname;
        if (currentPath.endsWith('index.html') || currentPath.endsWith('register.html')) {
            window.location.href = 'dashboard.html';
        }
    }
});

// Password toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('passwordInput');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.textContent = type === 'password' ? 'Show' : 'Hide';
        });
    }
});

// Export functions for HTML access
window.signUp = signUp;
window.signIn = signIn;