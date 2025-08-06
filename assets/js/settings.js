/**
 * Settings Page JavaScript
 * Placeholder for settings functionality
 */

function saveSettings() {
    showNotification('Settings saved successfully!', 'success');
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

// Initialize settings page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Settings page loaded');
    showEmptyState('settingsContainer', 'settings', {
        title: 'Settings Coming Soon',
        description: 'System configuration and user preferences will be implemented here.',
        icon: 'fas fa-cog',
        actionText: 'Save Settings',
        actionUrl: '#',
        showAction: true
    });
}); 