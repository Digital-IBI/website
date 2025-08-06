/**
 * Basic Search Engine for Infetech Website
 * Provides lightweight search functionality across all pages
 */

class BasicSearchEngine {
    constructor() {
        this.searchIndex = [];
        this.searchResults = [];
        this.isInitialized = false;
        this.init();
    }

    /**
     * Initialize the search engine
     */
    init() {
        this.buildSearchIndex();
        this.setupSearchEventListeners();
        this.isInitialized = true;
        console.log('Basic Search Engine initialized');
    }

    /**
     * Build search index from available pages
     */
    buildSearchIndex() {
        // Define the pages and their content for search
        this.searchIndex = [
            {
                title: "Home - Infetech Technology Solutions",
                url: "index.html",
                description: "Leading technology company providing SEO, WordPress development, social media management, AI-based tools and services, custom app development, and custom software development.",
                keywords: ["technology", "SEO", "WordPress", "social media", "AI", "app development", "software development"],
                category: "main"
            },
            {
                title: "About Us - Infetech",
                url: "about.html",
                description: "Learn about Infetech's mission, vision, and expertise in digital transformation and technology solutions.",
                keywords: ["about", "company", "mission", "vision", "expertise", "digital transformation"],
                category: "company"
            },
            {
                title: "Our Team - Infetech",
                url: "our-team.html",
                description: "Meet our talented team of technology experts, developers, and digital marketing professionals.",
                keywords: ["team", "experts", "developers", "professionals", "staff"],
                category: "company"
            },
            {
                title: "Contact Us - Infetech",
                url: "contact.html",
                description: "Get in touch with Infetech for your technology and digital marketing needs.",
                keywords: ["contact", "get in touch", "inquiry", "support", "help"],
                category: "main"
            },
            {
                title: "Custom Software Development - Infetech",
                url: "services/custom-software-development.html",
                description: "Custom software development services tailored to your business needs and requirements.",
                keywords: ["custom software", "development", "tailored", "business", "requirements"],
                category: "services"
            },
            {
                title: "App Development - Infetech",
                url: "services/app-development.html",
                description: "Professional mobile and web application development services for businesses and startups.",
                keywords: ["app development", "mobile apps", "web apps", "applications", "development"],
                category: "services"
            },
            {
                title: "SEO Services - Infetech",
                url: "services/seo-services.html",
                description: "Comprehensive SEO services to improve your website's search engine rankings and visibility.",
                keywords: ["SEO", "search engine optimization", "rankings", "visibility", "traffic"],
                category: "services"
            },
            {
                title: "Social Media Management - Infetech",
                url: "services/social-media-management.html",
                description: "Professional social media management services to grow your online presence and engagement.",
                keywords: ["social media", "management", "online presence", "engagement", "marketing"],
                category: "services"
            },
            {
                title: "WhatsApp Marketing - Infetech",
                url: "services/whatsapp-marketing.html",
                description: "WhatsApp marketing and automation services for business communication and customer engagement.",
                keywords: ["WhatsApp", "marketing", "automation", "communication", "customer engagement"],
                category: "services"
            },
            {
                title: "WordPress Development - Infetech",
                url: "services/wordpress-development.html",
                description: "Professional WordPress development services for websites, blogs, and e-commerce platforms.",
                keywords: ["WordPress", "development", "websites", "blogs", "e-commerce"],
                category: "services"
            },
            {
                title: "AI Asset Tracking - Infetech",
                url: "products/ai-asset-tracking.html",
                description: "AI-powered asset tracking and management solutions for businesses and organizations.",
                keywords: ["AI", "asset tracking", "management", "solutions", "business"],
                category: "products"
            },
            {
                title: "AI Loyalty Technology - Infetech",
                url: "products/ai-loyalty-tech.html",
                description: "Advanced AI-powered loyalty management and customer retention solutions.",
                keywords: ["AI", "loyalty", "customer retention", "management", "technology"],
                category: "products"
            },
            {
                title: "AI Sales LMS - Infetech",
                url: "products/ai-sales-lms.html",
                description: "AI-driven learning management system for sales training and performance improvement.",
                keywords: ["AI", "sales", "LMS", "training", "performance", "learning"],
                category: "products"
            },
            {
                title: "WhatsApp Marketing App - Infetech",
                url: "products/whatsapp-marketing-app.html",
                description: "Comprehensive WhatsApp marketing application for business automation and customer engagement.",
                keywords: ["WhatsApp", "marketing", "app", "automation", "business"],
                category: "products"
            },
            {
                title: "Custom Search Engine - Infetech",
                url: "products/custom-search-engine.html",
                description: "Custom search engine solutions tailored to your business needs and requirements.",
                keywords: ["custom search", "search engine", "tailored", "business", "solutions"],
                category: "products"
            },
            {
                title: "Projects - Infetech",
                url: "projects.html",
                description: "Explore our portfolio of successful projects and case studies across various industries.",
                keywords: ["projects", "portfolio", "case studies", "success", "industries"],
                category: "main"
            },
            {
                title: "Blog - Infetech",
                url: "blogs/blog.html",
                description: "Latest insights, tips, and industry news from Infetech's technology experts.",
                keywords: ["blog", "insights", "tips", "news", "technology", "experts"],
                category: "main"
            },
            {
                title: "Ecommerce Solutions - Infetech",
                url: "domains/ecommerce-solutions.html",
                description: "Comprehensive ecommerce solutions for online stores and digital marketplaces.",
                keywords: ["ecommerce", "online stores", "digital marketplace", "solutions"],
                category: "domains"
            },
            {
                title: "FMCG Solutions - Infetech",
                url: "domains/fmcg-solutions.html",
                description: "Digital transformation solutions for FMCG companies and consumer goods businesses.",
                keywords: ["FMCG", "consumer goods", "digital transformation", "solutions"],
                category: "domains"
            },
            {
                title: "Logistics Solutions - Infetech",
                url: "domains/logistics-solutions.html",
                description: "Technology solutions for logistics and supply chain management optimization.",
                keywords: ["logistics", "supply chain", "management", "optimization", "solutions"],
                category: "domains"
            },
            {
                title: "Startups Solutions - Infetech",
                url: "domains/startups-solutions.html",
                description: "Technology solutions and digital marketing services for startups and growing businesses.",
                keywords: ["startups", "growing businesses", "digital marketing", "technology solutions"],
                category: "domains"
            },
            {
                title: "MSME Solutions - Infetech",
                url: "domains/msme-solutions.html",
                description: "Affordable technology solutions for MSMEs and small to medium enterprises.",
                keywords: ["MSME", "small business", "medium enterprise", "affordable", "solutions"],
                category: "domains"
            }
        ];
    }

    /**
     * Setup search event listeners
     */
    setupSearchEventListeners() {
        // Handle search form submission
        $(document).on('submit', '.search-popup form', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.performSearch();
        });

        // Handle search input changes for real-time search
        $(document).on('input', '.search-popup input[type="search"]', (e) => {
            e.stopPropagation();
            const query = $(e.target).val().trim();
            if (query.length >= 2) {
                this.performRealTimeSearch(query);
            } else {
                this.clearSearchResults();
            }
        });

        // Handle search button click
        $(document).on('click', '.search-popup button[type="submit"]', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.performSearch();
        });

        // Prevent search popup from closing when clicking inside results
        $(document).on('click', '.search-results', (e) => {
            e.stopPropagation();
        });

        // Prevent search form from closing when clicking inside
        $(document).on('click', '.search-popup form', (e) => {
            e.stopPropagation();
        });

        // Prevent search input from closing when clicking inside
        $(document).on('click', '.search-popup input', (e) => {
            e.stopPropagation();
        });

        // Handle result item clicks
        $(document).on('click', '.search-result-item', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = $(e.currentTarget).data('url');
            if (url) {
                window.location.href = url;
            }
        });

        // Handle result link clicks
        $(document).on('click', '.search-result-item a', (e) => {
            e.stopPropagation();
            // Let the link work normally
        });

        // Prevent search popup from closing when clicking on results
        $(document).on('mousedown', '.search-results', (e) => {
            e.stopPropagation();
        });

        // Prevent search popup from closing when clicking on result items
        $(document).on('mousedown', '.search-result-item', (e) => {
            e.stopPropagation();
        });

        // Prevent search popup from closing when clicking on result links
        $(document).on('mousedown', '.search-result-item a', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * Perform search based on current input
     */
    performSearch() {
        const searchInput = $('.search-popup input[type="search"]');
        const query = searchInput.val().trim();
        
        if (query.length === 0) {
            this.showMessage('Please enter a search term');
            return;
        }

        this.search(query);
    }

    /**
     * Perform real-time search as user types
     */
    performRealTimeSearch(query) {
        this.search(query, true);
    }

    /**
     * Main search function
     */
    search(query, isRealTime = false) {
        const results = this.searchIndex.filter(item => {
            const searchText = query.toLowerCase();
            const titleMatch = item.title.toLowerCase().includes(searchText);
            const descriptionMatch = item.description.toLowerCase().includes(searchText);
            const keywordsMatch = item.keywords.some(keyword => 
                keyword.toLowerCase().includes(searchText)
            );
            
            return titleMatch || descriptionMatch || keywordsMatch;
        });

        this.searchResults = results;
        this.displaySearchResults(results, query, isRealTime);
    }

    /**
     * Display search results
     */
    displaySearchResults(results, query, isRealTime = false) {
        const searchPopup = $('.search-popup');
        const searchForm = searchPopup.find('form');
        
        // Remove existing results
        searchPopup.find('.search-results').remove();
        
        if (results.length === 0) {
            this.showMessage('No results found for "' + query + '"');
            return;
        }

        // Create results container
        const resultsContainer = $('<div class="search-results"></div>');
        
        // Add results header
        const resultsHeader = $(`
            <div class="search-results-header">
                <h4>Found ${results.length} result${results.length > 1 ? 's' : ''} for "${query}"</h4>
            </div>
        `);
        resultsContainer.append(resultsHeader);

        // Add results list
        const resultsList = $('<div class="search-results-list"></div>');
        
        results.forEach((result, index) => {
            const resultItem = $(`
                <div class="search-result-item" data-url="${result.url}">
                    <div class="result-title">
                        <a href="${result.url}">${result.title}</a>
                    </div>
                    <div class="result-description">${result.description}</div>
                    <div class="result-category">${this.getCategoryLabel(result.category)}</div>
                </div>
            `);
            
            resultsList.append(resultItem);
        });

        resultsContainer.append(resultsList);
        
        // Append results to the form instead of the popup
        searchForm.append(resultsContainer);

        // Add CSS for results
        this.addSearchResultsCSS();
        
        // Ensure the search popup stays open
        if (!$('body').hasClass('search-active')) {
            $('body').addClass('search-active');
        }
    }

    /**
     * Show message in search popup
     */
    showMessage(message) {
        const searchPopup = $('.search-popup');
        const searchForm = searchPopup.find('form');
        searchPopup.find('.search-results').remove();
        
        const messageDiv = $(`
            <div class="search-results">
                <div class="search-message">${message}</div>
            </div>
        `);
        
        searchForm.append(messageDiv);
        this.addSearchResultsCSS();
        
        // Ensure the search popup stays open
        if (!$('body').hasClass('search-active')) {
            $('body').addClass('search-active');
        }
    }

    /**
     * Clear search results
     */
    clearSearchResults() {
        $('.search-popup .search-results').remove();
    }

    /**
     * Get category label
     */
    getCategoryLabel(category) {
        const labels = {
            'main': 'Main Pages',
            'company': 'Company',
            'services': 'Services',
            'products': 'Products',
            'domains': 'Industry Solutions'
        };
        return labels[category] || category;
    }

    /**
     * Add CSS for search results
     */
    addSearchResultsCSS() {
        if ($('#search-results-css').length === 0) {
            const css = `
                <style id="search-results-css">
                    .search-results {
                        position: absolute;
                        top: 60px;
                        left: 0;
                        right: 0;
                        background: #fff;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                        max-height: 400px;
                        overflow-y: auto;
                        z-index: 10000;
                        margin-top: 10px;
                        pointer-events: auto;
                        width: 100%;
                    }
                    
                    .search-results-header {
                        padding: 15px 20px;
                        border-bottom: 1px solid #eee;
                        background: #f8f9fa;
                        border-radius: 8px 8px 0 0;
                    }
                    
                    .search-results-header h4 {
                        margin: 0;
                        font-size: 14px;
                        color: #666;
                        font-weight: 500;
                    }
                    
                    .search-results-list {
                        max-height: 300px;
                        overflow-y: auto;
                    }
                    
                    .search-result-item {
                        padding: 15px 20px;
                        border-bottom: 1px solid #f0f0f0;
                        cursor: pointer;
                        transition: background-color 0.2s ease;
                    }
                    
                    .search-result-item:hover {
                        background-color: #f8f9fa;
                    }
                    
                    .search-result-item:last-child {
                        border-bottom: none;
                    }
                    
                    .result-title {
                        margin-bottom: 5px;
                    }
                    
                    .result-title a {
                        color: #333;
                        text-decoration: none;
                        font-weight: 600;
                        font-size: 16px;
                    }
                    
                    .result-title a:hover {
                        color: #007bff;
                    }
                    
                    .result-description {
                        color: #666;
                        font-size: 14px;
                        line-height: 1.4;
                        margin-bottom: 8px;
                    }
                    
                    .result-category {
                        font-size: 12px;
                        color: #007bff;
                        background: #e3f2fd;
                        padding: 2px 8px;
                        border-radius: 12px;
                        display: inline-block;
                    }
                    
                    .search-message {
                        padding: 20px;
                        text-align: center;
                        color: #666;
                        font-size: 14px;
                    }
                    
                    .search-popup form {
                        position: relative;
                    }
                    
                    @media (max-width: 768px) {
                        .search-results {
                            max-height: 300px;
                        }
                        
                        .search-results-list {
                            max-height: 200px;
                        }
                    }
                </style>
            `;
            $('head').append(css);
        }
    }
}

// Initialize search engine when document is ready
$(document).ready(function() {
    window.basicSearchEngine = new BasicSearchEngine();
}); 