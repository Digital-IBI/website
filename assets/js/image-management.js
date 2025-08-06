/**
 * Comprehensive Image Management System
 * Handles static images, dynamic ads, tracking, and SEO optimization
 * Uses localStorage for data storage
 */

// Image Management Configuration
const IMAGE_MANAGEMENT = {
    // Storage Configuration
    storage: {
        baseUrl: '/assets/images/',
        cdnUrl: '/assets/images/',
        defaultParams: ''
    },
    
    // Image paths
    images: {
        'banner-hero': {
            path: 'banners/banner-hero-it-solutions.jpg',
            alt: 'Digital IBI Technologies - IT Solutions Banner',
            variants: {
                mobile: 'banners/banner-hero-it-solutions-mobile.jpg',
                tablet: 'banners/banner-hero-it-solutions-tablet.jpg'
            }
        },
        'banner-secondary': {
            path: 'banners/banner-secondary-services.jpg',
            alt: 'Digital IBI Technologies - Services Banner',
            variants: {
                mobile: 'banners/banner-secondary-services-mobile.jpg',
                tablet: 'banners/banner-secondary-services-tablet.jpg'
            }
        },
        'service-app-development': {
            path: 'services/service-app-development.jpg',
            alt: 'Mobile App Development Services',
            variants: {
                mobile: 'services/service-app-development-mobile.jpg',
                tablet: 'services/service-app-development-tablet.jpg'
            }
        },
        'service-digital-marketing': {
            path: 'services/service-digital-marketing.jpg',
            alt: 'Digital Marketing Services',
            variants: {
                mobile: 'services/service-digital-marketing-mobile.jpg',
                tablet: 'services/service-digital-marketing-tablet.jpg'
            }
        },
        'project-ecommerce': {
            path: 'projects/project-ecommerce-platform.jpg',
            alt: 'E-commerce Platform Development Project',
            variants: {
                mobile: 'projects/project-ecommerce-platform-mobile.jpg',
                tablet: 'projects/project-ecommerce-platform-tablet.jpg'
            }
        },
        'team-member-john': {
            path: 'team/team-member-john-doe.jpg',
            alt: 'John Doe - Senior Developer',
            variants: {
                mobile: 'team/team-member-john-doe-mobile.jpg',
                tablet: 'team/team-member-john-doe-tablet.jpg'
            }
        }
    },
    
    // Get image URL
    getImageUrl: function(path, variant = null) {
        const baseUrl = IMAGE_MANAGEMENT.storage.baseUrl;
        const encodedPath = encodeURIComponent(path);
        const url = `${baseUrl}${encodedPath}${IMAGE_MANAGEMENT.storage.defaultParams}`;
        return url;
    },
    
    // Get responsive image URL
    getResponsiveImageUrl: function(imageKey, variant = null) {
        const image = this.images[imageKey];
        if (!image) {
            console.warn(`Image key '${imageKey}' not found`);
            return '';
        }
        
        let path = image.path;
        if (variant && image.variants && image.variants[variant]) {
            path = image.variants[variant];
        }
        
        return this.getImageUrl(path);
    },
    
    // Upload image to localStorage
    async uploadImage(file, category = 'general', metadata = {}) {
        try {
            console.log('Uploading image to localStorage:', file.name);
            
            // Create image metadata
            const imageMetadata = {
                id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: file.name,
                path: `${category}/${file.name}`,
                size: file.size,
                type: file.type,
                category: category,
                uploadedAt: new Date().toISOString(),
                ...metadata
            };
            
            // Save to localStorage
            this.saveImageToLocalStorage(imageMetadata);
            
            console.log('Image uploaded successfully to localStorage!');
            return {
                success: true,
                metadata: imageMetadata,
                url: this.getImageUrl(imageMetadata.path)
            };
            
        } catch (error) {
            console.error('Error uploading image:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Delete image from localStorage
    async deleteImage(path) {
        try {
            console.log('Deleting image from localStorage:', path);
            
            // Remove from localStorage
            this.removeImageFromLocalStorage(path);
            
            console.log('Image deleted from localStorage');
            return { success: true };
            
        } catch (error) {
            console.error('Error deleting image:', error);
            return { success: false, error: error.message };
        }
    },
    
    // List images from localStorage
    async listImages(category = '') {
        try {
            const images = this.getImagesFromLocalStorage();
            
            if (category) {
                return {
                    success: true,
                    images: images.filter(img => img.category === category)
                };
            }
            
            return { success: true, images: images };
            
        } catch (error) {
            console.error('Error listing images:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Save image metadata to localStorage
    saveImageToLocalStorage(imageMetadata) {
        const images = this.getImagesFromLocalStorage();
        images.unshift(imageMetadata); // Add to beginning
        localStorage.setItem('imageManagementData', JSON.stringify(images));
    },
    
    // Remove image from localStorage
    removeImageFromLocalStorage(path) {
        const images = this.getImagesFromLocalStorage();
        const filteredImages = images.filter(img => img.path !== path);
        localStorage.setItem('imageManagementData', JSON.stringify(filteredImages));
    },
    
    // Get images from localStorage
    getImagesFromLocalStorage() {
        return JSON.parse(localStorage.getItem('imageManagementData') || '[]');
    },
    
    // Get all images
    async getAllImages() {
        try {
            // Use localStorage
            const images = this.getImagesFromLocalStorage();
            return { success: true, images: images };
            
        } catch (error) {
            console.error('Error getting all images:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Optimize image for web
    optimizeImage: function(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
                
                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    },
    
    // Generate image variants
    generateVariants: function(file, variants = ['mobile', 'tablet']) {
        const promises = variants.map(async (variant) => {
            const sizes = {
                mobile: { width: 768, height: 1024 },
                tablet: { width: 1024, height: 768 }
            };
            
            const size = sizes[variant];
            if (!size) return null;
            
            const optimized = await this.optimizeImage(file, size.width, size.height);
            return { variant, blob: optimized };
        });
        
        return Promise.all(promises);
    }
};

// Export for global access
window.IMAGE_MANAGEMENT = IMAGE_MANAGEMENT; 