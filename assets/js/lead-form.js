// Lead Form Component with Math Captcha and CRM Integration
// Based on contact form structure from contact.html

const LeadForm = {
    // Math captcha generation
    generateCaptcha: function() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const answer = num1 + num2;
        
        return {
            question: `${num1} + ${num2} = ?`,
            answer: answer
        };
    },

    // Form validation
    validateForm: function(formData) {
        const errors = [];
        
        // Name validation
        if (!formData.name || formData.name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            errors.push('Please enter a valid email address');
        }
        
        // Phone validation
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!formData.phone || !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
            errors.push('Please enter a valid phone number');
        }
        
        // Project description validation
        if (!formData.project_description || formData.project_description.trim().length < 10) {
            errors.push('Project description must be at least 10 characters long');
        }
        
        // Captcha validation
        if (!formData.captcha_answer || parseInt(formData.captcha_answer) !== this.currentCaptchaAnswer) {
            errors.push('Please solve the security check correctly');
        }
        
        return errors;
    },

    // CRM API integration
    sendToCRM: async function(formData) {
        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    project_description: formData.project_description,
                    service_page: window.location.pathname,
                    source: 'website_lead_form',
                    timestamp: new Date().toISOString(),
                    utm_source: this.getUTMParameter('utm_source'),
                    utm_medium: this.getUTMParameter('utm_medium'),
                    utm_campaign: this.getUTMParameter('utm_campaign')
                })
            });
            
            if (response.ok) {
                return { success: true, message: 'Thank you! We will contact you soon.' };
            } else {
                const errorData = await response.json();
                return { success: false, message: errorData.message || 'Something went wrong. Please try again.' };
            }
        } catch (error) {
            console.error('Lead form submission error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    },

    // Get UTM parameters
    getUTMParameter: function(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || '';
    },

    // Show success/error messages
    showMessage: function(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `lead-form-message ${type}`;
        messageDiv.textContent = message;
        
        const form = document.getElementById('leadForm');
        form.parentNode.insertBefore(messageDiv, form);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    },

    // Initialize lead form
    initLeadForm: function(config = {}) {
        const defaultConfig = {
            formId: 'leadForm',
            serviceName: 'Digital IBI Technologies Services',
            showCaptcha: true,
            crmEndpoint: '/api/leads',
            successMessage: 'Thank you! We will contact you soon.',
            errorMessage: 'Something went wrong. Please try again.'
        };
        
        this.config = { ...defaultConfig, ...config };
        this.currentCaptchaAnswer = null;
        
        // Generate initial captcha
        if (this.config.showCaptcha) {
            this.updateCaptcha();
        }
        
        // Add form event listener
        const form = document.getElementById(this.config.formId);
        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }
    },

    // Update captcha
    updateCaptcha: function() {
        const captcha = this.generateCaptcha();
        this.currentCaptchaAnswer = captcha.answer;
        
        const captchaQuestion = document.getElementById('captchaQuestion');
        if (captchaQuestion) {
            captchaQuestion.textContent = captcha.question;
        }
    },

    // Handle form submission
    handleFormSubmit: async function(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Convert form data to object
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            project_description: formData.get('project_description'),
            captcha_answer: formData.get('captcha_answer')
        };
        
        // Validate form
        const errors = this.validateForm(data);
        if (errors.length > 0) {
            this.showMessage(errors.join(', '), 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            // Send to CRM
            const result = await this.sendToCRM(data);
            
            if (result.success) {
                this.showMessage(result.message, 'success');
                form.reset();
                if (this.config.showCaptcha) {
                    this.updateCaptcha();
                }
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            this.showMessage(this.config.errorMessage, 'error');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    },

    // Create different form types
    createFormHTML: function(type = 'basic', serviceName = 'Our Services') {
        switch(type) {
            case 'basic':
                return this.createBasicFormHTML(serviceName);
            case 'service':
                return this.createServiceFormHTML(serviceName);
            case 'compact':
                return this.createCompactFormHTML(serviceName);
            case 'popup':
                return this.createPopupFormHTML(serviceName);
            default:
                return this.createBasicFormHTML(serviceName);
        }
    },

    // Basic form HTML
    createBasicFormHTML: function(serviceName = 'Our Services') {
        return `
            <div class="lead-form-container">
                <div class="section-title text-center mb-50">
                    <span>Get Free Consultation</span>
                    <h3 class="title">Ready to Start Your Project?</h3>
                    <p>Fill out the form below and we'll get back to you within 24 hours.</p>
                </div>
                
                <form id="leadForm" class="lead-form">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="input-box">
                                <input type="text" name="name" placeholder="Your Full Name" required>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="input-box">
                                <input type="email" name="email" placeholder="Email Address" required>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="input-box">
                                <input type="tel" name="phone" placeholder="Phone Number" required>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="input-box">
                                <input type="text" name="service" value="${serviceName}" readonly>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <div class="input-box">
                                <textarea name="project_description" placeholder="Tell us about your project requirements..." rows="5" required></textarea>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="input-box captcha-group">
                                <label>Security Check: <span id="captchaQuestion"></span></label>
                                <input type="number" name="captcha_answer" placeholder="Your Answer" required>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <div class="input-box">
                                <button type="submit" class="main-btn">Get Free Consultation</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;
    },

    // Service-specific form HTML
    createServiceFormHTML: function(serviceName = 'Our Services') {
        return `
            <div class="lead-form-container service-form">
                <div class="section-title text-center mb-50">
                    <span>Service Inquiry</span>
                    <h3 class="title">Get ${serviceName} Quote</h3>
                    <p>Tell us about your requirements and get a customized quote.</p>
                </div>
                
                <form id="leadForm" class="lead-form">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="input-box">
                                <input type="text" name="name" placeholder="Your Full Name" required>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="input-box">
                                <input type="email" name="email" placeholder="Email Address" required>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="input-box">
                                <input type="tel" name="phone" placeholder="Phone Number" required>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="input-box">
                                <select name="service" required>
                                    <option value="">Select Service</option>
                                    <option value="Custom Software Development">Custom Software Development</option>
                                    <option value="App Development">App Development</option>
                                    <option value="SEO Services">SEO Services</option>
                                    <option value="WhatsApp Marketing">WhatsApp Marketing</option>
                                    <option value="Digital Marketing">Digital Marketing</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <div class="input-box">
                                <textarea name="project_description" placeholder="Describe your project requirements, timeline, and budget..." rows="5" required></textarea>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="input-box captcha-group">
                                <label>Security Check: <span id="captchaQuestion"></span></label>
                                <input type="number" name="captcha_answer" placeholder="Your Answer" required>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <div class="input-box">
                                <button type="submit" class="main-btn">Get Quote</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;
    },

    // Compact form HTML
    createCompactFormHTML: function(serviceName = 'Our Services') {
        return `
            <div class="lead-form-container compact-form">
                <div class="section-title text-center mb-30">
                    <h3 class="title">Quick Contact</h3>
                    <p>Get in touch for a free consultation</p>
                </div>
                
                <form id="leadForm" class="lead-form">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="input-box">
                                <input type="text" name="name" placeholder="Name" required>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="input-box">
                                <input type="email" name="email" placeholder="Email" required>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <div class="input-box">
                                <textarea name="project_description" placeholder="Brief description of your project..." rows="3" required></textarea>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="input-box captcha-group">
                                <label>Security: <span id="captchaQuestion"></span></label>
                                <input type="number" name="captcha_answer" placeholder="Answer" required>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="input-box">
                                <button type="submit" class="main-btn">Send Message</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;
    },

    // Popup form HTML
    createPopupFormHTML: function(serviceName = 'Our Services') {
        return `
            <div class="lead-form-container popup-form">
                <div class="section-title text-center mb-30">
                    <h3 class="title">Get Started Today</h3>
                    <p>Limited time offer - Free consultation</p>
                </div>
                
                <form id="leadForm" class="lead-form">
                    <div class="row">
                        <div class="col-lg-12">
                            <div class="input-box">
                                <input type="text" name="name" placeholder="Your Name" required>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <div class="input-box">
                                <input type="email" name="email" placeholder="Email Address" required>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <div class="input-box">
                                <input type="tel" name="phone" placeholder="Phone Number" required>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <div class="input-box">
                                <textarea name="project_description" placeholder="Tell us about your project..." rows="3" required></textarea>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <div class="input-box captcha-group">
                                <label>Security: <span id="captchaQuestion"></span></label>
                                <input type="number" name="captcha_answer" placeholder="Answer" required>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <div class="input-box">
                                <button type="submit" class="main-btn">Get Free Quote</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;
    },

    // Create lead form HTML (backward compatibility)
    createLeadFormHTML: function(serviceName = 'Our Services') {
        return this.createBasicFormHTML(serviceName);
    },

    // Demo functionality
    initDemo: function() {
        const demoButtons = document.querySelectorAll('.demo-nav button');
        const container = document.getElementById('leadFormContainer');
        
        demoButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                demoButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get form type
                const formType = this.getAttribute('data-form');
                
                // Update form
                container.innerHTML = LeadForm.createFormHTML(formType, 'Demo Service');
                
                // Reinitialize form
                LeadForm.initLeadForm({
                    formId: 'leadForm',
                    serviceName: 'Demo Service',
                    showCaptcha: true,
                    crmEndpoint: '/api/leads'
                });
            });
        });
    }
};

// Export for use in other scripts
window.LeadForm = LeadForm; 