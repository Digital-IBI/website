// Netlify Function: Database Operations
const { CONFIG } = require('./config');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const config = CONFIG;
    const { httpMethod, path, body } = event;

    switch (httpMethod) {
      case 'POST':
        if (path.includes('/query')) {
          // Execute database query
          const { sql, params } = JSON.parse(body);
          const result = await executeQuery(sql, params);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
          };
        }
        break;

      case 'GET':
        if (path.includes('/health')) {
          // Database health check
          const health = await checkDatabaseHealth();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(health)
          };
        }
        break;

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };
  } catch (error) {
    console.error('Database function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Database operations (simplified for Netlify)
async function executeQuery(sql, params = []) {
  // In real implementation, this would connect to Netlify Database
  // For now, return mock data based on query type
  
  if (sql.toLowerCase().includes('select')) {
    if (sql.toLowerCase().includes('leads')) {
      return [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          message: 'Interested in services',
          source: 'website',
          status: 'new',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];
    } else if (sql.toLowerCase().includes('images')) {
      return [
        {
          id: 1,
          filename: 'hero_image.jpg',
          original_name: 'hero.jpg',
          url: 'https://your-site.netlify.app/assets/images/hero_image.jpg',
          alt_text: 'Hero section image',
          category: 'hero',
          size: 2048000,
          mime_type: 'image/jpeg',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];
    } else if (sql.toLowerCase().includes('admin_logs')) {
      return [
        {
          id: 1,
          action: 'admin_login',
          user_id: 'admin',
          details: { success: true, ip: '127.0.0.1' },
          ip_address: '127.0.0.1',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];
    }
  } else if (sql.toLowerCase().includes('insert')) {
    // Mock insert operation
    return {
      id: Date.now(),
      success: true,
      message: 'Record created successfully'
    };
  } else if (sql.toLowerCase().includes('update')) {
    // Mock update operation
    return {
      success: true,
      message: 'Record updated successfully'
    };
  } else if (sql.toLowerCase().includes('delete')) {
    // Mock delete operation
    return {
      success: true,
      message: 'Record deleted successfully'
    };
  }

  return {
    success: true,
    data: [],
    message: 'Query executed successfully'
  };
}

async function checkDatabaseHealth() {
  // In real implementation, this would check Netlify Database connection
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    provider: 'netlify-database',
    tables: ['leads', 'images', 'admin_logs', 'analytics_events']
  };
} 