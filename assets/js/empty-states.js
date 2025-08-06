/**
 * Empty States and Data Skeletons Utility
 * Provides consistent empty states, loading skeletons, and data placeholders
 */

class EmptyStateManager {
    constructor() {
        this.loadingStates = new Map();
        this.init();
    }

    init() {
        // Initialize loading states
        this.setupLoadingStates();
    }

    // Setup loading states for different modules
    setupLoadingStates() {
        this.loadingStates.set('dashboard', {
            stats: false,
            recentActivity: false,
            charts: false
        });
        
        this.loadingStates.set('leads', {
            table: false,
            stats: false,
            filters: false
        });
        
        this.loadingStates.set('images', {
            grid: false,
            upload: false,
            categories: false
        });
        
        this.loadingStates.set('campaigns', {
            list: false,
            stats: false,
            analytics: false
        });
    }

    // Show loading skeleton for a specific area
    showSkeleton(containerId, type = 'default') {
        const container = document.getElementById(containerId);
        if (!container) return;

        let skeletonHTML = '';
        
        switch (type) {
            case 'table':
                skeletonHTML = this.generateTableSkeleton();
                break;
            case 'stats':
                skeletonHTML = this.generateStatsSkeleton();
                break;
            case 'image-grid':
                skeletonHTML = this.generateImageGridSkeleton();
                break;
            case 'recent-activity':
                skeletonHTML = this.generateRecentActivitySkeleton();
                break;
            default:
                skeletonHTML = this.generateDefaultSkeleton();
        }

        container.innerHTML = skeletonHTML;
    }

    // Show empty state for a specific module
    showEmptyState(containerId, module, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const emptyStateHTML = this.generateEmptyState(module, options);
        container.innerHTML = emptyStateHTML;
    }

    // Generate table skeleton
    generateTableSkeleton() {
        return `
            <div class="skeleton-table">
                <div class="skeleton-table-header">
                    <div class="skeleton skeleton-line" style="width: 30%;"></div>
                </div>
                ${Array(5).fill().map(() => `
                    <div class="skeleton-table-row">
                        <div class="skeleton skeleton-table-cell"></div>
                        <div class="skeleton skeleton-table-cell"></div>
                        <div class="skeleton skeleton-table-cell"></div>
                        <div class="skeleton skeleton-table-cell"></div>
                        <div class="skeleton skeleton-table-cell"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Generate stats skeleton
    generateStatsSkeleton() {
        return `
            <div class="row">
                ${Array(4).fill().map(() => `
                    <div class="col-md-3 mb-3">
                        <div class="skeleton-stats-card">
                            <div class="skeleton-stats-header">
                                <div class="skeleton skeleton-stats-title"></div>
                                <div class="skeleton skeleton-stats-icon"></div>
                            </div>
                            <div class="skeleton skeleton-stats-value"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Generate image grid skeleton
    generateImageGridSkeleton() {
        return `
            <div class="skeleton-image-grid">
                ${Array(6).fill().map(() => `
                    <div class="skeleton-image-card">
                        <div class="skeleton skeleton-image"></div>
                        <div class="skeleton skeleton-image-title"></div>
                        <div class="skeleton skeleton-image-meta"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Generate recent activity skeleton
    generateRecentActivitySkeleton() {
        return `
            <div class="skeleton-card">
                <div class="skeleton-header">
                    <div class="skeleton skeleton-avatar"></div>
                    <div>
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton skeleton-subtitle"></div>
                    </div>
                </div>
                <div class="skeleton-content">
                    <div class="skeleton skeleton-line"></div>
                    <div class="skeleton skeleton-line"></div>
                    <div class="skeleton skeleton-line"></div>
                </div>
            </div>
        `;
    }

    // Generate default skeleton
    generateDefaultSkeleton() {
        return `
            <div class="skeleton-card">
                <div class="skeleton-header">
                    <div class="skeleton skeleton-avatar"></div>
                    <div>
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton skeleton-subtitle"></div>
                    </div>
                </div>
                <div class="skeleton-content">
                    <div class="skeleton skeleton-line"></div>
                    <div class="skeleton skeleton-line"></div>
                </div>
            </div>
        `;
    }

    // Generate empty state for different modules
    generateEmptyState(module, options = {}) {
        const defaultOptions = {
            title: this.getDefaultTitle(module),
            description: this.getDefaultDescription(module),
            icon: this.getDefaultIcon(module),
            actionText: this.getDefaultActionText(module),
            actionUrl: this.getDefaultActionUrl(module),
            showAction: true
        };

        const config = { ...defaultOptions, ...options };

        return `
            <div class="empty-state empty-state-${module}">
                <div class="empty-state-icon">
                    <i class="${config.icon}"></i>
                </div>
                <h3 class="empty-state-title">${config.title}</h3>
                <p class="empty-state-description">${config.description}</p>
                ${config.showAction ? `
                    <div class="empty-state-action">
                        <a href="${config.actionUrl}" class="btn btn-light btn-custom">
                            <i class="fas fa-plus"></i> ${config.actionText}
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Get default title for module
    getDefaultTitle(module) {
        const titles = {
            'leads': 'No Leads Found',
            'images': 'No Images Uploaded',
            'campaigns': 'No Campaigns Created',
            'analytics': 'No Analytics Data',
            'default': 'No Data Available'
        };
        return titles[module] || titles.default;
    }

    // Get default description for module
    getDefaultDescription(module) {
        const descriptions = {
            'leads': 'Start by adding your first lead to track potential customers and manage your sales pipeline.',
            'images': 'Upload your first image to manage your visual assets and create engaging content.',
            'campaigns': 'Create your first campaign to reach your audience and track marketing performance.',
            'analytics': 'Analytics data will appear here once you start using the system.',
            'default': 'Get started by adding your first item to see data here.'
        };
        return descriptions[module] || descriptions.default;
    }

    // Get default icon for module
    getDefaultIcon(module) {
        const icons = {
            'leads': 'fas fa-users',
            'images': 'fas fa-images',
            'campaigns': 'fas fa-bullhorn',
            'analytics': 'fas fa-chart-line',
            'default': 'fas fa-inbox'
        };
        return icons[module] || icons.default;
    }

    // Get default action text for module
    getDefaultActionText(module) {
        const actions = {
            'leads': 'Add New Lead',
            'images': 'Upload Image',
            'campaigns': 'Create Campaign',
            'analytics': 'View Dashboard',
            'default': 'Get Started'
        };
        return actions[module] || actions.default;
    }

    // Get default action URL for module
    getDefaultActionUrl(module) {
        const urls = {
            'leads': 'admin-leads.html',
            'images': 'admin-images.html',
            'campaigns': 'admin-campaigns.html',
            'analytics': 'admin-dashboard.html',
            'default': '#'
        };
        return urls[module] || urls.default;
    }

    // Show loading spinner
    showLoading(containerId, text = 'Loading...') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">${text}</div>
            </div>
        `;
    }

    // Hide loading and show content
    hideLoading(containerId, content) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (content && content.trim()) {
            container.innerHTML = content;
        } else {
            // Show empty state if no content
            this.showEmptyState(containerId, 'default');
        }
    }

    // Check if data exists and show appropriate state
    checkDataAndShowState(containerId, data, module, options = {}) {
        if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
            this.showEmptyState(containerId, module, options);
            return false;
        }
        return true;
    }

    // Show error state
    showErrorState(containerId, error, module) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-exclamation-triangle text-warning"></i>
                </div>
                <h3 class="empty-state-title">Error Loading ${module}</h3>
                <p class="empty-state-description">${error || 'An error occurred while loading data. Please try again.'}</p>
                <div class="empty-state-action">
                    <button class="btn btn-primary btn-custom" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            </div>
        `;
    }

    // Update loading state
    updateLoadingState(module, area, isLoading) {
        if (this.loadingStates.has(module)) {
            this.loadingStates.get(module)[area] = isLoading;
        }
    }

    // Get loading state
    getLoadingState(module, area) {
        if (this.loadingStates.has(module)) {
            return this.loadingStates.get(module)[area];
        }
        return false;
    }
}

// Global empty state manager instance
const emptyStateManager = new EmptyStateManager();

// Utility functions for easy access
function showSkeleton(containerId, type = 'default') {
    emptyStateManager.showSkeleton(containerId, type);
}

function showEmptyState(containerId, module, options = {}) {
    emptyStateManager.showEmptyState(containerId, module, options);
}

function showLoading(containerId, text = 'Loading...') {
    emptyStateManager.showLoading(containerId, text);
}

function hideLoading(containerId, content) {
    emptyStateManager.hideLoading(containerId, content);
}

function showErrorState(containerId, error, module) {
    emptyStateManager.showErrorState(containerId, error, module);
}

function checkDataAndShowState(containerId, data, module, options = {}) {
    return emptyStateManager.checkDataAndShowState(containerId, data, module, options);
} 