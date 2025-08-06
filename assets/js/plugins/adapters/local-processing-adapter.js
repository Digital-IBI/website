/**
 * Local Processing Adapter
 * Handles basic image processing locally
 */

class LocalProcessingAdapter {
    constructor() {
        this.name = 'local-processing';
        this.supportedOperations = ['resize', 'compress', 'format'];
    }

    // Process image
    async process(imageData, options = {}) {
        try {
            const processedData = { ...imageData };

            // Basic processing operations
            if (options.resize) {
                processedData.dimensions = this.calculateDimensions(
                    imageData.dimensions, 
                    options.resize
                );
            }

            if (options.compress) {
                processedData.compressed = true;
                processedData.originalSize = imageData.size;
                processedData.size = this.estimateCompressedSize(imageData.size);
            }

            if (options.format) {
                processedData.format = options.format;
                processedData.filename = this.changeExtension(
                    imageData.filename, 
                    options.format
                );
            }

            // Add processing metadata
            processedData.processedAt = new Date().toISOString();
            processedData.processingOptions = options;

            return {
                success: true,
                data: processedData
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Calculate new dimensions
    calculateDimensions(originalDimensions, resizeOptions) {
        if (!originalDimensions) {
            return null;
        }

        const { width: originalWidth, height: originalHeight } = originalDimensions;
        let newWidth = originalWidth;
        let newHeight = originalHeight;

        if (resizeOptions.width) {
            newWidth = resizeOptions.width;
            if (resizeOptions.maintainAspectRatio !== false) {
                newHeight = (originalHeight * newWidth) / originalWidth;
            }
        }

        if (resizeOptions.height) {
            newHeight = resizeOptions.height;
            if (resizeOptions.maintainAspectRatio !== false) {
                newWidth = (originalWidth * newHeight) / originalHeight;
            }
        }

        return {
            width: Math.round(newWidth),
            height: Math.round(newHeight)
        };
    }

    // Estimate compressed file size
    estimateCompressedSize(originalSize) {
        // Simple estimation - in real implementation, this would be more accurate
        const compressionRatio = 0.7; // 30% reduction
        return Math.round(originalSize * compressionRatio);
    }

    // Change file extension
    changeExtension(filename, newFormat) {
        const nameWithoutExtension = filename.split('.').slice(0, -1).join('.');
        return `${nameWithoutExtension}.${newFormat}`;
    }

    // Generate thumbnails
    async generateThumbnails(imageData, sizes = []) {
        try {
            const thumbnails = [];

            for (const size of sizes) {
                const thumbnail = {
                    ...imageData,
                    id: `${imageData.id}_thumb_${size.width}x${size.height}`,
                    filename: this.generateThumbnailFilename(imageData.filename, size),
                    dimensions: size,
                    type: 'thumbnail',
                    parentId: imageData.id
                };

                thumbnails.push(thumbnail);
            }

            return {
                success: true,
                data: thumbnails
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generate thumbnail filename
    generateThumbnailFilename(originalFilename, size) {
        const nameWithoutExtension = originalFilename.split('.').slice(0, -1).join('.');
        const extension = originalFilename.split('.').pop();
        return `${nameWithoutExtension}_${size.width}x${size.height}.${extension}`;
    }

    // Validate processing options
    validateOptions(options) {
        const errors = [];

        if (options.resize) {
            if (options.resize.width && options.resize.width <= 0) {
                errors.push('Width must be greater than 0');
            }
            if (options.resize.height && options.resize.height <= 0) {
                errors.push('Height must be greater than 0');
            }
        }

        if (options.format && !['jpg', 'jpeg', 'png', 'webp'].includes(options.format)) {
            errors.push('Unsupported format');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    // Get supported operations
    getSupportedOperations() {
        return this.supportedOperations;
    }

    // Check if operation is supported
    isOperationSupported(operation) {
        return this.supportedOperations.includes(operation);
    }
} 