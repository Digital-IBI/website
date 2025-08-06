/**
 * Security Page JavaScript
 * Placeholder for security functionality
 */

function refreshSecurity() {
    showNotification('Security refresh functionality will be implemented here', 'info');
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

// Initialize security page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Security page loaded');
    showEmptyState('securityContainer', 'security', {
        title: 'Security Dashboard Coming Soon',
        description: 'Security monitoring and threat detection will be implemented here.',
        icon: 'fas fa-shield-alt',
        actionText: 'Refresh',
        actionUrl: '#',
        showAction: true
    });
}); 