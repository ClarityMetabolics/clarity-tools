<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Five Anchors Platform - Sign In</title>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --physical-color: #7C8B60;
            --mental-color: #B7AFA3;
            --emotional-color: #C97D7D;
            --spiritual-color: #B6B0C3;
            --relational-color: #E8934A;
            --bg-color: #FEFEFE;
            --text-color: #2C2C2C;
            --card-bg: #FFFFFF;
            --card-border: #E5E5E5;
            --shadow: rgba(0, 0, 0, 0.1);
            --accent-color: #5A6C57;
            --success-color: #4CAF50;
            --error-color: #f44336;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Open Sans', sans-serif;
            background: linear-gradient(135deg, 
                rgba(124, 139, 96, 0.1) 0%, 
                rgba(183, 175, 163, 0.1) 25%, 
                rgba(201, 125, 125, 0.1) 50%, 
                rgba(182, 176, 195, 0.1) 75%, 
                rgba(232, 147, 74, 0.1) 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-color);
        }

        .auth-container {
            background: var(--card-bg);
            border-radius: 16px;
            box-shadow: 0 8px 32px var(--shadow);
            padding: 3rem;
            max-width: 450px;
            width: 90%;
            text-align: center;
        }

        .logo {
            font-family: 'Libre Baskerville', serif;
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--accent-color);
            margin-bottom: 1rem;
        }

        .subtitle {
            font-size: 1.1rem;
            opacity: 0.8;
            margin-bottom: 2.5rem;
            line-height: 1.5;
        }

        .auth-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .form-group {
            text-align: left;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: var(--accent-color);
        }

        .form-input {
            width: 100%;
            padding: 1rem;
            border: 2px solid var(--card-border);
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: var(--bg-color);
        }

        .form-input:focus {
            outline: none;
            border-color: var(--accent-color);
            box-shadow: 0 0 0 3px rgba(90, 108, 87, 0.1);
        }

        .auth-button {
            background: var(--accent-color);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 0.5rem;
        }

        .auth-button:hover {
            background: var(--physical-color);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(90, 108, 87, 0.3);
        }

        .auth-button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .divider {
            display: flex;
            align-items: center;
            margin: 2rem 0;
            color: #666;
        }

        .divider::before,
        .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--card-border);
        }

        .divider span {
            padding: 0 1rem;
            font-size: 0.9rem;
        }

        .demo-section {
            background: rgba(232, 147, 74, 0.1);
            border: 1px solid rgba(232, 147, 74, 0.3);
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 1.5rem;
        }

        .demo-title {
            font-weight: 600;
            color: var(--relational-color);
            margin-bottom: 1rem;
        }

        .demo-buttons {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .demo-button {
            background: transparent;
            border: 2px solid var(--relational-color);
            color: var(--relational-color);
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;
        }

        .demo-button:hover {
            background: var(--relational-color);
            color: white;
        }

        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            color: white;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .notification.success { background: var(--success-color); }
        .notification.error { background: var(--error-color); }
        .notification.info { background: #2196F3; }

        .status-message {
            margin-top: 1rem;
            padding: 1rem;
            border-radius: 6px;
            font-weight: 500;
        }

        .status-success {
            background: rgba(76, 175, 80, 0.1);
            border: 1px solid var(--success-color);
            color: var(--success-color);
        }

        .status-error {
            background: rgba(244, 67, 54, 0.1);
            border: 1px solid var(--error-color);
            color: var(--error-color);
        }

        .status-info {
            background: rgba(33, 150, 243, 0.1);
            border: 1px solid #2196F3;
            color: #2196F3;
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @media (max-width: 480px) {
            .auth-container {
                padding: 2rem;
                margin: 1rem;
            }
            
            .logo {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <h1 class="logo">Five Anchors</h1>
        <p class="subtitle">Sign in to access your coaching platform</p>
        
        <form class="auth-form" id="auth-form">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input 
                    type="email" 
                    id="email" 
                    class="form-input" 
                    placeholder="Enter your email address"
                    required
                >
            </div>
            
            <button type="submit" class="auth-button" id="auth-button">
                Send Magic Link
            </button>
            
            <div id="status-message"></div>
        </form>

        <div class="divider">
            <span>or</span>
        </div>

        <div class="demo-section">
            <div class="demo-title">Demo Access (Testing Only)</div>
            <div class="demo-buttons">
                <button class="demo-button" onclick="enterDemoMode('client')">
                    Continue as Demo Client
                </button>
                <button class="demo-button" onclick="enterDemoMode('coach')">
                    Continue as Demo Coach
                </button>
            </div>
        </div>
    </div>

    <script type="module">
        import { authManager, showNotification } from './js/supabase-config.js';

        // DOM elements
        const authForm = document.getElementById('auth-form');
        const emailInput = document.getElementById('email');
        const authButton = document.getElementById('auth-button');
        const statusMessage = document.getElementById('status-message');

        // Check if user is already authenticated on page load
        document.addEventListener('DOMContentLoaded', async () => {
            const { session } = await authManager.getSession();
            
            if (session) {
                showStatusMessage('You are already signed in. Redirecting...', 'success');
                setTimeout(() => {
                    authManager.redirectBasedOnRole();
                }, 1500);
            }
        });

        // Handle form submission
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            
            if (!email) {
                showStatusMessage('Please enter your email address', 'error');
                return;
            }

            // Show loading state
            authButton.disabled = true;
            authButton.innerHTML = '<span class="loading"></span> Sending...';

            try {
                const { data, error } = await authManager.signInWithEmail(email);
                
                if (error) {
                    throw error;
                }

                showStatusMessage(
                    'Magic link sent! Check your email and click the link to sign in.', 
                    'success'
                );
                
                // Keep button disabled but change text
                authButton.innerHTML = 'Check Your Email';
                
            } catch (error) {
                console.error('Auth error:', error);
                showStatusMessage(
                    error.message || 'Failed to send magic link. Please try again.', 
                    'error'
                );
                
                // Reset button
                authButton.disabled = false;
                authButton.innerHTML = 'Send Magic Link';
            }
        });

        // Demo mode functions (keeping for testing)
        window.enterDemoMode = function(role) {
            localStorage.setItem('authMode', `demo_${role}`);
            showNotification(`Entering demo mode as ${role}`, 'info');
            
            setTimeout(() => {
                if (role === 'coach') {
                    window.location.href = './coach-dashboard.html';
                } else {
                    window.location.href = './index.html';
                }
            }, 1000);
        };

        function showStatusMessage(message, type) {
            statusMessage.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
        }

        // Handle URL parameters (for password reset, etc.)
        const urlParams = new URLSearchParams(window.location.search);
        const resetToken = urlParams.get('access_token');
        const type = urlParams.get('type');

        if (resetToken && type === 'recovery') {
            showStatusMessage('Password reset link detected. Setting up your account...', 'info');
            // Handle password reset flow here if needed
        }
    </script>
</body>
</html>
