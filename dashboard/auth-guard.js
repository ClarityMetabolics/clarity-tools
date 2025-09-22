// File: /dashboard/auth-guard.js
// Updated auth guard for modular pages

import { globalAuthManager, dbManager } from './js/supabase-config.js';

// Global auth state for modular pages
const authManager = globalAuthManager;
const hybridDataManager = dbManager;
// Wait for auth to be ready
let authReady = false;

async function initializeAuth() {
    console.log('🔐 Initializing authentication for modular page...');
    
    try {
        // Wait for auth manager to initialize
        if (!authManager.currentUser) {
            console.log('⏳ Waiting for user session...');
            
            // Check for existing session
            const { session, error } = await authManager.getSession();
            
            if (error || !session?.user) {
                console.log('❌ No valid session, redirecting to auth');
                window.location.href = './auth.html';
                return false;
            }
            
            if (!authManager.userProfile) {
                console.log('⏳ Loading user profile...');
                await authManager.setCurrentUser(session.user);
            }
        }

        // Verify user profile is loaded
        if (!authManager.userProfile) {
            console.log('❌ User profile not loaded, redirecting to auth');
            window.location.href = './auth.html';
            return false;
        }

        authReady = true;
        
        // Show page content
        document.body.style.visibility = 'visible';
        
        console.log('✅ Auth initialized successfully');
        console.log('👤 Current user:', authManager.userProfile.full_name || authManager.currentUser.email);
        console.log('🎯 User role:', authManager.userProfile.role);
        
        return true;
        
    } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        document.body.style.visibility = 'visible';
        
        // Show user-friendly error
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            z-index: 9999;
        `;
        errorDiv.innerHTML = `
            <h3>Authentication Error</h3>
            <p>Unable to verify your identity. Please sign in again.</p>
            <button onclick="window.location.href='./auth.html'" 
                    style="background: white; color: #f44336; border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-top: 1rem; cursor: pointer;">
                Sign In Again
            </button>
        `;
        document.body.appendChild(errorDiv);
        
        return false;
    }
}

// Helper functions for modular pages
window.getCurrentUserId = function() {
    if (!authReady || !authManager.currentUser) {
        console.warn('⚠️  Auth not ready, cannot get user ID');
        return null;
    }
    return authManager.currentUser.id;
};

window.getCurrentUserProfile = function() {
    if (!authReady || !authManager.userProfile) {
        console.warn('⚠️  Auth not ready, cannot get user profile');
        return null;
    }
    return authManager.userProfile;
};

window.isCoach = function() {
    const profile = window.getCurrentUserProfile();
    return profile?.role === 'coach' || profile?.role === 'admin';
};

window.requireCoachAccess = function() {
    if (!window.isCoach()) {
        alert('This page requires coach access');
        window.location.href = './index.html';
        return false;
    }
    return true;
};

// Initialize auth when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    initializeAuth();
}

export { authManager, hybridDataManager };
