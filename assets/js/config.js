/**
 * Central Configuration System
 * Manages all services, features, and environment settings
 */

const CONFIG = {
    // Service Configuration
    services: {
        upload: 'local',        // 'local', 'netlify', 'firebase'
        storage: 'local',       // 'local', 'database', 'api'
        processing: 'local',    // 'local', 'cloud'
        delivery: 'local'       // 'local', 'cdn'
    },

    // Feature Toggles
    features: {
        imageOptimization: false,
        cdn: false,
        analytics: true,
        backup: false,
        realtime: false,
        multipleImages: true,   // Allow multiple images per location
        imageSuggestions: true, // Suggest optimal image sizes
        pageBasedManagement: true // Organize by page and location
    },

    // Project Structure - Pages and Image Locations
    pages: {
        'index.html': {
            name: 'Homepage',
            locations: {
                'hero-banner': {
                    name: 'Hero Banner',
                    description: 'Main banner at the top of homepage',
                    suggestedSizes: [
                        { width: 1920, height: 1080, name: 'Desktop' },
                        { width: 768, height: 432, name: 'Tablet' },
                        { width: 375, height: 211, name: 'Mobile' }
                    ],
                    maxImages: 5,
                    required: true
                },
                'service-cards': {
                    name: 'Service Cards',
                    description: 'Images for service cards section',
                    suggestedSizes: [
                        { width: 400, height: 300, name: 'Card' },
                        { width: 800, height: 600, name: 'High Res' }
                    ],
                    maxImages: 10,
                    required: false
                },
                'testimonials': {
                    name: 'Testimonials',
                    description: 'Customer testimonial images',
                    suggestedSizes: [
                        { width: 150, height: 150, name: 'Avatar' },
                        { width: 300, height: 300, name: 'Profile' }
                    ],
                    maxImages: 20,
                    required: false
                }
            }
        },
        'about.html': {
            name: 'About Page',
            locations: {
                'team-photos': {
                    name: 'Team Photos',
                    description: 'Team member profile photos',
                    suggestedSizes: [
                        { width: 300, height: 400, name: 'Portrait' },
                        { width: 600, height: 800, name: 'High Res' }
                    ],
                    maxImages: 50,
                    required: false
                },
                'company-history': {
                    name: 'Company History',
                    description: 'Historical company images',
                    suggestedSizes: [
                        { width: 800, height: 600, name: 'Standard' },
                        { width: 1200, height: 900, name: 'Large' }
                    ],
                    maxImages: 15,
                    required: false
                }
            }
        },
        'services/app-development.html': {
            name: 'App Development Service',
            locations: {
                'service-hero': {
                    name: 'Service Hero',
                    description: 'Main service banner',
                    suggestedSizes: [
                        { width: 1920, height: 600, name: 'Wide Banner' },
                        { width: 1200, height: 400, name: 'Standard' }
                    ],
                    maxImages: 3,
                    required: true
                },
                'portfolio-gallery': {
                    name: 'Portfolio Gallery',
                    description: 'App development portfolio images',
                    suggestedSizes: [
                        { width: 400, height: 300, name: 'Thumbnail' },
                        { width: 800, height: 600, name: 'Full Size' }
                    ],
                    maxImages: 20,
                    required: false
                }
            }
        },
        'products/ai-asset-tracking.html': {
            name: 'AI Asset Tracking Product',
            locations: {
                'product-hero': {
                    name: 'Product Hero',
                    description: 'Main product banner',
                    suggestedSizes: [
                        { width: 1920, height: 800, name: 'Hero' },
                        { width: 1200, height: 500, name: 'Standard' }
                    ],
                    maxImages: 2,
                    required: true
                },
                'feature-screenshots': {
                    name: 'Feature Screenshots',
                    description: 'Product feature screenshots',
                    suggestedSizes: [
                        { width: 800, height: 600, name: 'Screenshot' },
                        { width: 1200, height: 900, name: 'High Res' }
                    ],
                    maxImages: 10,
                    required: false
                }
            }
        }
    },

    // Global Image Categories
    categories: {
        'banners': {
            name: 'Banners',
            description: 'Hero banners and promotional images',
            suggestedSizes: [
                { width: 1920, height: 1080, name: 'Full HD' },
                { width: 1200, height: 675, name: 'HD' },
                { width: 800, height: 450, name: 'Standard' }
            ]
        },
        'services': {
            name: 'Services',
            description: 'Service-related images',
            suggestedSizes: [
                { width: 400, height: 300, name: 'Card' },
                { width: 800, height: 600, name: 'Feature' }
            ]
        },
        'products': {
            name: 'Products',
            description: 'Product images and screenshots',
            suggestedSizes: [
                { width: 600, height: 400, name: 'Product' },
                { width: 1200, height: 800, name: 'Detail' }
            ]
        },
        'team': {
            name: 'Team',
            description: 'Team member photos',
            suggestedSizes: [
                { width: 300, height: 400, name: 'Portrait' },
                { width: 150, height: 150, name: 'Avatar' }
            ]
        },
        'portfolio': {
            name: 'Portfolio',
            description: 'Project and case study images',
            suggestedSizes: [
                { width: 400, height: 300, name: 'Thumbnail' },
                { width: 800, height: 600, name: 'Gallery' }
            ]
        }
    },

    // API Endpoints
    endpoints: {
        local: {
            upload: '/api/upload',
            storage: '/api/storage',
            processing: '/api/process'
        },
        netlify: {
            upload: '/.netlify/functions/upload-image',
            storage: '/.netlify/functions/store-image',
            processing: '/.netlify/functions/process-image'
        }
    },

    // Environment Settings
    environment: {
        development: {
            debug: true,
            cache: false,
            fallback: true
        },
        production: {
            debug: false,
            cache: true,
            fallback: true
        }
    },

    // Get current environment
    getEnvironment() {
        return window.location.hostname === 'localhost' ? 'development' : 'production';
    },

    // Get current settings
    getSettings() {
        const env = this.getEnvironment();
        return {
            ...this.environment[env],
            services: this.services,
            features: this.features
        };
    },

    // Check if feature is enabled
    isFeatureEnabled(feature) {
        return this.features[feature] === true;
    },

    // Get service endpoint
    getEndpoint(service, type) {
        const currentService = this.services[service];
        return this.endpoints[currentService]?.[type] || this.endpoints.local[type];
    },

    // Get all pages
    getPages() {
        return this.pages;
    },

    // Get specific page
    getPage(pagePath) {
        return this.pages[pagePath];
    },

    // Get page locations
    getPageLocations(pagePath) {
        const page = this.getPage(pagePath);
        return page ? page.locations : {};
    },

    // Get specific location
    getLocation(pagePath, locationKey) {
        const page = this.getPage(pagePath);
        return page?.locations?.[locationKey];
    },

    // Get suggested sizes for location
    getSuggestedSizes(pagePath, locationKey) {
        const location = this.getLocation(pagePath, locationKey);
        return location?.suggestedSizes || [];
    },

    // Get category suggested sizes
    getCategorySizes(category) {
        return this.categories[category]?.suggestedSizes || [];
    },

    // Check if location allows multiple images
    allowsMultipleImages(pagePath, locationKey) {
        const location = this.getLocation(pagePath, locationKey);
        return location?.maxImages > 1;
    },

    // Get max images for location
    getMaxImages(pagePath, locationKey) {
        const location = this.getLocation(pagePath, locationKey);
        return location?.maxImages || 1;
    },

    // Check if location is required
    isLocationRequired(pagePath, locationKey) {
        const location = this.getLocation(pagePath, locationKey);
        return location?.required || false;
    },

    // Get current page path
    getCurrentPagePath() {
        const path = window.location.pathname;
        return path === '/' ? 'index.html' : path.substring(1);
    },

    // Get current page info
    getCurrentPage() {
        const pagePath = this.getCurrentPagePath();
        return this.getPage(pagePath);
    },

    // Get current page locations
    getCurrentPageLocations() {
        const pagePath = this.getCurrentPagePath();
        return this.getPageLocations(pagePath);
    },

    // Validate image for location
    validateImageForLocation(pagePath, locationKey, imageData) {
        const location = this.getLocation(pagePath, locationKey);
        if (!location) return { valid: false, error: 'Location not found' };

        const suggestedSizes = this.getSuggestedSizes(pagePath, locationKey);
        const imageSize = imageData.dimensions;

        if (imageSize) {
            const matchingSize = suggestedSizes.find(size => 
                size.width === imageSize.width && size.height === imageSize.height
            );

            if (!matchingSize) {
                return {
                    valid: false,
                    warning: `Image size (${imageSize.width}x${imageSize.height}) doesn't match suggested sizes`,
                    suggestedSizes: suggestedSizes
                };
            }
        }

        return { valid: true };
    },

    // Database Configuration
    database: {
        type: 'local', // 'local', 'netlify', 'supabase', 'firebase'
        credentials: {
            url: '',
            apiKey: '',
            secret: '',
            projectId: ''
        },
        migration: {
            completed: false,
            date: null,
            status: 'pending' // 'pending', 'in_progress', 'completed', 'failed'
        },
        connection: {
            status: 'disconnected', // 'connected', 'disconnected', 'testing'
            lastTest: null,
            error: null
        }
    },

    // Storage Configuration
    storage: {
        type: 'local', // 'local', 'netlify', 'cloudinary', 'aws'
        providers: {
            local: {
                path: 'assets/images/',
                enabled: true
            },
            netlify: {
                bucket: '',
                cdn: '',
                apiKey: '',
                enabled: false
            },
            cloudinary: {
                cloudName: '',
                apiKey: '',
                apiSecret: '',
                enabled: false
            },
            aws: {
                bucket: '',
                region: '',
                accessKey: '',
                secretKey: '',
                enabled: false
            }
        },
        settings: {
            maxSize: '5MB',
            allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            compression: true,
            backup: true
        }
    },

    // Admin Setup Configuration
    admin: {
        setupComplete: false,
        createAdminEnabled: true,
        firstAdminCreated: false,
        setupStep: 'initial', // 'initial', 'database', 'storage', 'complete'
        setupWizard: {
            databaseConfigured: false,
            storageConfigured: false,
            migrationCompleted: false
        }
    },

    // Database Management Methods
    getDatabaseConfig() {
        return this.database;
    },

    updateDatabaseConfig(config) {
        this.database = { ...this.database, ...config };
        this.saveConfig();
    },

    testDatabaseConnection() {
        return new Promise((resolve) => {
            // Simulate connection test
            setTimeout(() => {
                const success = Math.random() > 0.3; // 70% success rate for demo
                this.database.connection.status = success ? 'connected' : 'disconnected';
                this.database.connection.lastTest = new Date().toISOString();
                this.database.connection.error = success ? null : 'Connection failed';
                resolve({ success, error: this.database.connection.error });
            }, 1000);
        });
    },

    migrateToDatabase() {
        return new Promise((resolve) => {
            this.database.migration.status = 'in_progress';
            // Simulate migration
            setTimeout(() => {
                this.database.migration.status = 'completed';
                this.database.migration.date = new Date().toISOString();
                this.database.migration.completed = true;
                resolve({ success: true });
            }, 2000);
        });
    },

    // Storage Management Methods
    getStorageConfig() {
        return this.storage;
    },

    updateStorageConfig(config) {
        this.storage = { ...this.storage, ...config };
        this.saveConfig();
    },

    getActiveStorageProvider() {
        return this.storage.providers[this.storage.type];
    },

    testStorageConnection() {
        return new Promise((resolve) => {
            const provider = this.getActiveStorageProvider();
            // Simulate connection test
            setTimeout(() => {
                const success = provider.enabled;
                resolve({ success, provider: this.storage.type });
            }, 1000);
        });
    },

    // Admin Setup Methods
    getAdminSetupStatus() {
        return this.admin;
    },

    updateAdminSetupStatus(status) {
        this.admin = { ...this.admin, ...status };
        this.saveConfig();
    },

    isSetupComplete() {
        return this.admin.setupComplete;
    },

    canCreateAdmin() {
        return this.admin.createAdminEnabled;
    },

    // Config Persistence
    saveConfig() {
        localStorage.setItem('systemConfig', JSON.stringify({
            database: this.database,
            storage: this.storage,
            admin: this.admin
        }));
    },

    loadConfig() {
        const saved = localStorage.getItem('systemConfig');
        if (saved) {
            const config = JSON.parse(saved);
            this.database = { ...this.database, ...config.database };
            this.storage = { ...this.storage, ...config.storage };
            this.admin = { ...this.admin, ...config.admin };
        }
    }
};

// Make config globally available
window.CONFIG = CONFIG; 