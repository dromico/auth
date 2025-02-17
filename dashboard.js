import firebaseConfig from './config.js';

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// DOM Elements
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');

// Sign Out Function
async function signOut() {
    try {
        const button = event.target;
        button.disabled = true;
        button.textContent = 'Signing out...';
        
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Sign out error:', error);
        alert('Failed to sign out. Please try again.');
        button.disabled = false;
        button.textContent = 'Sign Out';
    }
}

// Auth State Listener
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        userName.textContent = user.displayName || 'User';
        userEmail.textContent = user.email;
    }
});

// Route Protection
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        // Double-check current auth state
        auth.onAuthStateChanged(user => {
            if (!user) {
                window.location.href = 'index.html';
            }
        });
    }
});

// Export for HTML access
window.signOut = signOut;