// Image Scanner Service - Phase 1 Image Management
// Scans assets/images directory and categorizes images for admin panel

class ImageScannerService {
  constructor() {
    this.config = window.COMMON_CONFIG ? window.COMMON_CONFIG.IMAGES : {};
    this.scannedImages = [];
    this.imageUsage = new Map();
  }

  // Scan all images in the project
  async scanImages() {
    try {
      console.log('🔍 Starting image scan...');
      
      // Get all image files from assets/images
      const imageFiles = await this.getImageFiles();
      
      // Categorize images
      const categorizedImages = this.categorizeImages(imageFiles);
      
      // Find usage locations
      const imagesWithUsage = await this.findImageUsage(categorizedImages);
      
      // Extract metadata
      const imagesWithMetadata = await this.extractImageMetadata(imagesWithUsage);
      
      this.scannedImages = imagesWithMetadata;
      
      console.log(`✅ Image scan complete: ${this.scannedImages.length} images found`);
      return this.scannedImages;
    } catch (error) {
      console.error('❌ Error scanning images:', error);
      throw error;
    }
  }

  // Get all image files from assets/images directory
  async getImageFiles() {
    // This would typically make an API call to scan the directory
    // For now, we'll return a mock list based on our analysis
    return [
      // Hero Images
      { name: 'banner-thumb-1.jpg', path: 'assets/images/banner-thumb-1.jpg', type: 'hero' },
      { name: 'banner-thumb-2.jpg', path: 'assets/images/banner-thumb-2.jpg', type: 'hero' },
      { name: 'banner-thumb-3.jpg', path: 'assets/images/banner-thumb-3.jpg', type: 'hero' },
      { name: 'banner-thumb-4.jpg', path: 'assets/images/banner-thumb-4.jpg', type: 'hero' },
      { name: 'banner-thumb-5.jpg', path: 'assets/images/banner-thumb-5.jpg', type: 'hero' },
      { name: 'banner-thumb-6.jpg', path: 'assets/images/banner-thumb-6.jpg', type: 'hero' },
      { name: 'banner-thumb-7.jpg', path: 'assets/images/banner-thumb-7.jpg', type: 'hero' },
      { name: 'banner-thumb-8.jpg', path: 'assets/images/banner-thumb-8.jpg', type: 'hero' },
      { name: 'banner-thumb-9.jpg', path: 'assets/images/banner-thumb-9.jpg', type: 'hero' },
      { name: 'banner-thumb-10.jpg', path: 'assets/images/banner-thumb-10.jpg', type: 'hero' },
      
      // About Images
      { name: 'about-thumb-1.jpg', path: 'assets/images/about-thumb-1.jpg', type: 'about' },
      { name: 'about-thumb-2.jpg', path: 'assets/images/about-thumb-2.jpg', type: 'about' },
      { name: 'about-thumb-3.jpg', path: 'assets/images/about-thumb-3.jpg', type: 'about' },
      { name: 'about-thumb-4.jpg', path: 'assets/images/about-thumb-4.jpg', type: 'about' },
      { name: 'about-thumb-5.jpg', path: 'assets/images/about-thumb-5.jpg', type: 'about' },
      { name: 'about-thumb-6.png', path: 'assets/images/about-thumb-6.png', type: 'about' },
      { name: 'about-thumb-ring.png', path: 'assets/images/about-thumb-ring.png', type: 'about' },
      
      // Service Images
      { name: 'service-1.jpg', path: 'assets/images/service-1.jpg', type: 'services' },
      { name: 'service-2.jpg', path: 'assets/images/service-2.jpg', type: 'services' },
      { name: 'service-3.jpg', path: 'assets/images/service-3.jpg', type: 'services' },
      { name: 'service-thumb-1.png', path: 'assets/images/service-thumb-1.png', type: 'services' },
      { name: 'service-thumb-2.png', path: 'assets/images/service-thumb-2.png', type: 'services' },
      { name: 'service-thumb-3.png', path: 'assets/images/service-thumb-3.png', type: 'services' },
      { name: 'service-thumb-4.png', path: 'assets/images/service-thumb-4.png', type: 'services' },
      { name: 'service-thumb-5.png', path: 'assets/images/service-thumb-5.png', type: 'services' },
      { name: 'service-thumb-6.png', path: 'assets/images/service-thumb-6.png', type: 'services' },
      
      // Project Images
      { name: 'project-1.jpg', path: 'assets/images/project-1.jpg', type: 'projects' },
      { name: 'project-2.jpg', path: 'assets/images/project-2.jpg', type: 'projects' },
      { name: 'project-3.jpg', path: 'assets/images/project-3.jpg', type: 'projects' },
      { name: 'project-4.jpg', path: 'assets/images/project-4.jpg', type: 'projects' },
      { name: 'project-5.jpg', path: 'assets/images/project-5.jpg', type: 'projects' },
      { name: 'project-6.jpg', path: 'assets/images/project-6.jpg', type: 'projects' },
      { name: 'project-thumb-1.png', path: 'assets/images/project-thumb-1.png', type: 'projects' },
      { name: 'project-thumb-2.png', path: 'assets/images/project-thumb-2.png', type: 'projects' },
      { name: 'project-thumb-banner.jpg', path: 'assets/images/project-thumb-banner.jpg', type: 'projects' },
      
      // Team Images
      { name: 'team-1.jpg', path: 'assets/images/team-1.jpg', type: 'team' },
      { name: 'team-2.jpg', path: 'assets/images/team-2.jpg', type: 'team' },
      { name: 'team-3.jpg', path: 'assets/images/team-3.jpg', type: 'team' },
      { name: 'team-4.jpg', path: 'assets/images/team-4.jpg', type: 'team' },
      { name: 'team-5.jpg', path: 'assets/images/team-5.jpg', type: 'team' },
      { name: 'team-6.jpg', path: 'assets/images/team-6.jpg', type: 'team' },
      { name: 'team-thumb.jpg', path: 'assets/images/team-thumb.jpg', type: 'team' },
      
      // Blog Images
      { name: 'blog-1.jpg', path: 'assets/images/blog-1.jpg', type: 'blog' },
      { name: 'blog-2.jpg', path: 'assets/images/blog-2.jpg', type: 'blog' },
      { name: 'blog-3.jpg', path: 'assets/images/blog-3.jpg', type: 'blog' },
      { name: 'blog-4.jpg', path: 'assets/images/blog-4.jpg', type: 'blog' },
      { name: 'blog-5.jpg', path: 'assets/images/blog-5.jpg', type: 'blog' },
      { name: 'blog-6.jpg', path: 'assets/images/blog-6.jpg', type: 'blog' },
      { name: 'blog-thumb.jpg', path: 'assets/images/blog-thumb.jpg', type: 'blog' },
      
      // Icon Images
      { name: 'service-icon-1.png', path: 'assets/images/icon/service-icon-1.png', type: 'icons' },
      { name: 'service-icon-2.png', path: 'assets/images/icon/service-icon-2.png', type: 'icons' },
      { name: 'service-icon-3.png', path: 'assets/images/icon/service-icon-3.png', type: 'icons' },
      { name: 'service-icon-4.png', path: 'assets/images/icon/service-icon-4.png', type: 'icons' },
      { name: 'icon-1.png', path: 'assets/images/icon/icon-1.png', type: 'icons' },
      { name: 'icon-2.png', path: 'assets/images/icon/icon-2.png', type: 'icons' },
      
      // Logo Images
      { name: 'logo.png', path: 'assets/images/logo.png', type: 'logos' },
      { name: 'logo-white.png', path: 'assets/images/logo-white.png', type: 'logos' },
      { name: 'brand-logo.png', path: 'assets/images/brand-logo.png', type: 'logos' },
      
      // Background Images
      { name: 'banner-bg.jpg', path: 'assets/images/banner-bg.jpg', type: 'backgrounds' },
      { name: 'service-bg.jpg', path: 'assets/images/service-bg.jpg', type: 'backgrounds' },
      { name: 'cta-bg.jpg', path: 'assets/images/cta-bg.jpg', type: 'backgrounds' },
      { name: 'cta-bg-2.jpg', path: 'assets/images/cta-bg-2.jpg', type: 'backgrounds' },
      { name: 'about-bg.jpg', path: 'assets/images/about-bg.jpg', type: 'backgrounds' },
      { name: 'footer-bg.jpg', path: 'assets/images/footer-bg.jpg', type: 'backgrounds' },
      { name: 'team-form-bg.jpg', path: 'assets/images/team-form-bg.jpg', type: 'backgrounds' },
      { name: 'video-bg.jpg', path: 'assets/images/video-bg.jpg', type: 'backgrounds' },
      
      // Other Images
      { name: 'favicon.png', path: 'assets/images/favicon.png', type: 'other' },
      { name: 'banner-laptop.png', path: 'assets/images/banner-laptop.png', type: 'other' },
      { name: 'VR-glasess.png', path: 'assets/images/VR-glasess.png', type: 'other' },
      { name: 'offer-thumb.png', path: 'assets/images/offer-thumb.png', type: 'other' },
      { name: 'cta-thumb.png', path: 'assets/images/cta-thumb.png', type: 'other' },
      { name: 'home-contact-thumb.jpg', path: 'assets/images/home-contact-thumb.jpg', type: 'other' }
    ];
  }

  // Categorize images based on name and path
  categorizeImages(imageFiles) {
    return imageFiles.map(file => {
      const category = this.determineCategory(file.name, file.path);
      return {
        ...file,
        category: category,
        displayName: this.getDisplayName(file.name),
        fileSize: this.estimateFileSize(file.name),
        format: this.getFileFormat(file.name)
      };
    });
  }

  // Determine image category
  determineCategory(fileName, filePath) {
    const name = fileName.toLowerCase();
    const path = filePath.toLowerCase();

    if (name.includes('banner') || name.includes('hero')) return 'hero';
    if (name.includes('about')) return 'about';
    if (name.includes('service')) return 'services';
    if (name.includes('project')) return 'projects';
    if (name.includes('team')) return 'team';
    if (name.includes('blog')) return 'blog';
    if (path.includes('icon/')) return 'icons';
    if (name.includes('logo')) return 'logos';
    if (name.includes('bg') || name.includes('background')) return 'backgrounds';
    
    return 'other';
  }

  // Get display name for image
  getDisplayName(fileName) {
    return fileName
      .replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  // Estimate file size based on image type
  estimateFileSize(fileName) {
    const format = this.getFileFormat(fileName);
    const name = fileName.toLowerCase();
    
    // Rough size estimates based on image type
    if (name.includes('banner') || name.includes('hero')) return '50-200KB';
    if (name.includes('thumb')) return '5-20KB';
    if (name.includes('icon')) return '1-5KB';
    if (name.includes('logo')) return '10-50KB';
    if (name.includes('bg')) return '20-100KB';
    
    return '10-50KB';
  }

  // Get file format
  getFileFormat(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    return extension;
  }

  // Find where images are used
  async findImageUsage(categorizedImages) {
    const usageMap = {
      // HTML direct usage
      'banner-thumb-1.jpg': ['index.html', 'services/*.html'],
      'banner-thumb-2.jpg': ['index.html', 'services/*.html'],
      'logo.png': ['*.html'],
      'logo-white.png': ['*.html'],
      'service-1.jpg': ['services/service-1.html'],
      'service-2.jpg': ['services/service-2.html'],
      'service-3.jpg': ['services/service-3.html'],
      'project-1.jpg': ['projects.html', 'index.html'],
      'project-2.jpg': ['projects.html', 'index.html'],
      'project-3.jpg': ['projects.html', 'index.html'],
      'project-4.jpg': ['projects.html', 'index.html'],
      'project-5.jpg': ['projects.html', 'index.html'],
      'project-6.jpg': ['projects.html', 'index.html'],
      'team-1.jpg': ['about.html', 'team.html'],
      'team-2.jpg': ['about.html', 'team.html'],
      'team-3.jpg': ['about.html', 'team.html'],
      'team-4.jpg': ['about.html', 'team.html'],
      'team-5.jpg': ['about.html', 'team.html'],
      'team-6.jpg': ['about.html', 'team.html'],
      'blog-1.jpg': ['blog.html', 'blog-details.html'],
      'blog-2.jpg': ['blog.html', 'blog-details.html'],
      'blog-3.jpg': ['blog.html', 'blog-details.html'],
      'blog-4.jpg': ['blog.html', 'blog-details.html'],
      'blog-5.jpg': ['blog.html', 'blog-details.html'],
      'blog-6.jpg': ['blog.html', 'blog-details.html'],
      
      // CSS background usage
      'banner-bg.jpg': ['assets/css/style.css'],
      'service-bg.jpg': ['assets/css/style.css'],
      'cta-bg.jpg': ['assets/css/style.css'],
      'cta-bg-2.jpg': ['assets/css/style.css'],
      'about-bg.jpg': ['assets/css/style.css'],
      'footer-bg.jpg': ['assets/css/style.css'],
      'team-form-bg.jpg': ['assets/css/style.css'],
      'video-bg.jpg': ['assets/css/style.css'],
      'service-icon-1.png': ['assets/css/icon-library.css'],
      'service-icon-2.png': ['assets/css/icon-library.css'],
      'service-icon-3.png': ['assets/css/icon-library.css'],
      'service-icon-4.png': ['assets/css/icon-library.css']
    };

    return categorizedImages.map(image => {
      const usage = usageMap[image.name] || [];
      return {
        ...image,
        usage: {
          html: usage.filter(u => u.includes('.html')),
          css: usage.filter(u => u.includes('.css')),
          total: usage.length
        },
        usageType: usage.some(u => u.includes('.css')) ? 'css-background' : 'html-direct'
      };
    });
  }

  // Extract image metadata
  async extractImageMetadata(imagesWithUsage) {
    return imagesWithUsage.map(image => {
      return {
        ...image,
        metadata: {
          width: this.estimateImageDimensions(image.name),
          height: this.estimateImageDimensions(image.name),
          aspectRatio: this.getAspectRatio(image.name),
          optimization: this.getOptimizationStatus(image.name),
          lastModified: new Date().toISOString(),
          uploadDate: new Date().toISOString()
        },
        status: {
          optimized: this.isOptimized(image.name),
          compressed: this.isCompressed(image.name),
          webp: this.hasWebpVersion(image.name),
          responsive: this.hasResponsiveVersions(image.name)
        }
      };
    });
  }

  // Estimate image dimensions
  estimateImageDimensions(fileName) {
    const name = fileName.toLowerCase();
    
    if (name.includes('banner') || name.includes('hero')) return 1200;
    if (name.includes('thumb')) return 300;
    if (name.includes('icon')) return 64;
    if (name.includes('logo')) return 200;
    if (name.includes('bg')) return 1920;
    
    return 800;
  }

  // Get aspect ratio
  getAspectRatio(fileName) {
    const name = fileName.toLowerCase();
    
    if (name.includes('banner') || name.includes('hero')) return '16:9';
    if (name.includes('thumb')) return '4:3';
    if (name.includes('icon')) return '1:1';
    if (name.includes('logo')) return '3:1';
    if (name.includes('bg')) return '16:9';
    
    return '4:3';
  }

  // Get optimization status
  getOptimizationStatus(fileName) {
    const name = fileName.toLowerCase();
    
    if (name.includes('banner') || name.includes('hero')) return 'needs-optimization';
    if (name.includes('thumb')) return 'optimized';
    if (name.includes('icon')) return 'optimized';
    if (name.includes('logo')) return 'optimized';
    if (name.includes('bg')) return 'needs-optimization';
    
    return 'unknown';
  }

  // Check if image is optimized
  isOptimized(fileName) {
    const name = fileName.toLowerCase();
    return name.includes('thumb') || name.includes('icon') || name.includes('logo');
  }

  // Check if image is compressed
  isCompressed(fileName) {
    const name = fileName.toLowerCase();
    return name.includes('thumb') || name.includes('icon');
  }

  // Check if image has WebP version
  hasWebpVersion(fileName) {
    return false; // Currently no WebP versions
  }

  // Check if image has responsive versions
  hasResponsiveVersions(fileName) {
    return false; // Currently no responsive versions
  }

  // Get images by category
  getImagesByCategory(category) {
    return this.scannedImages.filter(image => image.category === category);
  }

  // Get images by usage type
  getImagesByUsageType(usageType) {
    return this.scannedImages.filter(image => image.usageType === usageType);
  }

  // Get images that need optimization
  getImagesNeedingOptimization() {
    return this.scannedImages.filter(image => 
      image.metadata.optimization === 'needs-optimization'
    );
  }

  // Get image statistics
  getImageStatistics() {
    const stats = {
      total: this.scannedImages.length,
      byCategory: {},
      byUsageType: {},
      byFormat: {},
      optimizationNeeded: 0,
      totalSize: '0KB'
    };

    this.scannedImages.forEach(image => {
      // Category stats
      stats.byCategory[image.category] = (stats.byCategory[image.category] || 0) + 1;
      
      // Usage type stats
      stats.byUsageType[image.usageType] = (stats.byUsageType[image.usageType] || 0) + 1;
      
      // Format stats
      stats.byFormat[image.format] = (stats.byFormat[image.format] || 0) + 1;
      
      // Optimization stats
      if (image.metadata.optimization === 'needs-optimization') {
        stats.optimizationNeeded++;
      }
    });

    return stats;
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageScannerService;
} else {
  window.ImageScannerService = ImageScannerService;
} 