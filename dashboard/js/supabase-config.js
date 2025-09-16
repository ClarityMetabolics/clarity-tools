// File: /dashboard/js/supabase-config.js
// Updated Supabase Configuration for Five Anchors Platform

// Import Supabase client
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

// Supabase configuration - Replace with your actual values
const SUPABASE_URL = 'https://fcoosyveumtkalsdwppg.supabase.co'
const SUPABASE_ANON_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb29zeXZldW10a2Fsc2R3cHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NjQxOTUsImV4cCI6MjA3MzA0MDE5NX0.hukhtamCJx3nlxh_8Sya12sAnwZ6dOGjxp_vXp4ZsBY`

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Authentication helper functions
export class AuthManager {
    constructor() {
        this.currentUser = null
        this.isCoach = false
        this.userProfile = null
        this.init()
    }

    async init() {
        // Check if user is already logged in
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await this.setCurrentUser(user)
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                await this.setCurrentUser(session.user)
                // Redirect based on role
                this.redirectBasedOnRole()
            } else if (event === 'SIGNED_OUT') {
                this.clearCurrentUser()
                window.location.href = './auth.html'
            }
        })
    }

    async setCurrentUser(user) {
        this.currentUser = user
        
        // Get user profile from profiles table
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profile) {
            this.userProfile = profile
            this.isCoach = profile.role === 'coach' || profile.role === 'admin'
        } else if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([{
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || '',
                    role: 'client'
                }])
                .select()
                .single()
            
            if (newProfile) {
                this.userProfile = newProfile
                this.isCoach = false
            }
        }
    }

    clearCurrentUser() {
        this.currentUser = null
        this.userProfile = null
        this.isCoach = false
    }

    redirectBasedOnRole() {
        if (this.isCoach) {
            window.location.href = './coach-dashboard.html'
        } else {
            window.location.href = './index.html'
        }
    }

    // Magic link sign in
    async signInWithEmail(email) {
        const { data, error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: 'https://claritymetabolics.github.io/clarity-tools/dashboard/auth.html'
            }
        })
        return { data, error }
    }

    // Sign out
    async signOut() {
        const { error } = await supabase.auth.signOut()
        if (!error) {
            this.clearCurrentUser()
        }
        return { error }
    }

    // Get current session
    async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession()
        return { session, error }
    }

    getCurrentUserId() {
        return this.currentUser?.id
    }
}

// Database manager that bridges localStorage format with Supabase
export class DatabaseManager {
    constructor() {
        this.authManager = new AuthManager()
    }

    getCurrentUserId() {
        return this.authManager.getCurrentUserId()
    }

    // Save daily check-in in localStorage format to database
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

    // Get check-ins in localStorage format
    async getCheckIns(limit = 30) {
        const userId = this.getCurrentUserId()
        if (!userId) return { data: {}, error: { message: 'Not authenticated' } }

        const { data, error } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('client_id', userId)
            .order('checkin_date', { ascending: false })
            .limit(limit)

        // Transform to localStorage format: { [date]: { date, ratings, notes } }
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

    // Save journal entry in dashboard's 5-field format
    async saveJournalEntry(entryData) {
        const userId = this.getCurrentUserId()
        if (!userId) return { data: null, error: { message: 'Not authenticated' } }

        const { data, error } = await supabase
            .from('journal_entries')
            .insert([{
                client_id: userId,
                date_iso: entryData.dateISO,
                feeling_rating: entryData.rating,
                primary_thought_pattern: entryData.primaryThoughtPattern,
                practice_used: entryData.practiceUsed,
                reflection_text: entryData.reflection
            }])
            .select()

        return { data, error }
    }

    // Get journal entries in localStorage format
    async getJournalEntries(limit = 10) {
        const userId = this.getCurrentUserId()
        if (!userId) return { data: [], error: { message: 'Not authenticated' } }

        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('client_id', userId)
            .order('date_iso', { ascending: false })
            .limit(limit)

        // Transform to localStorage format
        const transformed = []
        if (data) {
            data.forEach(item => {
                transformed.push({
                    dateISO: item.date_iso,
                    rating: item.feeling_rating,
                    primaryThoughtPattern: item.primary_thought_pattern || '',
                    practiceUsed: item.practice_used || '',
                    reflection: item.reflection_text,
                    timestamp: item.created_at
                })
            })
        }

        return { data: transformed, error }
    }

    // Get module access in localStorage format
    async getModuleAccess() {
        const userId = this.getCurrentUserId()
        if (!userId) return { data: null, error: { message: 'Not authenticated' } }

        const { data, error } = await supabase
            .from('module_access')
            .select('*')
            .eq('user_id', userId)

        // Transform to localStorage structure
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
                if (item.module_type === 'fiveAnchors') {
                    if (access.fiveAnchors[item.module_key]) {
                        access.fiveAnchors[item.module_key][item.access_type] = item.unlocked
                    }
                } else if (item.module_type === 'discernmentTools') {
                    if (access.discernmentTools[item.module_key]) {
                        access.discernmentTools[item.module_key].unlocked = item.unlocked
                    }
                }
            })
        }

        return { data: access, error }
    }

    // Update module access (coach only)
    async updateModuleAccess(clientId, moduleType, moduleKey, accessType, unlocked) {
        const coachId = this.getCurrentUserId()
        if (!coachId) return { data: null, error: { message: 'Not authenticated' } }

        const { data, error } = await supabase
            .from('module_access')
            .upsert([{
                user_id: clientId,
                module_type: moduleType,
                module_key: moduleKey,
                access_type: accessType,
                unlocked: unlocked,
                unlocked_at: unlocked ? new Date().toISOString() : null,
                unlocked_by: unlocked ? coachId : null
            }], {
                onConflict: 'user_id,module_type,module_key,access_type'
            })
            .select()

        return { data, error }
    }

    // Get coaching clients (for coaches)
    async getCoachingClients() {
        const coachId = this.getCurrentUserId()
        if (!coachId) return { data: [], error: { message: 'Not authenticated' } }

        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id, email, full_name, coaching_package, sessions_completed, sessions_total, 
                start_date, status, assigned_coach_id, created_at
            `)
            .eq('assigned_coach_id', coachId)
            .eq('role', 'client')

        return { data, error }
    }

    // Get client's latest check-ins (for coaches)
    async getClientCheckIns(clientId, limit = 7) {
        const { data, error } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('client_id', clientId)
            .order('checkin_date', { ascending: false })
            .limit(limit)

        return { data, error }
    }
    // Anchor Statements Database Methods
    async saveAnchorStatements(statementsData) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const saveData = {
                user_id: user.id,
                statements: statementsData.statements,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: existing } = await supabase
                .from('anchor_statements')
                .select('id')
                .eq('user_id', user.id)
                .single();

            let result;
            if (existing) {
                result = await supabase
                    .from('anchor_statements')
                    .update({
                        statements: saveData.statements,
                        updated_at: saveData.updated_at
                    })
                    .eq('user_id', user.id);
            } else {
                result = await supabase
                    .from('anchor_statements')
                    .insert(saveData);
            }

            if (result.error) throw result.error;
            return { data: result.data, error: null };
        } catch (error) {
            console.error('Error saving anchor statements to database:', error); console.error('Error saving anchor statements to database:', error);
        return { data: null, error };
    }
},

async getAnchorStatements() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('anchor_statements')
            .select('statements, updated_at')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return { data: data ? data.statements : {}, error: null };
    } catch (error) {
        console.error('Error loading anchor statements from database:', error);
        return { data: {}, error };
    }
            return { data: null, error };
        }
    },

    async getAnchorStatements() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('anchor_statements')
                .select('statements, updated_at')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return { data: data ? data.statements : {}, error: null };
        } catch (error) {
            console.error('Error loading anchor statements from database:', error);
            return { data: {}, error };
        }
    },
}

// Real-time messaging system
export class MessagingManager {
    constructor() {
        this.authManager = new AuthManager()
        this.activeSubscriptions = new Map()
    }

    getCurrentUserId() {
        return this.authManager.getCurrentUserId()
    }

    // Send message between coach and client
    async sendMessage(recipientId, messageText, messageType = 'text') {
        const senderId = this.getCurrentUserId()
        if (!senderId) return { data: null, error: { message: 'Not authenticated' } }

        const { data, error } = await supabase
            .from('messages')
            .insert([{
                sender_id: senderId,
                recipient_id: recipientId,
                message_text: messageText,
                message_type: messageType
            }])
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey(id, full_name, email),
                recipient:profiles!messages_recipient_id_fkey(id, full_name, email)
            `)

        return { data, error }
    }

    // Get conversation between current user and another user
    async getConversation(otherUserId, limit = 50) {
        const currentUserId = this.getCurrentUserId()
        if (!currentUserId) return { data: [], error: { message: 'Not authenticated' } }
        
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey(id, full_name, email),
                recipient:profiles!messages_recipient_id_fkey(id, full_name, email)
            `)
            .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
            .order('created_at', { ascending: true })
            .limit(limit)

        return { data, error }
    }

    // Subscribe to real-time messages
    subscribeToMessages(otherUserId, onMessage) {
        const currentUserId = this.getCurrentUserId()
        if (!currentUserId) return null
        
        const subscription = supabase
            .channel(`messages-${currentUserId}-${otherUserId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `or(and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId}))`
            }, (payload) => {
                onMessage(payload.new)
            })
            .subscribe()

        this.activeSubscriptions.set(`${currentUserId}-${otherUserId}`, subscription)
        return subscription
    }

    // Mark messages as read
    async markMessagesAsRead(fromUserId) {
        const currentUserId = this.getCurrentUserId()
        if (!currentUserId) return { data: null, error: { message: 'Not authenticated' } }

        const { data, error } = await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('sender_id', fromUserId)
            .eq('recipient_id', currentUserId)
            .is('read_at', null)

        return { data, error }
    }
}

// Hybrid data manager - uses database first, localStorage as fallback
export class HybridDataManager {
    constructor() {
        this.dbManager = new DatabaseManager()
        this.storagePrefix = 'cm_'
        this.isOnline = true
    }

    // Save check-in to both database and localStorage
    async saveCheckIn(checkInData) {
        // Try database first
        const dbResult = await this.dbManager.saveCheckIn(checkInData)
        
        // Always save to localStorage as backup
        const allCheckIns = JSON.parse(localStorage.getItem('dailyCheckIns') || '{}')
        allCheckIns[checkInData.date] = checkInData
        localStorage.setItem('dailyCheckIns', JSON.stringify(allCheckIns))
        
        return dbResult.error ? { data: checkInData, error: null } : dbResult
    }

    // Load check-ins from database, fallback to localStorage
    async getCheckIns() {
        const dbResult = await this.dbManager.getCheckIns()
        
        if (!dbResult.error && Object.keys(dbResult.data).length > 0) {
            return dbResult
        }
        
        // Fallback to localStorage
        const localData = JSON.parse(localStorage.getItem('dailyCheckIns') || '{}')
        return { data: localData, error: null }
    }

    // Save journal entry to both
    async saveJournalEntry(entryData) {
        const dbResult = await this.dbManager.saveJournalEntry(entryData)
        
        // Save to localStorage
        const entries = JSON.parse(localStorage.getItem(this.storagePrefix + 'journal_v1') || '[]')
        entries.unshift(entryData)
        if (entries.length > 30) entries.splice(30)
        localStorage.setItem(this.storagePrefix + 'journal_v1', JSON.stringify(entries))
        
        return dbResult.error ? { data: entryData, error: null } : dbResult
    }

    // Load journal entries
    async getJournalEntries() {
        const dbResult = await this.dbManager.getJournalEntries()
        
        if (!dbResult.error && dbResult.data.length > 0) {
            return dbResult
        }
        
        // Fallback to localStorage
        const localData = JSON.parse(localStorage.getItem(this.storagePrefix + 'journal_v1') || '[]')
        return { data: localData, error: null }
    }

    // Module access
    async getModuleAccess() {
        const dbResult = await this.dbManager.getModuleAccess()
        
        if (!dbResult.error) {
            return dbResult
        }
        
        // Fallback to localStorage simulation
        return {
            data: {
                fiveAnchors: {
                    physical: { guide: true, webTool: false },
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
            },
            error: null
        }
    }

}

// Global managers
export const authManager = new AuthManager()
export const dbManager = new DatabaseManager()
export const messagingManager = new MessagingManager()
export const hybridDataManager = new HybridDataManager()

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
