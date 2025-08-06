// Dynamic Content Loader for Landing Pages
// This system allows dynamic content adjustment based on ad campaign parameters

class DynamicContentLoader {
    constructor() {
        this.urlParams = new URLSearchParams(window.location.search);
        this.dynamicData = this.parseUrlParameters();
        this.contentMappings = this.initializeContentMappings();
    }

    // Parse URL parameters from ad campaigns
    parseUrlParameters() {
        const params = {};
        
        // Campaign parameters
        params.keyword = this.urlParams.get('keyword') || this.urlParams.get('kw') || '';
        params.city = this.urlParams.get('city') || this.urlParams.get('location') || '';
        params.state = this.urlParams.get('state') || this.urlParams.get('region') || '';
        params.location = this.urlParams.get('location') || '';
        params.campaign = this.urlParams.get('campaign') || this.urlParams.get('utm_campaign') || '';
        params.source = this.urlParams.get('source') || this.urlParams.get('utm_source') || '';
        params.medium = this.urlParams.get('medium') || this.urlParams.get('utm_medium') || '';
        params.adGroup = this.urlParams.get('adgroup') || this.urlParams.get('utm_content') || '';
        
        // Content customization parameters
        params.headline = this.urlParams.get('headline') || '';
        params.subheadline = this.urlParams.get('subheadline') || '';
        params.ctaText = this.urlParams.get('cta') || '';
        params.image = this.urlParams.get('image') || '';
        params.paragraph = this.urlParams.get('paragraph') || '';
        
        return params;
    }

    // Initialize content mappings for different services/products
    initializeContentMappings() {
        return {
            'seo': {
                defaultHeadline: 'Transform Your Online Presence with Expert SEO Services',
                defaultSubheadline: 'Boost your website\'s search engine rankings and drive sustainable organic traffic',
                defaultCTA: 'Get Free SEO Audit',
                keywords: ['seo services', 'search engine optimization', 'google ranking', 'organic traffic'],
                images: {
                    hero: '../assets/images/service-thumb-1.png',
                    benefits: '../assets/images/service-thumb-2.png',
                    process: '../assets/images/service-thumb-3.png'
                }
            },
            'app-development': {
                defaultHeadline: 'Custom Mobile App Development Services',
                defaultSubheadline: 'Build high-performance mobile applications that drive user engagement and business growth',
                defaultCTA: 'Start Your App Project',
                keywords: ['mobile app development', 'custom apps', 'ios development', 'android development'],
                images: {
                    hero: '../assets/images/services/app-development-hero.jpg',
                    benefits: '../assets/images/service-thumb-4.png',
                    process: '../assets/images/service-thumb-5.png'
                }
            },
            'social-media': {
                defaultHeadline: 'Social Media Management & Marketing Services',
                defaultSubheadline: 'Grow your brand presence and engage your audience across all social platforms',
                defaultCTA: 'Get Social Media Strategy',
                keywords: ['social media management', 'social media marketing', 'instagram marketing', 'facebook ads'],
                images: {
                    hero: '../assets/images/service-thumb-6.png',
                    benefits: '../assets/images/service-thumb-1.png',
                    process: '../assets/images/service-thumb-2.png'
                }
            },
            'wordpress': {
                defaultHeadline: 'Professional WordPress Development Services',
                defaultSubheadline: 'Custom WordPress websites that convert visitors into customers',
                defaultCTA: 'Get WordPress Quote',
                keywords: ['wordpress development', 'custom wordpress', 'wordpress website', 'wordpress design'],
                images: {
                    hero: '../assets/images/service-thumb-3.png',
                    benefits: '../assets/images/service-thumb-4.png',
                    process: '../assets/images/service-thumb-5.png'
                }
            },
            'ai-asset-tracking': {
                defaultHeadline: 'AI-Powered Asset Tracking Solutions',
                defaultSubheadline: 'Real-time asset monitoring with artificial intelligence for maximum efficiency',
                defaultCTA: 'Get Asset Tracking Demo',
                keywords: ['asset tracking', 'iot tracking', 'fleet management', 'inventory tracking'],
                images: {
                    hero: '../assets/images/service-thumb-6.png',
                    benefits: '../assets/images/service-thumb-1.png',
                    process: '../assets/images/service-thumb-2.png'
                }
            },
            'ai-loyalty': {
                defaultHeadline: 'AI-Driven Loyalty Management System',
                defaultSubheadline: 'Boost customer retention with intelligent loyalty programs',
                defaultCTA: 'Get Loyalty Demo',
                keywords: ['loyalty program', 'customer retention', 'rewards system', 'loyalty management'],
                images: {
                    hero: '../assets/images/service-thumb-3.png',
                    benefits: '../assets/images/service-thumb-4.png',
                    process: '../assets/images/service-thumb-5.png'
                }
            },
            'whatsapp-marketing': {
                defaultHeadline: 'WhatsApp Marketing & Automation Services',
                defaultSubheadline: 'Engage customers directly through WhatsApp with automated marketing campaigns',
                defaultCTA: 'Get WhatsApp Strategy',
                keywords: ['whatsapp marketing', 'whatsapp automation', 'business whatsapp', 'whatsapp campaigns'],
                images: {
                    hero: '../assets/images/service-thumb-6.png',
                    benefits: '../assets/images/service-thumb-1.png',
                    process: '../assets/images/service-thumb-2.png'
                }
            }
        };
    }

    // Get service type from URL or page content
    getServiceType() {
        // Try to detect from URL path
        const path = window.location.pathname;
        if (path.includes('seo')) return 'seo';
        if (path.includes('app-development')) return 'app-development';
        if (path.includes('social-media')) return 'social-media';
        if (path.includes('wordpress')) return 'wordpress';
        if (path.includes('ai-asset-tracking')) return 'ai-asset-tracking';
        if (path.includes('ai-loyalty')) return 'ai-loyalty';
        if (path.includes('whatsapp')) return 'whatsapp-marketing';
        
        // Default to seo if no match
        return 'seo';
    }

    // Generate dynamic content based on parameters
    generateDynamicContent() {
        const serviceType = this.getServiceType();
        const mapping = this.contentMappings[serviceType] || this.contentMappings['seo'];
        
        return {
            headline: this.dynamicData.headline || this.customizeHeadline(mapping.defaultHeadline),
            subheadline: this.dynamicData.subheadline || this.customizeSubheadline(mapping.defaultSubheadline),
            ctaText: this.dynamicData.ctaText || mapping.defaultCTA,
            heroImage: this.dynamicData.image || mapping.images.hero,
            benefitsImage: mapping.images.benefits,
            processImage: mapping.images.process,
            location: this.dynamicData.city || this.dynamicData.location || '',
            state: this.dynamicData.state || '',
            keyword: this.dynamicData.keyword || '',
            customParagraph: this.dynamicData.paragraph || ''
        };
    }

    // Customize headline based on location and keyword
    customizeHeadline(defaultHeadline) {
        let headline = defaultHeadline;
        
        if (this.dynamicData.city) {
            headline = headline.replace('Services', `Services in ${this.dynamicData.city}`);
        }
        
        if (this.dynamicData.keyword) {
            headline = headline.replace('Services', `${this.dynamicData.keyword} Services`);
        }
        
        return headline;
    }

    // Customize subheadline based on location
    customizeSubheadline(defaultSubheadline) {
        let subheadline = defaultSubheadline;
        
        if (this.dynamicData.city) {
            subheadline = `${subheadline} in ${this.dynamicData.city}`;
        }
        
        return subheadline;
    }

    // Apply dynamic content to the page
    applyDynamicContent() {
        const content = this.generateDynamicContent();
        
        // Update page title
        this.updateElement('title', content.headline);
        
        // Update meta description
        this.updateMetaDescription(content.subheadline);
        
        // Update main headline
        this.updateElement('.title', content.headline);
        this.updateElement('h1', content.headline);
        this.updateElement('h2.title', content.headline);
        
        // Update subheadlines
        this.updateElement('.subtitle', content.subheadline);
        this.updateElement('h3.subtitle', content.subheadline);
        
        // Update CTA buttons
        this.updateCTAButtons(content.ctaText);
        
        // Update images
        this.updateImages(content);
        
        // Update location-specific content
        this.updateLocationContent(content);
        
        // Update custom paragraph if provided
        if (content.customParagraph) {
            this.updateCustomParagraph(content.customParagraph);
        }
        
        // Track dynamic content in analytics
        this.trackDynamicContent(content);
    }

    // Update element content
    updateElement(selector, content) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element && content) {
                element.textContent = content;
            }
        });
    }

    // Update meta description
    updateMetaDescription(description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', description);
    }

    // Update CTA buttons
    updateCTAButtons(ctaText) {
        const ctaSelectors = [
            '.btn-primary',
            '.infetech-btn',
            '.cta-btn',
            'a[href*="contact"]',
            'a[href*="consultation"]'
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

    // Update images
    updateImages(content) {
        // Update hero image
        const heroImages = document.querySelectorAll('.thumb img, .hero-image img, .banner-thumb img');
        heroImages.forEach(img => {
            if (img && content.heroImage) {
                img.src = content.heroImage;
                img.alt = content.headline;
            }
        });
        
        // Update other images if needed
        if (content.benefitsImage) {
            const benefitImages = document.querySelectorAll('.benefits img, .features img');
            benefitImages.forEach(img => {
                if (img && content.benefitsImage) {
                    img.src = content.benefitsImage;
                }
            });
        }
    }

    // Update location-specific content
    updateLocationContent(content) {
        if (content.location) {
            // Update location mentions in paragraphs
            const paragraphs = document.querySelectorAll('p');
            paragraphs.forEach(p => {
                if (p.textContent.includes('your business') || p.textContent.includes('your company')) {
                    p.textContent = p.textContent.replace('your business', `your ${content.location} business`);
                }
            });
            
            // Add location to contact forms
            const contactForms = document.querySelectorAll('form');
            contactForms.forEach(form => {
                const locationField = form.querySelector('input[name="location"], input[name="city"]');
                if (locationField) {
                    locationField.value = content.location;
                }
            });
        }
    }

    // Update custom paragraph
    updateCustomParagraph(paragraph) {
        const firstParagraph = document.querySelector('p');
        if (firstParagraph && paragraph) {
            firstParagraph.textContent = paragraph;
        }
    }

    // Track dynamic content for analytics
    trackDynamicContent(content) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'dynamic_content_loaded', {
                'event_category': 'landing_page',
                'event_label': content.headline,
                'custom_parameter_1': content.location,
                'custom_parameter_2': content.keyword,
                'custom_parameter_3': this.dynamicData.campaign
            });
        }
        
        // Also track in dataLayer for GTM
        if (typeof dataLayer !== 'undefined') {
            dataLayer.push({
                'event': 'dynamic_content_loaded',
                'headline': content.headline,
                'location': content.location,
                'keyword': content.keyword,
                'campaign': this.dynamicData.campaign
            });
        }
    }

    // Initialize dynamic content loading
    init() {
        // Only apply dynamic content if URL parameters are present
        if (Object.keys(this.dynamicData).some(key => this.dynamicData[key])) {
            console.log('Dynamic content parameters detected:', this.dynamicData);
            this.applyDynamicContent();
        } else {
            console.log('No dynamic content parameters found, using default content');
        }
    }
}

// Initialize dynamic content loader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const dynamicLoader = new DynamicContentLoader();
    dynamicLoader.init();
});

// Export for manual use
window.DynamicContentLoader = DynamicContentLoader; 