import firebaseConfig from './config.js';

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// DOM Elements
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const loadingState = document.getElementById('loadingState');
const content = document.getElementById('content');

// Sign Out Function
async function signOut() {
    try {
        const button = event.target;
        button.disabled = true;
        button.textContent = 'Signing out...';
        
        await auth.signOut();
        window.location.replace('index.html');
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
        window.location.replace('index.html');
        return;
    }
    
    // Update UI with user info
    userName.textContent = user.displayName || 'User';
    userEmail.textContent = user.email;
    
    // Show content and hide loading state
    loadingState.style.display = 'none';
    content.classList.remove('hidden');
});

// Route Protection - Immediate check
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        // Double-check current auth state
        setTimeout(() => {
            if (!auth.currentUser) {
                window.location.replace('index.html');
            }
        }, 1000); // Give a second for auth state to initialize
    }
});

// Export for HTML access
window.signOut = signOut;