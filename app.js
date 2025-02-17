import firebaseConfig from './config.js';

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

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
    await auth.setPersistence(persistence);
};

// Input Validation
const validateForm = () => {
    const email = elements.emailInput().value.trim();
    const password = elements.passwordInput().value;
    
    if (!elements.nameInput().value || !email || !password) {
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

// Auth Actions
async function signUp() {
    elements.errorMessage().textContent = '';
    if (!validateForm()) return;

    try {
        await setPersistence(elements.rememberMe().checked);
        const userCredential = await auth.createUserWithEmailAndPassword(
            elements.emailInput().value.trim(),
            elements.passwordInput().value
        );
        await userCredential.user.updateProfile({
            displayName: elements.nameInput().value.trim()
        });
        window.location.href = 'dashboard.html';
    } catch (error) {
        handleAuthError(error);
    }
}

async function signIn() {
    elements.errorMessage().textContent = '';
    const email = elements.emailInput().value.trim();
    const password = elements.passwordInput().value;
    
    if (!email || !password) {
        elements.errorMessage().textContent = errorMessages.emptyFields;
        return;
    }
    
    try {
        await setPersistence(elements.rememberMe().checked);
        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = 'dashboard.html';
    } catch (error) {
        handleAuthError(error);
    }
}

// Error Handling
function handleAuthError(error) {
    const errorMap = {
        'auth/email-already-in-use': errorMessages.emailInUse,
        'auth/user-not-found': errorMessages.userNotFound,
        'auth/wrong-password': errorMessages.wrongPassword
    };
    elements.errorMessage().textContent = errorMap[error.code] || error.message;
    console.error("Firebase Auth Error:", error); // Log the error for debugging
}

// Auth State Management
auth.onAuthStateChanged(user => {
    if (user && window.location.pathname.endsWith('index.html')) {
        window.location.href = 'dashboard.html';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.getElementById("togglePassword");
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById("passwordInput");
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            this.textContent = type === "password" ? "Show Password" : "Hide Password";
        });
    }
});

// Export functions to window object for HTML access
window.signUp = signUp;
window.signIn = signIn;