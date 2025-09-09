// dashboard/js/theme.js
// Theme management module for Five Anchors Dashboard

class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.init();
    }

    init() {
        this.loadSavedTheme();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('theme-toggle') || document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const body = document.body;
        const themeIcon = document.getElementById('theme-icon');
        
        if (body.getAttribute('data-theme') === 'dark') {
            this.setTheme('light');
        } else {
            this.setTheme('dark');
        }
    }

    setTheme(theme) {
        const body = document.body;
        const themeIcon = document.getElementById('theme-icon');
        
        if (theme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            if (themeIcon) themeIcon.textContent = '☀️';
            this.currentTheme = 'dark';
        } else {
            body.removeAttribute('data-theme');
            if (themeIcon) themeIcon.textContent = '🌙';
            this.currentTheme = 'light';
        }
        
        this.saveTheme();
    }

    saveTheme() {
        localStorage.setItem('theme', this.currentTheme);
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager when DOM is ready
let themeManager = null;

// Global function for backward compatibility
window.toggleTheme = function() {
    if (themeManager) {
        themeManager.toggleTheme();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
});

// Export for global access
window.ThemeManager = ThemeManager;
