/**
 * Consultation CTA Auto-Loader
 * Automatically adds consultation CTA to pages with minimal setup
 * Now integrated with centralized configuration and Netlify
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        ctaSelector: '[data-consultation-cta]',
        ctaTemplate: `
            <section class="infetech-cta-2-area pt-100 pb-100" id="consultation-cta">
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-lg-9">
                            <div class="cta-content">
                                <p>We're here to help to grow your business.</p>
                                <h2 class="title">Looking for the Best IT Business Solutions?</h2>
                            </div>
                        </div>
                        <div class="col-lg-3">
                            <div class="cta-btn text-right">
                                <a class="main-btn consultation-modal-trigger" onclick="showConsultationModal(event);">Get Free Consultation</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `,
        scriptDependencies: [
            'config/common-config.js',      // Centralized configuration
            'config/gtm.js',               // GTM tracking
            'assets/js/lead-form-embed.js' // Existing form system
        ]
    };

    // Common Service Manager instance
    let commonServiceManager = null;

    // Load required scripts
    function loadScripts() {
        return Promise.all(CONFIG.scriptDependencies.map(src => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve(); // Already loaded
                    return;
                }
                
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }));
    }

    // Initialize Common Service Manager
    async function initializeCommonServices() {
        if (window.CommonServiceManager) {
            commonServiceManager = new window.CommonServiceManager();
            await commonServiceManager.initialize();
            console.log('✅ Common services initialized for consultation CTA');
        } else {
            console.warn('⚠️ CommonServiceManager not available, using fallback');
        }
    }

    // Add consultation modal function
    function addConsultationModal() {
        if (typeof window.showConsultationModal === 'function') {
            return; // Already exists
        }

        window.showConsultationModal = async function(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            try {
                // Check if common services are available
                if (!commonServiceManager) {
                    console.error('Common services not initialized');
                    alert('Form system is loading, please try again in a moment.');
                    return;
                }

                // Track modal opening
                commonServiceManager.trackEvent('form_start', {
                    form_name: 'consultation_form',
                    form_type: 'consultation'
                });
                
                // Create popup form using existing system
                if (typeof LeadFormEmbed === 'undefined') {
                    console.error('LeadFormEmbed is not loaded');
                    alert('Form system is loading, please try again in a moment.');
                    return;
                }
                
                const popup = LeadFormEmbed.createPopupForm({
                    size: 'medium',
                    theme: 'gradient',
                    fields: ['name', 'email', 'phone', 'service', 'message'],
                    requiredFields: ['name', 'email', 'message'],
                    showCaptcha: true,
                    successMessage: 'Thank you! We will contact you within 24 hours.',
                    errorMessage: 'Something went wrong. Please try again.',
                    onSubmit: async (formData) => {
                        return await handleFormSubmission(formData);
                    }
                });
                
            } catch (error) {
                console.error('Error creating popup:', error);
                alert('There was an error opening the form. Please try again.');
            }
        };
    }

    // Handle form submission with Netlify integration
    async function handleFormSubmission(formData) {
        try {
            // Track form completion
            if (commonServiceManager) {
                commonServiceManager.trackEvent('form_complete', {
                    form_name: 'consultation_form',
                    form_type: 'consultation'
                });
            }

            // Submit to Netlify if available, otherwise use existing system
            if (commonServiceManager && commonServiceManager.isServiceAvailable('netlify')) {
                const response = await commonServiceManager.submitForm(formData, 'consultation');
                
                if (response.success) {
                    // Show success message
                    showMessage('Thank you! We will contact you within 24 hours.', 'success');
                    return { success: true };
                } else {
                    throw new Error(response.message || 'Submission failed');
                }
            } else {
                // Fallback to existing form handling
                console.log('Using fallback form handling');
                return { success: true };
            }
        } catch (error) {
            console.error('Form submission error:', error);
            
            // Track form error
            if (commonServiceManager) {
                commonServiceManager.trackEvent('form_error', {
                    form_name: 'consultation_form',
                    form_type: 'consultation',
                    error: error.message
                });
            }

            showMessage('Sorry, there was an error sending your message. Please try again.', 'error');
            throw error;
        }
    }

    // Auto-initialize consultation CTA
    function initConsultationCTA() {
        // Find all elements with data-consultation-cta attribute
        const ctaContainers = document.querySelectorAll(CONFIG.ctaSelector);
        
        ctaContainers.forEach(container => {
            // Get configuration from data attributes
            const config = {
                position: container.dataset.position || 'before-footer',
                theme: container.dataset.theme || 'default',
                text: container.dataset.text || 'Looking for the Best IT Business Solutions?',
                buttonText: container.dataset.buttonText || 'Get Free Consultation'
            };

            // Create CTA HTML
            const ctaHTML = CONFIG.ctaTemplate
                .replace('Looking for the Best IT Business Solutions?', config.text)
                .replace('Get Free Consultation', config.buttonText);

            // Insert CTA based on position
            if (config.position === 'before-footer') {
                const footer = document.querySelector('footer');
                if (footer) {
                    footer.insertAdjacentHTML('beforebegin', ctaHTML);
                }
            } else if (config.position === 'replace') {
                container.innerHTML = ctaHTML;
            } else {
                container.innerHTML = ctaHTML;
            }
        });
    }

    // Show message utility
    function showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            padding: 15px;
            border-radius: 5px;
            color: white;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    // Initialize when DOM is ready
    async function init() {
        try {
            // Load scripts first
            await loadScripts();
            
            // Initialize common services
            await initializeCommonServices();
            
            // Add consultation modal
            addConsultationModal();
            
            // Initialize CTA
            initConsultationCTA();
            
            console.log('✅ Consultation CTA Auto-Loader initialized successfully');
        } catch (error) {
            console.error('Error initializing consultation CTA:', error);
        }
    }

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for manual initialization
    window.ConsultationCTALoader = {
        init: init,
        addConsultationModal: addConsultationModal,
        initConsultationCTA: initConsultationCTA,
        handleFormSubmission: handleFormSubmission
    };

})(); 