// Netlify Functions Configuration
const CONFIG = {
  // GTM Configuration
  GTM: {
    ID: 'GTM-WKL8V4L',
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

  // Admin Configuration
  ADMIN: {
    EMAIL: '2bsinha@gmail.com',
    PASSWORD: 'MunMun@23081279'
  },

  // Site Configuration
  SITE: {
    URL: 'https://digitalibi.netlify.app',
    DOMAIN: 'digitalibi.net'
  },

  // Database Configuration
  DATABASE: {
    TYPE: 'netlify-database',
    TABLES: ['leads', 'images', 'admin_logs', 'analytics_events']
  },

  // Security Configuration
  SECURITY: {
    JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key-here',
    SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret-key-here'
  }
};

module.exports = { CONFIG }; 