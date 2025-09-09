// dashboard/js/dashboard.js
// Main dashboard functionality module for Five Anchors Dashboard

class FiveAnchorsDashboard {
    constructor() {
        this.currentDate = new Date();
        this.dailyRatings = {};
        this.checkInData = {};
        this.init();
    }

    init() {
        this.loadStoredData();
        this.setupEventListeners();
        this.initializeDashboardElements();
    }

    loadStoredData() {
        const stored = localStorage.getItem('dailyCheckIns');
        this.checkInData = stored ? JSON.parse(stored) : {};
        this.loadTodaysData();
    }

    loadTodaysData() {
        const today = this.getTodayString();
        const todayData = this.checkInData[today];
        
        if (todayData) {
            this.dailyRatings = todayData.ratings || {};
            this.loadRatingsToUI();
            this.loadNotesToUI(todayData.notes || {});
        }
    }

    setupEventListeners() {
        // Rating button listeners
        this.setupRatingButtons();
        
        // Action button listeners
        const saveBtn = document.querySelector('.save-checkin-btn');
        const clearBtn = document.querySelector('.clear-checkin-btn');
        
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveCheckIn());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearCheckIn());

        // Encouragement button listeners
        const encouragementBtns = document.querySelectorAll('.encouragement-btn');
        encouragementBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const anchor = e.target.getAttribute('onclick')?.match(/showEncouragement\(['"](.+?)['"]\)/)?.[1];
                if (anchor) this.showEncouragement(anchor);
            });
        });

        // Listen for section changes
        document.addEventListener('sectionChanged', (e) => {
            if (e.detail.sectionName === 'dashboard') {
                this.refreshDashboard();
            }
        });
    }

    setupRatingButtons() {
        const ratingButtons = document.querySelectorAll('.rating-btn');
        
        ratingButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const anchorInput = e.target.closest('.anchor-input');
                const anchor = anchorInput?.dataset.anchor;
                const value = parseInt(e.target.dataset.value);
                
                if (anchor && value) {
                    this.handleRatingClick(anchorInput, anchor, value);
                }
            });
        });
    }

    handleRatingClick(anchorInput, anchor, value) {
        // Remove selected class from siblings
        const siblings = anchorInput.querySelectorAll('.rating-btn');
        siblings.forEach(btn => btn.classList.remove('selected'));
        
        // Add selected class to clicked button
        event.target.classList.add('selected');
        
        // Update internal state
        this.dailyRatings[anchor] = value;
        
        // Update progress circle
        this.updateAnchorProgress(anchor, value);
        
        // Generate new recommendations
        this.generateRecommendations();
    }

    updateAnchorProgress(anchor, rating) {
        const circle = document.querySelector(`.anchor-circle[data-anchor="${anchor}"] .circle-progress`);
        const ratingDisplay = circle?.querySelector('.anchor-rating');
        
        if (circle && ratingDisplay) {
            circle.dataset.rating = rating;
            ratingDisplay.textContent = rating;
            
            // Calculate opacity based on rating (0.2 to 1.0)
            const opacity = rating > 0 ? (rating / 5) * 0.8 + 0.2 : 0.1;
            circle.style.opacity = opacity;
        }
        
        this.updateOverallWellness();
    }

    updateOverallWellness() {
        const circles = document.querySelectorAll('.circle-progress');
        let totalRating = 0;
        let ratedCount = 0;
        
        circles.forEach(circle => {
            const rating = parseInt(circle.dataset.rating);
            if (rating > 0) {
                totalRating += rating;
                ratedCount++;
            }
        });
        
        const overallRatingElement = document.getElementById('overall-rating');
        const wellnessFill = document.querySelector('.wellness-fill');
        
        if (overallRatingElement && wellnessFill) {
            if (ratedCount === 0) {
                overallRatingElement.textContent = 'Not Rated';
                wellnessFill.style.width = '0%';
            } else {
                const average = totalRating / ratedCount;
                const percentage = (average / 5) * 100;
                
                overallRatingElement.textContent = `${average.toFixed(1)}/5`;
                wellnessFill.style.width = `${percentage}%`;
            }
        }
    }

    saveCheckIn() {
        const today = this.getTodayString();
        const checkInData = {
            date: today,
            ratings: { ...this.dailyRatings },
            notes: this.collectNotes()
        };
        
        // Save to localStorage
        this.checkInData[today] = checkInData;
        localStorage.setItem('dailyCheckIns', JSON.stringify(this.checkInData));
        
        // Show confirmation
        this.showNotification('Daily check-in saved successfully!', 'success');
        
        // Update recommendations
        this.generateRecommendations();
    }

    clearCheckIn() {
        if (confirm('Are you sure you want to clear all ratings and notes?')) {
            // Clear UI
            document.querySelectorAll('.rating-btn.selected').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            document.querySelectorAll('.anchor-notes').forEach(textarea => {
                textarea.value = '';
            });
            
            // Reset progress circles
            document.querySelectorAll('.circle-progress').forEach(circle => {
                circle.dataset.rating = '0';
                const ratingDisplay = circle.querySelector('.anchor-rating');
                if (ratingDisplay) ratingDisplay.textContent = '-';
                circle.style.opacity = '0.1';
            });
            
            // Clear internal state
            this.dailyRatings = {};
            
            this.updateOverallWellness();
            this.generateRecommendations();
            
            this.showNotification('Check-in cleared', 'info');
        }
    }

    collectNotes() {
        const notes = {};
        const anchorInputs = document.querySelectorAll('.anchor-input');
        
        anchorInputs.forEach(input => {
            const anchor = input.dataset.anchor;
            const notesField = input.querySelector('.anchor-notes');
            const noteText = notesField?.value.trim();
            
            if (noteText) {
                notes[anchor] = noteText;
            }
        });
        
        return notes;
    }

    loadRatingsToUI() {
        Object.entries(this.dailyRatings).forEach(([anchor, rating]) => {
            const anchorInput = document.querySelector(`.anchor-input[data-anchor="${anchor}"]`);
            if (anchorInput) {
                const ratingBtn = anchorInput.querySelector(`[data-value="${rating}"]`);
                if (ratingBtn) {
                    ratingBtn.classList.add('selected');
                    this.updateAnchorProgress(anchor, rating);
                }
            }
        });
    }

    loadNotesToUI(notes) {
        Object.entries(notes).forEach(([anchor, note]) => {
            const anchorInput = document.querySelector(`.anchor-input[data-anchor="${anchor}"]`);
            if (anchorInput) {
                const notesField = anchorInput.querySelector('.anchor-notes');
                if (notesField) notesField.value = note;
            }
        });
    }

    generateRecommendations() {
        const container = document.getElementById('focus-recommendations');
        if (!container) return;

        const hasRatings = Object.keys(this.dailyRatings).length > 0;
        
        if (!hasRatings) {
            container.innerHTML = '<p class="focus-message">Complete your daily check-in to receive personalized recommendations.</p>';
            return;
        }
        
        // Find lowest rated anchor(s)
        const ratings = Object.values(this.dailyRatings);
        const lowestRating = Math.min(...ratings);
        const needsAttention = Object.entries(this.dailyRatings)
            .filter(([anchor, rating]) => rating === lowestRating)
            .map(([anchor]) => anchor);
        
        let recommendations = [];
        
        needsAttention.forEach(anchor => {
            const recommendation = this.getAnchorRecommendation(anchor, lowestRating);
            if (recommendation) {
                recommendations.push(recommendation);
            }
        });
        
        // Display recommendations
        if (recommendations.length > 0) {
            container.innerHTML = recommendations.map(rec => `
                <div class="focus-recommendation">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    ${rec.action ? `<p><strong>Try this:</strong> ${rec.action}</p>` : ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="focus-message">Great work! All your anchors are showing strength today.</p>';
        }
    }

    getAnchorRecommendation(anchor, rating) {
        const recommendations = {
            physical: {
                title: '🧭 Physical Anchor Needs Attention',
                description: 'Your body is asking for care and attention today.',
                action: rating <= 2 ? 
                    'Take 5 deep breaths, drink a glass of water, and do 3 gentle stretches.' :
                    'Try a short walk or some light movement to reconnect with your body.'
            },
            mental: {
                title: '👓 Mental Anchor Needs Clarity',
                description: 'Your mind could use some clearing and focus.',
                action: rating <= 2 ? 
                    'Write down 3 things that feel overwhelming, then identify one small action for each.' :
                    'Take 10 minutes to organize your thoughts or practice mindfulness.'
            },
            emotional: {
                title: '🪣 Emotional Anchor Needs Support',
                description: 'Your emotional well-being deserves attention today.',
                action: rating <= 2 ? 
                    'Acknowledge how you\'re feeling without judgment and consider reaching out to someone who cares.' :
                    'Practice self-compassion and do something nurturing for yourself.'
            },
            spiritual: {
                title: '✨ Spiritual Anchor Needs Connection',
                description: 'Your spiritual foundation could use strengthening.',
                action: rating <= 2 ? 
                    'Spend 5 minutes in prayer, meditation, or reading something meaningful.' :
                    'Take a moment to reflect on what gives your life purpose and meaning.'
            },
            relational: {
                title: '🌐 Relational Anchor Needs Care',
                description: 'Your connections with others need attention.',
                action: rating <= 2 ? 
                    'Reach out to one person you care about, even just to say hello.' :
                    'Consider how you can show appreciation to someone important in your life.'
            }
        };
        
        return recommendations[anchor];
    }

    showEncouragement(anchor) {
        const encouragements = this.getEncouragementMessage(anchor);
        
        const modal = document.createElement('div');
        modal.className = 'encouragement-modal';
        modal.innerHTML = `
            <div class="encouragement-content">
                <h3 class="encouragement-title">${encouragements.title}</h3>
                <p class="encouragement-message">${encouragements.message}</p>
                <button class="encouragement-close">Thank You ✨</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.encouragement-close');
        closeBtn.addEventListener('click', () => this.closeEncouragement());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEncouragement();
            }
        });
    }

    closeEncouragement() {
        const modal = document.querySelector('.encouragement-modal');
        if (modal) {
            modal.remove();
        }
    }

    getEncouragementMessage(anchor) {
        const dayOfWeek = new Date().getDay();
        const messages = {
            physical: {
                title: "🧭 Grounding Encouragement",
                messages: [
                    "Sunday Stillness: Your body deserves rest and restoration today. Listen to what it needs and honor that wisdom.",
                    "Monday Motivation: Your physical anchor is the foundation for everything else. Honor it today.",
                    "Tuesday Truth: You don't have to be perfect - just present in your body.",
                    "Wednesday Wisdom: Small movements create big changes. What tiny step can you take?",
                    "Thursday Thought: Your body holds wisdom. What is it telling you today?",
                    "Friday Focus: You've carried yourself through another week. That's worth celebrating.",
                    "Saturday Stillness: Rest is not lazy - it's sacred. Your body deserves restoration."
                ]
            },
            mental: {
                title: "👓 Clarity Encouragement", 
                messages: [
                    "Sunday Serenity: Let your mind rest today. Clarity often comes in quiet, unhurried moments.",
                    "Monday Motivation: You have everything you need to think clearly. Start with one thought.",
                    "Tuesday Troubleshooting: Confusion is temporary. Clarity is coming.",
                    "Wednesday Wisdom: The wise mind observes thoughts without becoming them.",
                    "Thursday Thought: Your perspective is powerful. Choose thoughts that serve you.",
                    "Friday Focus: You've processed so much this week. Your mental resilience is beautiful.",
                    "Saturday Stillness: Sometimes the clearest thinking happens in quiet moments."
                ]
            },
            emotional: {
                title: "🪣 Stability Encouragement",
                messages: [
                    "Sunday Softness: Your emotions are welcome here today. Feel deeply, rest fully, trust the process.",
                    "Monday Motivation: You can feel deeply and still stand strong. That's emotional maturity.",
                    "Tuesday Troubleshooting: It's okay to not be okay. Feelings flow through, they don't define you.",
                    "Wednesday Wisdom: Stability doesn't mean never feeling shaken - it means knowing how to return to center.",
                    "Thursday Thought: Your emotional world is rich and valid. All feelings have a place.",
                    "Friday Focus: You've navigated another week of feelings with grace. That takes courage.",
                    "Saturday Stillness: Rest allows emotions to settle naturally. Give yourself this gift."
                ]
            },
            spiritual: {
                title: "✨ Communion Encouragement",
                messages: [
                    "Sunday Sanctuary: This is a day set apart for rest and connection with the Divine. Your soul knows this rhythm.",
                    "Monday Motivation: Your spiritual journey is unique and beautiful. Trust the path you're on.",
                    "Tuesday Truth: Even in spiritual dryness, you are not alone. God is working in the waiting.",
                    "Wednesday Wisdom: Prayer doesn't have to be perfect. God hears the heart behind every word.",
                    "Thursday Thought: You are fearfully and wonderfully made. This truth anchors everything.",
                    "Friday Focus: Look for the sacred in ordinary moments. God is present in your daily life.",
                    "Saturday Stillness: Sabbath rest is spiritual medicine. Your soul needs this rhythm."
                ]
            },
            relational: {
                title: "🌐 Harmony Encouragement",
                messages: [
                    "Sunday Sabbath: Rest is a gift you give not just to yourself, but to all your relationships. You model healthy boundaries.",
                    "Monday Motivation: Healthy relationships begin with healthy boundaries. You get to choose.",
                    "Tuesday Troubleshooting: Not everyone will understand your journey, and that's okay.",
                    "Wednesday Wisdom: True connection happens when we show up as ourselves.",
                    "Thursday Thought: You attract what you embody. Be the energy you want to receive.",
                    "Friday Focus: Relationships are gardens - they need tending, not perfection.",
                    "Saturday Stillness: Sometimes the best gift you can give others is taking care of yourself."
                ]
            }
        };
        
        return {
            title: messages[anchor].title,
            message: messages[anchor].messages[dayOfWeek]
        };
    }

    initializeDashboardElements() {
        this.updateCurrentDate();
        this.generateRecommendations();
        this.updateOverallWellness();
    }

    updateCurrentDate() {
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            currentDateElement.textContent = now.toLocaleDateString('en-US', options);
        }
    }

    refreshDashboard() {
        this.loadTodaysData();
        this.updateOverallWellness();
        this.generateRecommendations();
    }

    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
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
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize dashboard when DOM is ready
let fiveAnchorsDashboard = null;

// Global function for backward compatibility
window.showEncouragement = function(anchor) {
    if (fiveAnchorsDashboard) {
        fiveAnchorsDashboard.showEncouragement(anchor);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    fiveAnchorsDashboard = new FiveAnchorsDashboard();
});

// Export for global access
window.FiveAnchorsDashboard = FiveAnchorsDashboard;
