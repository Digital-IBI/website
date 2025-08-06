/**
 * Local Storage Adapter
 * Manages image metadata and data in localStorage
 */

class LocalStorageAdapter {
    constructor() {
        this.name = 'local-storage';
        this.storageKey = 'imageManagementData';
    }

    // Store image data
    async store(imageData) {
        try {
            const images = this.getAll();
            images.unshift(imageData);
            
            localStorage.setItem(this.storageKey, JSON.stringify(images));
            
            return {
                success: true,
                data: imageData
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get image by ID
    async get(imageId) {
        try {
            const images = this.getAll();
            const image = images.find(img => img.id === imageId);
            
            if (!image) {
                throw new Error('Image not found');
            }

            return {
                success: true,
                data: image
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all images
    getAll() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    // Update image
    async update(imageId, updateData) {
        try {
            const images = this.getAll();
            const index = images.findIndex(img => img.id === imageId);
            
            if (index === -1) {
                throw new Error('Image not found');
            }

            images[index] = { ...images[index], ...updateData };
            localStorage.setItem(this.storageKey, JSON.stringify(images));

            return {
                success: true,
                data: images[index]
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Delete image
    async delete(imageId) {
        try {
            const images = this.getAll();
            const filteredImages = images.filter(img => img.id !== imageId);
            
            localStorage.setItem(this.storageKey, JSON.stringify(filteredImages));

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
    async search(query) {
        try {
            const images = this.getAll();
            const results = images.filter(img => 
                img.name.toLowerCase().includes(query.toLowerCase()) ||
                img.category.toLowerCase().includes(query.toLowerCase()) ||
                (img.alt && img.alt.toLowerCase().includes(query.toLowerCase()))
            );

            return {
                success: true,
                data: results
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get images by category
    async getByCategory(category) {
        try {
            const images = this.getAll();
            const results = images.filter(img => img.category === category);

            return {
                success: true,
                data: results
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Export data
    async export() {
        try {
            const data = this.getAll();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Import data
    async import(data) {
        try {
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format');
            }

            localStorage.setItem(this.storageKey, JSON.stringify(data));

            return {
                success: true,
                message: `Imported ${data.length} images`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Clear all data
    async clear() {
        try {
            localStorage.removeItem(this.storageKey);
            return {
                success: true,
                message: 'All data cleared'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
} 