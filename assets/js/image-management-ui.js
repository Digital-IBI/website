/**
 * Image Management UI JavaScript
 * Handles all UI interactions and data management
 */

class ImageManagementUI {
    constructor() {
        this.currentData = {
            images: {},
            campaigns: {},
            analytics: {},
            settings: {}
        };
        this.charts = {};
        this.core = null;
        this.init();
    }

    async init() {
        // Initialize core system
        this.core = new ImageManagementCore();
        await this.core.init();
        
        this.loadData();
        this.setupEventListeners();
        this.loadDashboard();
        this.loadImages();
        this.loadCampaigns();
        this.loadAnalytics();
        this.loadSettings();
    }

    // Load data from localStorage or default data
    loadData() {
        const savedData = localStorage.getItem('imageManagementData');
        if (savedData) {
            this.currentData = JSON.parse(savedData);
        } else {
            // Load default data from IMAGE_MANAGEMENT if available
            if (typeof IMAGE_MANAGEMENT !== 'undefined') {
                this.currentData.images = IMAGE_MANAGEMENT.images;
                this.currentData.campaigns = IMAGE_MANAGEMENT.adCampaigns;
            }
        }
    }

    // Save data to localStorage
    saveData() {
        localStorage.setItem('imageManagementData', JSON.stringify(this.currentData));
    }

    // Setup event listeners
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Form submissions
        document.getElementById('addImageForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addImage();
        });

        document.getElementById('addCampaignForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCampaign();
        });

        // Search and filter
        document.getElementById('searchFilter')?.addEventListener('input', (e) => {
            this.filterImages();
        });
    }

    // Dashboard functions
    loadDashboard() {
        console.log('Loading dashboard...');
        this.updateStats();
        this.loadRecentActivity();
        this.loadLeadStats();
    }

    updateStats() {
        const totalImages = Object.keys(this.currentData.images).reduce((total, category) => {
            return total + Object.keys(this.currentData.images[category]).length;
        }, 0);

        const activeCampaigns = Object.values(this.currentData.campaigns).filter(campaign => campaign.active).length;

        document.getElementById('totalImages').textContent = totalImages;
        document.getElementById('activeCampaigns').textContent = activeCampaigns;
    }

    loadLeadStats() {
        if (typeof leadManager !== 'undefined') {
            leadManager.updateLeadStats();
        }
    }

    loadRecentActivity() {
        const activityContainer = document.getElementById('recentActivity');
        if (!activityContainer) return;

        const activities = [
            { type: 'image', action: 'added', item: 'banner-hero-new.jpg', time: '2 hours ago' },
            { type: 'campaign', action: 'created', item: 'Summer Promotion', time: '1 day ago' },
            { type: 'image', action: 'updated', item: 'service-app-dev.jpg', time: '2 days ago' },
            { type: 'campaign', action: 'activated', item: 'Startup Promo', time: '3 days ago' }
        ];

        activityContainer.innerHTML = activities.map(activity => `
            <div class="d-flex align-items-center mb-3">
                <div class="me-3">
                    <i class="fas fa-${activity.type === 'image' ? 'image' : 'bullhorn'} text-primary"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="fw-bold">${activity.item}</div>
                    <small class="text-muted">${activity.action} ${activity.time}</small>
                </div>
            </div>
        `).join('');
    }

    // Image management functions
    loadImages() {
        console.log('Loading images...');
        const tableBody = document.getElementById('imagesTableBody');
        if (!tableBody) {
            console.error('Images table body not found');
            return;
        }

        let html = '';
        Object.keys(this.currentData.images).forEach(category => {
            Object.keys(this.currentData.images[category]).forEach(key => {
                const image = this.currentData.images[category][key];
                const views = Math.floor(Math.random() * 1000) + 100;
                const clicks = Math.floor(Math.random() * 100);
                const ctr = ((clicks / views) * 100).toFixed(2);

                html += `
                    <tr>
                        <td>
                            <img src="${this.getImagePreviewUrl(image)}" alt="${image.alt}" class="image-preview">
                        </td>
                        <td>
                            <div class="fw-bold">${image.filename}</div>
                            <small class="text-muted">${image.alt}</small>
                        </td>
                        <td>
                            <span class="badge bg-primary">${category}</span>
                        </td>
                        <td>${image.dimensions?.width || 'N/A'} × ${image.dimensions?.height || 'N/A'}</td>
                        <td>
                            <span class="status-badge status-active">Active</span>
                        </td>
                        <td>${views.toLocaleString()}</td>
                        <td>${clicks}</td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-primary" onclick="ui.editImage('${category}', '${key}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="ui.deleteImage('${category}', '${key}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        });

        tableBody.innerHTML = html;
    }

    getImagePreviewUrl(image) {
        // Mock preview URL - in real implementation, this would be the actual image URL
        return `https://via.placeholder.com/100x60/007bff/ffffff?text=${encodeURIComponent(image.filename.split('.')[0])}`;
    }

    filterImages() {
        const category = document.getElementById('categoryFilter').value;
        const status = document.getElementById('statusFilter').value;
        const search = document.getElementById('searchFilter').value.toLowerCase();

        const rows = document.querySelectorAll('#imagesTableBody tr');
        rows.forEach(row => {
            const categoryCell = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const nameCell = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const statusCell = row.querySelector('td:nth-child(5)').textContent.toLowerCase();

            const categoryMatch = !category || categoryCell.includes(category);
            const statusMatch = !status || statusCell.includes(status);
            const searchMatch = !search || nameCell.includes(search);

            row.style.display = categoryMatch && statusMatch && searchMatch ? '' : 'none';
        });
    }

    showAddImageModal() {
        const modal = new bootstrap.Modal(document.getElementById('addImageModal'));
        modal.show();
    }

    async addImage() {
        try {
            const formData = {
                pagePath: document.getElementById('imagePagePath')?.value || CONFIG.getCurrentPagePath(),
                locationKey: document.getElementById('imageLocationKey')?.value || 'general',
                category: document.getElementById('imageCategory').value,
                key: document.getElementById('imageKey').value,
                filename: document.getElementById('imageFilename').value,
                path: document.getElementById('imagePath').value,
                alt: document.getElementById('imageAltText').value,
                title: document.getElementById('imageTitle').value,
                width: parseInt(document.getElementById('imageWidth').value) || 1920,
                height: parseInt(document.getElementById('imageHeight').value) || 1080,
                keywords: document.getElementById('imageKeywords').value.split(',').map(k => k.trim()),
                description: document.getElementById('imageDescription').value
            };

            // Create image metadata
            const imageMetadata = {
                id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: formData.filename,
                filename: formData.filename,
                path: formData.path,
                alt: formData.alt,
                title: formData.title,
                category: formData.category,
                pagePath: formData.pagePath,
                locationKey: formData.locationKey,
                dimensions: { width: formData.width, height: formData.height },
                seo: {
                    keywords: formData.keywords,
                    category: formData.category,
                    priority: 'medium'
                },
                tracking: {
                    event: 'image_view',
                    category: 'engagement',
                    label: formData.key
                },
                uploadedAt: new Date().toISOString()
            };

            // Validate image for location
            const validation = CONFIG.validateImageForLocation(formData.pagePath, formData.locationKey, imageMetadata);
            if (!validation.valid) {
                this.showNotification(validation.error || validation.warning, 'warning');
            }

            // Use core system to store image
            const result = await this.core.uploadImage(null, imageMetadata);

            if (result.success) {
                // Update local data structure for UI
                if (!this.currentData.images[formData.category]) {
                    this.currentData.images[formData.category] = {};
                }

                this.currentData.images[formData.category][formData.key] = imageMetadata;

                this.saveData();
                this.loadImages();
                this.updateStats();

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addImageModal'));
                modal.hide();

                this.showNotification('Image added successfully!', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error adding image:', error);
            this.showNotification('Error adding image: ' + error.message, 'error');
        }
    }

    editImage(category, key) {
        const image = this.currentData.images[category][key];
        if (!image) return;

        // Populate modal with image data
        document.getElementById('imageCategory').value = category;
        document.getElementById('imageKey').value = key;
        document.getElementById('imageFilename').value = image.filename;
        document.getElementById('imagePath').value = image.path || '';
        document.getElementById('imageAltText').value = image.alt;
        document.getElementById('imageTitle').value = image.title;
        document.getElementById('imageWidth').value = image.dimensions?.width || '';
        document.getElementById('imageHeight').value = image.dimensions?.height || '';
        document.getElementById('imageKeywords').value = image.seo?.keywords?.join(', ') || '';
        document.getElementById('imageDescription').value = image.description || '';

        this.showAddImageModal();
    }

    deleteImage(category, key) {
        if (confirm('Are you sure you want to delete this image?')) {
            delete this.currentData.images[category][key];
            this.saveData();
            this.loadImages();
            this.updateStats();
            this.showNotification('Image deleted successfully!', 'success');
        }
    }

    // Campaign management functions
    loadCampaigns() {
        console.log('Loading campaigns...');
        const tableBody = document.getElementById('campaignsTableBody');
        if (!tableBody) {
            console.error('Campaigns table body not found');
            return;
        }

        let html = '';
        Object.keys(this.currentData.campaigns).forEach(key => {
            const campaign = this.currentData.campaigns[key];
            const views = Math.floor(Math.random() * 5000) + 500;
            const clicks = Math.floor(Math.random() * 500);
            const ctr = ((clicks / views) * 100).toFixed(2);

            html += `
                <tr>
                    <td>
                        <div class="fw-bold">${campaign.name}</div>
                        <small class="text-muted">${key}</small>
                    </td>
                    <td>
                        <span class="status-badge ${campaign.active ? 'status-active' : 'status-inactive'}">
                            ${campaign.active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        ${campaign.targetAudience?.map(audience => 
                            `<span class="badge bg-secondary me-1">${audience}</span>`
                        ).join('') || 'N/A'}
                    </td>
                    <td>${campaign.startDate}</td>
                    <td>${campaign.endDate}</td>
                    <td>${views.toLocaleString()}</td>
                    <td>${clicks}</td>
                    <td>${ctr}%</td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary" onclick="ui.editCampaign('${key}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="ui.deleteCampaign('${key}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    showAddCampaignModal() {
        const modal = new bootstrap.Modal(document.getElementById('addCampaignModal'));
        modal.show();
    }

    addCampaign() {
        const formData = {
            key: document.getElementById('campaignKey').value,
            name: document.getElementById('campaignName').value,
            startDate: document.getElementById('campaignStartDate').value,
            endDate: document.getElementById('campaignEndDate').value,
            targetAudience: Array.from(document.getElementById('campaignAudience').selectedOptions).map(option => option.value),
            campaignId: document.getElementById('campaignId').value,
            active: document.getElementById('campaignActive').checked,
            bannerImage: document.getElementById('campaignBannerImage').value,
            serviceImage: document.getElementById('campaignServiceImage').value
        };

        this.currentData.campaigns[formData.key] = {
            name: formData.name,
            active: formData.active,
            startDate: formData.startDate,
            endDate: formData.endDate,
            targetAudience: formData.targetAudience,
            images: {
                banner: formData.bannerImage,
                service: formData.serviceImage
            },
            tracking: {
                campaignId: formData.campaignId,
                utmSource: 'website',
                utmMedium: 'banner',
                utmCampaign: formData.key
            }
        };

        this.saveData();
        this.loadCampaigns();
        this.updateStats();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCampaignModal'));
        modal.hide();

        this.showNotification('Campaign created successfully!', 'success');
    }

    editCampaign(key) {
        const campaign = this.currentData.campaigns[key];
        if (!campaign) return;

        // Populate modal with campaign data
        document.getElementById('campaignKey').value = key;
        document.getElementById('campaignName').value = campaign.name;
        document.getElementById('campaignStartDate').value = campaign.startDate;
        document.getElementById('campaignEndDate').value = campaign.endDate;
        document.getElementById('campaignId').value = campaign.tracking?.campaignId || '';
        document.getElementById('campaignActive').checked = campaign.active;
        document.getElementById('campaignBannerImage').value = campaign.images?.banner || '';
        document.getElementById('campaignServiceImage').value = campaign.images?.service || '';

        // Set selected audience
        const audienceSelect = document.getElementById('campaignAudience');
        Array.from(audienceSelect.options).forEach(option => {
            option.selected = campaign.targetAudience?.includes(option.value) || false;
        });

        this.showAddCampaignModal();
    }

    deleteCampaign(key) {
        if (confirm('Are you sure you want to delete this campaign?')) {
            delete this.currentData.campaigns[key];
            this.saveData();
            this.loadCampaigns();
            this.updateStats();
            this.showNotification('Campaign deleted successfully!', 'success');
        }
    }

    // Analytics functions
    loadAnalytics() {
        console.log('Loading analytics...');
        this.createCharts();
        this.loadAnalyticsTable();
    }

    createCharts() {
        // Destroy existing charts before creating new ones
        if (this.charts.imagePerformance) {
            this.charts.imagePerformance.destroy();
        }
        if (this.charts.campaignPerformance) {
            this.charts.campaignPerformance.destroy();
        }

        // Image Performance Chart
        const imageCtx = document.getElementById('imagePerformanceChart');
        if (imageCtx) {
            this.charts.imagePerformance = new Chart(imageCtx, {
                type: 'bar',
                data: {
                    labels: ['Banner Hero', 'Service App Dev', 'Project Ecommerce', 'Team Member'],
                    datasets: [{
                        label: 'Views',
                        data: [1200, 800, 600, 400],
                        backgroundColor: 'rgba(102, 126, 234, 0.8)'
                    }, {
                        label: 'Clicks',
                        data: [120, 80, 60, 40],
                        backgroundColor: 'rgba(118, 75, 162, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        }

        // Campaign Performance Chart
        const campaignCtx = document.getElementById('campaignPerformanceChart');
        if (campaignCtx) {
            this.charts.campaignPerformance = new Chart(campaignCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Startup Promo', 'Enterprise Solutions', 'Summer Campaign'],
                    datasets: [{
                        data: [300, 200, 150],
                        backgroundColor: [
                            'rgba(102, 126, 234, 0.8)',
                            'rgba(118, 75, 162, 0.8)',
                            'rgba(255, 193, 7, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        }
                    }
                }
            });
        }
    }

    loadAnalyticsTable() {
        const tableBody = document.getElementById('analyticsTableBody');
        if (!tableBody) return;

        const analyticsData = [
            { name: 'Banner Hero', views: 1200, clicks: 120, ctr: '10.0%', avgTime: '2.5s', conversions: 12 },
            { name: 'Service App Dev', views: 800, clicks: 80, ctr: '10.0%', avgTime: '3.2s', conversions: 8 },
            { name: 'Startup Promo', views: 500, clicks: 50, ctr: '10.0%', avgTime: '4.1s', conversions: 5 },
            { name: 'Enterprise Solutions', views: 300, clicks: 30, ctr: '10.0%', avgTime: '5.0s', conversions: 3 }
        ];

        tableBody.innerHTML = analyticsData.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.views.toLocaleString()}</td>
                <td>${item.clicks}</td>
                <td>${item.ctr}</td>
                <td>${item.avgTime}</td>
                <td>${item.conversions}</td>
            </tr>
        `).join('');
    }

    refreshAnalytics() {
        // Update chart data with new random values
        if (this.charts.imagePerformance) {
            this.charts.imagePerformance.data.datasets[0].data = [
                Math.floor(Math.random() * 1000) + 500,
                Math.floor(Math.random() * 800) + 400,
                Math.floor(Math.random() * 600) + 300,
                Math.floor(Math.random() * 400) + 200
            ];
            this.charts.imagePerformance.update();
        }

        this.showNotification('Analytics refreshed!', 'info');
    }

    // Settings functions
    loadSettings() {
        console.log('Loading settings...');
        // Load saved settings from localStorage
        const settings = JSON.parse(localStorage.getItem('imageManagementSettings') || '{}');
        
        document.getElementById('gaTrackingId').value = settings.gaTrackingId || '';
        document.getElementById('enableTracking').checked = settings.enableTracking !== false;
        document.getElementById('enableLazyLoading').checked = settings.enableLazyLoading !== false;
    }

    saveSettings() {
        const settings = {
            gaTrackingId: document.getElementById('gaTrackingId').value,
            enableTracking: document.getElementById('enableTracking').checked,
            enableLazyLoading: document.getElementById('enableLazyLoading').checked
        };

        localStorage.setItem('imageManagementSettings', JSON.stringify(settings));
        this.showNotification('Settings saved successfully!', 'success');
    }

    // Utility functions
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => container.removeChild(notification), 300);
        }, 3000);
    }

    exportData() {
        const dataStr = JSON.stringify(this.currentData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'image-management-data.json';
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Data exported successfully!', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.currentData = data;
                        this.saveData();
                        this.loadImages();
                        this.loadCampaigns();
                        this.updateStats();
                        this.showNotification('Data imported successfully!', 'success');
                    } catch (error) {
                        this.showNotification('Error importing data!', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    exportAnalytics() {
        const analyticsData = {
            timestamp: new Date().toISOString(),
            images: this.currentData.images,
            campaigns: this.currentData.campaigns,
            analytics: this.currentData.analytics
        };

        const dataStr = JSON.stringify(analyticsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'analytics-export.json';
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Analytics exported successfully!', 'success');
    }
}

// Global functions for button onclick handlers
function refreshStats() {
    ui.updateStats();
    ui.showNotification('Stats refreshed!', 'info');
}

function showAddImageModal() {
    ui.showAddImageModal();
}

function showAddCampaignModal() {
    ui.showAddCampaignModal();
}

function filterImages() {
    ui.filterImages();
}

function refreshAnalytics() {
    ui.refreshAnalytics();
}

function exportData() {
    ui.exportData();
}

function importData() {
    ui.importData();
}

function exportAnalytics() {
    ui.exportAnalytics();
}

function saveSettings() {
    ui.saveSettings();
}

function addImage() {
    ui.addImage();
}

function addCampaign() {
    ui.addCampaign();
}

// Lead management functions
function showAddLeadModal() {
    const modal = new bootstrap.Modal(document.getElementById('addLeadModal'));
    modal.show();
}

function addNewLead() {
    const leadData = {
        name: document.getElementById('newLeadName').value,
        email: document.getElementById('newLeadEmail').value,
        phone: document.getElementById('newLeadPhone').value,
        company: document.getElementById('newLeadCompany').value,
        service: document.getElementById('newLeadService').value,
        source: document.getElementById('newLeadSource').value,
        budget: document.getElementById('newLeadBudget').value,
        timeline: document.getElementById('newLeadTimeline').value,
        message: document.getElementById('newLeadMessage').value
    };

    if (leadManager.addLead(leadData)) {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addLeadModal'));
        modal.hide();
        
        // Clear form
        document.getElementById('addLeadForm').reset();
        
        showNotification('Lead added successfully!', 'success');
    } else {
        showNotification('Error adding lead!', 'error');
    }
}

function editLeadFromView() {
    // Close view modal and open edit modal
    const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewLeadModal'));
    viewModal.hide();
    
    // Get current lead ID from the view modal
    const currentLeadId = document.querySelector('#viewLeadModal').getAttribute('data-lead-id');
    if (currentLeadId) {
        leadManager.editLead(currentLeadId);
    }
}

// Tab navigation function
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked nav link
    const activeLink = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        console.log('Active link updated');
    } else {
        console.error('Active link not found for:', tabName);
    }
    
    // Hide all tab content
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('show', 'active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('show', 'active');
        console.log('Tab content shown:', tabName);
    } else {
        console.error('Tab content not found:', tabName);
    }
    
            // Load tab-specific content
        setTimeout(() => {
            switch(tabName) {
                case 'dashboard':
                    if (typeof ui !== 'undefined') {
                        ui.loadDashboard();
                    }
                    break;
                case 'leads':
                    if (typeof leadManager !== 'undefined') {
                        leadManager.updateLeadTable();
                        leadManager.updateLeadStats();
                    }
                    break;
                case 'images':
                    if (typeof ui !== 'undefined') {
                        ui.loadImages();
                    }
                    break;
                case 'campaigns':
                    if (typeof ui !== 'undefined') {
                        ui.loadCampaigns();
                    }
                    break;
                case 'analytics':
                    if (typeof ui !== 'undefined') {
                        ui.loadAnalytics();
                    }
                    break;
                case 'security':
                    loadSecurityTab();
                    break;
                case 'settings':
                    if (typeof ui !== 'undefined') {
                        ui.loadSettings();
                    }
                    break;
            }
        }, 100);
}

// Security tab functions
function loadSecurityTab() {
    if (typeof securitySystem !== 'undefined') {
        const stats = securitySystem.getSecurityStats();
        document.getElementById('blockedIPs').textContent = stats.blockedIPs;
        document.getElementById('rateLimitAttempts').textContent = stats.rateLimitAttempts;
        document.getElementById('securityEvents').textContent = stats.securityLogCount;
        
        loadSecurityEvents();
    }
}

function loadSecurityEvents() {
    const securityLog = JSON.parse(localStorage.getItem('securityLog') || '[]');
    const tableBody = document.getElementById('securityEventsTable');
    
    if (!tableBody) return;
    
    let html = '';
    const recentEvents = securityLog.slice(-10).reverse(); // Show last 10 events
    
    recentEvents.forEach(event => {
        html += `
            <tr>
                <td>${new Date(event.timestamp).toLocaleString()}</td>
                <td>${event.message}</td>
                <td><span class="badge bg-warning">${event.type}</span></td>
                <td>${JSON.stringify(event.details).substring(0, 50)}...</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

function exportSecurityLog() {
    if (typeof securitySystem !== 'undefined') {
        securitySystem.exportSecurityLog();
        showNotification('Security log exported successfully!', 'success');
    }
}

// CAPTCHA functions
let currentCaptcha = null;

function refreshCaptcha() {
    if (typeof securitySystem !== 'undefined') {
        currentCaptcha = securitySystem.generateCaptcha();
        const canvas = document.getElementById('captchaCanvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Create image from data URL
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
        };
        img.src = currentCaptcha.image;
    }
}

// Enhanced login handler
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const captchaInput = document.getElementById('captchaInput').value;
    
    if (!currentCaptcha) {
        refreshCaptcha();
        showNotification('Please refresh CAPTCHA and try again', 'error');
        return;
    }
    
    const result = auth.login(username, password, captchaInput, currentCaptcha.text);
    
    if (result.success) {
        showNotification(result.message, 'success');
        // Clear form
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('captchaInput').value = '';
    } else {
        showNotification(result.message, 'error');
        refreshCaptcha();
        document.getElementById('captchaInput').value = '';
    }
}

// Setup Bootstrap tab event listeners
function setupTabEventListeners() {
    // Listen for Bootstrap tab events
    document.addEventListener('shown.bs.tab', function (event) {
        const target = event.target.getAttribute('href');
        const tabName = target.substring(1); // Remove the #
        console.log('Bootstrap tab shown:', tabName);
        
        // Load tab-specific content
        switch(tabName) {
            case 'dashboard':
                if (typeof ui !== 'undefined') {
                    ui.loadDashboard();
                }
                break;
            case 'leads':
                if (typeof leadManager !== 'undefined') {
                    leadManager.updateLeadTable();
                    leadManager.updateLeadStats();
                }
                break;
            case 'images':
                if (typeof ui !== 'undefined') {
                    ui.loadImages();
                }
                break;
            case 'campaigns':
                if (typeof ui !== 'undefined') {
                    ui.loadCampaigns();
                }
                break;
            case 'analytics':
                if (typeof ui !== 'undefined') {
                    ui.loadAnalytics();
                }
                break;
            case 'security':
                loadSecurityTab();
                break;
            case 'settings':
                if (typeof ui !== 'undefined') {
                    ui.loadSettings();
                }
                break;
        }
    });
}

// Initialize UI when DOM is loaded
let ui;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing UI...');
    ui = new ImageManagementUI();
    console.log('UI initialized:', ui);
    
    // Initialize CAPTCHA
    if (typeof securitySystem !== 'undefined') {
        refreshCaptcha();
    }
    
    // Setup Bootstrap tab event listeners
    setupTabEventListeners();
}); 