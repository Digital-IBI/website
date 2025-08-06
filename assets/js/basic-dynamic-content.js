// Basic Dynamic Content System for Landing Pages
// Works with Google Ads, Facebook Ads, and Instagram Ads

class BasicDynamicContent {
    constructor() {
        this.urlParams = new URLSearchParams(window.location.search);
        this.isInitialized = false;
        this.campaignData = this.parseCampaignData();
    }

    // Parse campaign data from URL parameters
    parseCampaignData() {
        return {
            // Campaign parameters
            keyword: this.urlParams.get('keyword') || this.urlParams.get('kw') || '',
            city: this.urlParams.get('city') || this.urlParams.get('location') || '',
            campaign: this.urlParams.get('campaign') || this.urlParams.get('utm_campaign') || '',
            source: this.urlParams.get('source') || this.urlParams.get('utm_source') || '',
            medium: this.urlParams.get('medium') || this.urlParams.get('utm_medium') || '',
            adgroup: this.urlParams.get('adgroup') || this.urlParams.get('utm_content') || '',
            
            // Content customization
            headline: this.urlParams.get('headline') || '',
            subheadline: this.urlParams.get('subheadline') || '',
            cta: this.urlParams.get('cta') || '',
            image: this.urlParams.get('image') || '',
            
            // Platform-specific
            platform: this.detectPlatform()
        };
    }

    // Detect ad platform from parameters
    detectPlatform() {
        const source = (this.campaignData?.source || '').toLowerCase();
        const medium = (this.campaignData?.medium || '').toLowerCase();
        
        if (source.includes('google') || medium.includes('cpc')) return 'google';
        if (source.includes('facebook') || source.includes('fb')) return 'facebook';
        if (source.includes('instagram') || source.includes('ig')) return 'instagram';
        if (source.includes('linkedin')) return 'linkedin';
        
        return 'unknown';
    }

    // Initialize dynamic content
    init() {
        if (this.isInitialized) return;
        
        try {
            // Apply dynamic content
            this.updateHeadlines();
            this.updateCTAs();
            this.updateImages();
            this.updateMetaTags();
            this.trackCampaign();
            
            this.isInitialized = true;
            
            console.log('Basic Dynamic Content initialized:', this.campaignData);
        } catch (error) {
            console.error('Error initializing Basic Dynamic Content:', error);
        }
    }

    // Update headlines based on campaign data
    updateHeadlines() {
        const headline = this.generateHeadline();
        const subheadline = this.generateSubheadline();
        
        // Update main headlines
        this.updateElement('h1', headline);
        this.updateElement('h2.title', headline);
        this.updateElement('.title', headline);
        this.updateElement('#main-headline', headline);
        
        // Update subheadlines
        this.updateElement('h2.subtitle', subheadline);
        this.updateElement('.subtitle', subheadline);
        this.updateElement('#main-description', subheadline);
    }

    // Generate headline based on campaign data
    generateHeadline() {
        // Priority: URL headline > Location-based > Keyword-based > Default
        if (this.campaignData.headline) {
            return this.campaignData.headline;
        }
        
        if (this.campaignData.city) {
            return this.getLocationHeadline(this.campaignData.city);
        }
        
        if (this.campaignData.keyword) {
            return this.getKeywordHeadline(this.campaignData.keyword);
        }
        
        return this.getDefaultHeadline();
    }

    // Generate subheadline
    generateSubheadline() {
        if (this.campaignData.subheadline) {
            return this.campaignData.subheadline;
        }
        
        if (this.campaignData.city) {
            return `Get found by customers searching for your business in ${this.campaignData.city}`;
        }
        
        return 'Boost your website\'s search engine rankings and drive sustainable organic traffic';
    }

    // Get location-based headline
    getLocationHeadline(city) {
        const locationHeadlines = {
            'mumbai': 'Leading SEO Services in Mumbai',
            'delhi': 'Premium SEO Services in Delhi NCR',
            'bangalore': 'Tech-Savvy SEO Services in Bangalore',
            'hyderabad': 'Professional SEO Services in Hyderabad',
            'chennai': 'Expert SEO Services in Chennai',
            'pune': 'Reliable SEO Services in Pune',
            'kolkata': 'Trusted SEO Services in Kolkata',
            'ahmedabad': 'Professional SEO Services in Ahmedabad'
        };
        
        return locationHeadlines[city.toLowerCase()] || `SEO Services in ${city}`;
    }

    // Get keyword-based headline
    getKeywordHeadline(keyword) {
        const keywordHeadlines = {
            'local seo': 'Local SEO Services',
            'ecommerce seo': 'E-commerce SEO Services',
            'technical seo': 'Technical SEO Services',
            'on page seo': 'On-Page SEO Services',
            'off page seo': 'Off-Page SEO Services',
            'mobile seo': 'Mobile SEO Services',
            'voice seo': 'Voice Search SEO Services'
        };
        
        return keywordHeadlines[keyword.toLowerCase()] || `${keyword} SEO Services`;
    }

    // Get default headline based on page
    getDefaultHeadline() {
        const path = window.location.pathname;
        
        if (path.includes('seo')) return 'Expert SEO Services';
        if (path.includes('app-development')) return 'Custom App Development Services';
        if (path.includes('social-media')) return 'Social Media Marketing Services';
        if (path.includes('wordpress')) return 'WordPress Development Services';
        if (path.includes('ai-asset-tracking')) return 'AI Asset Tracking Solutions';
        if (path.includes('ai-loyalty')) return 'AI Loyalty Management System';
        if (path.includes('whatsapp')) return 'WhatsApp Marketing Services';
        
        return 'Expert Technology Solutions';
    }

    // Update CTAs based on campaign data
    updateCTAs() {
        const cta = this.generateCTA();
        
        // Update CTA buttons
        this.updateElement('.btn-primary', cta);
        this.updateElement('.infetech-btn', cta);
        this.updateElement('a[href*="contact"]', cta);
        this.updateElement('button[type="submit"]', cta);
        this.updateElement('#cta-button', cta);
    }

    // Generate CTA based on campaign data
    generateCTA() {
        if (this.campaignData.cta) {
            return this.campaignData.cta;
        }
        
        if (this.campaignData.city) {
            return `Get ${this.campaignData.city} SEO Audit`;
        }
        
        if (this.campaignData.platform === 'google') {
            return 'Get Free SEO Audit';
        }
        
        if (this.campaignData.platform === 'facebook') {
            return 'Start Your SEO Project';
        }
        
        if (this.campaignData.platform === 'instagram') {
            return 'Get SEO Strategy';
        }
        
        return 'Get Started Today';
    }

    // Update images based on campaign data
    updateImages() {
        if (this.campaignData.image) {
            this.updateImageSrc('.thumb img', this.campaignData.image);
            this.updateImageSrc('#hero-image', this.campaignData.image);
        }
    }

    // Update image source
    updateImageSrc(selector, src) {
        const images = document.querySelectorAll(selector);
        images.forEach(img => {
            if (img) {
                img.src = src;
                img.alt = this.campaignData.headline || 'Dynamic Image';
            }
        });
    }

    // Update meta tags
    updateMetaTags() {
        const headline = this.generateHeadline();
        const description = this.generateSubheadline();
        
        // Update page title
        const title = document.querySelector('title');
        if (title) {
            title.textContent = headline + ' | Infetech';
        }
        
        // Update meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', description);
    }

    // Track campaign data
    trackCampaign() {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', 'dynamic_content_loaded', {
                'event_category': 'landing_page',
                'event_label': this.campaignData.platform,
                'custom_parameter_1': this.campaignData.city || 'unknown',
                'custom_parameter_2': this.campaignData.keyword || 'unknown',
                'custom_parameter_3': this.campaignData.campaign || 'unknown'
            });
        }
        
        // Google Tag Manager
        if (typeof dataLayer !== 'undefined') {
            dataLayer.push({
                'event': 'dynamic_content_loaded',
                'platform': this.campaignData.platform,
                'city': this.campaignData.city,
                'keyword': this.campaignData.keyword,
                'campaign': this.campaignData.campaign,
                'headline': this.generateHeadline(),
                'cta': this.generateCTA()
            });
        }
    }

    // Update element content
    updateElement(selector, content) {
        if (!content) return;
        
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element) {
                element.textContent = content;
            }
        });
    }

    // Get campaign data for external use
    getCampaignData() {
        return this.campaignData;
    }

    // Check if dynamic content was applied
    wasApplied() {
        return this.isInitialized;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    try {
        window.BasicDynamicContent = new BasicDynamicContent();
        
        // Only initialize if there are URL parameters or if we're testing
        const urlParams = new URLSearchParams(window.location.search);
        const hasParams = urlParams.toString().length > 0;
        
        if (hasParams) {
            window.BasicDynamicContent.init();
        } else {
            console.log('Basic Dynamic Content loaded (no URL parameters found)');
        }
    } catch (error) {
        console.error('Error loading Basic Dynamic Content:', error);
    }
});

// Export for manual use
window.BasicDynamicContent = BasicDynamicContent; 