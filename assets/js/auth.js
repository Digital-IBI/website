/**
 * Unified Authentication System with Google reCAPTCHA v3
 * Handles authentication with localStorage
 */

class UnifiedAuth {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
        this.authType = 'local';
        this.recaptchaSiteKey = '6Le9cZkrAAAAAPhlM9jtiTbuULBXfzZ1D32HXofp';
        this.init();
    }

    // Initialize authentication
    init() {
        this.checkAuth();
        this.setupAuthStateListener();
        this.loadRecaptcha();
    }

    // Load Google reCAPTCHA v3
    loadRecaptcha() {
        if (typeof grecaptcha === 'undefined') {
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${this.recaptchaSiteKey}`;
            document.head.appendChild(script);
        }
    }

    // Execute reCAPTCHA
    async executeRecaptcha() {
        try {
            if (typeof grecaptcha === 'undefined') {
                throw new Error('reCAPTCHA not loaded');
            }
            
            const token = await grecaptcha.execute(this.recaptchaSiteKey, {action: 'login'});
            return token;
        } catch (error) {
            console.error('reCAPTCHA error:', error);
            return null;
        }
    }

    // Check if user is authenticated
    checkAuth() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        const loginTime = localStorage.getItem('loginTime');

        if (token && user && loginTime) {
            const now = Date.now();
            const timeDiff = now - parseInt(loginTime);

            if (timeDiff < this.sessionTimeout) {
                this.isAuthenticated = true;
                this.currentUser = JSON.parse(user);
                this.authType = 'local';
                this.hideLoginForm();
                this.showAdminContent();
                return true;
            } else {
                this.logout();
            }
        } else {
            this.showLoginForm();
        }
        return false;
    }

    // Setup auth state listener
    setupAuthStateListener() {
        // No Firebase auth state listener needed
    }

    // Show login form
    showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const adminContent = document.getElementById('adminContent');
        
        if (loginForm) loginForm.style.display = 'block';
        if (adminContent) adminContent.style.display = 'none';
    }

    // Hide login form
    hideLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.style.display = 'none';
    }

    // Show admin content
    showAdminContent() {
        const adminContent = document.getElementById('adminContent');
        if (adminContent) adminContent.style.display = 'block';
    }

    // Login function with unified approach
    async login(email, password) {
        try {
            // Check rate limiting first
            if (!this.checkRateLimit()) {
                this.logSecurityEvent('Login blocked - Rate limit exceeded', 'rate_limit_exceeded', { email });
                return { success: false, message: 'Too many failed attempts. Please try again in 15 minutes.' };
            }

            // Validate inputs
            if (!email || !password) {
                return { success: false, message: 'Please provide both email and password.' };
            }

            // Validate email format
            if (!this.validateEmail(email)) {
                return { success: false, message: 'Please enter a valid email address.' };
            }

            // Sanitize inputs
            const sanitizedEmail = this.sanitizeInput(email);
            const sanitizedPassword = this.sanitizeInput(password);

            // Execute reCAPTCHA
            const recaptchaToken = await this.executeRecaptcha();
            if (!recaptchaToken) {
                return { success: false, message: 'reCAPTCHA verification failed. Please try again.' };
            }

            // Use localStorage authentication
            const adminUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
            const user = adminUsers.find(u => u.email === sanitizedEmail && u.password === sanitizedPassword);
            
            if (user) {
                this.isAuthenticated = true;
                this.currentUser = user;
                this.authType = 'local';
                this.updateSession();
                this.hideLoginForm();
                this.showAdminContent();
                
                // Log successful login
                this.logSecurityEvent('Login successful', 'login_success', { 
                    email: sanitizedEmail, 
                    userId: user.id,
                    timestamp: new Date().toISOString()
                });
                
                return { success: true, message: 'Login successful!' };
            } else {
                // Log failed login attempt
                this.logSecurityEvent('Login failed - Invalid credentials', 'login_failed', { 
                    email: sanitizedEmail,
                    timestamp: new Date().toISOString()
                });
                throw new Error('Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'Login failed. Please check your credentials.' };
        }
    }

    // Update session
    updateSession() {
        const token = 'local_' + Date.now();
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('loginTime', Date.now().toString());
    }

    // Logout function
    async logout() {
        // Clear local state
        this.isAuthenticated = false;
        this.currentUser = null;
        this.authType = 'local';

        // Clear localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTime');

        // Show login form
        this.showLoginForm();
    }

    // Enhanced input sanitization and validation
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        // Remove HTML tags and dangerous characters
        let sanitized = input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .replace(/script/gi, '') // Remove script tags
            .trim();
        
        // Limit length for security
        if (sanitized.length > 1000) {
            sanitized = sanitized.substring(0, 1000);
        }
        
        return sanitized;
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    validatePassword(password) {
        // Minimum 8 characters, at least one letter and one number
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    // Generate CSRF token
    generateCSRFToken() {
        const token = 'csrf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('csrfToken', token);
        return token;
    }

    // Validate CSRF token
    validateCSRFToken(token) {
        const storedToken = sessionStorage.getItem('csrfToken');
        return token === storedToken;
    }

    // Rate limiting for login attempts
    checkRateLimit() {
        const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
        const now = Date.now();
        const window = 15 * 60 * 1000; // 15 minutes
        
        // Remove old attempts
        const recentAttempts = attempts.filter(attempt => now - attempt < window);
        
        if (recentAttempts.length >= 5) {
            return false; // Rate limited
        }
        
        // Add current attempt
        recentAttempts.push(now);
        localStorage.setItem('loginAttempts', JSON.stringify(recentAttempts));
        return true;
    }

    // Generate token
    generateToken() {
        return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get client identifier
    getClientIdentifier() {
        return navigator.userAgent + '_' + (navigator.language || 'en');
    }

    // Log security event
    logSecurityEvent(message, type, details = {}) {
        console.warn('Security Event:', { message, type, details, timestamp: new Date().toISOString() });
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get auth type
    getAuthType() {
        return this.authType;
    }

    // Create admin user function with enhanced security
    async createAdminUser() {
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;

        // Validate inputs
        if (!email || !password) {
            showNotification('Please fill in all fields!', 'error');
            return;
        }

        // Validate email format
        if (!this.validateEmail(email)) {
            showNotification('Please enter a valid email address!', 'error');
            return;
        }

        // Validate password strength
        if (!this.validatePassword(password)) {
            showNotification('Password must be at least 8 characters with letters and numbers!', 'error');
            return;
        }

        try {
            // Execute reCAPTCHA
            const recaptchaToken = await this.executeRecaptcha();
            if (!recaptchaToken) {
                showNotification('reCAPTCHA verification failed. Please try again.', 'error');
                return;
            }

            // Sanitize inputs
            const sanitizedEmail = this.sanitizeInput(email);
            const sanitizedPassword = this.sanitizeInput(password);

            // Use localStorage
            const adminUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
            const existingUser = adminUsers.find(user => user.email === sanitizedEmail);
            
            if (existingUser) {
                showNotification('Admin user already exists!', 'error');
                return;
            }

            // Create new admin user
            const newAdmin = {
                id: 'admin_' + Date.now(),
                email: sanitizedEmail,
                password: sanitizedPassword, // In production, this should be hashed
                role: 'admin',
                createdAt: new Date().toISOString(),
                lastLogin: null,
                loginCount: 0
            };

            adminUsers.push(newAdmin);
            localStorage.setItem('adminUsers', JSON.stringify(adminUsers));
            
            // Log admin user creation
            this.logSecurityEvent('Admin user created', 'admin_created', { 
                email: sanitizedEmail,
                timestamp: new Date().toISOString()
            });
            
            showNotification('Admin user created successfully! You can now login.', 'success');
            document.getElementById('loginFormElement').reset();
        } catch (error) {
            console.error('Error creating admin user:', error);
            showNotification('Error creating admin user: ' + error.message, 'error');
        }
    }
}

// Global unified auth instance
const unifiedAuth = new UnifiedAuth();

// Global functions for easy access
function createAdminUser() {
    if (unifiedAuth) {
        unifiedAuth.createAdminUser();
    } else {
        console.error('UnifiedAuth not initialized');
        showNotification('Authentication system not ready. Please refresh the page.', 'error');
    }
}

// Update login handling to use reCAPTCHA
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
        showNotification('Please fill in all fields!', 'error');
        return;
    }

    const result = await unifiedAuth.login(email, password);
    
    if (result.success) {
        showNotification(result.message, 'success');
    } else {
        showNotification(result.message, 'error');
    }
}

// Logout function
async function handleLogout() {
    await unifiedAuth.logout();
    showNotification('Logged out successfully!', 'info');
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
} 