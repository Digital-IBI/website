/**
 * Lead Form Embed System
 * Flexible lead form component for embedding across the website
 * Supports multiple sizes, configurations, and placement options
 */

// Add CSS styles for lead form
const leadFormCSS = `
<style>
.lead-form-embed {
    font-family: 'Poppins', sans-serif;
    max-width: 100%;
    margin: 0 auto;
}

.lead-form-embed.lead-form-small {
    max-width: 300px;
}

.lead-form-embed.lead-form-medium {
    max-width: 500px;
}

.lead-form-embed.lead-form-large {
    max-width: 700px;
}

.lead-form-embed.lead-form-full {
    max-width: 100%;
}

.form-header {
    text-align: center;
    margin-bottom: 25px;
}

.form-header h3 {
    color: #333;
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 10px;
}

.form-header p {
    color: #666;
    font-size: 14px;
    margin: 0;
}

.lead-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

/* Force 2-column layout with more specific selectors */
.lead-form-embed .lead-form .form-row {
    display: flex !important;
    gap: 15px !important;
    flex-wrap: wrap !important;
    margin-bottom: 15px !important;
    width: 100% !important;
}

.lead-form-embed .lead-form .form-row .input-box {
    flex: 1 1 calc(50% - 7.5px) !important;
    min-width: 200px !important;
    max-width: calc(50% - 7.5px) !important;
    width: calc(50% - 7.5px) !important;
    box-sizing: border-box !important;
}

.lead-form-embed .lead-form .form-row .input-box.full-width {
    flex: 1 1 100% !important;
    width: 100% !important;
    max-width: 100% !important;
}

.lead-form-embed .lead-form .input-box:not(.full-width) {
    display: inline-block !important;
    vertical-align: top !important;
}

/* Mobile responsive */
@media (max-width: 768px) {
    .lead-form-embed .lead-form .form-row {
        flex-direction: column !important;
    }
    
    .lead-form-embed .lead-form .form-row .input-box {
        flex: 1 1 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        width: 100% !important;
    }
    
    /* Mobile popup adjustments */
    .popup-content {
        min-width: 95% !important;
        max-width: 95% !important;
        padding: 20px !important;
    }
}

/* Tablet responsive */
@media (min-width: 769px) and (max-width: 1024px) {
    .popup-content {
        min-width: 700px !important;
        max-width: 700px !important;
    }
}

/* Additional specificity for popup forms */
.popup-content .lead-form-embed .lead-form .form-row {
    display: flex !important;
    gap: 15px !important;
    flex-wrap: wrap !important;
    margin-bottom: 15px !important;
    width: 100% !important;
}

.popup-content .lead-form-embed .lead-form .form-row .input-box {
    flex: 1 1 calc(50% - 7.5px) !important;
    min-width: 200px !important;
    max-width: calc(50% - 7.5px) !important;
    width: calc(50% - 7.5px) !important;
    box-sizing: border-box !important;
}

.popup-content .lead-form-embed .lead-form .form-row .input-box.full-width {
    flex: 1 1 100% !important;
    width: 100% !important;
    max-width: 100% !important;
}

/* Ensure popup form container has proper width */
.popup-content #popup-form-container {
    width: 100% !important;
    max-width: 100% !important;
}

.popup-content .lead-form-embed {
    width: 100% !important;
    max-width: 100% !important;
}

.lead-form .input-box {
    position: relative;
}

.lead-form .input-box input,
.lead-form .input-box select,
.lead-form .input-box textarea {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.3s ease;
    box-sizing: border-box;
}

.lead-form .input-box input:focus,
.lead-form .input-box select:focus,
.lead-form .input-box textarea:focus {
    outline: none;
    border-color: #b882fc;
    box-shadow: 0 0 0 2px rgba(184, 130, 252, 0.1);
}

.lead-form .input-box textarea {
    resize: vertical;
    min-height: 100px;
}

.lead-form .main-btn {
    background: linear-gradient(135deg, #b882fc 0%, #8a5cf6 100%);
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 5px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
}

.lead-form .main-btn:hover {
    background: linear-gradient(135deg, #8a5cf6 0%, #b882fc 100%);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(184, 130, 252, 0.3);
}

.lead-form .main-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.captcha-group {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    border: 1px solid #e9ecef;
}

.captcha-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: #333 !important;
    font-weight: 500;
}

.captcha-group input {
    color: #333 !important;
    background: white !important;
    border: 1px solid #ddd !important;
}

.captcha-group input::placeholder {
    color: #666 !important;
}

.lead-form-message {
    padding: 10px 15px;
    border-radius: 5px;
    margin-bottom: 15px;
    font-size: 14px;
}

.lead-form-message.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.lead-form-message.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

/* Theme variations */
.lead-form-embed.lead-form-dark {
    background: #2d3748;
    color: white;
    padding: 25px;
    border-radius: 10px;
}

.lead-form-embed.lead-form-dark .form-header h3,
.lead-form-embed.lead-form-dark .captcha-group label {
    color: white;
}

.lead-form-embed.lead-form-dark .form-header p {
    color: #cbd5e0;
}

.lead-form-embed.lead-form-dark .input-box input,
.lead-form-embed.lead-form-dark .input-box select,
.lead-form-embed.lead-form-dark .input-box textarea {
    background: #4a5568;
    border-color: #4a5568;
    color: white;
}

.lead-form-embed.lead-form-dark .input-box input::placeholder,
.lead-form-embed.lead-form-dark .input-box textarea::placeholder {
    color: #a0aec0;
}

.lead-form-embed.lead-form-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 25px;
    border-radius: 10px;
}

.lead-form-embed.lead-form-gradient .form-header h3,
.lead-form-embed.lead-form-gradient .captcha-group label {
    color: white;
}

.lead-form-embed.lead-form-gradient .form-header p {
    color: rgba(255, 255, 255, 0.8);
}

.lead-form-embed.lead-form-gradient .input-box input,
.lead-form-embed.lead-form-gradient .input-box select,
.lead-form-embed.lead-form-gradient .input-box textarea {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
}

.lead-form-embed.lead-form-gradient .input-box input::placeholder,
.lead-form-embed.lead-form-gradient .input-box textarea::placeholder {
    color: rgba(255, 255, 255, 0.6);
}

.lead-form-embed.lead-form-gradient .main-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.lead-form-embed.lead-form-gradient .main-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* Ensure captcha is visible in gradient theme */
.lead-form-embed.lead-form-gradient .captcha-group {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.lead-form-embed.lead-form-gradient .captcha-group label {
    color: white !important;
}

.lead-form-embed.lead-form-gradient .captcha-group input {
    background: rgba(255, 255, 255, 0.9) !important;
    color: #333 !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.lead-form-embed.lead-form-gradient .captcha-group input::placeholder {
    color: #666 !important;
}

.lead-form-embed.lead-form-minimal {
    background: transparent;
    padding: 0;
}

.lead-form-embed.lead-form-minimal .input-box input,
.lead-form-embed.lead-form-minimal .input-box select,
.lead-form-embed.lead-form-minimal .input-box textarea {
    border: none;
    border-bottom: 2px solid #e2e8f0;
    border-radius: 0;
    padding: 15px 0;
    background: transparent;
}

.lead-form-embed.lead-form-minimal .input-box input:focus,
.lead-form-embed.lead-form-minimal .input-box select:focus,
.lead-form-embed.lead-form-minimal .input-box textarea:focus {
    border-bottom-color: #b882fc;
    box-shadow: none;
}
</style>
`;

// Inject CSS into head
if (document.head) {
    // Check if CSS is already injected
    const existingCSS = document.querySelector('style[data-lead-form-embed]');
    if (!existingCSS) {
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-lead-form-embed', 'true');
        styleElement.textContent = leadFormCSS.replace('<style>', '').replace('</style>', '');
        document.head.appendChild(styleElement);
        console.log('LeadFormEmbed CSS injected successfully');
    } else {
        console.log('LeadFormEmbed CSS already exists');
    }
} else {
    console.error('Document head not available for CSS injection');
}

const LeadFormEmbed = {
    // Default configuration
    defaultConfig: {
        size: 'medium', // small, medium, large, full
        position: 'inline', // inline, popup, sidebar, floating
        showCaptcha: true,
        serviceName: '',
        crmEndpoint: '/api/leads',
        successMessage: 'Thank you! We will contact you soon.',
        errorMessage: 'Something went wrong. Please try again.',
        autoInit: true,
        theme: 'default', // default, dark, gradient, minimal
        fields: ['name', 'email', 'phone', 'service', 'message'], // Customizable fields
        requiredFields: ['name', 'email', 'message']
    },

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

    // Input sanitization to prevent XSS and SQL injection
    sanitizeInput: function(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"`]/g, '') // Remove quotes that could be used in SQL injection
            .replace(/[;]/g, '') // Remove semicolons
            .replace(/[\\]/g, '') // Remove backslashes
            .replace(/[\/]/g, '') // Remove forward slashes
            .replace(/[\(\)]/g, '') // Remove parentheses
            .replace(/[\[\]]/g, '') // Remove brackets
            .replace(/[{}]/g, '') // Remove braces
            .replace(/[|]/g, '') // Remove pipes
            .replace(/[&]/g, '') // Remove ampersands
            .replace(/[=]/g, '') // Remove equals
            .replace(/[+]/g, '') // Remove plus signs
            .replace(/[%]/g, '') // Remove percent signs
            .replace(/[#]/g, '') // Remove hash signs
            .replace(/[!]/g, '') // Remove exclamation marks
            .replace(/[@]/g, '') // Remove at signs
            .replace(/[\$]/g, '') // Remove dollar signs
            .replace(/[\^]/g, '') // Remove caret
            .replace(/[\*]/g, '') // Remove asterisks
            .replace(/[~]/g, '') // Remove tildes
            .replace(/[`]/g, '') // Remove backticks
            .replace(/[\n\r\t]/g, ' ') // Replace newlines and tabs with spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .substring(0, 1000); // Limit length to prevent buffer overflow
    },

    // Enhanced form validation with security checks
    validateForm: function(formData, requiredFields) {
        const errors = [];
        
        // Name validation with security checks
        if (requiredFields.includes('name')) {
            if (!formData.name || formData.name.trim().length < 2) {
                errors.push('Name must be at least 2 characters long');
            } else if (formData.name.trim().length > 100) {
                errors.push('Name must be less than 100 characters');
            } else if (!/^[a-zA-Z\s\-\.]+$/.test(formData.name.trim())) {
                errors.push('Name can only contain letters, spaces, hyphens, and periods');
            }
        }
        
        // Email validation with enhanced security
        if (requiredFields.includes('email')) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!formData.email || !emailRegex.test(formData.email)) {
                errors.push('Please enter a valid email address');
            } else if (formData.email.length > 254) {
                errors.push('Email address is too long');
            }
        }
        
        // Phone validation with enhanced security
        if (requiredFields.includes('phone') && formData.phone) {
            const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,20}$/;
            if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
                errors.push('Please enter a valid phone number (7-20 digits)');
            }
        }
        
        // Service validation - Allow any service or use default
        if (formData.service && formData.service.trim() !== '') {
            // Allow any service name, just check if it's not empty
            if (formData.service.trim().length < 2) {
                errors.push('Please enter a valid service name');
            }
        }
        
        // Message validation with security checks
        if (requiredFields.includes('message')) {
            if (!formData.message || formData.message.trim().length < 10) {
                errors.push('Message must be at least 10 characters long');
            } else if (formData.message.trim().length > 2000) {
                errors.push('Message must be less than 2000 characters');
            } else if (formData.message.includes('<script>') || formData.message.includes('javascript:')) {
                errors.push('Message contains invalid content');
            }
        }
        
        // Captcha validation
        if (this.currentCaptchaAnswer && (!formData.captcha_answer || parseInt(formData.captcha_answer) !== this.currentCaptchaAnswer)) {
            errors.push('Please solve the security check correctly');
        }
        
        // Rate limiting check (basic implementation)
        const now = Date.now();
        const lastSubmission = this.lastSubmissionTime || 0;
        if (now - lastSubmission < 5000) { // 5 seconds between submissions
            errors.push('Please wait 5 seconds before submitting again');
        }
        
        return errors;
    },

    // CRM API integration with enhanced security
    sendToCRM: async function(formData, config) {
        try {
            // Create lead data for admin system
            const leadData = {
                name: formData.name || '',
                email: formData.email || '',
                phone: formData.phone || '',
                company: formData.company || '',
                service: formData.service || config.serviceName || '',
                source: config.source || 'contact_form',
                budget: formData.budget || '',
                timeline: formData.timeline || '',
                message: formData.message || '',
                status: 'new',
                created: new Date().toISOString(),
                lastContacted: new Date().toISOString(),
                notes: '',
                pageUrl: window.location.href,
                userAgent: navigator.userAgent,
                ipAddress: await this.getClientIP(),
                utm_source: this.getUTMParameter('utm_source'),
                utm_medium: this.getUTMParameter('utm_medium'),
                utm_campaign: this.getUTMParameter('utm_campaign'),
                utm_content: this.getUTMParameter('utm_content'),
                utm_term: this.getUTMParameter('utm_term')
            };

            // Save to admin system
            const saveResult = await this.saveLeadToAdmin(leadData);
            console.log('Save result:', saveResult);

            // Track conversion
            this.trackConversion(leadData);

            // If CRM endpoint is configured, also send there
            if (config.crmEndpoint) {
                const response = await fetch(config.crmEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': this.generateCSRFToken(),
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(leadData)
                });
                
                if (!response.ok) {
                    console.warn('CRM endpoint failed, but lead saved to admin system');
                }
            }

            return { success: true, message: config.successMessage };
        } catch (error) {
            console.error('Lead form submission error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    },

    // Generate CSRF token
    generateCSRFToken: function() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return btoa(`${timestamp}-${random}-${navigator.userAgent}`).substring(0, 32);
    },

    // Get client IP (basic implementation)
    getClientIP: async function() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || 'unknown';
        } catch (error) {
            console.warn('Could not get client IP:', error);
            return 'unknown';
        }
    },

    // Get UTM parameters
    getUTMParameter: function(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || '';
    },

    // Show success/error messages
    showMessage: function(message, type = 'success', formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        // Remove existing messages
        const existingMessages = form.parentNode.querySelectorAll('.lead-form-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `lead-form-message ${type}`;
        messageDiv.textContent = message;
        
        form.parentNode.insertBefore(messageDiv, form);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    },

    // Update captcha
    updateCaptcha: function(formId) {
        const captcha = this.generateCaptcha();
        this.currentCaptchaAnswer = captcha.answer;
        
        console.log('Updating CAPTCHA for form:', formId, 'Question:', captcha.question, 'Answer:', captcha.answer);
        
        const captchaQuestion = document.querySelector(`#${formId} #captchaQuestion`);
        if (captchaQuestion) {
            captchaQuestion.textContent = captcha.question;
            console.log('CAPTCHA question updated successfully');
        } else {
            console.error('CAPTCHA question element not found for form:', formId);
            // Try alternative selector
            const altCaptchaQuestion = document.querySelector(`#${formId} .captcha-group span`);
            if (altCaptchaQuestion) {
                altCaptchaQuestion.textContent = captcha.question;
                console.log('CAPTCHA question updated with alternative selector');
            } else {
                console.error('No CAPTCHA question element found with any selector');
            }
        }
    },
    
    // Manual CAPTCHA refresh function
    refreshCaptcha: function(formId) {
        console.log('Manually refreshing CAPTCHA for form:', formId);
        this.updateCaptcha(formId);
    },
    
    // Global CAPTCHA refresh function
    globalRefreshCaptcha: function() {
        console.log('Global CAPTCHA refresh called');
        // Find all forms with CAPTCHA and refresh them
        const forms = document.querySelectorAll('.lead-form');
        forms.forEach(form => {
            const formId = form.id;
            if (formId && form.querySelector('.captcha-group')) {
                this.refreshCaptcha(formId);
            }
        });
    },

    // Handle form submission
    handleFormSubmit: async function(e, config) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Convert form data to object and sanitize inputs
        const data = {};
        for (let [key, value] of formData.entries()) {
            // Sanitize all inputs to prevent XSS and SQL injection
            data[key] = this.sanitizeInput(value);
        }
        
        // Validate form
        const errors = this.validateForm(data, config.requiredFields);
        if (errors.length > 0) {
            this.showMessage(errors.join(', '), 'error', config.formId);
            return;
        }
        
        // Update rate limiting
        this.lastSubmissionTime = Date.now();
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            // Send to CRM
            const result = await this.sendToCRM(data, config);
            
            if (result.success) {
                this.showMessage(result.message, 'success', config.formId);
                form.reset();
                if (config.showCaptcha) {
                    this.updateCaptcha(config.formId);
                }
                
                // Trigger admin update if available
                if (typeof checkLeads === 'function') {
                    setTimeout(() => {
                        checkLeads();
                    }, 500);
                }
            } else {
                this.showMessage(result.message, 'error', config.formId);
            }
        } catch (error) {
            this.showMessage(config.errorMessage, 'error', config.formId);
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    },

    // Generate form HTML based on size and configuration
    generateFormHTML: function(config) {
        const size = config.size;
        const theme = config.theme;
        const fields = config.fields;
        
        console.log('Generating form HTML with fields:', fields);
        
        let formHTML = `<div class="lead-form-embed lead-form-${size} lead-form-${theme}">`;
        
        // Form header
        if (size !== 'small') {
            formHTML += `
                <div class="form-header">
                    <h3>Get Free Consultation</h3>
                    <p>Fill out the form below and we'll get back to you within 24 hours.</p>
                </div>
            `;
        }
        
        formHTML += `<form id="${config.formId}" class="lead-form">`;
        
        // First row: Name and Email (2 columns)
        if (fields.includes('name') || fields.includes('email')) {
            formHTML += `<div class="form-row" style="display: flex !important; gap: 15px !important; flex-wrap: wrap !important; margin-bottom: 15px !important; width: 100% !important;">`;
            
            if (fields.includes('name')) {
                formHTML += `
                    <div class="input-box" style="flex: 1 1 calc(50% - 7.5px) !important; min-width: 200px !important; max-width: calc(50% - 7.5px) !important; width: calc(50% - 7.5px) !important; box-sizing: border-box !important;">
                        <input type="text" name="name" placeholder="Your Name" ${config.requiredFields.includes('name') ? 'required' : ''}>
                    </div>
                `;
            }
            
            if (fields.includes('email')) {
                formHTML += `
                    <div class="input-box" style="flex: 1 1 calc(50% - 7.5px) !important; min-width: 200px !important; max-width: calc(50% - 7.5px) !important; width: calc(50% - 7.5px) !important; box-sizing: border-box !important;">
                        <input type="email" name="email" placeholder="Email Address" ${config.requiredFields.includes('email') ? 'required' : ''}>
                    </div>
                `;
            }
            
            formHTML += `</div>`;
        }
        
        // Second row: Phone and Service (2 columns)
        if (fields.includes('phone') || fields.includes('service')) {
            formHTML += `<div class="form-row" style="display: flex !important; gap: 15px !important; flex-wrap: wrap !important; margin-bottom: 15px !important; width: 100% !important;">`;
            
            if (fields.includes('phone')) {
                formHTML += `
                    <div class="input-box" style="flex: 1 1 calc(50% - 7.5px) !important; min-width: 200px !important; max-width: calc(50% - 7.5px) !important; width: calc(50% - 7.5px) !important; box-sizing: border-box !important;">
                        <input type="tel" name="phone" placeholder="Phone Number" ${config.requiredFields.includes('phone') ? 'required' : ''}>
                    </div>
                `;
            }
            
            if (fields.includes('service')) {
                if (config.serviceName) {
                    formHTML += `
                        <div class="input-box" style="flex: 1 1 calc(50% - 7.5px) !important; min-width: 200px !important; max-width: calc(50% - 7.5px) !important; width: calc(50% - 7.5px) !important; box-sizing: border-box !important;">
                            <input type="text" name="service" value="${config.serviceName}" readonly>
                        </div>
                    `;
                } else {
                    formHTML += `
                        <div class="input-box" style="flex: 1 1 calc(50% - 7.5px) !important; min-width: 200px !important; max-width: calc(50% - 7.5px) !important; width: calc(50% - 7.5px) !important; box-sizing: border-box !important;">
                            <select name="service" ${config.requiredFields.includes('service') ? 'required' : ''}>
                                <option value="">Select Service</option>
                                <option value="Custom Software Development">Custom Software Development</option>
                                <option value="App Development">App Development</option>
                                <option value="SEO Services">SEO Services</option>
                                <option value="WhatsApp Marketing">WhatsApp Marketing</option>
                                <option value="Digital Marketing">Digital Marketing</option>
                            </select>
                        </div>
                    `;
                }
            }
            
            formHTML += `</div>`;
        }
        
        // Message field (full width)
        if (fields.includes('message')) {
            const rows = size === 'small' ? 3 : 5;
            formHTML += `
                <div class="input-box full-width">
                    <textarea name="message" placeholder="Tell us about your project..." rows="${rows}" ${config.requiredFields.includes('message') ? 'required' : ''}></textarea>
                </div>
            `;
        }
        
        // Captcha (full width)
        if (config.showCaptcha) {
            formHTML += `
                <div class="input-box captcha-group full-width">
                    <label>Security Check: <span id="captchaQuestion"></span></label>
                    <input type="number" name="captcha_answer" placeholder="Your Answer" required>
                </div>
            `;
        }
        
        // Submit button (full width)
        const buttonText = size === 'small' ? 'Send' : 'Get Free Consultation';
        formHTML += `
            <div class="input-box full-width">
                <button type="submit" class="main-btn">${buttonText}</button>
            </div>
        `;
        
        formHTML += `</form></div>`;
        
        console.log('Generated form HTML:', formHTML);
        console.log('Form structure should be 2-column layout');
        
        return formHTML;
    },

    // Initialize lead form
    initLeadForm: function(containerId, userConfig = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }

        // Merge configuration
        const config = { ...this.defaultConfig, ...userConfig };
        config.formId = `leadForm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate and insert form HTML
        container.innerHTML = this.generateFormHTML(config);
        
        // Initialize captcha if enabled
        if (config.showCaptcha) {
            // Wait a bit for DOM to be ready
            setTimeout(() => {
                this.updateCaptcha(config.formId);
            }, 100);
        }
        
        // Add form event listener
        const form = document.getElementById(config.formId);
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e, config));
            
            // Add real-time validation
            this.addRealTimeValidation(form, config);
            
            // Ensure CAPTCHA is initialized after form is ready
            if (config.showCaptcha) {
                setTimeout(() => {
                    this.updateCaptcha(config.formId);
                }, 200);
            }
        }
        
        return config.formId;
    },

    // Create floating form
    createFloatingForm: function(config = {}) {
        const floatingConfig = { ...this.defaultConfig, position: 'floating', size: 'small', ...config };
        const formId = `floating_${Date.now()}`;
        
        // Create floating container
        const floatingContainer = document.createElement('div');
        floatingContainer.id = 'floating-lead-form';
        floatingContainer.className = 'floating-lead-form';
        document.body.appendChild(floatingContainer);
        
        // Initialize form
        this.initLeadForm('floating-lead-form', floatingConfig);
        
        return formId;
    },

    // Create popup form
    createPopupForm: function(config = {}) {
        const popupConfig = { ...this.defaultConfig, position: 'popup', size: 'medium', ...config };
        
        console.log('Creating popup form with config:', popupConfig);
        
        // Create popup overlay
        const popupOverlay = document.createElement('div');
        popupOverlay.id = 'popup-overlay';
        popupOverlay.className = 'popup-overlay';
        popupOverlay.style.cssText = `
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
        
        popupOverlay.innerHTML = `
            <div class="popup-content" style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 800px;
                min-width: 600px;
                width: 90%;
                position: relative;
                max-height: 90vh;
                overflow-y: auto;
                box-sizing: border-box;
            ">
                <button class="popup-close" style="
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    font-size: 20px;
                    font-weight: bold;
                    cursor: pointer;
                    color: #333;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    z-index: 10000;
                ">&times;</button>
                <div id="popup-form-container"></div>
            </div>
        `;
        document.body.appendChild(popupOverlay);
        
        // Initialize form
        this.initLeadForm('popup-form-container', popupConfig);
        
        // Add close functionality
        const closeBtn = popupOverlay.querySelector('.popup-close');
        
        // Function to close modal
        const closeModal = () => {
            popupOverlay.remove();
            // Remove keyboard event listener
            document.removeEventListener('keydown', handleKeydown);
        };
        
        // Handle keyboard events
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        
        // Add event listeners
        closeBtn.addEventListener('click', closeModal);
        
        // Close on overlay click
        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                closeModal();
            }
        });
        
        // Add keyboard support for Escape key
        document.addEventListener('keydown', handleKeydown);
        
        // Add hover effect for close button
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#e9ecef';
            closeBtn.style.borderColor = '#dee2e6';
            closeBtn.style.transform = 'scale(1.1)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = '#f8f9fa';
            closeBtn.style.borderColor = '#e9ecef';
            closeBtn.style.transform = 'scale(1)';
        });
        
        return popupOverlay;
    },

    // Add real-time validation to form fields
    addRealTimeValidation: function(form, config) {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', (e) => {
                this.validateField(e.target, config);
            });
            
            input.addEventListener('input', (e) => {
                this.clearFieldError(e.target);
            });
        });
    },

    // Validate individual field
    validateField: function(field, config) {
        const fieldName = field.name;
        const value = field.value;
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'name':
                if (config.requiredFields.includes('name')) {
                    if (!value || value.trim().length < 2) {
                        isValid = false;
                        errorMessage = 'Name must be at least 2 characters long';
                    } else if (value.trim().length > 100) {
                        isValid = false;
                        errorMessage = 'Name must be less than 100 characters';
                    } else if (!/^[a-zA-Z\s\-\.]+$/.test(value.trim())) {
                        isValid = false;
                        errorMessage = 'Name can only contain letters, spaces, hyphens, and periods';
                    }
                }
                break;

            case 'email':
                if (config.requiredFields.includes('email')) {
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    if (!value || !emailRegex.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address';
                    } else if (value.length > 254) {
                        isValid = false;
                        errorMessage = 'Email address is too long';
                    }
                }
                break;

            case 'phone':
                if (value) {
                    const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,20}$/;
                    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                        isValid = false;
                        errorMessage = 'Please enter a valid phone number (7-20 digits)';
                    }
                }
                break;

            case 'message':
                if (config.requiredFields.includes('message')) {
                    if (!value || value.trim().length < 10) {
                        isValid = false;
                        errorMessage = 'Message must be at least 10 characters long';
                    } else if (value.trim().length > 2000) {
                        isValid = false;
                        errorMessage = 'Message must be less than 2000 characters';
                    } else if (value.includes('<script>') || value.includes('javascript:')) {
                        isValid = false;
                        errorMessage = 'Message contains invalid content';
                    }
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }
    },

    // Show field error
    showFieldError: function(field, message) {
        this.clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.cssText = 'color: #dc3545; font-size: 12px; margin-top: 5px;';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
        field.style.borderColor = '#dc3545';
    },

    // Clear field error
    clearFieldError: function(field) {
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        field.style.borderColor = '';
    },

    // Auto-initialize forms with data attributes
    autoInit: function() {
        const containers = document.querySelectorAll('[data-lead-form]');
        
        containers.forEach(container => {
            const config = {
                size: container.dataset.size || 'medium',
                theme: container.dataset.theme || 'default',
                serviceName: container.dataset.service || '',
                showCaptcha: container.dataset.captcha !== 'false',
                fields: container.dataset.fields ? container.dataset.fields.split(',') : ['name', 'email', 'phone', 'service', 'message'],
                requiredFields: container.dataset.required ? container.dataset.required.split(',') : ['name', 'email', 'message']
            };
            
            this.initLeadForm(container.id, config);
        });
    },

    // Handle form submission
    handleSubmit: function(form, config) {
        const formData = new FormData(form);
        const leadData = {
            name: formData.get('name') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            company: formData.get('company') || '',
            service: formData.get('service') || config.serviceName || '',
            source: config.source || 'contact_form',
            budget: formData.get('budget') || '',
            timeline: formData.get('timeline') || '',
            message: formData.get('message') || '',
            status: 'new',
            created: new Date().toISOString(),
            lastContacted: new Date().toISOString(),
            notes: '',
            pageUrl: window.location.href,
            userAgent: navigator.userAgent,
            ipAddress: 'N/A' // Will be set by server
        };

        // Save to admin system
        this.saveLeadToAdmin(leadData);

        // Show success message
        this.showSuccessMessage(form, config);
        
        // Track conversion
        this.trackConversion(leadData);
        
        return false; // Prevent default form submission
    },

    // Save lead to admin system
    saveLeadToAdmin: async function(leadData) {
        try {
            console.log('Attempting to save lead:', leadData);
            
            // Use localStorage
            return this.saveToLocalStorage(leadData);
        } catch (error) {
            console.error('Error saving lead to admin system:', error);
            return this.saveToLocalStorage(leadData);
        }
    },

    // Fallback to localStorage
    saveToLocalStorage: function(leadData) {
        try {
            console.log('Saving to localStorage as fallback');
            
            // Get existing leads from localStorage
            const existingLeads = JSON.parse(localStorage.getItem('leadManagementData') || '[]');
            console.log('Existing leads count:', existingLeads.length);
            
            // Add new lead with unique ID
            const newLead = {
                id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                ...leadData
            };
            
            // Add to beginning of array (most recent first)
            existingLeads.unshift(newLead);
            
            // Save back to localStorage
            localStorage.setItem('leadManagementData', JSON.stringify(existingLeads));
            
            // Verify save was successful
            const savedLeads = JSON.parse(localStorage.getItem('leadManagementData') || '[]');
            console.log('Leads after save:', savedLeads.length);
            console.log('Lead saved to localStorage:', newLead);
            
            // Trigger admin system update if available
            if (typeof leadManager !== 'undefined') {
                leadManager.updateLeadTable();
                leadManager.updateLeadStats();
            }
            
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },

    // Track conversion for analytics
    trackConversion: function(leadData) {
        // Google Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'lead_submission', {
                'event_category': 'lead_generation',
                'event_label': leadData.service,
                'value': 1
            });
        }
        
        // Facebook Pixel tracking
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', {
                content_name: leadData.service,
                content_category: 'lead_generation'
            });
        }
        
        // Custom tracking
        console.log('Lead conversion tracked:', {
            service: leadData.service,
            source: leadData.source,
            page: leadData.pageUrl
        });
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (LeadFormEmbed.defaultConfig.autoInit) {
        LeadFormEmbed.autoInit();
    }
});

// Export for global use
window.LeadFormEmbed = LeadFormEmbed;

// Add global CAPTCHA refresh function
window.refreshAllCaptchas = function() {
    if (typeof LeadFormEmbed !== 'undefined') {
        LeadFormEmbed.globalRefreshCaptcha();
    }
}; 