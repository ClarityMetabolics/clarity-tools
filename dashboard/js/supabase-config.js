// File: /dashboard/js/supabase-config.js
// Supabase Configuration for Five Anchors Platform

// Import Supabase client
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

// Supabase configuration - Replace with your actual values
const SUPABASE_URL = 'https://fcoosyveumtkalsdwppg.supabase.co'
const SUPABASE_ANON_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb29zeXZldW10a2Fsc2R3cHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4ODc5NTAsImV4cCI6MjA1MjQ2Mzk1MH0.gfE6XNfzKVXCOBBrgtR6JnEJ3x4X4y6y4XzYFUDgNIM`
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
            } else if (event === 'SIGNED_OUT') {
                this.clearCurrentUser()
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
            
            // Trigger user loaded event
            document.dispatchEvent(new CustomEvent('userLoaded', {
                detail: { user, profile, isCoach: this.isCoach }
            }))
        }
    }

    clearCurrentUser() {
        this.currentUser = null
        this.userProfile = null
        this.isCoach = false
        
        // Trigger user cleared event
        document.dispatchEvent(new CustomEvent('userCleared'))
    }

    // Magic link sign in
    async signInWithEmail(email) {
        const { data, error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.origin + '/dashboard/'
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
}

// Database helper functions
export class DatabaseManager {
    constructor() {
        this.authManager = new AuthManager()
    }

    // Save daily check-in to database
    async saveCheckIn(checkInData) {
        const { data, error } = await supabase
            .from('daily_checkins')
            .insert([{
                user_id: this.authManager.currentUser?.id,
                date: checkInData.date,
                physical_rating: checkInData.ratings.physical,
                mental_rating: checkInData.ratings.mental,
                emotional_rating: checkInData.ratings.emotional,
                spiritual_rating: checkInData.ratings.spiritual,
                relational_rating: checkInData.ratings.relational,
                physical_notes: checkInData.notes.physical || null,
                mental_notes: checkInData.notes.mental || null,
                emotional_notes: checkInData.notes.emotional || null,
                spiritual_notes: checkInData.notes.spiritual || null,
                relational_notes: checkInData.notes.relational || null
            }])
            .select()

        return { data, error }
    }

    // Get user's check-ins
    async getCheckIns(userId, limit = 30) {
        const { data, error } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('user_id', userId || this.authManager.currentUser?.id)
            .order('date', { ascending: false })
            .limit(limit)

        return { data, error }
    }

    // Save journal entry (client-only, never shared with coaches)
    async saveJournalEntry(entryData) {
        const { data, error } = await supabase
            .from('journal_entries')
            .insert([{
                user_id: this.authManager.currentUser?.id,
                date_iso: entryData.dateISO,
                feeling_rating: entryData.rating,
                thought_pattern: entryData.primaryThoughtPattern,
                practice_used: entryData.practiceUsed,
                reflection_text: entryData.reflection
            }])
            .select()

        return { data, error }
    }

    // Get user's journal entries (user can only see their own)
    async getJournalEntries(limit = 10) {
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', this.authManager.currentUser?.id)
            .order('date_iso', { ascending: false })
            .limit(limit)

        return { data, error }
    }

    // Get coaching sessions for a user
    async getCoachingSessions(userId = null) {
        const targetUserId = userId || this.authManager.currentUser?.id
        
        const { data, error } = await supabase
            .from('coaching_sessions')
            .select(`
                *,
                client:profiles!coaching_sessions_client_id_fkey(id, name, email),
                coach:profiles!coaching_sessions_coach_id_fkey(id, name, email)
            `)
            .eq('client_id', targetUserId)
            .order('scheduled_time', { ascending: false })

        return { data, error }
    }

    // Get module access for a user
    async getModuleAccess(userId = null) {
        const targetUserId = userId || this.authManager.currentUser?.id
        
        const { data, error } = await supabase
            .from('enhancement_modules')
            .select('*')
            .eq('user_id', targetUserId)

        return { data, error }
    }

    // Update module access (coach only)
    async updateModuleAccess(userId, moduleType, moduleKey, accessType, unlocked) {
        if (!this.authManager.isCoach) {
            return { data: null, error: { message: 'Unauthorized: Coach access required' } }
        }

        const { data, error } = await supabase
            .from('enhancement_modules')
            .upsert([{
                user_id: userId,
                module_type: moduleType,
                module_key: moduleKey,
                access_type: accessType,
                unlocked: unlocked
            }], {
                onConflict: 'user_id,module_type,module_key,access_type'
            })
            .select()

        return { data, error }
    }
}

// Real-time messaging system
export class MessagingManager {
    constructor() {
        this.authManager = new AuthManager()
        this.activeSubscriptions = new Map()
        this.messageHandlers = new Map()
    }

    // Send message between coach and client
    async sendMessage(recipientId, messageText, messageType = 'text') {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                sender_id: this.authManager.currentUser?.id,
                recipient_id: recipientId,
                message_text: messageText,
                message_type: messageType
            }])
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey(id, name, email),
                recipient:profiles!messages_recipient_id_fkey(id, name, email)
            `)

        return { data, error }
    }

    // Get conversation between two users
    async getConversation(otherUserId, limit = 50) {
        const currentUserId = this.authManager.currentUser?.id
        
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey(id, name, email),
                recipient:profiles!messages_recipient_id_fkey(id, name, email)
            `)
            .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
            .order('created_at', { ascending: true })
            .limit(limit)

        return { data, error }
    }

    // Subscribe to real-time messages
    subscribeToMessages(otherUserId, onMessage) {
        const currentUserId = this.authManager.currentUser?.id
        
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

    // Unsubscribe from messages
    unsubscribeFromMessages(otherUserId) {
        const currentUserId = this.authManager.currentUser?.id
        const key = `${currentUserId}-${otherUserId}`
        
        const subscription = this.activeSubscriptions.get(key)
        if (subscription) {
            supabase.removeChannel(subscription)
            this.activeSubscriptions.delete(key)
        }
    }

    // Mark messages as read
    async markMessagesAsRead(fromUserId) {
        const { data, error } = await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('sender_id', fromUserId)
            .eq('recipient_id', this.authManager.currentUser?.id)
            .is('read_at', null)

        return { data, error }
    }

    // Get unread message count
    async getUnreadCount() {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', this.authManager.currentUser?.id)
            .is('read_at', null)

        return { count, error }
    }
}

// Global managers - initialize once
export const authManager = new AuthManager()
export const dbManager = new DatabaseManager()
export const messagingManager = new MessagingManager()

// Utility functions
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
