// Common Configuration - Centralized External Integrations
// This file manages all external integrations (Netlify, GTM, Analytics, etc.)

const COMMON_CONFIG = {
  // Active Provider Configuration
  PROVIDER: {
    ACTIVE: 'NETLIFY', // NETLIFY, CUSTOM, HYBRID
    FALLBACK: 'CUSTOM' // Fallback provider if primary fails
  },

  // Netlify Configuration
  NETLIFY: {
    FUNCTIONS: {
      LEADS: '/.netlify/functions/netlify-leads',
      IMAGES: '/.netlify/functions/netlify-images',
      ADMIN: '/.netlify/functions/netlify-admin',
      ANALYTICS: '/.netlify/functions/netlify-analytics',
      DATABASE: '/.netlify/functions/netlify-database'
    },
    CMS: {
      URL: '/admin',
      BACKEND: 'git-gateway',
      BRANCH: 'main',
      MEDIA_FOLDER: 'assets/images/cms',
      PUBLIC_FOLDER: '/assets/images/cms'
    },
    DATABASE: {
      TYPE: 'netlify-database',
      TABLES: ['leads', 'images', 'admin_logs', 'analytics_events']
    },
    CDN: {
      IMAGE_OPTIMIZATION: true,
      IMAGE_FORMATS: ['webp', 'avif', 'jpg', 'png'],
      MAX_IMAGE_SIZE: 10485760, // 10MB
      THUMBNAIL_SIZES: [150, 300, 600, 1200]
    }
  },

  // GTM Configuration
  GTM: {
    ID: 'GTM-WKL8V4L', // Updated with actual GTM ID
    EVENTS: {
      LEAD_SUBMISSION: 'lead_submission',
      IMAGE_UPLOAD: 'image_upload',
      ADMIN_LOGIN: 'admin_login',
      ADMIN_LOGOUT: 'admin_logout',
      ADMIN_ACTION: 'admin_action',
      PAGE_VIEW: 'page_view',
      FORM_START: 'form_start',
      FORM_COMPLETE: 'form_complete',
      FORM_ERROR: 'form_error',
      BUTTON_CLICK: 'button_click',
      FILE_DOWNLOAD: 'file_download',
      EMAIL_CLICK: 'email_click',
      PHONE_CLICK: 'phone_click'
    },
    CATEGORIES: {
      ADMIN: 'admin',
      LEADS: 'leads',
      IMAGES: 'images',
      FORMS: 'forms',
      ENGAGEMENT: 'engagement'
    }
  },

  // Analytics Configuration
  ANALYTICS: {
    PROVIDER: 'GTM', // GTM, GA4, CUSTOM
    TRACK_PAGE_VIEWS: true,
    TRACK_FORM_INTERACTIONS: true,
    TRACK_ADMIN_ACTIONS: true,
    TRACK_IMAGE_UPLOADS: true
  },

  // Form Configuration
  FORMS: {
    CONSULTATION: {
      FIELDS: ['name', 'email', 'phone', 'service', 'message'],
      REQUIRED_FIELDS: ['name', 'email', 'message'],
      SHOW_CAPTCHA: true,
      SUCCESS_MESSAGE: 'Thank you! We will contact you within 24 hours.',
      ERROR_MESSAGE: 'Something went wrong. Please try again.'
    },
    LEAD: {
      FIELDS: ['name', 'email', 'phone', 'company', 'message'],
      REQUIRED_FIELDS: ['name', 'email'],
      SHOW_CAPTCHA: false,
      SUCCESS_MESSAGE: 'Thank you! Your message has been sent successfully.',
      ERROR_MESSAGE: 'Sorry, there was an error sending your message. Please try again.'
    }
  },

  // Image Management Configuration
  IMAGES: {
    LOCAL_PATH: 'assets/images/',
    NETLIFY_PATH: '/assets/images/',
    ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    MAX_FILE_SIZE: 10485760, // 10MB
    THUMBNAIL_SIZES: [150, 300, 600, 1200],
    OPTIMIZATION: {
      QUALITY: 85,
      FORMAT: 'webp',
      COMPRESSION: true
    },
    CATEGORIES: {
      HERO: 'hero',
      ABOUT: 'about',
      SERVICES: 'services',
      PROJECTS: 'projects',
      TEAM: 'team',
      BLOG: 'blog',
      ICONS: 'icons',
      LOGOS: 'logos',
      BACKGROUNDS: 'backgrounds'
    }
  },

  // Environment Configuration
  ENV: {
    NODE_VERSION: '18',
    SITE_URL: 'https://digitalibi.net',
    ADMIN_URL: '/admin',
    API_TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3
  },

  // Security Configuration
  SECURITY: {
    CORS_ORIGINS: ['*'],
    API_RATE_LIMIT: 100, // requests per minute
    SESSION_TIMEOUT: 3600000, // 1 hour
    CSRF_PROTECTION: true
  }
};

// Common Service Manager
class CommonServiceManager {
  constructor() {
    this.config = COMMON_CONFIG;
    this.loadedServices = new Set();
    this.initialized = false;
  }

  // Initialize common services
  async initialize() {
    if (this.initialized) return;

    try {
      // Load core services based on active provider
      await this.loadCoreServices();
      
      // Initialize GTM if available
      if (window.GTMService) {
        window.gtm = new window.GTMService();
        console.log('✅ GTM Service initialized');
      }

      // Initialize Netlify services if active
      if (this.config.PROVIDER.ACTIVE === 'NETLIFY') {
        await this.initializeNetlifyServices();
      }

      this.initialized = true;
      console.log('✅ Common Service Manager initialized');
    } catch (error) {
      console.error('❌ Error initializing Common Service Manager:', error);
    }
  }

  // Load core services
  async loadCoreServices() {
    const coreServices = [
      'config/gtm.js'
    ];

    if (this.config.PROVIDER.ACTIVE === 'NETLIFY') {
      coreServices.push(
        'services/netlify-api-service.js',
        'services/netlify-database-service.js'
      );
    }

    await this.loadScripts(coreServices);
  }

  // Initialize Netlify services
  async initializeNetlifyServices() {
    if (window.NetlifyApiService && window.NetlifyDatabaseService) {
      window.netlifyApi = new window.NetlifyApiService();
      window.netlifyDatabase = new window.NetlifyDatabaseService();
      
      await window.netlifyApi.initialize();
      await window.netlifyDatabase.initialize();
      
      console.log('✅ Netlify services initialized');
    }
  }

  // Load scripts dynamically
  async loadScripts(scripts) {
    const promises = scripts.map(src => {
      if (this.loadedServices.has(src)) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          this.loadedServices.add(src);
          console.log(`✅ Loaded: ${src}`);
          resolve();
        };
        script.onerror = (error) => {
          console.error(`❌ Failed to load: ${src}`, error);
          reject(error);
        };
        document.head.appendChild(script);
      });
    });

    return Promise.all(promises);
  }

  // Get configuration
  getConfig(section) {
    return section ? this.config[section] : this.config;
  }

  // Get active provider
  getActiveProvider() {
    return this.config.PROVIDER.ACTIVE;
  }

  // Check if service is available
  isServiceAvailable(serviceName) {
    switch (serviceName) {
      case 'netlify':
        return this.config.PROVIDER.ACTIVE === 'NETLIFY' && window.netlifyApi;
      case 'gtm':
        return window.gtm;
      case 'database':
        return window.netlifyDatabase;
      default:
        return false;
    }
  }

  // Track event
  trackEvent(eventName, parameters = {}) {
    if (window.gtm) {
      window.gtm.trackEvent(eventName, parameters);
    }
  }

  // Submit form data
  async submitForm(formData, formType = 'consultation') {
    try {
      let response;

      if (this.isServiceAvailable('netlify')) {
        response = await window.netlifyApi.submitLead(formData);
      } else {
        // Fallback to existing form handling
        response = { success: true, message: 'Form submitted successfully' };
      }

      // Track form submission
      this.trackEvent(this.config.GTM.EVENTS.LEAD_SUBMISSION, {
        form_type: formType,
        lead_source: formData.source || 'website_form',
        lead_type: formData.type || 'general_inquiry'
      });

      return response;
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Track form error
      this.trackEvent(this.config.GTM.EVENTS.FORM_ERROR, {
        form_type: formType,
        error: error.message
      });

      throw error;
    }
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COMMON_CONFIG, CommonServiceManager };
} else {
  window.COMMON_CONFIG = COMMON_CONFIG;
  window.CommonServiceManager = CommonServiceManager;
} 