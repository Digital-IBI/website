// Social Sharing Functionality
// This file provides functions for social media sharing

const SocialSharing = {
    // Share to Facebook
    shareToFacebook: function(url, title) {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        this.openShareWindow(shareUrl, 'Facebook Share', 600, 400);
    },

    // Share to Twitter
    shareToTwitter: function(url, title) {
        const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        this.openShareWindow(shareUrl, 'Twitter Share', 600, 400);
    },

    // Share to LinkedIn
    shareToLinkedIn: function(url, title) {
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        this.openShareWindow(shareUrl, 'LinkedIn Share', 600, 400);
    },

    // Share to WhatsApp
    shareToWhatsApp: function(url, title) {
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
        this.openShareWindow(shareUrl, 'WhatsApp Share', 600, 400);
    },

    // Open share window
    openShareWindow: function(url, title, width, height) {
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        
        window.open(url, title, 
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );
    },

    // Initialize social sharing for a page
    initSocialSharing: function(pageConfig) {
        const currentUrl = window.location.href;
        const pageTitle = pageConfig.title || document.title;
        const pageDescription = pageConfig.description || '';

        // Add click event listeners to share buttons
        document.addEventListener('DOMContentLoaded', function() {
            // Facebook share
            const facebookShares = document.querySelectorAll('.facebook-share, [data-share="facebook"]');
            facebookShares.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    SocialSharing.shareToFacebook(currentUrl, pageTitle);
                });
            });

            // Twitter share
            const twitterShares = document.querySelectorAll('.twitter-share, [data-share="twitter"]');
            twitterShares.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    SocialSharing.shareToTwitter(currentUrl, pageTitle);
                });
            });

            // LinkedIn share
            const linkedinShares = document.querySelectorAll('.linkedin-share, [data-share="linkedin"]');
            linkedinShares.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    SocialSharing.shareToLinkedIn(currentUrl, pageTitle);
                });
            });

            // WhatsApp share
            const whatsappShares = document.querySelectorAll('.whatsapp-share, [data-share="whatsapp"]');
            whatsappShares.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    SocialSharing.shareToWhatsApp(currentUrl, pageTitle);
                });
            });

            // Generic share buttons (existing share-icon elements)
            const shareIcons = document.querySelectorAll('.share-icon');
            shareIcons.forEach(icon => {
                icon.addEventListener('click', function(e) {
                    e.preventDefault();
                    // Show share options or share to default platform
                    SocialSharing.shareToFacebook(currentUrl, pageTitle);
                });
            });
        });
    },

    // Create share buttons HTML
    createShareButtons: function() {
        return `
            <div class="social-share-buttons">
                <button class="share-btn facebook-share" title="Share on Facebook">
                    <i class="fab fa-facebook-f"></i>
                </button>
                <button class="share-btn twitter-share" title="Share on Twitter">
                    <i class="fab fa-twitter"></i>
                </button>
                <button class="share-btn linkedin-share" title="Share on LinkedIn">
                    <i class="fab fa-linkedin-in"></i>
                </button>
                <button class="share-btn whatsapp-share" title="Share on WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
            </div>
        `;
    }
};

// Export for use in other scripts
window.SocialSharing = SocialSharing; 