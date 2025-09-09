// dashboard/js/navigation.js
// Navigation management module for Five Anchors Dashboard

class DashboardNavigation {
    constructor() {
        this.currentSection = 'dashboard';
        this.navItems = [];
        this.sections = [];
        this.init();
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadSavedSection();
    }

    cacheElements() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.sections = document.querySelectorAll('.section');
    }

    setupEventListeners() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionName = this.getSectionFromNavItem(item);
                if (sectionName) {
                    this.showSection(sectionName);
                }
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.loadSavedSection();
        });
    }

    getSectionFromNavItem(item) {
        // Extract section name from onclick attribute or data attribute
        const onclick = item.getAttribute('onclick');
        if (onclick) {
            const match = onclick.match(/showSection\(['"](.+?)['"]\)/);
            return match ? match[1] : null;
        }
        return item.dataset.section;
    }

    showSection(sectionName) {
        // Validate section exists
        const targetSection = document.getElementById(sectionName);
        if (!targetSection) {
            console.warn(`Section ${sectionName} not found`);
            return;
        }

        // Hide all sections
        this.sections.forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav items
        this.navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Show target section
        targetSection.classList.add('active');

        // Add active class to corresponding nav item
        const activeNavItem = this.findNavItemForSection(sectionName);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Update current section
        this.currentSection = sectionName;
        this.saveCurrentSection();

        // Trigger section-specific initialization
        this.triggerSectionInit(sectionName);
    }

    findNavItemForSection(sectionName) {
        return Array.from(this.navItems).find(item => {
            const onclick = item.getAttribute('onclick');
            if (onclick) {
                return onclick.includes(`'${sectionName}'`) || onclick.includes(`"${sectionName}"`);
            }
            return item.dataset.section === sectionName;
        });
    }

    triggerSectionInit(sectionName) {
        // Dispatch custom event for section-specific initialization
        const event = new CustomEvent('sectionChanged', { 
            detail: { sectionName } 
        });
        document.dispatchEvent(event);

        // Call section-specific init functions if they exist
        const initFunctionName = `init${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}Section`;
        if (window[initFunctionName] && typeof window[initFunctionName] === 'function') {
            window[initFunctionName]();
        }
    }

    saveCurrentSection() {
        localStorage.setItem('currentSection', this.currentSection);
    }

    loadSavedSection() {
        const savedSection = localStorage.getItem('currentSection');
        if (savedSection && document.getElementById(savedSection)) {
            this.showSection(savedSection);
        } else {
            this.showSection('dashboard');
        }
    }

    getCurrentSection() {
        return this.currentSection;
    }
}

// Initialize navigation when DOM is ready
let dashboardNav = null;

document.addEventListener('DOMContentLoaded', () => {
    dashboardNav = new DashboardNavigation();
});

// Export for global access
window.DashboardNavigation = DashboardNavigation;
