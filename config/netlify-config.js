// Netlify Configuration - Modular Architecture - Netlify Config - Netlify Config 
const NETLIFY_CONFIG = {
  // Netlify Functions URLs
  FUNCTIONS: {
    LEADS: '/.netlify/functions/netlify-leads',
    IMAGES: '/.netlify/functions/netlify-images',
    ADMIN: '/.netlify/functions/netlify-admin',
    ANALYTICS: '/.netlify/functions/netlify-analytics',
    DATABASE: '/.netlify/functions/netlify-database'
  },

  // Netlify CMS Configuration
  CMS: {
    URL: '/admin',
    BACKEND: 'git-gateway',
    BRANCH: 'main',
    MEDIA_FOLDER: 'assets/images/cms',
    PUBLIC_FOLDER: '/assets/images/cms'
  },

  // Netlify Database Configuration
  DATABASE: {
    TYPE: 'netlify-database',
    TABLES: ['leads', 'images', 'admin_logs', 'analytics_events']
  },

  // Netlify CDN Configuration
  CDN: {
    IMAGE_OPTIMIZATION: true,
    IMAGE_FORMATS: ['webp', 'avif', 'jpg', 'png'],
    MAX_IMAGE_SIZE: 10485760, // 10MB
    THUMBNAIL_SIZES: [150, 300, 600, 1200]
  },

  // Netlify Environment Variables
  ENV: {
    ACTIVE_PROVIDER: 'NETLIFY',
    NODE_VERSION: '18',
    GTM_ID: process.env.GTM_ID || 'GTM-XXXXXXX'
  },

  // Netlify Redirects
  REDIRECTS: [
    { from: '/api/leads/*', to: '/.netlify/functions/netlify-leads/:splat', status: 200 },
    { from: '/api/images/*', to: '/.netlify/functions/netlify-images/:splat', status: 200 },
    { from: '/api/admin/*', to: '/.netlify/functions/netlify-admin/:splat', status: 200 },
    { from: '/api/analytics/*', to: '/.netlify/functions/netlify-analytics/:splat', status: 200 },
    { from: '/api/database/*', to: '/.netlify/functions/netlify-database/:splat', status: 200 }
  ],

  // Netlify Headers
  HEADERS: {
    SECURITY: {
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    },
    CORS: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  }
};

// Netlify Provider Class
class NetlifyProvider {
  constructor() {
    this.config = NETLIFY_CONFIG;
  }

  // Get function URL
  getFunctionUrl(functionName) {
    return this.config.FUNCTIONS[functionName.toUpperCase()] || null;
  }

  // Get CMS configuration
  getCMSConfig() {
    return this.config.CMS;
  }

  // Get database configuration
  getDatabaseConfig() {
    return this.config.DATABASE;
  }

  // Get CDN configuration
  getCDNConfig() {
    return this.config.CDN;
  }

  // Get environment variables
  getEnvVars() {
    return this.config.ENV;
  }

  // Get redirects
  getRedirects() {
    return this.config.REDIRECTS;
  }

  // Get headers
  getHeaders(type = 'SECURITY') {
    return this.config.HEADERS[type] || {};
  }

  // Check if Netlify is active
  isActive() {
    return this.config.ENV.ACTIVE_PROVIDER === 'NETLIFY';
  }

  // Initialize Netlify provider
  async initialize() {
    if (!this.isActive()) {
      throw new Error('Netlify provider is not active');
    }

    console.log('✅ Netlify provider initialized');
    return true;
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NETLIFY_CONFIG, NetlifyProvider };
} else {
  window.NETLIFY_CONFIG = NETLIFY_CONFIG;
  window.NetlifyProvider = NetlifyProvider;
} 