// File: /dashboard/auth-guard.js
// Clean auth guard using standard interface - no compatibility layers

import { authManager, dbManager, supabase } from './js/supabase-config.js'

// Standard initialization pattern
async function initializeAuth() {
    console.log('🔐 Initializing authentication for dashboard page...')
    
    try {
        // Wait for auth manager to initialize
        const authSuccess = await authManager.init()
        
        if (!authSuccess) {
            console.log('❌ Authentication failed')
            return false
        }

        // Make auth functions globally available for onclick handlers
        window.getCurrentUserId = () => authManager.getCurrentUserId()
        window.getCurrentUserProfile = () => authManager.userProfile
        window.isCoach = () => authManager.isCoach
        window.authManager = authManager
        window.dbManager = dbManager
        
        // Show page content
        document.body.style.visibility = 'visible'
        
        console.log('✅ Auth guard initialized successfully')
        console.log('👤 Current user:', authManager.userProfile?.full_name || authManager.currentUser?.email)
        console.log('🎯 User role:', authManager.userProfile?.role)
        
        return true
        
    } catch (error) {
        console.error('❌ Auth guard initialization failed:', error)
        
        // Show error message to user
        document.body.style.visibility = 'visible'
        
        const errorDiv = document.createElement('div')
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
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        `
        errorDiv.innerHTML = `
            <h3>Authentication Error</h3>
            <p>Unable to verify your identity. Please sign in again.</p>
            <button onclick="window.location.href='./auth.html'" 
                    style="background: white; color: #f44336; border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-top: 1rem; cursor: pointer;">
                Sign In Again
            </button>
        `
        document.body.appendChild(errorDiv)
        
        return false
    }
}

// Helper function for coach access requirement
window.requireCoachAccess = function() {
    if (!authManager.isCoach) {
        alert('This page requires coach access')
        window.location.href = './index.html'
        return false
    }
    return true
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth)
} else {
    initializeAuth()
}

// Export for other modules that might need it
export { authManager, dbManager, supabase }
