// Netlify Database Service - Modular Architecture
class NetlifyDatabaseService {
  constructor() {
    this.config = window.NETLIFY_CONFIG || {};
    this.apiService = null;
  }

  // Initialize with Netlify API service
  async initialize() {
    if (window.NetlifyApiService) {
      this.apiService = new window.NetlifyApiService();
      await this.apiService.initialize();
    }
  }

  // Execute database query
  async query(sql, params = []) {
    if (!this.apiService) {
      throw new Error('Netlify API service not initialized');
    }

    return this.apiService.databaseQuery(sql, params);
  }

  // Lead Management
  async createLead(leadData) {
    const sql = `
      INSERT INTO leads (name, email, phone, message, source, status)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    const params = [
      leadData.name,
      leadData.email,
      leadData.phone || null,
      leadData.message || null,
      leadData.source || 'website',
      leadData.status || 'new'
    ];
    
    return this.query(sql, params);
  }

  async getLeads(filters = {}) {
    let sql = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.source) {
      sql += ' AND source = ?';
      params.push(filters.source);
    }

    if (filters.dateFrom) {
      sql += ' AND created_at >= ?';
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      sql += ' AND created_at <= ?';
      params.push(filters.dateTo);
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    return this.query(sql, params);
  }

  async updateLead(leadId, updateData) {
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    params.push(leadId);

    const sql = `
      UPDATE leads 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = ?
      RETURNING *
    `;

    return this.query(sql, params);
  }

  async deleteLead(leadId) {
    const sql = 'DELETE FROM leads WHERE id = ?';
    return this.query(sql, [leadId]);
  }

  // Image Management
  async createImage(imageData) {
    const sql = `
      INSERT INTO images (filename, original_name, url, alt_text, category, size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    const params = [
      imageData.filename,
      imageData.originalName,
      imageData.url,
      imageData.altText || null,
      imageData.category || 'general',
      imageData.size,
      imageData.mimeType
    ];

    return this.query(sql, params);
  }

  async getImages(filters = {}) {
    let sql = 'SELECT * FROM images WHERE 1=1';
    const params = [];

    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.search) {
      sql += ' AND (filename ILIKE ? OR alt_text ILIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    return this.query(sql, params);
  }

  async updateImage(imageId, updateData) {
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    params.push(imageId);

    const sql = `
      UPDATE images 
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING *
    `;

    return this.query(sql, params);
  }

  async deleteImage(imageId) {
    const sql = 'DELETE FROM images WHERE id = ?';
    return this.query(sql, [imageId]);
  }

  // Admin Logs
  async logAdminAction(action, details = {}) {
    const sql = `
      INSERT INTO admin_logs (action, user_id, details, ip_address)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `;
    const params = [
      action,
      details.userId || 'unknown',
      JSON.stringify(details),
      details.ipAddress || 'unknown'
    ];

    return this.query(sql, params);
  }

  async getAdminLogs(filters = {}) {
    let sql = 'SELECT * FROM admin_logs WHERE 1=1';
    const params = [];

    if (filters.action) {
      sql += ' AND action = ?';
      params.push(filters.action);
    }

    if (filters.userId) {
      sql += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.dateFrom) {
      sql += ' AND created_at >= ?';
      params.push(filters.dateFrom);
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    return this.query(sql, params);
  }

  // Analytics
  async getLeadStats(filters = {}) {
    const sql = `
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
        COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_leads,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as leads_this_week,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as leads_this_month
      FROM leads
      WHERE 1=1
    `;
    const params = [];

    if (filters.source) {
      sql += ' AND source = ?';
      params.push(filters.source);
    }

    return this.query(sql, params);
  }

  async getImageStats(filters = {}) {
    const sql = `
      SELECT 
        COUNT(*) as total_images,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as images_this_week,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as images_this_month,
        SUM(size) as total_size,
        AVG(size) as avg_size
      FROM images
      WHERE 1=1
    `;
    const params = [];

    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    return this.query(sql, params);
  }

  // Database Schema Management
  async createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        message TEXT,
        source VARCHAR(100) DEFAULT 'website',
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        url VARCHAR(500) NOT NULL,
        alt_text TEXT,
        category VARCHAR(100) DEFAULT 'general',
        size INTEGER,
        mime_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        user_id VARCHAR(100),
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_name VARCHAR(100) NOT NULL,
        event_category VARCHAR(100),
        event_data JSONB,
        user_agent TEXT,
        ip_address VARCHAR(45),
        page_url VARCHAR(500),
        timestamp TIMESTAMP DEFAULT NOW()
      )`
    ];

    for (const tableSql of tables) {
      await this.query(tableSql);
    }
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetlifyDatabaseService;
} else {
  window.NetlifyDatabaseService = NetlifyDatabaseService;
} 