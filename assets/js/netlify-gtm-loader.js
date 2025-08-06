// Netlify GTM Loader - Modular Script Loading
// This script is injected via GTM and loads Netlify modules only when needed

(function() {
  'use strict';

  // Netlify Module Loader
  const NetlifyModuleLoader = {
    // Track loaded modules
    loadedModules: new Set(),
    
    // Module configurations
    modules: {
      'netlify-config': '/config/netlify-config.js',
      'netlify-api': '/services/netlify-api-service.js',
      'netlify-database': '/services/netlify-database-service.js',
      'gtm-service': '/config/gtm.js'
    },

    // Load a single module
    async loadModule(moduleName) {
      if (this.loadedModules.has(moduleName)) {
        return Promise.resolve();
      }

      const modulePath = this.modules[moduleName];
      if (!modulePath) {
        throw new Error(`Module not found: ${moduleName}`);
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = modulePath;
        script.onload = () => {
          this.loadedModules.add(moduleName);
          console.log(`✅ Loaded module: ${moduleName}`);
          resolve();
        };
        script.onerror = (error) => {
          console.error(`❌ Failed to load module: ${moduleName}`, error);
          reject(error);
        };
        document.head.appendChild(script);
      });
    },

    // Load multiple modules
    async loadModules(moduleNames) {
      const promises = moduleNames.map(name => this.loadModule(name));
      return Promise.all(promises);
    },

    // Initialize Netlify services
    async initializeNetlify() {
      try {
        // Load core modules
        await this.loadModules([
          'netlify-config',
          'gtm-service'
        ]);

        // Initialize GTM
        if (window.GTMService) {
          window.gtm = new window.GTMService();
          console.log('✅ GTM Service initialized');
        }

        // Track page view
        if (window.gtm) {
          window.gtm.trackPageView({
            name: document.title,
            section: this.getPageSection(),
            userType: this.isAdminPage() ? 'admin' : 'visitor'
          });
        }

        console.log('✅ Netlify core modules initialized');
      } catch (error) {
        console.error('❌ Error initializing Netlify core:', error);
      }
    },

    // Initialize admin features (only when needed)
    async initializeAdmin() {
      if (!this.isAdminPage()) return;

      try {
        await this.loadModules([
          'netlify-api',
          'netlify-database'
        ]);

        // Initialize admin services
        if (window.NetlifyApiService && window.NetlifyDatabaseService) {
          window.netlifyApi = new window.NetlifyApiService();
          window.netlifyDatabase = new window.NetlifyDatabaseService();
          
          await window.netlifyApi.initialize();
          await window.netlifyDatabase.initialize();
          
          console.log('✅ Netlify admin services initialized');
        }

        // Initialize admin tracking
        this.initializeAdminTracking();
      } catch (error) {
        console.error('❌ Error initializing Netlify admin:', error);
      }
    },

    // Initialize form handling (only when needed)
    async initializeForms() {
      const forms = document.querySelectorAll('form[data-netlify="true"]');
      if (forms.length === 0) return;

      try {
        await this.loadModule('netlify-api');
        
        if (window.NetlifyApiService) {
          window.netlifyApi = new window.NetlifyApiService();
          await window.netlifyApi.initialize();
          
          this.initializeFormTracking();
          console.log('✅ Netlify form handling initialized');
        }
      } catch (error) {
        console.error('❌ Error initializing Netlify forms:', error);
      }
    },

    // Get current page section
    getPageSection() {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) return 'admin';
      if (path.startsWith('/services')) return 'services';
      if (path.startsWith('/products')) return 'products';
      if (path.startsWith('/projects')) return 'projects';
      if (path.startsWith('/blog')) return 'blog';
      if (path === '/about') return 'about';
      if (path === '/contact') return 'contact';
      return 'home';
    },

    // Check if current page is admin
    isAdminPage() {
      return window.location.pathname.startsWith('/admin');
    },

    // Initialize form tracking
    initializeFormTracking() {
      const forms = document.querySelectorAll('form[data-netlify="true"]');
      forms.forEach(form => {
        const formName = form.getAttribute('data-form-name') || form.id || 'contact_form';
        
        // Track form start
        form.addEventListener('focusin', (e) => {
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (window.gtm) {
              window.gtm.trackFormInteraction(formName, 'start');
            }
          }
        });

        // Track form submission
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          if (window.gtm) {
            window.gtm.trackFormInteraction(formName, 'complete');
          }

          await this.handleFormSubmission(form);
        });
      });
    },

    // Handle form submission
    async handleFormSubmission(form) {
      try {
        const formData = new FormData(form);
        const formObject = {};
        
        for (let [key, value] of formData.entries()) {
          formObject[key] = value;
        }

        // Submit to Netlify API
        if (window.netlifyApi) {
          const response = await window.netlifyApi.submitLead(formObject);
          
          if (response.success) {
            // Track lead submission
            if (window.gtm) {
              window.gtm.trackLeadSubmission({
                source: formObject.source || 'website_form',
                type: formObject.type || 'general_inquiry',
                email: formObject.email,
                formName: form.getAttribute('data-form-name') || form.id
              });
            }

            this.showMessage('Thank you! Your message has been sent successfully.', 'success');
            form.reset();
          } else {
            throw new Error(response.message || 'Submission failed');
          }
        } else {
          throw new Error('Netlify API service not available');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        
        // Track form error
        if (window.gtm) {
          window.gtm.trackEvent('form_error', {
            form_name: form.getAttribute('data-form-name') || form.id,
            error: error.message
          });
        }

        this.showMessage('Sorry, there was an error sending your message. Please try again.', 'error');
      }
    },

    // Initialize admin tracking
    initializeAdminTracking() {
      // Admin login tracking
      const loginForm = document.getElementById('loginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(loginForm);
          const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
          };

          try {
            if (window.netlifyApi) {
              const response = await window.netlifyApi.adminLogin(credentials);
              
              if (response.success) {
                // Track successful login
                if (window.gtm) {
                  window.gtm.trackAdminLogin({
                    user: credentials.username,
                    method: 'password',
                    success: true
                  });
                }

                // Redirect to admin dashboard
                window.location.href = '/admin/admin-dashboard.html';
              } else {
                // Track failed login
                if (window.gtm) {
                  window.gtm.trackAdminLogin({
                    user: credentials.username,
                    method: 'password',
                    success: false
                  });
                }

                this.showMessage('Invalid credentials. Please try again.', 'error');
              }
            }
          } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Login failed. Please try again.', 'error');
          }
        });
      }

      // Admin action tracking
      const adminActions = document.querySelectorAll('[data-admin-action]');
      adminActions.forEach(element => {
        element.addEventListener('click', (e) => {
          const action = element.getAttribute('data-admin-action');
          const details = JSON.parse(element.getAttribute('data-admin-details') || '{}');
          
          if (window.gtm) {
            window.gtm.trackAdminAction(action, details);
          }
        });
      });
    },

    // Show message utility
    showMessage(message, type = 'info') {
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
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await NetlifyModuleLoader.initializeNetlify();
      await NetlifyModuleLoader.initializeAdmin();
      await NetlifyModuleLoader.initializeForms();
    });
  } else {
    (async () => {
      await NetlifyModuleLoader.initializeNetlify();
      await NetlifyModuleLoader.initializeAdmin();
      await NetlifyModuleLoader.initializeForms();
    })();
  }

  // Expose to global scope for GTM access
  window.NetlifyModuleLoader = NetlifyModuleLoader;

})(); 