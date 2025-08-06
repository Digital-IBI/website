/**
 * Images Page JavaScript
 * Handles image management with localStorage and empty states
 */

class ImagesPage {
    constructor() {
        this.images = [];
        this.filteredImages = [];
        this.init();
    }

    async init() {
        // Show loading skeleton initially
        showSkeleton('imagesContainer', 'image-grid');
        
        await this.loadImages();
        this.setupEventListeners();
    }

    async loadImages() {
        try {
            // Use localStorage
            this.loadFromLocalStorage();
            this.filteredImages = [...this.images];
            this.updateImagesDisplay();

        } catch (error) {
            console.error('Error loading images:', error);
            this.loadFromLocalStorage();
            this.updateImagesDisplay();
        }
    }

    loadFromLocalStorage() {
        try {
            const imageData = JSON.parse(localStorage.getItem('imageManagementData') || '[]');
            this.images = Array.isArray(imageData) ? imageData : [];
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.images = [];
        }
    }

    updateImagesDisplay() {
        const container = document.getElementById('imagesContainer');
        if (!container) return;

        if (this.filteredImages.length === 0) {
            showEmptyState('imagesContainer', 'images', {
                title: 'No Images Uploaded',
                description: 'Upload your first image to manage your visual assets and create engaging content.',
                icon: 'fas fa-images',
                actionText: 'Upload Image',
                actionUrl: '#',
                showAction: true
            });
            return;
        }

        // Generate images grid HTML
        const html = this.generateImagesGridHTML();
        container.innerHTML = html;
    }

    generateImagesGridHTML() {
        let html = '<div class="row">';

        this.filteredImages.forEach(image => {
            html += this.generateImageCardHTML(image);
        });

        html += '</div>';
        return html;
    }

    generateImageCardHTML(image) {
        const imageUrl = image.url || image.src || 'assets/images/placeholder.jpg';
        const fileSize = this.formatFileSize(image.size || 0);
        const uploadDate = new Date(image.uploadedAt || image.createdAt || Date.now()).toLocaleDateString();
        
        return `
            <div class="col-md-4 col-lg-3 mb-4">
                <div class="image-card">
                    <div class="text-center mb-3">
                        <img src="${imageUrl}" alt="${image.alt || image.name}" class="image-preview" 
                             onerror="this.src='assets/images/placeholder.jpg'">
                    </div>
                    <div class="mb-2">
                        <h6 class="fw-bold">${image.name || 'Unnamed Image'}</h6>
                        <small class="text-muted">${this.formatCategory(image.category)}</small>
                    </div>
                    <div class="mb-2">
                        <small class="text-muted">
                            <i class="fas fa-file-image"></i> ${fileSize}<br>
                            <i class="fas fa-calendar"></i> ${uploadDate}
                        </small>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewImage('${image.id || image.name}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="editImage('${image.id || image.name}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteImage('${image.id || image.name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    formatCategory(category) {
        return category ? category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'General';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setupEventListeners() {
        // Add any additional event listeners here
    }

    async addImage(imageData) {
        try {
            this.images.unshift(imageData);
            this.filteredImages = [...this.images];
            this.updateImagesDisplay();
            
            // Save to localStorage as backup
            this.saveToLocalStorage();
            
            showNotification('Image added successfully!', 'success');
        } catch (error) {
            console.error('Error adding image:', error);
            showNotification('Error adding image', 'error');
        }
    }

    async updateImage(imageId, updateData) {
        try {
            const index = this.images.findIndex(img => img.id === imageId || img.name === imageId);
            if (index !== -1) {
                this.images[index] = { ...this.images[index], ...updateData };
                this.filteredImages = [...this.images];
                this.updateImagesDisplay();
                
                // Save to localStorage as backup
                this.saveToLocalStorage();
                
                showNotification('Image updated successfully!', 'success');
            }
        } catch (error) {
            console.error('Error updating image:', error);
            showNotification('Error updating image', 'error');
        }
    }

    async deleteImage(imageId) {
        try {
            const image = this.images.find(img => img.id === imageId || img.name === imageId);
            if (!image) {
                showNotification('Image not found', 'error');
                return;
            }

            // Delete from localStorage
            if (typeof IMAGE_MANAGEMENT !== 'undefined' && image.path) {
                const deleteResult = await IMAGE_MANAGEMENT.deleteImage(image.path);
                if (!deleteResult.success) {
                    console.warn('Failed to delete from localStorage:', deleteResult.error);
                }
            }

            // Remove from local arrays
            this.images = this.images.filter(img => img.id !== imageId && img.name !== imageId);
            this.filteredImages = this.filteredImages.filter(img => img.id !== imageId && img.name !== imageId);
            this.updateImagesDisplay();
            
            // Save to localStorage as backup
            this.saveToLocalStorage();
            
            showNotification('Image deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting image:', error);
            showNotification('Error deleting image', 'error');
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('imageManagementData', JSON.stringify(this.images));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
}

// Initialize the page
let imagesPage;

document.addEventListener('DOMContentLoaded', function() {
    imagesPage = new ImagesPage();
});

// Global functions for HTML onclick handlers
function showUploadModal() {
    // This will be handled by the form submission
    console.log('Upload modal functionality');
}

async function handleImageUpload(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const formData = new FormData(form);
        
        const file = document.getElementById('imageFile').files[0];
        const category = document.getElementById('imageCategory').value;
        const name = document.getElementById('imageName').value;
        const alt = document.getElementById('imageAlt').value;
        const description = document.getElementById('imageDescription').value;
        
        if (!file) {
            showNotification('Please select an image file', 'error');
            return;
        }
        
        if (!category || !name) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        submitBtn.disabled = true;
        
        // Upload to localStorage
        if (typeof IMAGE_MANAGEMENT !== 'undefined') {
            const uploadResult = await IMAGE_MANAGEMENT.uploadImage(file, category, {
                alt: alt,
                description: description,
                name: name
            });
            
            if (uploadResult.success) {
                // Add to local array
                await imagesPage.addImage(uploadResult.metadata);
                
                // Reset form
                form.reset();
                
                showNotification('Image uploaded successfully to localStorage!', 'success');
            } else {
                throw new Error(uploadResult.error);
            }
        } else {
            // Fallback to localStorage only
            const imageData = {
                id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: name,
                category: category,
                alt: alt,
                description: description,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                // Create a local URL for preview
                url: URL.createObjectURL(file)
            };
            
            await imagesPage.addImage(imageData);
            
            // Reset form
            form.reset();
            
            showNotification('Image uploaded successfully (local storage)!', 'success');
        }
        
    } catch (error) {
        console.error('Error uploading image:', error);
        showNotification('Error uploading image: ' + error.message, 'error');
    } finally {
        // Reset button state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Image';
        submitBtn.disabled = false;
    }
}

function viewImage(imageId) {
    const image = imagesPage.images.find(img => img.id === imageId || img.name === imageId);
    if (image) {
        // Create modal to show image details
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${image.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="${image.url}" alt="${image.alt || image.name}" class="img-fluid mb-3">
                        <div class="text-start">
                            <p><strong>Category:</strong> ${imagesPage.formatCategory(image.category)}</p>
                            <p><strong>Size:</strong> ${imagesPage.formatFileSize(image.size || 0)}</p>
                            <p><strong>Uploaded:</strong> ${new Date(image.uploadedAt || image.createdAt).toLocaleDateString()}</p>
                            ${image.description ? `<p><strong>Description:</strong> ${image.description}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }
}

function editImage(imageId) {
    // Implement edit functionality
    showNotification('Edit functionality coming soon', 'info');
}

async function deleteImage(imageId) {
    if (confirm('Are you sure you want to delete this image?')) {
        await imagesPage.deleteImage(imageId);
    }
}

function exportImages() {
    try {
        const dataStr = JSON.stringify(imagesPage.images, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'images-export.json';
        link.click();
        
        URL.revokeObjectURL(url);
        showNotification('Images exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting images:', error);
        showNotification('Error exporting images', 'error');
    }
}

function importImages() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const text = await file.text();
                const importedImages = JSON.parse(text);
                
                if (Array.isArray(importedImages)) {
                    // Add imported images to existing ones
                    imagesPage.images = [...importedImages, ...imagesPage.images];
                    imagesPage.filteredImages = [...imagesPage.images];
                    imagesPage.updateImagesDisplay();
                    imagesPage.saveToLocalStorage();
                    
                    showNotification(`${importedImages.length} images imported successfully!`, 'success');
                } else {
                    throw new Error('Invalid import format');
                }
            } catch (error) {
                console.error('Error importing images:', error);
                showNotification('Error importing images: Invalid file format', 'error');
            }
        }
    };
    input.click();
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
} 