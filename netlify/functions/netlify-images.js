// Netlify Function: Image Management
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
    const imageId = path.split('/').pop();

    switch (httpMethod) {
      case 'POST':
        // Upload image
        const uploadedImage = await uploadImage(event);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(uploadedImage)
        };

      case 'GET':
        if (imageId && imageId !== 'images') {
          // Get specific image
          const image = await getImage(imageId);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(image)
          };
        } else {
          // Get all images with filters
          const queryParams = event.queryStringParameters || {};
          const images = await getImages(queryParams);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(images)
          };
        }

      case 'PUT':
        // Update image metadata
        const requestBody = body ? JSON.parse(body) : {};
        const updatedImage = await updateImage(imageId, requestBody);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updatedImage)
        };

      case 'DELETE':
        // Delete image
        await deleteImage(imageId);
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
    console.error('Image function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Image operations
async function uploadImage(event) {
  // In real implementation, this would upload to Netlify CDN
  const imageData = {
    id: Date.now(),
    filename: `image_${Date.now()}.jpg`,
    original_name: 'uploaded_image.jpg',
    url: `https://your-site.netlify.app/assets/images/${Date.now()}.jpg`,
    alt_text: 'Uploaded image',
    category: 'general',
    size: 1024000, // 1MB
    mime_type: 'image/jpeg',
    created_at: new Date().toISOString()
  };

  // Log admin action
  await logAdminAction('image_uploaded', {
    imageId: imageData.id,
    filename: imageData.filename,
    size: imageData.size
  });

  return imageData;
}

async function getImages(filters = {}) {
  // In real implementation, this would query Netlify Database
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
    },
    {
      id: 2,
      filename: 'about_image.jpg',
      original_name: 'about.jpg',
      url: 'https://your-site.netlify.app/assets/images/about_image.jpg',
      alt_text: 'About section image',
      category: 'about',
      size: 1536000,
      mime_type: 'image/jpeg',
      created_at: '2024-01-15T11:00:00Z'
    }
  ];
}

async function getImage(imageId) {
  // In real implementation, this would query Netlify Database
  return {
    id: parseInt(imageId),
    filename: 'hero_image.jpg',
    original_name: 'hero.jpg',
    url: 'https://your-site.netlify.app/assets/images/hero_image.jpg',
    alt_text: 'Hero section image',
    category: 'hero',
    size: 2048000,
    mime_type: 'image/jpeg',
    created_at: '2024-01-15T10:00:00Z'
  };
}

async function updateImage(imageId, updateData) {
  // In real implementation, this would update Netlify Database
  const image = await getImage(imageId);
  const updatedImage = { ...image, ...updateData };

  // Log admin action
  await logAdminAction('image_updated', {
    imageId: parseInt(imageId),
    changes: updateData
  });

  return updatedImage;
}

async function deleteImage(imageId) {
  // In real implementation, this would delete from Netlify CDN and Database
  
  // Log admin action
  await logAdminAction('image_deleted', {
    imageId: parseInt(imageId)
  });

  return true;
}

async function logAdminAction(action, details = {}) {
  // In real implementation, this would log to Netlify Database
  console.log('Admin Action:', action, details);
} 