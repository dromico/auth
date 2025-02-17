import firebaseConfig from './config.js';

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); // Initialize Firestore

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
    const name = elements.nameInput().value.trim();
    const password = elements.passwordInput().value;
    
    if (!name || !password) {
        showError(errorMessages.emptyFields);
        return false;
    }
    
    return true;
};

function showError(message) {
    elements.errorMessage().textContent = message;
}

// Auth Actions
async function signUp() {
    elements.errorMessage().textContent = '';
    if (!validateRegistrationForm()) return;

    // Disable the submit button and show loading state
    const submitButton = document.querySelector('button[onclick="signUp()"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Account...';
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(
            elements.emailInput().value.trim(),
            elements.passwordInput().value
        );
        
        const displayName = elements.nameInput().value.trim();
        
        // Update user profile
        await userCredential.user.updateProfile({
            displayName: displayName
        });

        // Store user data in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            displayName: displayName,
            email: elements.emailInput().value.trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Force trigger auth state change
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User authenticated, redirecting...');
                window.location.replace('dashboard.html');
            }
        });

    } catch (error) {
        handleAuthError(error);
        // Reset button state on error
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create Account';
        }
    }
}

async function signIn() {
    elements.errorMessage().textContent = '';
    if (!validateLoginForm()) return;

    const name = elements.nameInput().value.trim();
    const password = elements.passwordInput().value;

    try {
        console.log('Searching for user:', name); // Debug log
        
        // Query Firestore for user with matching display name
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('displayName', '==', name).get();

        if (snapshot.empty) {
            console.log('No matching users found'); // Debug log
            showError('User not found');
            return;
        }

        // Get the first matching user
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        console.log('Found user:', userData.email); // Debug log

        // Try to sign in with email and password
        const remember = elements.rememberMe()?.checked || false;
        await setPersistence(remember);

        try {
            const result = await auth.signInWithEmailAndPassword(userData.email, password);
            console.log('Sign in successful'); // Debug log
            window.location.href = 'dashboard.html';
        } catch (authError) {
            console.error('Auth error:', authError); // Debug log
            if (authError.code === 'auth/wrong-password') {
                showError('Incorrect password');
            } else {
                showError(authError.message);
            }
        }
    } catch (error) {
        console.error('Login error:', error); // Debug log
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
    showError(errorMap[error.code] || error.message);
    console.error("Firebase Auth Error:", error);
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
            this.textContent = type === "password" ? "Show" : "Hide";
        });
    }
});

// Export functions to window object for HTML access
window.signUp = signUp;
window.signIn = signIn;