/**
 * Leads Page JavaScript
 * Handles leads page-specific functionality with empty states and data skeletons
 */

class LeadsPage {
    constructor() {
        this.leads = [];
        this.filteredLeads = [];
        this.init();
    }

    async init() {
        // Show loading skeleton initially
        showSkeleton('leadsContainer', 'table');
        
        await this.loadLeads();
        this.setupEventListeners();
    }

    async loadLeads() {
        try {
            // Use localStorage
            this.leads = JSON.parse(localStorage.getItem('leadManagementData') || '[]');
            this.filteredLeads = [...this.leads];
            this.updateLeadsDisplay();

        } catch (error) {
            console.error('Error loading leads:', error);
            showErrorState('leadsContainer', error.message, 'leads');
        }
    }

    updateLeadsDisplay() {
        const container = document.getElementById('leadsContainer');
        if (!container) return;

        if (this.filteredLeads.length === 0) {
            showEmptyState('leadsContainer', 'leads', {
                title: 'No Leads Found',
                description: 'Start by adding your first lead to track potential customers and manage your sales pipeline.',
                icon: 'fas fa-users',
                actionText: 'Add New Lead',
                actionUrl: '#',
                showAction: true
            });
            return;
        }

        // Generate leads table HTML
        const html = this.generateLeadsTableHTML();
        container.innerHTML = html;
    }

    generateLeadsTableHTML() {
        let html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Contact</th>
                            <th>Company</th>
                            <th>Service</th>
                            <th>Status</th>
                            <th>Source</th>
                            <th>Budget/Timeline</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.filteredLeads.forEach(lead => {
            html += this.generateLeadRowHTML(lead);
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    }

    generateLeadRowHTML(lead) {
        const statusColor = this.getStatusColor(lead.status);
        const createdDate = new Date(lead.createdAt || lead.created || Date.now()).toLocaleDateString();
        
        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar me-3">
                            <i class="fas fa-user-circle fa-2x text-primary"></i>
                        </div>
                        <div>
                            <div class="fw-bold">${lead.name || 'Unknown'}</div>
                            <small class="text-muted">${lead.email || 'No email'}</small>
                            ${lead.phone ? `<br><small class="text-muted">${lead.phone}</small>` : ''}
                        </div>
                    </div>
                </td>
                <td>${lead.company || 'N/A'}</td>
                <td>${this.formatService(lead.service)}</td>
                <td>
                    <span class="badge bg-${statusColor}">${this.formatStatus(lead.status)}</span>
                </td>
                <td>${this.formatSource(lead.source)}</td>
                <td>
                    <div>
                        <small class="text-muted">Budget: ${this.formatBudget(lead.budget)}</small><br>
                        <small class="text-muted">Timeline: ${this.formatTimeline(lead.timeline)}</small>
                    </div>
                </td>
                <td>${createdDate}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewLead('${lead.id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-secondary" onclick="editLead('${lead.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteLead('${lead.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getStatusColor(status) {
        const colors = {
            'new': 'primary',
            'contacted': 'warning',
            'qualified': 'info',
            'proposal_sent': 'warning',
            'won': 'success',
            'lost': 'danger'
        };
        return colors[status] || 'secondary';
    }

    formatService(service) {
        const services = {
            'web_development': 'Web Development',
            'mobile_app': 'Mobile App',
            'digital_marketing': 'Digital Marketing',
            'seo': 'SEO',
            'consulting': 'Consulting'
        };
        return services[service] || service || 'N/A';
    }

    formatStatus(status) {
        const statuses = {
            'new': 'New',
            'contacted': 'Contacted',
            'qualified': 'Qualified',
            'proposal_sent': 'Proposal Sent',
            'won': 'Won',
            'lost': 'Lost'
        };
        return statuses[status] || status || 'New';
    }

    formatSource(source) {
        const sources = {
            'website': 'Website',
            'social_media': 'Social Media',
            'referral': 'Referral',
            'email': 'Email',
            'phone': 'Phone'
        };
        return sources[source] || source || 'N/A';
    }

    formatBudget(budget) {
        const budgets = {
            'under_5k': 'Under $5,000',
            '5k_10k': '$5,000 - $10,000',
            '10k_25k': '$10,000 - $25,000',
            '25k_50k': '$25,000 - $50,000',
            'over_50k': 'Over $50,000'
        };
        return budgets[budget] || budget || 'N/A';
    }

    formatTimeline(timeline) {
        const timelines = {
            'immediate': 'Immediate',
            '1_month': '1 Month',
            '3_months': '3 Months',
            '6_months': '6 Months',
            'flexible': 'Flexible'
        };
        return timelines[timeline] || timeline || 'N/A';
    }

    setupEventListeners() {
        // Filter leads
        document.getElementById('leadStatusFilter')?.addEventListener('change', () => {
            this.filterLeads();
        });

        document.getElementById('leadSourceFilter')?.addEventListener('change', () => {
            this.filterLeads();
        });

        document.getElementById('leadServiceFilter')?.addEventListener('change', () => {
            this.filterLeads();
        });

        document.getElementById('leadSearchFilter')?.addEventListener('input', () => {
            this.filterLeads();
        });
    }

    filterLeads() {
        const statusFilter = document.getElementById('leadStatusFilter')?.value || '';
        const sourceFilter = document.getElementById('leadSourceFilter')?.value || '';
        const serviceFilter = document.getElementById('leadServiceFilter')?.value || '';
        const searchFilter = document.getElementById('leadSearchFilter')?.value || '';

        this.filteredLeads = this.leads.filter(lead => {
            // Status filter
            if (statusFilter && lead.status !== statusFilter) return false;
            
            // Source filter
            if (sourceFilter && lead.source !== sourceFilter) return false;
            
            // Service filter
            if (serviceFilter && lead.service !== serviceFilter) return false;
            
            // Search filter
            if (searchFilter) {
                const searchTerm = searchFilter.toLowerCase();
                const searchableFields = [
                    lead.name || '',
                    lead.email || '',
                    lead.company || '',
                    lead.service || '',
                    lead.message || ''
                ].join(' ').toLowerCase();
                
                if (!searchableFields.includes(searchTerm)) return false;
            }
            
            return true;
        });

        this.updateLeadsDisplay();
    }

    async addLead(leadData) {
        try {
            // Add required fields
            const newLead = {
                id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                ...leadData,
                status: 'new',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Use localStorage
            this.leads.unshift(newLead);
            localStorage.setItem('leadManagementData', JSON.stringify(this.leads));
            this.filteredLeads = [...this.leads];
            this.updateLeadsDisplay();
            return true;
        } catch (error) {
            console.error('Error adding lead:', error);
            showNotification('Error adding lead: ' + error.message, 'error');
            return false;
        }
    }

    async updateLead(leadId, updateData) {
        try {
            const leadIndex = this.leads.findIndex(lead => lead.id === leadId);
            if (leadIndex === -1) {
                throw new Error('Lead not found');
            }

            const updatedLead = {
                ...this.leads[leadIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            // Use localStorage
            this.leads[leadIndex] = updatedLead;
            localStorage.setItem('leadManagementData', JSON.stringify(this.leads));
            this.filteredLeads = [...this.leads];
            this.updateLeadsDisplay();
            return true;
        } catch (error) {
            console.error('Error updating lead:', error);
            showNotification('Error updating lead: ' + error.message, 'error');
            return false;
        }
    }

    async deleteLead(leadId) {
        if (!confirm('Are you sure you want to delete this lead?')) {
            return false;
        }

        try {
            // Use localStorage
            this.leads = this.leads.filter(lead => lead.id !== leadId);
            localStorage.setItem('leadManagementData', JSON.stringify(this.leads));
            this.filteredLeads = [...this.leads];
            this.updateLeadsDisplay();
            return true;
        } catch (error) {
            console.error('Error deleting lead:', error);
            showNotification('Error deleting lead: ' + error.message, 'error');
            return false;
        }
    }
}

// Global leads page instance
let leadsPage;

// Global functions for leads page
function showAddLeadModal() {
    const modal = new bootstrap.Modal(document.getElementById('addLeadModal'));
    modal.show();
}

async function addNewLead() {
    const leadData = {
        name: document.getElementById('newLeadName').value,
        email: document.getElementById('newLeadEmail').value,
        phone: document.getElementById('newLeadPhone').value,
        company: document.getElementById('newLeadCompany').value,
        service: document.getElementById('newLeadService').value,
        source: document.getElementById('newLeadSource').value,
        budget: document.getElementById('newLeadBudget').value,
        timeline: document.getElementById('newLeadTimeline').value,
        message: document.getElementById('newLeadMessage').value
    };

    if (leadsPage && await leadsPage.addLead(leadData)) {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addLeadModal'));
        modal.hide();
        
        // Clear form
        document.getElementById('addLeadForm').reset();
        
        showNotification('Lead added successfully!', 'success');
    }
}

function viewLead(leadId) {
    const lead = leadsPage?.leads.find(l => l.id === leadId);
    if (!lead) {
        showNotification('Lead not found!', 'error');
        return;
    }

    // For now, just show lead details in an alert
    // In a real app, you'd open a modal with detailed view
    alert(`
Lead Details:
Name: ${lead.name}
Email: ${lead.email}
Company: ${lead.company}
Service: ${leadsPage.formatService(lead.service)}
Status: ${leadsPage.formatStatus(lead.status)}
Source: ${leadsPage.formatSource(lead.source)}
Budget: ${leadsPage.formatBudget(lead.budget)}
Timeline: ${leadsPage.formatTimeline(lead.timeline)}
Message: ${lead.message || 'No message'}
    `);
}

function editLead(leadId) {
    const lead = leadsPage?.leads.find(l => l.id === leadId);
    if (!lead) {
        showNotification('Lead not found!', 'error');
        return;
    }

    // For now, just show an alert
    // In a real app, you'd open an edit modal
    alert('Edit functionality would open a modal here for lead: ' + lead.name);
}

async function deleteLead(leadId) {
    if (leadsPage && await leadsPage.deleteLead(leadId)) {
        showNotification('Lead deleted successfully!', 'success');
    }
}

function exportLeads() {
    if (!leadsPage?.leads.length) {
        showNotification('No leads to export!', 'warning');
        return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + 
        'Name,Email,Phone,Company,Service,Status,Source,Budget,Timeline,Message\n' +
        leadsPage.leads.map(lead => 
            `"${lead.name || ''}","${lead.email || ''}","${lead.phone || ''}","${lead.company || ''}","${lead.service || ''}","${lead.status || ''}","${lead.source || ''}","${lead.budget || ''}","${lead.timeline || ''}","${lead.message || ''}"`
        ).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'leads_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Leads exported successfully!', 'success');
}

function importLeads() {
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
                
                const importedLeads = [];
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) {
                        const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
                        const lead = {};
                        headers.forEach((header, index) => {
                            lead[header.toLowerCase()] = values[index] || '';
                        });
                        if (lead.name && lead.email) {
                            importedLeads.push(lead);
                        }
                    }
                }

                if (importedLeads.length > 0) {
                    // Add imported leads
                    importedLeads.forEach(lead => {
                        leadsPage?.addLead(lead);
                    });
                    showNotification(`${importedLeads.length} leads imported successfully!`, 'success');
                } else {
                    showNotification('No valid leads found in the file!', 'error');
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

// Initialize leads page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing leads page...');
    leadsPage = new LeadsPage();
    console.log('Leads page initialized:', leadsPage);
}); 