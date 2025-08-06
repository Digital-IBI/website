/**
 * Image Management Core
 * Main system that coordinates plugins and adapters
 */

class ImageManagementCore {
    constructor() {
        this.pluginManager = null;
        this.config = null;
        this.init();
    }

    async init() {
        // Wait for config to be loaded
        if (typeof CONFIG === 'undefined') {
            console.warn('CONFIG not loaded, using defaults');
            this.config = {
                services: {
                    upload: 'local',
                    storage: 'local',
                    processing: 'local'
                },
                features: {
                    imageOptimization: false,
                    analytics: true
                }
            };
        } else {
            this.config = CONFIG;
        }

        // Initialize plugin manager
        this.pluginManager = new PluginManager();
        
        console.log('Image Management Core initialized');
        console.log('Available plugins:', this.pluginManager.getAvailablePlugins());
    }

    // Upload image
    async uploadImage(file, options = {}) {
        try {
            console.log('Uploading image:', file.name);

            // Upload file
            const uploadResult = await this.pluginManager.execute('upload', 'upload', file, options);
            
            if (!uploadResult.success) {
                throw new Error(uploadResult.error);
            }

            // Store metadata
            const storageResult = await this.pluginManager.execute('storage', 'store', uploadResult.data.metadata);
            
            if (!storageResult.success) {
                throw new Error(storageResult.error);
            }

            // Process image if optimization is enabled
            if (this.config.isFeatureEnabled('imageOptimization')) {
                const processResult = await this.pluginManager.execute('processing', 'process', uploadResult.data.metadata, {
                    compress: true,
                    resize: options.resize
                });

                if (processResult.success) {
                    // Update with processed data
                    await this.pluginManager.execute('storage', 'update', uploadResult.data.id, processResult.data);
                }
            }

            // Track analytics
            if (this.config.isFeatureEnabled('analytics')) {
                this.trackImageUpload(uploadResult.data);
            }

            return {
                success: true,
                data: uploadResult.data
            };

        } catch (error) {
            console.error('Image upload failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get image by ID
    async getImage(imageId) {
        try {
            const result = await this.pluginManager.execute('storage', 'get', imageId);
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all images
    async getAllImages() {
        try {
            const storagePlugin = this.pluginManager.getPlugin('storage');
            const images = storagePlugin.getAll();
            
            return {
                success: true,
                data: images
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update image
    async updateImage(imageId, updateData) {
        try {
            const result = await this.pluginManager.execute('storage', 'update', imageId, updateData);
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Delete image
    async deleteImage(imageId) {
        try {
            // Delete from storage
            const storageResult = await this.pluginManager.execute('storage', 'delete', imageId);
            
            if (!storageResult.success) {
                throw new Error(storageResult.error);
            }

            // Delete from upload service if available
            if (this.pluginManager.hasPlugin('upload')) {
                await this.pluginManager.execute('upload', 'delete', imageId);
            }

            return {
                success: true,
                message: 'Image deleted successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Search images
    async searchImages(query) {
        try {
            const result = await this.pluginManager.execute('storage', 'search', query);
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get images by category
    async getImagesByCategory(category) {
        try {
            const result = await this.pluginManager.execute('storage', 'getByCategory', category);
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Process image
    async processImage(imageId, options = {}) {
        try {
            // Get image data
            const imageResult = await this.getImage(imageId);
            
            if (!imageResult.success) {
                throw new Error(imageResult.error);
            }

            // Process image
            const processResult = await this.pluginManager.execute('processing', 'process', imageResult.data, options);
            
            if (!processResult.success) {
                throw new Error(processResult.error);
            }

            // Update with processed data
            const updateResult = await this.updateImage(imageId, processResult.data);
            
            return updateResult;

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Export data
    async exportData() {
        try {
            const result = await this.pluginManager.execute('storage', 'export');
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Import data
    async importData(data) {
        try {
            const result = await this.pluginManager.execute('storage', 'import', data);
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Track image upload for analytics
    trackImageUpload(imageData) {
        try {
            const analyticsData = {
                event: 'image_upload',
                imageId: imageData.id,
                category: imageData.category,
                size: imageData.size,
                timestamp: new Date().toISOString()
            };

            // Store analytics in localStorage
            const analytics = JSON.parse(localStorage.getItem('imageAnalytics') || '[]');
            analytics.push(analyticsData);
            localStorage.setItem('imageAnalytics', JSON.stringify(analytics));

            console.log('Image upload tracked:', analyticsData);
        } catch (error) {
            console.error('Analytics tracking failed:', error);
        }
    }

    // Get system status
    getStatus() {
        return {
            config: this.config,
            plugins: this.pluginManager ? this.pluginManager.getAvailablePlugins() : [],
            features: this.config ? this.config.features : {}
        };
    }
}

// Make core system globally available
window.ImageManagementCore = ImageManagementCore; 