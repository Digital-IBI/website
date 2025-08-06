// Meta Tags Configuration for SEO and Social Sharing
// This file provides functions to dynamically add meta tags

const MetaConfig = {
    // Default meta tags for all pages
    defaultMeta: {
        charset: 'utf-8',
        viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
        compatibility: 'ie=edge'
    },

    // Function to add Open Graph tags
    addOpenGraphTags: function(title, description, image, url, type = 'website') {
        const ogTags = [
            { property: 'og:title', content: title },
            { property: 'og:description', content: description },
            { property: 'og:image', content: image },
            { property: 'og:url', content: url },
            { property: 'og:type', content: type },
            { property: 'og:site_name', content: 'Digital IBI Technologies' },
            { property: 'og:locale', content: 'en_US' }
        ];

        ogTags.forEach(tag => {
            const meta = document.createElement('meta');
            meta.setAttribute('property', tag.property);
            meta.setAttribute('content', tag.content);
            document.head.appendChild(meta);
        });
    },

    // Function to add Twitter Card tags
    addTwitterCardTags: function(title, description, image) {
        const twitterTags = [
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:description', content: description },
            { name: 'twitter:image', content: image },
            { name: 'twitter:site', content: '@digitalibi' }
        ];

        twitterTags.forEach(tag => {
            const meta = document.createElement('meta');
            meta.setAttribute('name', tag.name);
            meta.setAttribute('content', tag.content);
            document.head.appendChild(meta);
        });
    },

    // Function to add additional SEO meta tags
    addSEOTags: function(keywords, author = 'Digital IBI Technologies') {
        const seoTags = [
            { name: 'keywords', content: keywords },
            { name: 'author', content: author },
            { name: 'robots', content: 'index, follow' },
            { name: 'language', content: 'English' }
        ];

        seoTags.forEach(tag => {
            const meta = document.createElement('meta');
            meta.setAttribute('name', tag.name);
            meta.setAttribute('content', tag.content);
            document.head.appendChild(meta);
        });
    },

    // Function to initialize all meta tags for a page
    initPageMeta: function(pageConfig) {
        const baseUrl = window.location.origin;
        const currentUrl = window.location.href;
        
        // Add Open Graph tags
        this.addOpenGraphTags(
            pageConfig.title,
            pageConfig.description,
            pageConfig.image || `${baseUrl}/assets/images/og-default.jpg`,
            currentUrl,
            pageConfig.type || 'website'
        );

        // Add Twitter Card tags
        this.addTwitterCardTags(
            pageConfig.title,
            pageConfig.description,
            pageConfig.image || `${baseUrl}/assets/images/og-default.jpg`
        );

        // Add SEO tags if keywords provided
        if (pageConfig.keywords) {
            this.addSEOTags(pageConfig.keywords, pageConfig.author);
        }
    }
};

// Export for use in other scripts
window.MetaConfig = MetaConfig; 