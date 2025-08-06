// Global Consultation Modal Function with GTM Tracking
// This function can be used across all pages

function showConsultationModal(event) {
    // Prevent default behavior and page scrolling
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('showConsultationModal called');
    
    // Get current page information for tracking
    const currentPage = window.location.pathname;
    const pageTitle = document.title || 'Unknown Page';
    const pageUrl = window.location.href;
    
    // Add GTM tracking for consultation button clicks
    if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
            'event': 'consultation_cta_click',
            'event_category': 'engagement',
            'event_label': 'free_consultation',
            'page_name': currentPage,
            'page_title': pageTitle,
            'page_url': pageUrl,
            'button_location': 'consultation_cta_section',
            'timestamp': new Date().toISOString()
        });
        
        console.log('GTM Event Pushed:', {
            'event': 'consultation_cta_click',
            'page_name': currentPage,
            'page_title': pageTitle
        });
    } else {
        console.warn('dataLayer not available for tracking');
    }
    
    try {
        console.log('Checking LeadFormEmbed availability...');
        console.log('LeadFormEmbed type:', typeof LeadFormEmbed);
        
        // Wait for LeadFormEmbed to be available
        if (typeof LeadFormEmbed === 'undefined') {
            console.error('LeadFormEmbed is not loaded');
            createFallbackModal();
            return;
        }
        
        // Check if LeadFormEmbed is properly initialized
        if (typeof LeadFormEmbed.createPopupForm !== 'function') {
            console.error('LeadFormEmbed.createPopupForm is not available');
            console.log('Available LeadFormEmbed methods:', Object.keys(LeadFormEmbed));
            createFallbackModal();
            return;
        }
        
        console.log('Creating popup form...');
        const popup = LeadFormEmbed.createPopupForm({
            size: 'medium',
            theme: 'gradient',
            fields: ['name', 'email', 'phone', 'service', 'message'],
            requiredFields: ['name', 'email', 'message'],
            showCaptcha: false,
            successMessage: 'Thank you! We will contact you within 24 hours.',
            errorMessage: 'Something went wrong. Please try again.'
        });
        
        console.log('Popup created:', popup);
        
    } catch (error) {
        console.error('Error creating popup:', error);
        createFallbackModal();
    }
}

// Fallback modal function
function createFallbackModal() {
    console.log('Creating fallback modal...');
    
    // Create a simple modal as fallback
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
        position: relative;
    `;
    
    modalContent.innerHTML = `
        <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
        <h3 style="margin-bottom: 20px; color: #333;">Get Free Consultation</h3>
        <p style="margin-bottom: 20px; color: #666;">We're here to help grow your business. Please contact us:</p>
        <div style="margin-bottom: 15px;">
            <strong>Email:</strong> <a href="mailto:info@digitalibi.com">info@digitalibi.com</a>
        </div>
        <div style="margin-bottom: 15px;">
            <strong>Phone:</strong> <a href="tel:+9198006802">+91 (9800) 6802</a>
        </div>
        <div style="margin-bottom: 20px;">
            <strong>WhatsApp:</strong> <a href="https://wa.me/9198006802">+91 9800 6802</a>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="background: #b882fc; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    console.log('Fallback modal created and added to DOM');
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Export for use in other scripts if needed
if (typeof window !== 'undefined') {
    window.showConsultationModal = showConsultationModal;
    window.createFallbackModal = createFallbackModal;
} 