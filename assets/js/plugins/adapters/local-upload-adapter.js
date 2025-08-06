/**
 * Local Upload Adapter
 * Handles file uploads to local storage
 */

class LocalUploadAdapter {
    constructor() {
        this.name = 'local-upload';
        this.supportedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
    }

    // Upload file to local storage
    async upload(file, options = {}) {
        try {
            // Validate file
            this.validateFile(file);

            // Create file metadata
            const metadata = this.createMetadata(file, options);

            // Store file in localStorage (as base64 for demo)
            const fileData = await this.fileToBase64(file);
            
            // Store metadata
            this.storeMetadata(metadata, fileData);

            return {
                success: true,
                data: {
                    id: metadata.id,
                    url: metadata.url,
                    path: metadata.path,
                    metadata: metadata
                }
            };
        } catch (error) {
            console.error('Local upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Validate file
    validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }

        if (file.size > this.maxFileSize) {
            throw new Error(`File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`);
        }

        const extension = file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(extension)) {
            throw new Error(`Unsupported file format: ${extension}`);
        }
    }

    // Create file metadata
    createMetadata(file, options) {
        const id = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const extension = file.name.split('.').pop().toLowerCase();
        const filename = `${id}.${extension}`;
        
        return {
            id: id,
            name: file.name,
            filename: filename,
            path: options.path || `assets/images/${filename}`,
            url: options.url || `assets/images/${filename}`,
            size: file.size,
            type: file.type,
            extension: extension,
            category: options.category || 'general',
            alt: options.alt || file.name,
            title: options.title || file.name,
            uploadedAt: new Date().toISOString(),
            dimensions: options.dimensions || null,
            seo: options.seo || {},
            tracking: options.tracking || {}
        };
    }

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Store metadata in localStorage
    storeMetadata(metadata, fileData) {
        try {
            // Get existing images
            const images = JSON.parse(localStorage.getItem('imageManagementData') || '[]');
            
            // Add new image
            images.unshift({
                ...metadata,
                fileData: fileData // Store base64 data for demo
            });

            // Save back to localStorage
            localStorage.setItem('imageManagementData', JSON.stringify(images));
            
            console.log('Image stored locally:', metadata.id);
        } catch (error) {
            console.error('Error storing metadata:', error);
            throw new Error('Failed to store image metadata');
        }
    }

    // Delete file
    async delete(imageId) {
        try {
            const images = JSON.parse(localStorage.getItem('imageManagementData') || '[]');
            const filteredImages = images.filter(img => img.id !== imageId);
            
            localStorage.setItem('imageManagementData', JSON.stringify(filteredImages));
            
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

    // Get file info
    async getInfo(imageId) {
        try {
            const images = JSON.parse(localStorage.getItem('imageManagementData') || '[]');
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
} 