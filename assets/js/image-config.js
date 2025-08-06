// Image Configuration Management
// This file centralizes all image references for easy management

const IMAGE_CONFIG = {
    // Banner Images
    banners: {
        main: 'banner-thumb-1.jpg',
        secondary: 'banner-thumb-2.jpg',
        custom: 'my-custom-banner.jpg'
    },
    
    // Service Images
    services: {
        app_development: 'service-1.jpg',
        digital_marketing: 'service-2.jpg',
        custom_software: 'service-3.jpg'
    },
    
    // Project Images
    projects: {
        project_1: 'project-1.jpg',
        project_2: 'project-2.jpg',
        project_3: 'project-3.jpg'
    },
    
    // Team Images
    team: {
        member_1: 'team-1.jpg',
        member_2: 'team-2.jpg',
        member_3: 'team-3.jpg'
    },
    
    // Blog Images
    blog: {
        blog_1: 'blog-1.jpg',
        blog_2: 'blog-2.jpg',
        blog_3: 'blog-3.jpg'
    }
};

// Function to get image path
function getImagePath(category, key) {
    return `assets/images/${IMAGE_CONFIG[category][key]}`;
}

// Function to update image
function updateImage(category, key, newImageName) {
    IMAGE_CONFIG[category][key] = newImageName;
    console.log(`Updated ${category}.${key} to ${newImageName}`);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IMAGE_CONFIG, getImagePath, updateImage };
} 