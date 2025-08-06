/**
 * Campaigns Page JavaScript
 * Handles campaign management with empty states and data skeletons
 */

class CampaignsPage {
    constructor() {
        this.campaigns = [];
        this.filteredCampaigns = [];
        this.init();
    }

    async init() {
        // Show loading skeleton initially
        showSkeleton('campaignsContainer', 'default');
        
        await this.loadCampaigns();
        this.setupEventListeners();
    }

    async loadCampaigns() {
        try {
            // Load campaigns from localStorage
            const campaignData = JSON.parse(localStorage.getItem('campaignManagementData') || '[]');
            this.campaigns = campaignData;
            this.filteredCampaigns = [...this.campaigns];
            this.updateCampaignsDisplay();

        } catch (error) {
            console.error('Error loading campaigns:', error);
            showErrorState('campaignsContainer', error.message, 'campaigns');
        }
    }

    updateCampaignsDisplay() {
        const container = document.getElementById('campaignsContainer');
        if (!container) return;

        if (this.filteredCampaigns.length === 0) {
            showEmptyState('campaignsContainer', 'campaigns', {
                title: 'No Campaigns Found',
                description: 'Create your first marketing campaign to start reaching your audience and driving results.',
                icon: 'fas fa-bullhorn',
                actionText: 'Create Campaign',
                actionUrl: '#',
                showAction: true
            });
            return;
        }

        // Generate campaigns grid HTML
        const html = this.generateCampaignsGridHTML();
        container.innerHTML = html;
    }

    generateCampaignsGridHTML() {
        let html = '<div class="row">';

        this.filteredCampaigns.forEach(campaign => {
            html += this.generateCampaignCardHTML(campaign);
        });

        html += '</div>';
        return html;
    }

    generateCampaignCardHTML(campaign) {
        const startDate = new Date(campaign.startDate || campaign.createdAt || Date.now()).toLocaleDateString();
        const endDate = campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing';
        const budget = this.formatBudget(campaign.budget);
        const status = this.formatStatus(campaign.status);
        const statusClass = this.getStatusClass(campaign.status);
        
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="campaign-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h6 class="fw-bold mb-0">${campaign.name || 'Unnamed Campaign'}</h6>
                        <span class="campaign-status ${statusClass}">${status}</span>
                    </div>
                    
                    <p class="text-muted small mb-3">${campaign.description || 'No description available'}</p>
                    
                    <div class="mb-3">
                        <small class="text-muted">
                            <i class="fas fa-calendar"></i> ${startDate} - ${endDate}<br>
                            <i class="fas fa-dollar-sign"></i> Budget: ${budget}<br>
                            <i class="fas fa-users"></i> Target: ${campaign.targetAudience || 'Not specified'}<br>
                            <i class="fas fa-chart-line"></i> Type: ${this.formatType(campaign.type)}
                        </small>
                    </div>
                    
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewCampaign('${campaign.id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="editCampaign('${campaign.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCampaign('${campaign.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        const classes = {
            'active': 'status-active',
            'paused': 'status-paused',
            'draft': 'status-draft',
            'completed': 'status-completed'
        };
        return classes[status] || 'status-draft';
    }

    formatStatus(status) {
        const statuses = {
            'active': 'Active',
            'paused': 'Paused',
            'draft': 'Draft',
            'completed': 'Completed'
        };
        return statuses[status] || 'Draft';
    }

    formatType(type) {
        const types = {
            'email': 'Email Marketing',
            'social': 'Social Media',
            'ppc': 'PPC/Google Ads',
            'content': 'Content Marketing',
            'seo': 'SEO Campaign',
            'influencer': 'Influencer Marketing'
        };
        return types[type] || type || 'Other';
    }

    formatBudget(budget) {
        if (!budget) return 'Not specified';
        const budgets = {
            'under_1k': 'Under $1,000',
            '1k_5k': '$1,000 - $5,000',
            '5k_10k': '$5,000 - $10,000',
            '10k_25k': '$10,000 - $25,000',
            'over_25k': 'Over $25,000'
        };
        return budgets[budget] || budget || 'Not specified';
    }

    setupEventListeners() {
        // Add any additional event listeners here
        console.log('Campaign management event listeners setup complete');
    }

    async addCampaign(campaignData) {
        try {
            // Generate unique ID
            const campaignId = 'campaign_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const newCampaign = {
                id: campaignId,
                ...campaignData,
                createdAt: new Date().toISOString(),
                status: 'draft'
            };

            // Store in localStorage
            this.campaigns.unshift(newCampaign);
            localStorage.setItem('campaignManagementData', JSON.stringify(this.campaigns));
            this.filteredCampaigns = [...this.campaigns];
            this.updateCampaignsDisplay();

            return true;
        } catch (error) {
            console.error('Error adding campaign:', error);
            showNotification('Error adding campaign: ' + error.message, 'error');
            return false;
        }
    }

    async updateCampaign(campaignId, updateData) {
        try {
            const campaignIndex = this.campaigns.findIndex(campaign => campaign.id === campaignId);
            if (campaignIndex === -1) {
                throw new Error('Campaign not found');
            }

            const updatedCampaign = {
                ...this.campaigns[campaignIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            // Update in localStorage
            this.campaigns[campaignIndex] = updatedCampaign;
            localStorage.setItem('campaignManagementData', JSON.stringify(this.campaigns));
            this.filteredCampaigns = [...this.campaigns];
            this.updateCampaignsDisplay();

            return true;
        } catch (error) {
            console.error('Error updating campaign:', error);
            showNotification('Error updating campaign: ' + error.message, 'error');
            return false;
        }
    }

    async deleteCampaign(campaignId) {
        if (!confirm('Are you sure you want to delete this campaign?')) {
            return false;
        }

        try {
            // Remove from localStorage
            this.campaigns = this.campaigns.filter(campaign => campaign.id !== campaignId);
            localStorage.setItem('campaignManagementData', JSON.stringify(this.campaigns));
            this.filteredCampaigns = [...this.campaigns];
            this.updateCampaignsDisplay();

            return true;
        } catch (error) {
            console.error('Error deleting campaign:', error);
            showNotification('Error deleting campaign: ' + error.message, 'error');
            return false;
        }
    }
}

// Global campaigns page instance
let campaignsPage;

// Global functions for campaigns page
function showAddCampaignModal() {
    // For now, just show an alert
    // In a real app, you'd open a modal
    alert('Create Campaign functionality would open a modal here');
}

function viewCampaign(campaignId) {
    const campaign = campaignsPage?.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
        showNotification('Campaign not found!', 'error');
        return;
    }

    // For now, just show campaign details in an alert
    // In a real app, you'd open a modal with detailed view
    alert(`
Campaign Details:
Name: ${campaign.name}
Type: ${campaignsPage.formatType(campaign.type)}
Status: ${campaignsPage.formatStatus(campaign.status)}
Budget: ${campaignsPage.formatBudget(campaign.budget)}
Target Audience: ${campaign.targetAudience || 'Not specified'}
Start Date: ${new Date(campaign.startDate || campaign.createdAt || Date.now()).toLocaleDateString()}
End Date: ${campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'}
Description: ${campaign.description || 'No description'}
    `);
}

function editCampaign(campaignId) {
    const campaign = campaignsPage?.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
        showNotification('Campaign not found!', 'error');
        return;
    }

    // For now, just show an alert
    // In a real app, you'd open an edit modal
    alert('Edit functionality would open a modal here for campaign: ' + campaign.name);
}

async function deleteCampaign(campaignId) {
    if (campaignsPage && await campaignsPage.deleteCampaign(campaignId)) {
        showNotification('Campaign deleted successfully!', 'success');
    }
}

function exportCampaigns() {
    if (!campaignsPage?.campaigns.length) {
        showNotification('No campaigns to export!', 'warning');
        return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + 
        'Name,Type,Status,Budget,Target Audience,Start Date,End Date,Description\n' +
        campaignsPage.campaigns.map(campaign => 
            `"${campaign.name || ''}","${campaign.type || ''}","${campaign.status || ''}","${campaign.budget || ''}","${campaign.targetAudience || ''}","${new Date(campaign.startDate || campaign.createdAt || Date.now()).toLocaleDateString()}","${campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'}","${campaign.description || ''}"`
        ).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'campaigns_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Campaigns exported successfully!', 'success');
}

function importCampaigns() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
                
                const importedCampaigns = [];
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) {
                        const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
                        const campaign = {};
                        headers.forEach((header, index) => {
                            campaign[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
                        });
                        if (campaign.name && campaign.type) {
                            importedCampaigns.push(campaign);
                        }
                    }
                }

                if (importedCampaigns.length > 0) {
                    // Add imported campaigns
                    importedCampaigns.forEach(campaign => {
                        campaignsPage?.addCampaign(campaign);
                    });
                    showNotification(`${importedCampaigns.length} campaigns imported successfully!`, 'success');
                } else {
                    showNotification('No valid campaigns found in the file!', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
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

// Initialize campaigns page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing campaigns page...');
    campaignsPage = new CampaignsPage();
    console.log('Campaigns page initialized:', campaignsPage);
}); 