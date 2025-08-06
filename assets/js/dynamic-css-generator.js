/**
 * Dynamic CSS Variable Generator
 * Automatically generates CSS variables from image management system
 */

class DynamicCSSGenerator {
    constructor() {
        this.cssVariables = {};
        this.generatedStyles = '';
        this.isInitialized = false;
    }

    // Initialize the dynamic CSS system
    init() {
        if (this.isInitialized) return;
        
        this.generateCSSVariables();
        this.injectCSSVariables();
        this.setupEventListeners();
        this.isInitialized = true;
        
        console.log('Dynamic CSS Generator initialized');
    }

    // Generate CSS variables from image management system
    generateCSSVariables() {
        this.cssVariables = {};
        
        // Generate variables for all images
        Object.keys(IMAGE_MANAGEMENT.images).forEach(category => {
            Object.keys(IMAGE_MANAGEMENT.images[category]).forEach(key => {
                const image = IMAGE_MANAGEMENT.images[category][key];
                this.generateImageVariables(category, key, image);
            });
        });

        // Generate variables for ad campaigns
        Object.keys(IMAGE_MANAGEMENT.adCampaigns).forEach(campaignKey => {
            const campaign = IMAGE_MANAGEMENT.adCampaigns[campaignKey];
            this.generateCampaignVariables(campaignKey, campaign);
        });

        console.log('CSS variables generated:', Object.keys(this.cssVariables).length);
    }

    // Generate variables for a specific image
    generateImageVariables(category, key, image) {
        const baseVarName = `--${category}-${key}`;
        
        // Main image variable
        this.cssVariables[baseVarName] = `url('${image.path || ''}')`;
        
        // Generate variables for ad variants if they exist
        if (image.adVariants) {
            Object.keys(image.adVariants).forEach(variant => {
                const variantVarName = `${baseVarName}-${variant}`;
                const variantPath = (image.path || '').replace(image.filename, image.adVariants[variant]);
                this.cssVariables[variantVarName] = `url('${variantPath}')`;
            });
        }

        // Generate responsive variables if dimensions are specified
        if (image.dimensions) {
            const responsiveVarName = `${baseVarName}-dimensions`;
            this.cssVariables[responsiveVarName] = `${image.dimensions.width}px ${image.dimensions.height}px`;
        }
    }

    // Generate variables for ad campaigns
    generateCampaignVariables(campaignKey, campaign) {
        if (campaign.images) {
            Object.keys(campaign.images).forEach(imageType => {
                const imageName = campaign.images[imageType];
                const varName = `--campaign-${campaignKey}-${imageType}`;
                const imagePath = `${imageType}s/${imageName}`; // e.g., banners/banner-startup-promo.jpg
                this.cssVariables[varName] = `url('${imagePath}')`;
            });
        }
    }

    // Inject CSS variables into document
    injectCSSVariables() {
        // Remove existing dynamic styles
        const existingStyle = document.getElementById('dynamic-css-variables');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Create new style element
        const style = document.createElement('style');
        style.id = 'dynamic-css-variables';
        
        // Generate CSS content
        let cssContent = ':root {\n';
        Object.keys(this.cssVariables).forEach(varName => {
            cssContent += `    ${varName}: ${this.cssVariables[varName]};\n`;
        });
        cssContent += '}\n\n';

        // Add utility classes
        cssContent += this.generateUtilityClasses();
        
        style.textContent = cssContent;
        document.head.appendChild(style);
        
        console.log('CSS variables injected into document');
    }

    // Generate utility classes for easy usage
    generateUtilityClasses() {
        let utilityCSS = '';
        
        // Generate background image classes
        Object.keys(this.cssVariables).forEach(varName => {
            if (varName.includes('--banner-') || varName.includes('--service-') || varName.includes('--project-')) {
                const className = varName.replace('--', '').replace(/-/g, '-');
                utilityCSS += `.bg-${className} {\n`;
                utilityCSS += `    background-image: var(${varName});\n`;
                utilityCSS += `    background-size: cover;\n`;
                utilityCSS += `    background-position: center center;\n`;
                utilityCSS += `    background-repeat: no-repeat;\n`;
                utilityCSS += `}\n\n`;
            }
        });

        // Generate responsive classes
        utilityCSS += this.generateResponsiveClasses();
        
        return utilityCSS;
    }

    // Generate responsive classes
    generateResponsiveClasses() {
        return `
/* Responsive Image Classes */
@media (max-width: 768px) {
    .bg-banner-hero,
    .bg-banner-secondary,
    .bg-banner-startup-promo,
    .bg-banner-enterprise-solutions {
        background-size: cover;
        background-position: center center;
    }
}

@media (max-width: 480px) {
    .bg-banner-hero,
    .bg-banner-secondary {
        background-size: cover;
        background-position: center center;
    }
}

/* Dynamic Ad Image Classes */
.bg-dynamic {
    transition: background-image 0.3s ease;
}

/* Lazy Loading Classes */
.bg-lazy {
    opacity: 0;
    transition: opacity 0.3s ease;
}

.bg-lazy.loaded {
    opacity: 1;
}
`;
    }

    // Update CSS variables dynamically
    updateCSSVariables(updates) {
        Object.assign(this.cssVariables, updates);
        this.injectCSSVariables();
        console.log('CSS variables updated');
    }

    // Add new image and generate variables
    addImage(category, key, imageData) {
        if (!IMAGE_MANAGEMENT.images[category]) {
            IMAGE_MANAGEMENT.images[category] = {};
        }
        
        IMAGE_MANAGEMENT.images[category][key] = imageData;
        this.generateImageVariables(category, key, imageData);
        this.injectCSSVariables();
        
        console.log(`Added new image: ${category}.${key}`);
    }

    // Add new ad campaign
    addCampaign(campaignKey, campaignData) {
        IMAGE_MANAGEMENT.adCampaigns[campaignKey] = campaignData;
        this.generateCampaignVariables(campaignKey, campaignData);
        this.injectCSSVariables();
        
        console.log(`Added new campaign: ${campaignKey}`);
    }

    // Get CSS variable value
    getCSSVariable(varName) {
        return this.cssVariables[varName] || null;
    }

    // Get all CSS variables
    getAllCSSVariables() {
        return this.cssVariables;
    }

    // Setup event listeners for dynamic updates
    setupEventListeners() {
        // Listen for image management updates
        window.addEventListener('imageManagementUpdate', (event) => {
            this.generateCSSVariables();
            this.injectCSSVariables();
        });

        // Listen for campaign updates
        window.addEventListener('campaignUpdate', (event) => {
            this.generateCSSVariables();
            this.injectCSSVariables();
        });
    }

    // Refresh all CSS variables
    refresh() {
        this.generateCSSVariables();
        this.injectCSSVariables();
        console.log('CSS variables refreshed');
    }
}

// Create global instance
const dynamicCSS = new DynamicCSSGenerator();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    dynamicCSS.init();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DynamicCSSGenerator, dynamicCSS };
} 