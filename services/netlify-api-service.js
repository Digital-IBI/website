// Netlify API Service - Modular Architecture
class NetlifyApiService {
  constructor() {
    this.config = window.NETLIFY_CONFIG || {};
    this.baseUrl = '';
  }

  // Initialize with Netlify configuration
  async initialize() {
    if (window.NetlifyProvider) {
      const netlifyProvider = new window.NetlifyProvider();
      await netlifyProvider.initialize();
      this.config = netlifyProvider.config;
    }
  }

  // Make API request to Netlify Functions
  async request(endpoint, options = {}) {
    const functionUrl = this.config.FUNCTIONS[endpoint.toUpperCase()];
    if (!functionUrl) {
      throw new Error(`Netlify function not found: ${endpoint}`);
    }

    const url = `${functionUrl}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        throw new Error(`Netlify API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Netlify API Request Error:', error);
      throw error;
    }
  }

  // Lead Management
  async submitLead(leadData) {
    return this.request('LEADS', {
      method: 'POST',
      body: JSON.stringify(leadData)
    });
  }

  async getLeads(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request('LEADS', {
      method: 'GET',
      url: `?${params}`
    });
  }

  async updateLead(leadId, updateData) {
    return this.request('LEADS', {
      method: 'PUT',
      url: `/${leadId}`,
      body: JSON.stringify(updateData)
    });
  }

  async deleteLead(leadId) {
    return this.request('LEADS', {
      method: 'DELETE',
      url: `/${leadId}`
    });
  }

  // Image Management
  async uploadImage(imageFile, metadata = {}) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('metadata', JSON.stringify(metadata));

    return this.request('IMAGES', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData
    });
  }

  async getImages(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request('IMAGES', {
      method: 'GET',
      url: `?${params}`
    });
  }

  async updateImage(imageId, updateData) {
    return this.request('IMAGES', {
      method: 'PUT',
      url: `/${imageId}`,
      body: JSON.stringify(updateData)
    });
  }

  async deleteImage(imageId) {
    return this.request('IMAGES', {
      method: 'DELETE',
      url: `/${imageId}`
    });
  }

  // Admin Management
  async adminLogin(credentials) {
    return this.request('ADMIN', {
      method: 'POST',
      url: '/login',
      body: JSON.stringify(credentials)
    });
  }

  async adminLogout() {
    return this.request('ADMIN', {
      method: 'POST',
      url: '/logout'
    });
  }

  async getAdminStats() {
    return this.request('ADMIN', {
      method: 'GET',
      url: '/stats'
    });
  }

  async getAdminLogs(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request('ADMIN', {
      method: 'GET',
      url: `/logs?${params}`
    });
  }

  // Analytics
  async getAnalytics(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request('ANALYTICS', {
      method: 'GET',
      url: `?${params}`
    });
  }

  async trackEvent(eventData) {
    return this.request('ANALYTICS', {
      method: 'POST',
      url: '/track',
      body: JSON.stringify(eventData)
    });
  }

  // Database Operations
  async databaseQuery(sql, params = []) {
    return this.request('DATABASE', {
      method: 'POST',
      url: '/query',
      body: JSON.stringify({ sql, params })
    });
  }

  // Health Check
  async healthCheck() {
    return this.request('ADMIN', {
      method: 'GET',
      url: '/health'
    });
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetlifyApiService;
} else {
  window.NetlifyApiService = NetlifyApiService;
} 