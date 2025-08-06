// Netlify Function: Analytics Tracking
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
    const pathParts = path.split('/');
    const action = pathParts[pathParts.length - 1];

    switch (httpMethod) {
      case 'POST':
        if (action === 'track') {
          // Track analytics event
          const eventData = JSON.parse(body);
          const trackResult = await trackEvent(eventData);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(trackResult)
          };
        }
        break;

      case 'GET':
        if (action === 'analytics') {
          // Get analytics data
          const queryParams = event.queryStringParameters || {};
          const analytics = await getAnalytics(queryParams);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(analytics)
          };
        } else if (action === 'stats') {
          // Get analytics statistics
          const stats = await getAnalyticsStats();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(stats)
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
    console.error('Analytics function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Analytics operations
async function trackEvent(eventData) {
  // In real implementation, this would store in Netlify Database
  const event = {
    id: Date.now(),
    event_name: eventData.event_name,
    event_category: eventData.event_category,
    event_data: eventData.event_data || {},
    user_agent: eventData.user_agent,
    ip_address: eventData.ip_address,
    page_url: eventData.page_url,
    timestamp: new Date().toISOString()
  };

  // Log the event
  console.log('Analytics Event:', event);

  return {
    success: true,
    event_id: event.id,
    message: 'Event tracked successfully'
  };
}

async function getAnalytics(filters = {}) {
  // In real implementation, this would query Netlify Database
  return {
    page_views: [
      { date: '2024-01-15', count: 150 },
      { date: '2024-01-14', count: 120 },
      { date: '2024-01-13', count: 180 }
    ],
    lead_submissions: [
      { date: '2024-01-15', count: 8 },
      { date: '2024-01-14', count: 5 },
      { date: '2024-01-13', count: 12 }
    ],
    image_uploads: [
      { date: '2024-01-15', count: 3 },
      { date: '2024-01-14', count: 1 },
      { date: '2024-01-13', count: 2 }
    ],
    admin_actions: [
      { date: '2024-01-15', count: 25 },
      { date: '2024-01-14', count: 18 },
      { date: '2024-01-13', count: 30 }
    ]
  };
}

async function getAnalyticsStats() {
  // In real implementation, this would query Netlify Database
  return {
    total_page_views: 450,
    total_lead_submissions: 25,
    total_image_uploads: 6,
    total_admin_actions: 73,
    conversion_rate: 5.56, // (25/450)*100
    avg_session_duration: '2m 30s',
    bounce_rate: 35.2,
    top_pages: [
      { page: '/', views: 200 },
      { page: '/services', views: 120 },
      { page: '/contact', views: 80 },
      { page: '/about', views: 50 }
    ],
    top_sources: [
      { source: 'direct', visits: 180 },
      { source: 'google', visits: 150 },
      { source: 'social', visits: 120 }
    ]
  };
} 