// Google Tag Manager Configuration
// Replace GTM-XXXXXXX with your actual GTM container ID
const GTM_CONTAINER_ID = 'GTM-XXXXXXX';

// GTM Head Script
function loadGTMHead() {
    // Temporarily disabled to avoid 404 errors
    // Uncomment when you have a real GTM container ID
    /*
    const script = document.createElement('script');
    script.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');
    `;
    document.head.appendChild(script);
    */
    
    // Initialize dataLayer for tracking
    if (typeof dataLayer === 'undefined') {
        window.dataLayer = window.dataLayer || [];
    }
}

// GTM Body Script
function loadGTMBody() {
    // Temporarily disabled to avoid 404 errors
    // Uncomment when you have a real GTM container ID
    /*
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.appendChild(noscript);
    */
}

// Initialize GTM
function initGTM() {
    // Load GTM head script
    loadGTMHead();
    
    // Load GTM body script when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadGTMBody);
    } else {
        loadGTMBody();
    }
}

// Auto-initialize GTM when script loads
initGTM();

// Export for manual initialization if needed
window.GTMConfig = {
    init: initGTM,
    containerId: GTM_CONTAINER_ID
}; 