// Netlify Function: Lead Management
const { getConfig } = require('../../../config/environment');

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
    const config = getConfig();
    const { httpMethod, path, body } = event;
    const leadId = path.split('/').pop();

    // Parse request body
    const requestBody = body ? JSON.parse(body) : {};

    switch (httpMethod) {
      case 'POST':
        // Create new lead
        const newLead = await createLead(requestBody);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newLead)
        };

      case 'GET':
        if (leadId && leadId !== 'leads') {
          // Get specific lead
          const lead = await getLead(leadId);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(lead)
          };
        } else {
          // Get all leads with filters
          const queryParams = event.queryStringParameters || {};
          const leads = await getLeads(queryParams);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(leads)
          };
        }

      case 'PUT':
        // Update lead
        const updatedLead = await updateLead(leadId, requestBody);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updatedLead)
        };

      case 'DELETE':
        // Delete lead
        await deleteLead(leadId);
        return {
          statusCode: 204,
          headers,
          body: ''
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Lead function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Database operations (simplified for Netlify)
async function createLead(leadData) {
  // In real implementation, this would connect to Netlify Database
  const lead = {
    id: Date.now(),
    name: leadData.name,
    email: leadData.email,
    phone: leadData.phone || null,
    message: leadData.message || null,
    source: leadData.source || 'website',
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Log admin action
  await logAdminAction('lead_created', {
    leadId: lead.id,
    source: lead.source
  });

  return lead;
}

async function getLeads(filters = {}) {
  // In real implementation, this would query Netlify Database
  // For now, return mock data
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
}

async function getLead(leadId) {
  // In real implementation, this would query Netlify Database
  return {
    id: parseInt(leadId),
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    message: 'Interested in services',
    source: 'website',
    status: 'new',
    created_at: '2024-01-15T10:00:00Z'
  };
}

async function updateLead(leadId, updateData) {
  // In real implementation, this would update Netlify Database
  const lead = await getLead(leadId);
  const updatedLead = { ...lead, ...updateData, updated_at: new Date().toISOString() };

  // Log admin action
  await logAdminAction('lead_updated', {
    leadId: parseInt(leadId),
    changes: updateData
  });

  return updatedLead;
}

async function deleteLead(leadId) {
  // In real implementation, this would delete from Netlify Database
  
  // Log admin action
  await logAdminAction('lead_deleted', {
    leadId: parseInt(leadId)
  });

  return true;
}

async function logAdminAction(action, details = {}) {
  // In real implementation, this would log to Netlify Database
  console.log('Admin Action:', action, details);
} 