/**
 * HTML Image Helper Functions
 * Easy way to use images in HTML with SEO and tracking
 */

class HTMLImageHelper {
    constructor() {
        this.trackingEnabled = true;
    }

    // Create an image element with all SEO and tracking attributes
    createImage(category, key, options = {}) {
        const imageData = IMAGE_MANAGEMENT.utils.getImageWithTracking(category, key, options.campaign);
        if (!imageData) {
            console.error(`Image not found: ${category}.${key}`);
            return null;
        }

        const img = document.createElement('img');
        
        // Set basic attributes
        img.src = imageData.url;
        img.alt = options.alt || imageData.alt;
        img.title = options.title || imageData.title;
        
        // Set dimensions
        if (imageData.dimensions) {
            img.width = options.width || imageData.dimensions.width;
            img.height = options.height || imageData.dimensions.height;
        }
        
        // Add CSS classes
        if (options.className) {
            img.className = options.className;
        }
        
        // Add lazy loading
        if (options.lazy !== false) {
            img.loading = 'lazy';
        }
        
        // Add tracking
        if (this.trackingEnabled && imageData.tracking) {
            img.addEventListener('load', () => {
                IMAGE_MANAGEMENT.utils.trackImageInteraction(imageData, 'view');
            });
            
            img.addEventListener('click', () => {
                IMAGE_MANAGEMENT.utils.trackImageInteraction(imageData, 'click');
            });
        }
        
        return img;
    }

    // Create a background image element
    createBackgroundImage(category, key, options = {}) {
        const imageData = IMAGE_MANAGEMENT.utils.getImageWithTracking(category, key, options.campaign);
        if (!imageData) {
            console.error(`Image not found: ${category}.${key}`);
            return null;
        }

        const element = document.createElement('div');
        
        // Set background image using CSS variable
        const cssVarName = `--${category}-${key}`;
        element.style.backgroundImage = `var(${cssVarName})`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center center';
        element.style.backgroundRepeat = 'no-repeat';
        
        // Set dimensions
        if (imageData.dimensions) {
            element.style.width = options.width || `${imageData.dimensions.width}px`;
            element.style.height = options.height || `${imageData.dimensions.height}px`;
        }
        
        // Add CSS classes
        if (options.className) {
            element.className = options.className;
        }
        
        // Add content
        if (options.content) {
            element.innerHTML = options.content;
        }
        
        // Add tracking
        if (this.trackingEnabled && imageData.tracking) {
            element.addEventListener('click', () => {
                IMAGE_MANAGEMENT.utils.trackImageInteraction(imageData, 'click');
            });
        }
        
        return element;
    }

    // Create a responsive image with multiple sizes
    createResponsiveImage(category, key, options = {}) {
        const imageData = IMAGE_MANAGEMENT.utils.getImageWithTracking(category, key, options.campaign);
        if (!imageData) {
            console.error(`Image not found: ${category}.${key}`);
            return null;
        }

        const picture = document.createElement('picture');
        
        // Create source elements for different screen sizes
        if (options.sizes) {
            options.sizes.forEach(size => {
                const source = document.createElement('source');
                source.media = size.media;
                source.srcset = `${imageData.url}&w=${size.width}`;
                picture.appendChild(source);
            });
        }
        
        // Create img element
        const img = this.createImage(category, key, options);
        if (img) {
            picture.appendChild(img);
        }
        
        return picture;
    }

    // Create a dynamic ad image that changes based on user segment
    createDynamicAdImage(category, key, userSegment = null, options = {}) {
        const imageData = IMAGE_MANAGEMENT.utils.getDynamicAdImage(category, key, userSegment);
        if (!imageData) {
            console.error(`Dynamic image not found: ${category}.${key}`);
            return null;
        }

        const element = document.createElement('div');
        element.className = 'dynamic-ad-image';
        
        // Set initial background
        element.style.backgroundImage = `var(--${category}-${key})`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center center';
        element.style.backgroundRepeat = 'no-repeat';
        element.style.transition = 'background-image 0.3s ease';
        
        // Set dimensions
        if (imageData.dimensions) {
            element.style.width = options.width || `${imageData.dimensions.width}px`;
            element.style.height = options.height || `${imageData.dimensions.height}px`;
        }
        
        // Add content
        if (options.content) {
            element.innerHTML = options.content;
        }
        
        // Add tracking
        if (this.trackingEnabled && imageData.tracking) {
            element.addEventListener('click', () => {
                IMAGE_MANAGEMENT.utils.trackImageInteraction(imageData, 'click');
            });
        }
        
        return element;
    }

    // Update an existing element's background image
    updateBackgroundImage(element, category, key, options = {}) {
        const imageData = IMAGE_MANAGEMENT.utils.getImageWithTracking(category, key, options.campaign);
        if (!imageData) {
            console.error(`Image not found: ${category}.${key}`);
            return false;
        }

        const cssVarName = `--${category}-${key}`;
        element.style.backgroundImage = `var(${cssVarName})`;
        
        // Add tracking
        if (this.trackingEnabled && imageData.tracking) {
            element.addEventListener('click', () => {
                IMAGE_MANAGEMENT.utils.trackImageInteraction(imageData, 'click');
            });
        }
        
        return true;
    }

    // Create an image gallery
    createImageGallery(images, options = {}) {
        const gallery = document.createElement('div');
        gallery.className = options.className || 'image-gallery';
        
        images.forEach((imageConfig, index) => {
            const imageElement = this.createImage(
                imageConfig.category, 
                imageConfig.key, 
                {
                    ...options,
                    className: options.itemClassName || 'gallery-item',
                    lazy: index > 2 ? true : false // Lazy load images after first 3
                }
            );
            
            if (imageElement) {
                gallery.appendChild(imageElement);
            }
        });
        
        return gallery;
    }

    // Create a carousel/slider
    createImageCarousel(images, options = {}) {
        const carousel = document.createElement('div');
        carousel.className = options.className || 'image-carousel';
        
        const container = document.createElement('div');
        container.className = 'carousel-container';
        
        images.forEach((imageConfig, index) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            
            const imageElement = this.createImage(
                imageConfig.category, 
                imageConfig.key, 
                {
                    ...options,
                    className: options.itemClassName || 'carousel-image'
                }
            );
            
            if (imageElement) {
                slide.appendChild(imageElement);
            }
            
            container.appendChild(slide);
        });
        
        carousel.appendChild(container);
        
        // Add navigation if requested
        if (options.navigation !== false) {
            const nav = this.createCarouselNavigation(images.length);
            carousel.appendChild(nav);
        }
        
        return carousel;
    }

    // Create carousel navigation
    createCarouselNavigation(slideCount) {
        const navigation = document.createElement('div');
        navigation.className = 'carousel-navigation';
        
        for (let i = 0; i < slideCount; i++) {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot';
            dot.setAttribute('data-slide', i);
            navigation.appendChild(dot);
        }
        
        return navigation;
    }

    // Enable/disable tracking
    setTrackingEnabled(enabled) {
        this.trackingEnabled = enabled;
    }

    // Get image data for external use
    getImageData(category, key, campaign = null) {
        return IMAGE_MANAGEMENT.utils.getImageWithTracking(category, key, campaign);
    }
}

// Create global instance
const htmlImageHelper = new HTMLImageHelper();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HTMLImageHelper, htmlImageHelper };
} 