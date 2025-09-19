// File: /dashboard/auth-guard.js
// Lightweight authentication guard for Five Anchors Platform

import { authManager } from './js/supabase-config.js';

async function validateAccess() {
    try {
        console.log('Auth guard: Checking session...');
        const { session } = await authManager.getSession();
        
        if (!session) {
            console.log('Auth guard: No valid session - redirecting to auth');
            window.location.href = './auth.html';
            return;
        }
        
        console.log('Auth guard: Valid session found - showing dashboard');
        document.body.style.setProperty('visibility', 'visible', 'important');
        
    } catch (error) {
        console.error('Auth guard: Error checking authentication:', error);
        window.location.href = './auth.html';
    }
}

// Run authentication check immediately
validateAccess();
