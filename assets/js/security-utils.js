/**
 * Security Utilities for Admin System
 * Provides additional security features for form handling and data protection
 */

class SecurityUtils {
    constructor() {
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    // Enhanced input sanitization
    sanitizeInput(input, maxLength = 1000) {
        if (typeof input !== 'string') return '';
        
        let sanitized = input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .replace(/script/gi, '') // Remove script tags
            .replace(/data:/gi, '') // Remove data: protocol
            .replace(/vbscript:/gi, '') // Remove vbscript: protocol
            .trim();
        
        // Limit length
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }
        
        return sanitized;
    }

    // Validate form data
    validateFormData(formData, rules = {}) {
        const errors = [];
        
        for (const [field, value] of Object.entries(formData)) {
            const rule = rules[field];
            if (!rule) continue;
            
            // Required field validation
            if (rule.required && (!value || value.trim() === '')) {
                errors.push(`${field} is required`);
                continue;
            }
            
            // Email validation
            if (rule.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors.push(`${field} must be a valid email address`);
                }
            }
            
            // Password validation
            if (rule.type === 'password' && value) {
                const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
                if (!passwordRegex.test(value)) {
                    errors.push(`${field} must be at least 8 characters with letters and numbers`);
                }
            }
            
            // Length validation
            if (rule.minLength && value && value.length < rule.minLength) {
                errors.push(`${field} must be at least ${rule.minLength} characters`);
            }
            
            if (rule.maxLength && value && value.length > rule.maxLength) {
                errors.push(`${field} must be no more than ${rule.maxLength} characters`);
            }
        }
        
        return errors;
    }

    // Generate secure token
    generateSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Hash password (basic implementation - use bcrypt in production)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Verify password
    async verifyPassword(password, hashedPassword) {
        const hashedInput = await this.hashPassword(password);
        return hashedInput === hashedPassword;
    }

    // Session management
    createSecureSession(userData) {
        const sessionId = this.generateSecureToken();
        const sessionData = {
            id: sessionId,
            userId: userData.id,
            email: userData.email,
            role: userData.role,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.sessionTimeout,
            lastActivity: Date.now()
        };
        
        sessionStorage.setItem('sessionId', sessionId);
        localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
        
        return sessionId;
    }

    // Validate session
    validateSession() {
        const sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) return null;
        
        const sessionData = JSON.parse(localStorage.getItem(`session_${sessionId}`) || 'null');
        if (!sessionData) return null;
        
        // Check if session expired
        if (Date.now() > sessionData.expiresAt) {
            this.destroySession();
            return null;
        }
        
        // Update last activity
        sessionData.lastActivity = Date.now();
        localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
        
        return sessionData;
    }

    // Destroy session
    destroySession() {
        const sessionId = sessionStorage.getItem('sessionId');
        if (sessionId) {
            localStorage.removeItem(`session_${sessionId}`);
            sessionStorage.removeItem('sessionId');
        }
    }

    // Audit logging
    logSecurityEvent(event, type, details = {}) {
        const logEntry = {
            event,
            type,
            details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Store in localStorage for audit trail
        const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
        auditLog.push(logEntry);
        
        // Keep only last 1000 entries
        if (auditLog.length > 1000) {
            auditLog.splice(0, auditLog.length - 1000);
        }
        
        localStorage.setItem('auditLog', JSON.stringify(auditLog));
        
        // Console log for debugging
        console.log('Security Event:', logEntry);
    }

    // Rate limiting
    checkRateLimit(action, identifier) {
        const key = `rateLimit_${action}_${identifier}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        const now = Date.now();
        
        // Remove old attempts
        const recentAttempts = attempts.filter(timestamp => now - timestamp < this.lockoutDuration);
        
        if (recentAttempts.length >= this.maxLoginAttempts) {
            return false; // Rate limited
        }
        
        // Add current attempt
        recentAttempts.push(now);
        localStorage.setItem(key, JSON.stringify(recentAttempts));
        
        return true;
    }

    // CSRF protection
    generateCSRFToken() {
        const token = this.generateSecureToken();
        sessionStorage.setItem('csrfToken', token);
        return token;
    }

    validateCSRFToken(token) {
        const storedToken = sessionStorage.getItem('csrfToken');
        return token === storedToken;
    }

    // XSS prevention
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Secure form submission
    secureFormSubmission(formElement, callback) {
        const formData = new FormData(formElement);
        const data = {};
        
        // Sanitize all form data
        for (const [key, value] of formData.entries()) {
            data[key] = this.sanitizeInput(value);
        }
        
        // Validate CSRF token if present
        const csrfToken = formData.get('csrf_token');
        if (csrfToken && !this.validateCSRFToken(csrfToken)) {
            throw new Error('Invalid CSRF token');
        }
        
        return callback(data);
    }
}

// Global security utilities instance
window.SecurityUtils = new SecurityUtils(); 