// User Visit Tracker
// Tracks user visit history, session behavior, and cross-page journey

class UserVisitTracker {
    constructor() {
        this.visitData = {};
        this.currentSession = {};
        this.isInitialized = false;
        this.debugMode = window.DYNAMIC_DEBUG || false;
        this.storageKey = 'infetech_user_visits';
        this.sessionKey = 'infetech_session_data';
    }

    // Initialize the visit tracker
    init() {
        if (this.isInitialized) return;
        
        try {
            // Load existing visit data
            this.loadVisitData();
            
            // Track current page visit
            this.trackCurrentVisit();
            
            // Track session behavior
            this.trackSessionBehavior();
            
            // Save updated data
            this.saveVisitData();
            
            // Update debug panel
            this.updateDebugPanel();
            
            // Trigger visit-based events
            this.triggerVisitEvents();
            
            this.isInitialized = true;
            
            if (this.debugMode) {
                console.log('User Visit Tracker initialized:', this.visitData);
            }
            
        } catch (error) {
            console.error('Failed to initialize User Visit Tracker:', error);
        }
    }

    // Load visit data from localStorage
    loadVisitData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.visitData = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load visit data:', error);
            this.visitData = {};
        }
    }

    // Save visit data to localStorage
    saveVisitData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.visitData));
        } catch (error) {
            console.warn('Failed to save visit data:', error);
        }
    }

    // Track current page visit
    trackCurrentVisit() {
        const currentPage = window.location.pathname;
        const currentTime = Date.now();
        
        // Initialize page data if not exists
        if (!this.visitData.pages) {
            this.visitData.pages = {};
        }
        
        if (!this.visitData.pages[currentPage]) {
            this.visitData.pages[currentPage] = {
                visits: 0,
                firstVisit: currentTime,
                lastVisit: currentTime,
                totalTime: 0
            };
        }
        
        // Update page visit data
        const pageData = this.visitData.pages[currentPage];
        pageData.visits += 1;
        pageData.lastVisit = currentTime;
        
        // Update overall visit data
        if (!this.visitData.totalVisits) {
            this.visitData.totalVisits = 0;
            this.visitData.firstVisit = currentTime;
        }
        
        this.visitData.totalVisits += 1;
        this.visitData.lastVisit = currentTime;
        
        // Track visit frequency
        this.trackVisitFrequency();
        
        // Track page categories
        this.trackPageCategories(currentPage);
    }

    // Track visit frequency patterns
    trackVisitFrequency() {
        const visitCount = this.visitData.totalVisits;
        
        if (visitCount === 1) {
            this.visitData.visitType = 'first-time';
        } else if (visitCount <= 3) {
            this.visitData.visitType = 'returning';
        } else if (visitCount <= 10) {
            this.visitData.visitType = 'regular';
        } else {
            this.visitData.visitType = 'loyal';
        }
    }

    // Track page categories for interest analysis
    trackPageCategories(page) {
        if (!this.visitData.categories) {
            this.visitData.categories = {};
        }
        
        // Define page categories
        const categories = {
            'seo': ['seo', 'search', 'optimization'],
            'app-development': ['app', 'development', 'mobile', 'ios', 'android'],
            'social-media': ['social', 'instagram', 'facebook', 'marketing'],
            'wordpress': ['wordpress', 'website', 'development'],
            'ai-products': ['ai', 'asset', 'loyalty', 'tracking'],
            'projects': ['project', 'case', 'study'],
            'blog': ['blog', 'article'],
            'about': ['about', 'team', 'company']
        };
        
        // Find matching category
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => page.toLowerCase().includes(keyword))) {
                if (!this.visitData.categories[category]) {
                    this.visitData.categories[category] = 0;
                }
                this.visitData.categories[category] += 1;
                break;
            }
        }
    }

    // Track session behavior
    trackSessionBehavior() {
        const sessionId = this.getSessionId();
        const currentTime = Date.now();
        
        // Initialize session data
        if (!this.currentSession.id) {
            this.currentSession.id = sessionId;
            this.currentSession.startTime = currentTime;
            this.currentSession.pages = [];
        }
        
        // Track current page in session
        const currentPage = window.location.pathname;
        if (!this.currentSession.pages.includes(currentPage)) {
            this.currentSession.pages.push(currentPage);
        }
        
        // Track session duration
        this.currentSession.duration = currentTime - this.currentSession.startTime;
        
        // Save session data
        this.saveSessionData();
    }

    // Generate unique session ID
    getSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Save session data
    saveSessionData() {
        try {
            sessionStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));
        } catch (error) {
            console.warn('Failed to save session data:', error);
        }
    }

    // Get visit count for current page
    getCurrentPageVisits() {
        const currentPage = window.location.pathname;
        return this.visitData.pages && this.visitData.pages[currentPage] ? 
            this.visitData.pages[currentPage].visits : 0;
    }

    // Get total visit count
    getTotalVisits() {
        return this.visitData.totalVisits || 0;
    }

    // Get visit type (first-time, returning, regular, loyal)
    getVisitType() {
        return this.visitData.visitType || 'first-time';
    }

    // Get days since first visit
    getDaysSinceFirstVisit() {
        if (!this.visitData.firstVisit) return 0;
        const days = Math.floor((Date.now() - this.visitData.firstVisit) / (1000 * 60 * 60 * 24));
        return days;
    }

    // Get user interests based on page visits
    getUserInterests() {
        if (!this.visitData.categories) return [];
        
        const interests = [];
        const categories = this.visitData.categories;
        
        // Find categories with highest visit counts
        const sortedCategories = Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        
        return sortedCategories.map(([category, count]) => ({
            category: category,
            visits: count
        }));
    }

    // Check if user has visited specific page
    hasVisitedPage(page) {
        return this.visitData.pages && this.visitData.pages[page] && this.visitData.pages[page].visits > 0;
    }

    // Check if user has visited specific category
    hasVisitedCategory(category) {
        return this.visitData.categories && this.visitData.categories[category] && this.visitData.categories[category] > 0;
    }

    // Get visit-based content variations
    getVisitContent() {
        const visitType = this.getVisitType();
        const totalVisits = this.getTotalVisits();
        const interests = this.getUserInterests();
        
        // Define content variations based on visit behavior
        const contentVariations = {
            'first-time': {
                headline: 'Welcome to Infetech - Expert Technology Solutions',
                description: 'Discover how our comprehensive technology services can transform your business. We specialize in SEO, app development, and digital marketing.',
                cta: 'Get Started Today',
                urgency: 'low',
                focus: 'introduction'
            },
            'returning': {
                headline: 'Welcome Back! Ready to Grow Your Business?',
                description: 'We\'re glad you\'re back! Let\'s discuss how our proven solutions can help you achieve your business goals.',
                cta: 'Let\'s Discuss Your Project',
                urgency: 'medium',
                focus: 'engagement'
            },
            'regular': {
                headline: 'Trusted Partner for Your Digital Success',
                description: 'You\'ve seen our work. Now let\'s make it work for you. Our team is ready to deliver results that drive your business forward.',
                cta: 'Start Your Project Now',
                urgency: 'high',
                focus: 'conversion'
            },
            'loyal': {
                headline: 'Your Success is Our Priority',
                description: 'Thank you for your continued trust. We\'re committed to delivering exceptional results that exceed your expectations.',
                cta: 'Get Your Custom Quote',
                urgency: 'high',
                focus: 'loyalty'
            }
        };
        
        // Get base content for visit type
        let content = contentVariations[visitType] || contentVariations['first-time'];
        
        // Customize based on user interests
        if (interests.length > 0) {
            const topInterest = interests[0];
            content = this.customizeContentByInterest(content, topInterest.category);
        }
        
        return content;
    }

    // Customize content based on user interests
    customizeContentByInterest(baseContent, interest) {
        const interestCustomizations = {
            'seo': {
                headline: baseContent.headline.replace('Technology Solutions', 'SEO Services'),
                description: 'Expert SEO services to boost your search rankings and drive organic traffic.',
                cta: 'Get SEO Audit'
            },
            'app-development': {
                headline: baseContent.headline.replace('Technology Solutions', 'App Development'),
                description: 'Custom mobile app development services for iOS and Android platforms.',
                cta: 'Start App Project'
            },
            'social-media': {
                headline: baseContent.headline.replace('Technology Solutions', 'Social Media Marketing'),
                description: 'Professional social media management and marketing services.',
                cta: 'Get Social Strategy'
            },
            'wordpress': {
                headline: baseContent.headline.replace('Technology Solutions', 'WordPress Development'),
                description: 'Custom WordPress website development and optimization services.',
                cta: 'Get WordPress Quote'
            },
            'ai-products': {
                headline: baseContent.headline.replace('Technology Solutions', 'AI-Powered Solutions'),
                description: 'Cutting-edge AI solutions for asset tracking, loyalty management, and automation.',
                cta: 'Explore AI Solutions'
            }
        };
        
        return interestCustomizations[interest] || baseContent;
    }

    // Update debug panel with visit information
    updateDebugPanel() {
        const elements = {
            'visit-count': this.getTotalVisits(),
            'last-visit': this.visitData.lastVisit ? 
                new Date(this.visitData.lastVisit).toLocaleDateString() : 'Never',
            'content-source': this.getVisitType()
        };
        
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    }

    // Trigger visit-based events
    triggerVisitEvents() {
        const event = new CustomEvent('visitTracked', {
            detail: {
                visitType: this.getVisitType(),
                totalVisits: this.getTotalVisits(),
                currentPageVisits: this.getCurrentPageVisits(),
                interests: this.getUserInterests(),
                sessionData: this.currentSession
            }
        });
        
        document.dispatchEvent(event);
    }

    // Track time spent on page
    trackPageTime() {
        const startTime = Date.now();
        
        // Track when user leaves the page
        window.addEventListener('beforeunload', () => {
            const timeSpent = Date.now() - startTime;
            const currentPage = window.location.pathname;
            
            if (this.visitData.pages && this.visitData.pages[currentPage]) {
                this.visitData.pages[currentPage].totalTime += timeSpent;
                this.saveVisitData();
            }
        });
    }

    // Get user engagement score
    getUserEngagementScore() {
        const totalVisits = this.getTotalVisits();
        const daysSinceFirst = this.getDaysSinceFirstVisit();
        const interests = this.getUserInterests();
        
        let score = 0;
        
        // Visit frequency score
        if (totalVisits >= 10) score += 40;
        else if (totalVisits >= 5) score += 30;
        else if (totalVisits >= 2) score += 20;
        else score += 10;
        
        // Recency score
        if (daysSinceFirst <= 7) score += 30;
        else if (daysSinceFirst <= 30) score += 20;
        else if (daysSinceFirst <= 90) score += 10;
        
        // Interest diversity score
        score += Math.min(interests.length * 10, 30);
        
        return Math.min(score, 100);
    }

    // Clear all visit data (for testing)
    clearVisitData() {
        this.visitData = {};
        localStorage.removeItem(this.storageKey);
        sessionStorage.removeItem(this.sessionKey);
        console.log('Visit data cleared');
    }
}

// Initialize global instance
window.UserVisitTracker = new UserVisitTracker();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.UserVisitTracker) {
        window.UserVisitTracker.init();
    }
}); 