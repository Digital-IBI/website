// GTM Configuration - Centralized Tracking
const GTM_CONFIG = {
  ID: process.env.GTM_ID || 'GTM-XXXXXXX', // Replace with your actual GTM ID
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
};

// GTM Service Class
class GTMService {
  constructor() {
    this.gtmId = GTM_CONFIG.ID;
    this.events = GTM_CONFIG.EVENTS;
    this.categories = GTM_CONFIG.CATEGORIES;
    this.init();
  }

  init() {
    // Initialize GTM
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){dataLayer.push(arguments);};
    
    // Load GTM script if not already loaded
    if (!document.querySelector('script[src*="googletagmanager.com"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${this.gtmId}`;
      document.head.appendChild(script);
    }
  }

  trackEvent(eventName, parameters = {}) {
    if (window.gtag) {
      const eventData = {
        event: eventName,
        ...parameters,
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        page_title: document.title
      };
      
      window.gtag('event', eventName, eventData);
      
      // Also push to dataLayer for debugging
      window.dataLayer.push(eventData);
    }
  }

  trackLeadSubmission(leadData) {
    this.trackEvent(this.events.LEAD_SUBMISSION, {
      event_category: this.categories.LEADS,
      lead_source: leadData.source || 'website_form',
      lead_type: leadData.type || 'general_inquiry',
      lead_email: leadData.email ? '***' + leadData.email.slice(-4) : 'anonymous',
      form_name: leadData.formName || 'contact_form'
    });
  }

  trackAdminAction(action, details = {}) {
    this.trackEvent(this.events.ADMIN_ACTION, {
      event_category: this.categories.ADMIN,
      action: action,
      admin_user: details.user || 'unknown',
      admin_action_type: details.type || 'general',
      admin_target: details.target || 'none',
      admin_result: details.result || 'success'
    });
  }

  trackImageUpload(imageData) {
    this.trackEvent(this.events.IMAGE_UPLOAD, {
      event_category: this.categories.IMAGES,
      image_filename: imageData.filename,
      image_size: imageData.size,
      image_type: imageData.mimeType,
      image_category: imageData.category || 'general'
    });
  }

  trackFormInteraction(formName, action) {
    this.trackEvent(action === 'start' ? this.events.FORM_START : this.events.FORM_COMPLETE, {
      event_category: this.categories.FORMS,
      form_name: formName,
      form_action: action
    });
  }

  trackPageView(pageData = {}) {
    this.trackEvent(this.events.PAGE_VIEW, {
      event_category: this.categories.ENGAGEMENT,
      page_name: pageData.name || document.title,
      page_section: pageData.section || 'general',
      user_type: pageData.userType || 'visitor'
    });
  }

  trackButtonClick(buttonData) {
    this.trackEvent(this.events.BUTTON_CLICK, {
      event_category: this.categories.ENGAGEMENT,
      button_text: buttonData.text,
      button_location: buttonData.location,
      button_action: buttonData.action
    });
  }

  // Admin specific tracking methods
  trackAdminLogin(userData) {
    this.trackEvent(this.events.ADMIN_LOGIN, {
      event_category: this.categories.ADMIN,
      admin_user: userData.user || 'unknown',
      login_method: userData.method || 'password',
      login_success: userData.success || true
    });
  }

  trackAdminLogout(userData) {
    this.trackEvent(this.events.ADMIN_LOGOUT, {
      event_category: this.categories.ADMIN,
      admin_user: userData.user || 'unknown',
      session_duration: userData.sessionDuration || 0
    });
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GTM_CONFIG, GTMService };
} else {
  window.GTM_CONFIG = GTM_CONFIG;
  window.GTMService = GTMService;
} 