// Dynamic Content Engine
// Combines IP geolocation and visit tracking to provide personalized content

class DynamicContentEngine {
    constructor() {
        this.isInitialized = false;
        this.debugMode = window.DYNAMIC_DEBUG || false;
        this.contentPriority = ['url', 'location', 'visit', 'default'];
        this.currentContent = {};
    }

    // Initialize the dynamic content engine
    init() {
        if (this.isInitialized) return;
        
        // Wait for both geolocation and visit tracker to be ready
        this.waitForSystems().then(() => {
            this.generatePersonalizedContent();
            this.applyContentToPage();
            this.trackContentApplication();
            
            this.isInitialized = true;
            
            if (this.debugMode) {
                console.log('Dynamic Content Engine initialized:', this.currentContent);
            }
        });
    }

    // Wait for geolocation and visit tracking systems to be ready
    async waitForSystems() {
        return new Promise((resolve) => {
            const checkSystems = () => {
                const geolocationReady = window.IPGeolocation && window.IPGeolocation.isInitialized;
                const visitTrackerReady = window.UserVisitTracker && window.UserVisitTracker.isInitialized;
                
                if (geolocationReady && visitTrackerReady) {
                    resolve();
                } else {
                    setTimeout(checkSystems, 100);
                }
            };
            
            checkSystems();
        });
    }

    // Generate personalized content based on all available data
    generatePersonalizedContent() {
        const urlParams = this.getURLParameters();
        const locationData = window.IPGeolocation.getCurrentLocation();
        const visitData = window.UserVisitTracker.getVisitType();
        const userInterests = window.UserVisitTracker.getUserInterests();
        
        // Priority-based content selection
        let finalContent = {};
        
        // 1. URL Parameters (highest priority)
        if (urlParams.headline || urlParams.cta) {
            finalContent = this.getURLBasedContent(urlParams);
        }
        // 2. Location-based content
        else if (locationData) {
            finalContent = this.getLocationBasedContent(locationData);
        }
        // 3. Visit-based content
        else if (visitData) {
            finalContent = this.getVisitBasedContent(visitData, userInterests);
        }
        // 4. Default content
        else {
            finalContent = this.getDefaultContent();
        }
        
        // Enhance content with additional context
        finalContent = this.enhanceContentWithContext(finalContent, {
            location: locationData,
            visitType: visitData,
            interests: userInterests,
            urlParams: urlParams
        });
        
        this.currentContent = finalContent;
    }

    // Get URL parameters
    getURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            headline: urlParams.get('headline'),
            subheadline: urlParams.get('subheadline'),
            cta: urlParams.get('cta'),
            keyword: urlParams.get('keyword'),
            city: urlParams.get('city'),
            industry: urlParams.get('industry'),
            campaign: urlParams.get('campaign')
        };
    }

    // Get content based on URL parameters
    getURLBasedContent(urlParams) {
        return {
            headline: urlParams.headline || 'Expert Technology Solutions',
            description: urlParams.subheadline || 'Transform your business with our comprehensive technology services.',
            cta: urlParams.cta || 'Get Started Today',
            source: 'url',
            priority: 'high'
        };
    }

    // Get content based on location
    getLocationBasedContent(locationData) {
        const locationContent = window.IPGeolocation.getLocationContent();
        return {
            headline: locationContent.headline,
            description: locationContent.description,
            cta: locationContent.cta,
            testimonial: locationContent.testimonial,
            source: 'location',
            priority: 'medium'
        };
    }

    // Get content based on visit behavior
    getVisitBasedContent(visitType, interests) {
        const visitContent = window.UserVisitTracker.getVisitContent();
        return {
            headline: visitContent.headline,
            description: visitContent.description,
            cta: visitContent.cta,
            urgency: visitContent.urgency,
            focus: visitContent.focus,
            source: 'visit',
            priority: 'medium'
        };
    }

    // Get default content
    getDefaultContent() {
        return {
            headline: 'Transform Your Online Presence with Expert SEO Services',
            description: 'Boost your website\'s search engine rankings and drive sustainable organic traffic with our comprehensive SEO services.',
            cta: 'Get Free SEO Audit',
            source: 'default',
            priority: 'low'
        };
    }

    // Enhance content with additional context
    enhanceContentWithContext(baseContent, context) {
        let enhancedContent = { ...baseContent };
        
        // Add location context if available
        if (context.location) {
            enhancedContent.location = context.location.city;
            enhancedContent.state = context.location.state;
            enhancedContent.country = context.location.country;
            
            // Add location-specific urgency
            if (context.location.city === 'Mumbai' || context.location.city === 'Delhi') {
                enhancedContent.urgency = 'high';
            }
        }
        
        // Add visit context
        if (context.visitType) {
            enhancedContent.visitType = context.visitType;
            enhancedContent.totalVisits = window.UserVisitTracker.getTotalVisits();
        }
        
        // Add interest context
        if (context.interests && context.interests.length > 0) {
            enhancedContent.topInterest = context.interests[0].category;
        }
        
        // Add campaign context
        if (context.urlParams.campaign) {
            enhancedContent.campaign = context.urlParams.campaign;
        }
        
        return enhancedContent;
    }

    // Apply content to the page
    applyContentToPage() {
        if (!this.currentContent) return;
        
        // Update main headline
        this.updateElement('main-headline', this.currentContent.headline);
        this.updateElement('.title', this.currentContent.headline);
        this.updateElement('h1', this.currentContent.headline);
        this.updateElement('h2.title', this.currentContent.headline);
        
        // Update description
        this.updateElement('main-description', this.currentContent.description);
        
        // Update CTA elements
        this.updateElement('cta-headline', this.currentContent.headline);
        this.updateElement('cta-description', this.currentContent.description);
        this.updateElement('cta-button', this.currentContent.cta);
        
        // Update all CTA buttons
        this.updateCTAButtons(this.currentContent.cta);
        
        // Update page title
        this.updatePageTitle(this.currentContent.headline);
        
        // Update meta description
        this.updateMetaDescription(this.currentContent.description);
        
        // Add location-specific classes
        this.addLocationClasses();
        
        // Add urgency indicators
        this.addUrgencyIndicators();
    }

    // Update element content
    updateElement(selector, content) {
        if (!content) return;
        
        const elements = document.querySelectorAll(`#${selector}, .${selector}`);
        elements.forEach(element => {
            if (element) {
                element.textContent = content;
            }
        });
    }

    // Update CTA buttons
    updateCTAButtons(ctaText) {
        if (!ctaText) return;
        
        const ctaSelectors = [
            '.btn-primary',
            '.infetech-btn',
            '.cta-btn',
            'a[href*="contact"]',
            'a[href*="consultation"]',
            'button[type="submit"]'
        ];
        
        ctaSelectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => {
                if (button && ctaText) {
                    button.textContent = ctaText;
                }
            });
        });
    }

    // Update page title
    updatePageTitle(headline) {
        if (!headline) return;
        
        const title = document.querySelector('title');
        if (title) {
            title.textContent = headline + ' | Infetech';
        }
    }

    // Update meta description
    updateMetaDescription(description) {
        if (!description) return;
        
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', description);
    }

    // Add location-specific CSS classes
    addLocationClasses() {
        if (!this.currentContent.location) return;
        
        const body = document.body;
        const city = this.currentContent.location.toLowerCase();
        
        // Remove existing location classes
        body.classList.remove('location-mumbai', 'location-delhi', 'location-bangalore', 'location-hyderabad', 'location-chennai');
        
        // Add new location class
        body.classList.add(`location-${city}`);
    }

    // Add urgency indicators
    addUrgencyIndicators() {
        if (!this.currentContent.urgency) return;
        
        const urgency = this.currentContent.urgency;
        const body = document.body;
        
        // Remove existing urgency classes
        body.classList.remove('urgency-low', 'urgency-medium', 'urgency-high');
        
        // Add urgency class
        body.classList.add(`urgency-${urgency}`);
        
        // Add visual indicators for high urgency
        if (urgency === 'high') {
            this.addHighUrgencyIndicators();
        }
    }

    // Add high urgency visual indicators
    addHighUrgencyIndicators() {
        // Add pulsing animation to CTA buttons
        const ctaButtons = document.querySelectorAll('.btn-primary, .infetech-btn');
        ctaButtons.forEach(button => {
            button.style.animation = 'pulse 2s infinite';
        });
        
        // Add CSS for pulse animation
        if (!document.getElementById('urgency-styles')) {
            const style = document.createElement('style');
            style.id = 'urgency-styles';
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Track content application for analytics
    trackContentApplication() {
        if (!this.currentContent) return;
        
        // Google Analytics 4 tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'dynamic_content_applied', {
                'event_category': 'personalization',
                'event_label': this.currentContent.source,
                'custom_parameter_1': this.currentContent.location || 'unknown',
                'custom_parameter_2': this.currentContent.visitType || 'unknown',
                'custom_parameter_3': this.currentContent.topInterest || 'unknown',
                'custom_parameter_4': this.currentContent.campaign || 'none'
            });
        }
        
        // Google Tag Manager tracking
        if (typeof dataLayer !== 'undefined') {
            dataLayer.push({
                'event': 'dynamic_content_applied',
                'content_source': this.currentContent.source,
                'location': this.currentContent.location,
                'visit_type': this.currentContent.visitType,
                'top_interest': this.currentContent.topInterest,
                'campaign': this.currentContent.campaign,
                'headline': this.currentContent.headline,
                'cta': this.currentContent.cta
            });
        }
        
        // Console logging for debugging
        if (this.debugMode) {
            console.log('Content applied:', {
                source: this.currentContent.source,
                headline: this.currentContent.headline,
                cta: this.currentContent.cta,
                location: this.currentContent.location,
                visitType: this.currentContent.visitType
            });
        }
    }

    // Get current content configuration
    getCurrentContent() {
        return this.currentContent;
    }

    // Force content refresh
    refreshContent() {
        this.generatePersonalizedContent();
        this.applyContentToPage();
        this.trackContentApplication();
    }

    // Get content performance metrics
    getContentPerformance() {
        return {
            source: this.currentContent.source,
            priority: this.currentContent.priority,
            location: this.currentContent.location,
            visitType: this.currentContent.visitType,
            timestamp: Date.now()
        };
    }

    // Test different content variations
    testContentVariation(variation) {
        const testContent = {
            'location': this.getLocationBasedContent(window.IPGeolocation.getCurrentLocation()),
            'visit': this.getVisitBasedContent(window.UserVisitTracker.getVisitType(), window.UserVisitTracker.getUserInterests()),
            'default': this.getDefaultContent()
        };
        
        if (testContent[variation]) {
            this.currentContent = testContent[variation];
            this.applyContentToPage();
            console.log(`Testing ${variation} content variation`);
        }
    }
}

// Initialize global instance
window.DynamicContentEngine = new DynamicContentEngine();

// Listen for system events
document.addEventListener('locationDetected', function(event) {
    if (window.DynamicContentEngine && !window.DynamicContentEngine.isInitialized) {
        window.DynamicContentEngine.init();
    }
});

document.addEventListener('visitTracked', function(event) {
    if (window.DynamicContentEngine && !window.DynamicContentEngine.isInitialized) {
        window.DynamicContentEngine.init();
    }
});

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.DynamicContentEngine) {
        window.DynamicContentEngine.init();
    }
}); 