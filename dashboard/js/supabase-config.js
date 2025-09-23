// File: /dashboard/js/supabase-config.js
// Clean Authentication & Database System for Five Anchors Platform
// No compatibility layers - single standard interface

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

// Supabase configuration
const SUPABASE_URL = 'https://fcoosyveumtkalsdwppg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb29zeXZldW10a2Fsc2R3cHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NjQxOTUsImV4cCI6MjA3MzA0MDE5NX0.hukhtamCJx3nlxh_8Sya12sAnwZ6dOGjxp_vXp4ZsBY'

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Authentication Manager - Single source of truth
class AuthManager {
    constructor() {
        this.currentUser = null
        this.userProfile = null
        this.isAuthenticated = false
        this.isCoach = false
        this.isReady = false
    }

    async init() {
        try {
            console.log('🔐 Initializing authentication...')
            
            // Check current session
            const { data: { user }, error } = await supabase.auth.getUser()
            
            if (error) {
                console.error('Auth check failed:', error)
                this.redirectToAuth()
                return false
            }

            if (!user) {
                console.log('No user session found')
                this.redirectToAuth()
                return false
            }

            // Load user profile
            await this.loadUserProfile(user)
            
            // Set up auth state listener
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    this.clearAuth()
                    this.redirectToAuth()
                } else if (event === 'SIGNED_IN' && session?.user) {
                    await this.loadUserProfile(session.user)
                }
            })

            this.isReady = true
            console.log('✅ Authentication ready')
            return true
            
        } catch (error) {
            console.error('Auth initialization failed:', error)
            this.redirectToAuth()
            return false
        }
    }

    async loadUserProfile(user) {
        this.currentUser = user
        this.isAuthenticated = true
        
        try {
            // Get user profile from database
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error && error.code === 'PGRST116') {
                // Create profile if it doesn't exist
                const { data: newProfile } = await supabase
                    .from('profiles')
                    .insert([{
                        id: user.id,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
                        role: 'client'
                    }])
                    .select()
                    .single()
                    
                this.userProfile = newProfile
                this.isCoach = false
            } else if (profile) {
                this.userProfile = profile
                this.isCoach = profile.role === 'coach' || profile.role === 'admin'
            }

            console.log('👤 Profile loaded:', {
                email: this.userProfile?.email,
                role: this.userProfile?.role,
                isCoach: this.isCoach
            })

        } catch (error) {
            console.error('Error loading user profile:', error)
        }
    }

    getCurrentUserId() {
        if (!this.isAuthenticated || !this.currentUser) {
            console.warn('⚠️ getCurrentUserId called but user not authenticated')
            return null
        }
        return this.currentUser.id
    }

    async signOut() {
        const { error } = await supabase.auth.signOut()
        if (!error) {
            this.clearAuth()
        }
        return { error }
    }

    clearAuth() {
        this.currentUser = null
        this.userProfile = null
        this.isAuthenticated = false
        this.isCoach = false
        this.isReady = false
    }

    redirectToAuth() {
        if (!window.location.pathname.includes('auth.html')) {
            window.location.href = './auth.html'
        }
    }
}

// Database Manager - Clean data operations
class DatabaseManager {
    constructor(authManager) {
        this.authManager = authManager
    }

    getCurrentUserId() {
        const userId = this.authManager.getCurrentUserId()
        if (!userId) {
            console.error('❌ Database operation attempted without authentication')
        }
        return userId
    }

    // Daily Check-ins
    async saveCheckIn(checkInData) {
        const userId = this.getCurrentUserId()
        if (!userId) return { data: null, error: { message: 'Not authenticated' } }

        try {
            const { data, error } = await supabase
                .from('daily_checkins')
                .upsert([{
                    client_id: userId,
                    checkin_date: checkInData.date,
                    ratings: checkInData.ratings,
                    notes: checkInData.notes || {}
                }], {
                    onConflict: 'client_id,checkin_date'
                })
                .select()

            if (error) {
                console.error('Error saving check-in:', error)
                return { data: null, error }
            }

            console.log('✅ Check-in saved')
            return { data, error: null }

        } catch (error) {
            console.error('Database error saving check-in:', error)
            return { data: null, error }
        }
    }

    async getCheckIns(limit = 30) {
        const userId = this.getCurrentUserId()
        if (!userId) return { data: {}, error: { message: 'Not authenticated' } }

        try {
            const { data, error } = await supabase
                .from('daily_checkins')
                .select('*')
                .eq('client_id', userId)
                .order('checkin_date', { ascending: false })
                .limit(limit)

            if (error) {
                console.error('Error loading check-ins:', error)
                return { data: {}, error }
            }

            // Transform to expected format
            const transformed = {}
            if (data) {
                data.forEach(item => {
                    transformed[item.checkin_date] = {
                        date: item.checkin_date,
                        ratings: item.ratings,
                        notes: item.notes || {}
                    }
                })
            }

            return { data: transformed, error: null }

        } catch (error) {
            console.error('Error in getCheckIns:', error)
            return { data: {}, error }
        }
    }

    // Anchor Statements
    async saveAnchorStatement(anchorType, statementText, sharedWithCoach = false) {
        const userId = this.getCurrentUserId()
        if (!userId) return { data: null, error: { message: 'Not authenticated' } }

        try {
            // Get existing statements
            const { data: existing } = await supabase
                .from('anchor_statements')
                .select('statements')
                .eq('user_id', userId)
                .single()

            // Build updated statements object
            const currentStatements = existing?.statements || {}
            currentStatements[anchorType] = {
                statement_text: statementText,
                shared_with_coach: sharedWithCoach,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            // Save to database
            const { data, error } = await supabase
                .from('anchor_statements')
                .upsert({
                    user_id: userId,
                    statements: currentStatements,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                })
                .select()

            if (error) {
                console.error('Error saving anchor statement:', error)
                return { data: null, error }
            }

            console.log(`✅ Anchor statement saved: ${anchorType}`)
            return { data, error: null }

        } catch (error) {
            console.error('Database error saving anchor statement:', error)
            return { data: null, error }
        }
    }

    async getAnchorStatements() {
        const userId = this.getCurrentUserId()
        if (!userId) return { data: {}, error: { message: 'Not authenticated' } }

        try {
            const { data, error } = await supabase
                .from('anchor_statements')
                .select('statements')
                .eq('user_id', userId)
                .single()

            if (error && error.code === 'PGRST116') {
                return { data: {}, error: null }
            }

            if (error) {
                console.error('Error loading anchor statements:', error)
                return { data: {}, error }
            }

            return { data: data?.statements || {}, error: null }

        } catch (error) {
            console.error('Error in getAnchorStatements:', error)
            return { data: {}, error }
        }
    }

    async updateAnchorStatementSharing(anchorType, sharedWithCoach) {
        const userId = this.getCurrentUserId()
        if (!userId) return { data: null, error: { message: 'Not authenticated' } }

        try {
            const { data: existing } = await supabase
                .from('anchor_statements')
                .select('statements')
                .eq('user_id', userId)
                .single()

            if (!existing || !existing.statements?.[anchorType]) {
                return { data: null, error: { message: 'Statement not found' } }
            }

            const updatedStatements = { ...existing.statements }
            updatedStatements[anchorType] = {
                ...updatedStatements[anchorType],
                shared_with_coach: sharedWithCoach,
                updated_at: new Date().toISOString()
            }

            const { data, error } = await supabase
                .from('anchor_statements')
                .update({
                    statements: updatedStatements,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .select()

            if (error) {
                console.error('Error updating sharing status:', error)
                return { data: null, error }
            }

            console.log(`✅ Sharing updated for ${anchorType}`)
            return { data, error: null }

        } catch (error) {
            console.error('Error updating anchor statement sharing:', error)
            return { data: null, error }
        }
    }

    // Module Access
    async getModuleAccess(userId = null) {
        const targetUserId = userId || this.getCurrentUserId()
        if (!targetUserId) return { data: null, error: { message: 'No user ID provided' } }

        try {
            const { data, error } = await supabase
                .from('module_access')
                .select('*')
                .eq('user_id', targetUserId)

            if (error) {
                console.error('Error loading module access:', error)
                return { data: null, error }
            }

            // Transform to expected format
            const access = {
                fiveAnchors: {
                    physical: { guide: false, webTool: false },
                    mental: { guide: false, webTool: false },
                    emotional: { guide: false, webTool: false },
                    spiritual: { guide: false, webTool: false },
                    relational: { guide: false, webTool: false }
                },
                discernmentTools: {
                    thoughtRefiner: { unlocked: false },
                    beliefThreader: { unlocked: false },
                    echoEraser: { unlocked: false },
                    forgivenessFilter: { unlocked: false },
                    connectionCalibrator: { unlocked: false }
                }
            }

            if (data) {
                data.forEach(item => {
                    if (item.module_type === 'fiveAnchors' && access.fiveAnchors[item.module_key]) {
                        access.fiveAnchors[item.module_key][item.access_type] = item.unlocked
                    } else if (item.module_type === 'discernmentTools' && access.discernmentTools[item.module_key]) {
                        access.discernmentTools[item.module_key].unlocked = item.unlocked
                    }
                })
            }

            return { data: access, error: null }

        } catch (error) {
            console.error('Error in getModuleAccess:', error)
            return { data: null, error }
        }
    }

    async unlockModuleForClient(clientId, moduleType, moduleKey, accessType = 'webTool') {
        const coachId = this.getCurrentUserId()
        if (!coachId) {
            console.error('❌ Coach not authenticated for unlock operation')
            return { data: null, error: { message: 'Coach not authenticated' } }
        }

        try {
            console.log(`🔓 Coach ${coachId} unlocking ${moduleKey} for client ${clientId}`)

            const { data, error } = await supabase
                .from('module_access')
                .upsert({
                    user_id: clientId,
                    module_type: moduleType,
                    module_key: moduleKey,
                    access_type: accessType,
                    unlocked: true,
                    unlocked_at: new Date().toISOString(),
                    unlocked_by: coachId
                }, {
                    onConflict: 'user_id,module_type,module_key,access_type'
                })
                .select()

            if (error) {
                console.error('Database error unlocking module:', error)
                return { data: null, error }
            }

            console.log(`✅ Module unlocked: ${moduleKey} for ${clientId}`)
            return { data, error: null }

        } catch (error) {
            console.error('Error in unlockModuleForClient:', error)
            return { data: null, error }
        }
    }

    // Coach Functions
    async getCoachClients() {
        const coachId = this.getCurrentUserId()
        if (!coachId) return { data: [], error: { message: 'Coach not authenticated' } }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id, email, full_name, coaching_package, sessions_completed, 
                    sessions_total, start_date, status, assigned_coach_id, created_at
                `)
                .eq('assigned_coach_id', coachId)
                .eq('role', 'client')

            if (error) {
                console.error('Error loading coach clients:', error)
                return { data: [], error }
            }

            return { data: data || [], error: null }

        } catch (error) {
            console.error('Error in getCoachClients:', error)
            return { data: [], error }
        }
    }

    async getClientAnchorStatements(clientId) {
        try {
            const { data, error } = await supabase
                .from('anchor_statements')
                .select('statements')
                .eq('user_id', clientId)
                .single()

            if (error && error.code === 'PGRST116') {
                return { data: {}, error: null }
            }

            if (error) {
                console.error('Error loading client anchor statements:', error)
                return { data: {}, error }
            }

            // Filter for shared statements only
            const sharedStatements = {}
            if (data?.statements) {
                Object.entries(data.statements).forEach(([anchorType, statement]) => {
                    if (statement.shared_with_coach) {
                        sharedStatements[anchorType] = statement
                    }
                })
            }

            return { data: sharedStatements, error: null }

        } catch (error) {
            console.error('Error in getClientAnchorStatements:', error)
            return { data: {}, error }
        }
    }

    async getClientCheckIns(clientId, limit = 7) {
        try {
            const { data, error } = await supabase
                .from('daily_checkins')
                .select('*')
                .eq('client_id', clientId)
                .order('checkin_date', { ascending: false })
                .limit(limit)

            if (error) {
                console.error('Error loading client check-ins:', error)
                return { data: [], error }
            }

            return { data: data || [], error: null }

        } catch (error) {
            console.error('Error in getClientCheckIns:', error)
            return { data: [], error }
        }
    }
}

// Create instances
export const authManager = new AuthManager()
export const dbManager = new DatabaseManager(authManager)

// Notification utility
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.textContent = message
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        z-index: 1001;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease'
        setTimeout(() => notification.remove(), 300)
    }, 3000)
}

// Add animation styles
const style = document.createElement('style')
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`
document.head.appendChild(style)

console.log('📦 Clean auth system loaded')
