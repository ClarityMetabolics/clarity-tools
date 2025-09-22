// File: /dashboard/js/supabase-config.js
// FIXED: Authentication and Database Integration for Five Anchors Platform

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

// Supabase configuration
const SUPABASE_URL = 'https://fcoosyveumtkalsdwppg.supabase.co'
const SUPABASE_ANON_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb29zeXZldW10a2Fsc2R3cHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NjQxOTUsImV4cCI6MjA3MzA0MDE5NX0.hukhtamCJx3nlxh_8Sya12sAnwZ6dOGjxp_vXp4ZsBY`

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// FIXED: Global auth state management
class GlobalAuthManager {
    constructor() {
        this.currentUser = null
        this.userProfile = null
        this.isCoach = false
        this.isReady = false
        this.initPromise = null
        
        // Make globally available immediately
        if (typeof window !== 'undefined') {
            window.authManager = this
            window.getCurrentUserId = () => this.getCurrentUserId()
            window.getCurrentUserProfile = () => this.userProfile
            window.isCoach = () => this.isCoach
        }
    }

    async init() {
        if (this.initPromise) return this.initPromise
        
        this.initPromise = this._initialize()
        return this.initPromise
    }

    async _initialize() {
        try {
            console.log('🔐 Initializing global auth manager...')
            
            // Check current session
            const { data: { user }, error } = await supabase.auth.getUser()
            
            if (error) {
                console.error('Auth check failed:', error)
                this.redirectToAuth()
                return false
            }

            if (!user) {
                console.log('No authenticated user found')
                this.redirectToAuth()
                return false
            }

            console.log('✅ User authenticated:', user.email)
            
            // Set user and get profile
            await this.setCurrentUser(user)
            
            // Set up auth state listener
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    this.clearUser()
                    this.redirectToAuth()
                } else if (event === 'SIGNED_IN' && session?.user) {
                    await this.setCurrentUser(session.user)
                }
            })

            this.isReady = true
            console.log('✅ Auth manager fully initialized')
            return true
            
        } catch (error) {
            console.error('Fatal auth initialization error:', error)
            this.redirectToAuth()
            return false
        }
    }

    async setCurrentUser(user) {
        this.currentUser = user
        
        try {
            // Get user profile
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

            console.log('👤 User profile loaded:', {
                id: this.userProfile?.id,
                email: this.userProfile?.email,
                role: this.userProfile?.role,
                isCoach: this.isCoach
            })

        } catch (error) {
            console.error('Error loading user profile:', error)
        }
    }

    clearUser() {
        this.currentUser = null
        this.userProfile = null
        this.isCoach = false
        this.isReady = false
    }

    redirectToAuth() {
        const currentPath = window.location.pathname
        if (!currentPath.includes('auth.html')) {
            window.location.href = './auth.html'
        }
    }

    getCurrentUserId() {
        if (!this.currentUser) {
            console.warn('⚠️ getCurrentUserId called but no user authenticated')
            return null
        }
        return this.currentUser.id
    }

    async signOut() {
        const { error } = await supabase.auth.signOut()
        if (!error) {
            this.clearUser()
            this.redirectToAuth()
        }
        return { error }
    }
}

// FIXED: Database manager with proper auth integration
export class DatabaseManager {
    constructor() {
        this.authManager = window.authManager || globalAuthManager
    }

    getCurrentUserId() {
        const userId = this.authManager.getCurrentUserId()
        if (!userId) {
            console.error('❌ Database operation attempted without auth')
        }
        return userId
    }

    // Save anchor statement with JSONB structure matching schema
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

            // Upsert with JSONB structure
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
                console.error('Database error saving anchor statement:', error)
                return { data: null, error }
            }

            console.log(`✅ Anchor statement saved: ${anchorType}`)
            return { data, error: null }

        } catch (error) {
            console.error('Error saving anchor statement:', error)
            return { data: null, error }
        }
    }

    // Get anchor statements from JSONB structure
    async getAnchorStatements() {
        const userId = this.getCurrentUserId()
        if (!userId) return { data: [], error: { message: 'Not authenticated' } }

        try {
            const { data, error } = await supabase
                .from('anchor_statements')
                .select('statements')
                .eq('user_id', userId)
                .single()

            if (error && error.code === 'PGRST116') {
                // No statements yet
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

    // Update sharing status for anchor statement
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

            return { data, error }

        } catch (error) {
            console.error('Error updating sharing status:', error)
            return { data: null, error }
        }
    }

    // FIXED: Module access functions for coach unlock functionality
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

            console.log(`✅ Module unlocked successfully: ${moduleKey} for ${clientId}`)
            return { data, error: null }

        } catch (error) {
            console.error('Error in unlockModuleForClient:', error)
            return { data: null, error }
        }
    }

    // Get module access for client
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

    // Coach functions
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

            return { data: data || [], error }

        } catch (error) {
            console.error('Error loading coach clients:', error)
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

            if (error) return { data: {}, error }

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
            console.error('Error loading client anchor statements:', error)
            return { data: {}, error }
        }
    }

    // Daily check-ins and other existing functions remain the same...
    async saveCheckIn(checkInData) {
        const userId = this.getCurrentUserId()
        if (!userId) return { data: null, error: { message: 'Not authenticated' } }

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

        return { data, error }
    }

    async getCheckIns(limit = 30) {
        const userId = this.getCurrentUserId()
        if (!userId) return { data: {}, error: { message: 'Not authenticated' } }

        const { data, error } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('client_id', userId)
            .order('checkin_date', { ascending: false })
            .limit(limit)

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

        return { data: transformed, error }
    }
}

// Create and initialize global instances
export const globalAuthManager = new GlobalAuthManager()
export const dbManager = new DatabaseManager()

// Global initialization function
export async function initializeAuth() {
    console.log('🚀 Starting auth initialization...')
    
    const success = await globalAuthManager.init()
    
    if (success) {
        console.log('✅ Auth initialization complete')
        
        // Make database manager globally available
        if (typeof window !== 'undefined') {
            window.dbManager = dbManager
        }
        
        return true
    } else {
        console.error('❌ Auth initialization failed')
        return false
    }
}

// Utility function for notifications
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

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    // Initialize immediately and make available
    window.addEventListener('DOMContentLoaded', () => {
        initializeAuth().then(success => {
            if (success) {
                console.log('🎉 Global auth ready for all dashboard pages')
                document.body.style.visibility = 'visible'
            }
        })
    })
}
