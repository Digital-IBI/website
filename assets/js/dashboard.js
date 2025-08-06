/**
 * Dashboard JavaScript
 * Handles dashboard-specific functionality with localStorage
 */

class Dashboard {
    constructor() {
        this.init();
    }

    init() {
        console.log('Initializing dashboard...');
        this.loadStats();
        this.loadRecentActivity();
        console.log('Dashboard initialized:', this.constructor.name);
    }

    // Load stats
    async loadStats() {
        try {
            // Use localStorage
            const storedLeads = JSON.parse(localStorage.getItem('leadManagementData') || '[]');
            const totalLeads = storedLeads.length;
            
            const statusCounts = {};
            storedLeads.forEach(lead => {
                const status = lead.status || 'new';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
            
            this.displayStats({
                total: totalLeads,
                new: statusCounts.new || 0,
                contacted: statusCounts.contacted || 0,
                converted: statusCounts.converted || 0,
                conversionRate: totalLeads > 0 ? ((statusCounts.converted || 0) / totalLeads * 100).toFixed(1) : 0
            });
            
        } catch (error) {
            console.error('Error loading stats:', error);
            this.displayStats({
                total: 0,
                new: 0,
                contacted: 0,
                converted: 0,
                conversionRate: 0
            });
        }
    }

    displayStats(stats) {
        // Update stats display
        const totalLeadsElement = document.getElementById('totalLeads');
        if (totalLeadsElement) {
            totalLeadsElement.textContent = stats.total || 0;
        }
        
        const newLeadsElement = document.getElementById('newLeads');
        if (newLeadsElement) {
            newLeadsElement.textContent = stats.new || 0;
        }
        
        const contactedLeadsElement = document.getElementById('contactedLeads');
        if (contactedLeadsElement) {
            contactedLeadsElement.textContent = stats.contacted || 0;
        }
        
        const convertedLeadsElement = document.getElementById('convertedLeads');
        if (convertedLeadsElement) {
            convertedLeadsElement.textContent = stats.converted || 0;
        }
        
        const conversionRateElement = document.getElementById('conversionRate');
        if (conversionRateElement) {
            conversionRateElement.textContent = stats.conversionRate || 0;
        }
    }

    // Load recent activity
    async loadRecentActivity() {
        try {
            // Use localStorage
            const storedLeads = JSON.parse(localStorage.getItem('leadManagementData') || '[]');
            this.displayRecentActivity(storedLeads.slice(0, 5));
            
        } catch (error) {
            console.error('Error loading recent activity:', error);
            this.displayRecentActivity([]);
        }
    }

    displayRecentActivity(activities) {
        const container = document.getElementById('recentActivityContainer');
        if (!container) return;
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent activity</p>';
            return;
        }
        
        const html = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-user"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.name || 'Unknown Lead'}</div>
                    <div class="activity-description">${activity.service || 'No service specified'}</div>
                    <div class="activity-time">${new Date(activity.createdAt || activity.created || Date.now()).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    getStatusColor(status) {
        const colors = {
            'new': 'primary',
            'contacted': 'warning',
            'qualified': 'info',
            'converted': 'success',
            'lost': 'danger'
        };
        return colors[status] || 'secondary';
    }

    setupEventListeners() {
        // Add any additional event listeners here
    }
}

// Initialize the dashboard
let dashboard;

document.addEventListener('DOMContentLoaded', function() {
    dashboard = new Dashboard();
});

// Global functions for HTML onclick handlers
function refreshStats() {
    if (dashboard) {
        dashboard.loadStats();
        dashboard.loadRecentActivity();
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    let originalText = '';
    let submitBtn = null;
    
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        // Show loading state
        submitBtn = event.target.querySelector('button[type="submit"]');
        originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;
        
        // Use localStorage auth
        const adminUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
        const user = adminUsers.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('loginTime', new Date().toISOString());
            
            showNotification('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
        } else {
            throw new Error('Invalid credentials');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed: ' + error.message, 'error');
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

async function createAdminUser() {
    try {
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        const displayName = document.getElementById('adminDisplayName').value;
        
        if (!email || !password || !displayName) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        // Create admin user in localStorage
        const adminUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
        
        // Check if user already exists
        const existingUser = adminUsers.find(u => u.email === email);
        if (existingUser) {
            showNotification('Admin user already exists', 'error');
            return;
        }
        
        // Add new admin user
        const newAdmin = {
            id: 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            email: email,
            password: password, // In production, this should be hashed
            displayName: displayName,
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        
        adminUsers.push(newAdmin);
        localStorage.setItem('adminUsers', JSON.stringify(adminUsers));
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createAdminModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reset form
        document.getElementById('createAdminForm').reset();
        
        showNotification('Admin user created successfully!', 'success');
        
    } catch (error) {
        console.error('Error creating admin user:', error);
        showNotification('Error creating admin user: ' + error.message, 'error');
    }
}

async function handleLogout() {
    try {
        // Clear localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('authToken');
        
        showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed: ' + error.message, 'error');
    }
}

async function setupDatabase() {
    try {
        showNotification('Setting up database...', 'info');
        
        // Initialize collections in localStorage
        const collections = ['leads', 'images', 'campaigns', 'analytics'];
        
        collections.forEach(collection => {
            if (!localStorage.getItem(collection + 'Data')) {
                localStorage.setItem(collection + 'Data', '[]');
            }
        });
        
        // Create default admin user if none exists
        const adminUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
        if (adminUsers.length === 0) {
            createDefaultAdminUser();
        }
        
        showNotification('Database setup completed!', 'success');
        
    } catch (error) {
        console.error('Database setup error:', error);
        showNotification('Database setup failed: ' + error.message, 'error');
    }
}

function createDefaultAdminUser() {
    const defaultAdmin = {
        id: 'admin_default_' + Date.now(),
        email: 'admin@digitalibi.com',
        password: 'admin123', // Change this in production
        displayName: 'Default Admin',
        role: 'admin',
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('adminUsers', JSON.stringify([defaultAdmin]));
    console.log('Default admin user created:', defaultAdmin.email);
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
} 