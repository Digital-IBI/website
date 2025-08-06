// Netlify Function: Admin Panel Management
const { COMMON_CONFIG } = require('../../../config/common-config');

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
    const config = COMMON_CONFIG;
    const { httpMethod, path, body } = event;
    const pathParts = path.split('/');
    const action = pathParts[pathParts.length - 1];

    switch (httpMethod) {
      case 'POST':
        if (action === 'login') {
          // Admin login
          const credentials = JSON.parse(body);
          const loginResult = await adminLogin(credentials);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(loginResult)
          };
        } else if (action === 'logout') {
          // Admin logout
          const logoutResult = await adminLogout();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(logoutResult)
          };
        }
        break;

      case 'GET':
        if (action === 'stats') {
          // Get admin statistics
          const stats = await getAdminStats();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(stats)
          };
        } else if (action === 'logs') {
          // Get admin logs
          const queryParams = event.queryStringParameters || {};
          const logs = await getAdminLogs(queryParams);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(logs)
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
    console.error('Admin function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Admin operations
async function adminLogin(credentials) {
  // In real implementation, this would validate against Netlify Database
  const { username, password } = credentials;
  
  // Simple validation (replace with proper authentication)
  if (username === 'admin' && password === 'password') {
    const session = {
      user: username,
      token: `token_${Date.now()}`,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      login_time: new Date().toISOString()
    };

    // Log admin action
    await logAdminAction('admin_login', {
      user: username,
      success: true,
      ip: '127.0.0.1'
    });

    return {
      success: true,
      session,
      message: 'Login successful'
    };
  } else {
    // Log failed login attempt
    await logAdminAction('admin_login_failed', {
      user: username,
      success: false,
      ip: '127.0.0.1'
    });

    return {
      success: false,
      message: 'Invalid credentials'
    };
  }
}

async function adminLogout() {
  // In real implementation, this would invalidate session in Netlify Database
  
  // Log admin action
  await logAdminAction('admin_logout', {
    user: 'admin',
    success: true
  });

  return {
    success: true,
    message: 'Logout successful'
  };
}

async function getAdminStats() {
  // In real implementation, this would query Netlify Database
  return {
    total_leads: 25,
    new_leads: 8,
    contacted_leads: 12,
    converted_leads: 5,
    total_images: 15,
    admin_logins_today: 3,
    system_health: 'good',
    last_backup: new Date().toISOString()
  };
}

async function getAdminLogs(filters = {}) {
  // In real implementation, this would query Netlify Database
  return [
    {
      id: 1,
      action: 'admin_login',
      user_id: 'admin',
      details: { success: true, ip: '127.0.0.1' },
      ip_address: '127.0.0.1',
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      action: 'lead_created',
      user_id: 'system',
      details: { leadId: 123, source: 'website' },
      ip_address: '127.0.0.1',
      created_at: '2024-01-15T09:30:00Z'
    },
    {
      id: 3,
      action: 'image_uploaded',
      user_id: 'admin',
      details: { imageId: 456, filename: 'hero.jpg', size: 2048000 },
      ip_address: '127.0.0.1',
      created_at: '2024-01-15T09:00:00Z'
    }
  ];
}

async function logAdminAction(action, details = {}) {
  // In real implementation, this would log to Netlify Database
  console.log('Admin Action:', action, details);
} 