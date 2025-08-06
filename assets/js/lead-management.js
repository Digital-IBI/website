/**
 * Lead Management System
 * Handles leads from landing pages and CTAs
 */

class LeadManagement {
    constructor() {
        this.leads = [];
        this.sources = ['landing_page', 'cta_button', 'contact_form', 'consultation_modal'];
        this.statuses = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
        this.services = ['app_development', 'digital_marketing', 'custom_software', 'seo_services', 'whatsapp_marketing'];
        this.init();
    }

    init() {
        this.loadLeads();
        this.setupEventListeners();
    }

    // Load leads from localStorage
    loadLeads() {
        const savedLeads = localStorage.getItem('leadManagementData');
        if (savedLeads) {
            this.leads = JSON.parse(savedLeads);
        } else {
            // Load sample data
            this.leads = this.getSampleLeads();
            this.saveLeads();
        }
    }

    // Save leads to localStorage
    saveLeads() {
        localStorage.setItem('leadManagementData', JSON.stringify(this.leads));
    }

    // Get sample leads for demonstration
    getSampleLeads() {
        return [
            {
                id: 'lead_001',
                name: 'John Smith',
                email: 'john.smith@company.com',
                phone: '+1-555-0123',
                company: 'TechStart Inc.',
                service: 'app_development',
                source: 'landing_page',
                status: 'new',
                message: 'Looking for a mobile app for our startup. Need iOS and Android versions.',
                budget: '$10,000 - $25,000',
                timeline: '3-6 months',
                createdAt: '2024-01-15T10:30:00Z',
                lastContacted: null,
                notes: 'Interested in MVP development',
                tags: ['startup', 'mobile', 'mvp'],
                utmSource: 'google',
                utmMedium: 'cpc',
                utmCampaign: 'app_dev_2024',
                pageUrl: '/app-development-landing.html',
                ipAddress: '192.168.1.100',
                location: 'San Francisco, CA',
                device: 'desktop',
                browser: 'Chrome'
            },
            {
                id: 'lead_002',
                name: 'Sarah Johnson',
                email: 'sarah.j@marketingpro.com',
                phone: '+1-555-0456',
                company: 'Marketing Pro LLC',
                service: 'digital_marketing',
                source: 'cta_button',
                status: 'contacted',
                message: 'Need help with SEO and social media marketing for our e-commerce site.',
                budget: '$5,000 - $15,000',
                timeline: '1-3 months',
                createdAt: '2024-01-14T14:20:00Z',
                lastContacted: '2024-01-15T09:15:00Z',
                notes: 'Follow up scheduled for next week',
                tags: ['ecommerce', 'seo', 'social_media'],
                utmSource: 'facebook',
                utmMedium: 'social',
                utmCampaign: 'digital_marketing_2024',
                pageUrl: '/digital-marketing-landing.html',
                ipAddress: '192.168.1.101',
                location: 'New York, NY',
                device: 'mobile',
                browser: 'Safari'
            },
            {
                id: 'lead_003',
                name: 'Mike Chen',
                email: 'mike.chen@enterprise.com',
                phone: '+1-555-0789',
                company: 'Enterprise Solutions Corp',
                service: 'custom_software',
                source: 'consultation_modal',
                status: 'qualified',
                message: 'Looking for custom ERP system integration with existing infrastructure.',
                budget: '$50,000 - $100,000',
                timeline: '6-12 months',
                createdAt: '2024-01-13T16:45:00Z',
                lastContacted: '2024-01-14T11:30:00Z',
                notes: 'Technical requirements discussed, proposal in progress',
                tags: ['enterprise', 'erp', 'integration'],
                utmSource: 'linkedin',
                utmMedium: 'social',
                utmCampaign: 'enterprise_solutions_2024',
                pageUrl: '/custom-software-development.html',
                ipAddress: '192.168.1.102',
                location: 'Chicago, IL',
                device: 'desktop',
                browser: 'Firefox'
            }
        ];
    }

    // Add new lead
    addLead(leadData) {
        const lead = {
            id: 'lead_' + Date.now(),
            ...leadData,
            createdAt: new Date().toISOString(),
            lastContacted: null,
            status: 'new',
            notes: '',
            tags: []
        };

        this.leads.unshift(lead);
        this.saveLeads();
        this.updateLeadTable();
        this.updateLeadStats();

        return lead;
    }

    // Update lead
    updateLead(leadId, updates) {
        const leadIndex = this.leads.findIndex(lead => lead.id === leadId);
        if (leadIndex !== -1) {
            this.leads[leadIndex] = { ...this.leads[leadIndex], ...updates };
            this.saveLeads();
            this.updateLeadTable();
            this.updateLeadStats();
            return true;
        }
        return false;
    }

    // Delete lead
    deleteLead(leadId) {
        const leadIndex = this.leads.findIndex(lead => lead.id === leadId);
        if (leadIndex !== -1) {
            this.leads.splice(leadIndex, 1);
            this.saveLeads();
            this.updateLeadTable();
            this.updateLeadStats();
            return true;
        }
        return false;
    }

    // Get lead by ID
    getLead(leadId) {
        return this.leads.find(lead => lead.id === leadId);
    }

    // Filter leads
    filterLeads(filters = {}) {
        return this.leads.filter(lead => {
            const statusMatch = !filters.status || lead.status === filters.status;
            const sourceMatch = !filters.source || lead.source === filters.source;
            const serviceMatch = !filters.service || lead.service === filters.service;
            const searchMatch = !filters.search || 
                lead.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                lead.email.toLowerCase().includes(filters.search.toLowerCase()) ||
                lead.company.toLowerCase().includes(filters.search.toLowerCase());

            return statusMatch && sourceMatch && serviceMatch && searchMatch;
        });
    }

    // Update lead table
    updateLeadTable() {
        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) return;

        let html = '';
        this.leads.forEach(lead => {
            const statusClass = this.getStatusClass(lead.status);
            const sourceIcon = this.getSourceIcon(lead.source);
            const serviceBadge = this.getServiceBadge(lead.service);

            html += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar me-2">
                                <i class="fas fa-user-circle fa-2x text-primary"></i>
                            </div>
                            <div>
                                <div class="fw-bold">${lead.name}</div>
                                <small class="text-muted">${lead.email}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="fw-bold">${lead.company}</div>
                        <small class="text-muted">${lead.phone}</small>
                    </td>
                    <td>
                        ${serviceBadge}
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">${lead.status.replace('_', ' ')}</span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <i class="fas ${sourceIcon} me-2"></i>
                            <span>${lead.source.replace('_', ' ')}</span>
                        </div>
                    </td>
                    <td>
                        <div class="fw-bold">${lead.budget}</div>
                        <small class="text-muted">${lead.timeline}</small>
                    </td>
                    <td>
                        ${new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary" onclick="leadManager.viewLead('${lead.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="leadManager.editLead('${lead.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="leadManager.deleteLead('${lead.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    // Update lead statistics
    updateLeadStats() {
        const totalLeads = this.leads.length;
        const newLeads = this.leads.filter(lead => lead.status === 'new').length;
        const qualifiedLeads = this.leads.filter(lead => lead.status === 'qualified').length;
        const wonLeads = this.leads.filter(lead => lead.status === 'won').length;

        // Update stats in UI
        const statsElements = {
            'totalLeads': totalLeads,
            'newLeads': newLeads,
            'qualifiedLeads': qualifiedLeads,
            'wonLeads': wonLeads
        };

        Object.keys(statsElements).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = statsElements[key];
            }
        });
    }

    // Get status class for styling
    getStatusClass(status) {
        const statusClasses = {
            'new': 'status-active',
            'contacted': 'status-warning',
            'qualified': 'status-info',
            'proposal_sent': 'status-warning',
            'won': 'status-success',
            'lost': 'status-inactive'
        };
        return statusClasses[status] || 'status-active';
    }

    // Get source icon
    getSourceIcon(source) {
        const sourceIcons = {
            'landing_page': 'fa-globe',
            'cta_button': 'fa-mouse-pointer',
            'contact_form': 'fa-envelope',
            'consultation_modal': 'fa-comments'
        };
        return sourceIcons[source] || 'fa-question';
    }

    // Get service badge
    getServiceBadge(service) {
        const serviceNames = {
            'app_development': 'App Development',
            'digital_marketing': 'Digital Marketing',
            'custom_software': 'Custom Software',
            'seo_services': 'SEO Services',
            'whatsapp_marketing': 'WhatsApp Marketing'
        };
        return `<span class="badge bg-primary">${serviceNames[service] || service}</span>`;
    }

    // View lead details
    viewLead(leadId) {
        const lead = this.getLead(leadId);
        if (!lead) return;

        // Populate modal with lead details
        document.getElementById('leadName').textContent = lead.name;
        document.getElementById('leadEmail').textContent = lead.email;
        document.getElementById('leadPhone').textContent = lead.phone;
        document.getElementById('leadCompany').textContent = lead.company;
        document.getElementById('leadService').textContent = lead.service.replace('_', ' ');
        document.getElementById('leadSource').textContent = lead.source.replace('_', ' ');
        document.getElementById('leadStatus').textContent = lead.status.replace('_', ' ');
        document.getElementById('leadBudget').textContent = lead.budget;
        document.getElementById('leadTimeline').textContent = lead.timeline;
        document.getElementById('leadMessage').textContent = lead.message;
        document.getElementById('leadNotes').textContent = lead.notes;
        document.getElementById('leadCreated').textContent = new Date(lead.createdAt).toLocaleString();
        document.getElementById('leadLastContacted').textContent = lead.lastContacted ? new Date(lead.lastContacted).toLocaleString() : 'Not contacted yet';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('viewLeadModal'));
        modal.show();
    }

    // Edit lead
    editLead(leadId) {
        const lead = this.getLead(leadId);
        if (!lead) return;

        // Populate edit form
        document.getElementById('editLeadId').value = lead.id;
        document.getElementById('editLeadName').value = lead.name;
        document.getElementById('editLeadEmail').value = lead.email;
        document.getElementById('editLeadPhone').value = lead.phone;
        document.getElementById('editLeadCompany').value = lead.company;
        document.getElementById('editLeadService').value = lead.service;
        document.getElementById('editLeadStatus').value = lead.status;
        document.getElementById('editLeadBudget').value = lead.budget;
        document.getElementById('editLeadTimeline').value = lead.timeline;
        document.getElementById('editLeadMessage').value = lead.message;
        document.getElementById('editLeadNotes').value = lead.notes;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editLeadModal'));
        modal.show();
    }

    // Save edited lead
    saveEditedLead() {
        const leadId = document.getElementById('editLeadId').value;
        const updates = {
            name: document.getElementById('editLeadName').value,
            email: document.getElementById('editLeadEmail').value,
            phone: document.getElementById('editLeadPhone').value,
            company: document.getElementById('editLeadCompany').value,
            service: document.getElementById('editLeadService').value,
            status: document.getElementById('editLeadStatus').value,
            budget: document.getElementById('editLeadBudget').value,
            timeline: document.getElementById('editLeadTimeline').value,
            message: document.getElementById('editLeadMessage').value,
            notes: document.getElementById('editLeadNotes').value,
            lastContacted: new Date().toISOString()
        };

        if (this.updateLead(leadId, updates)) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editLeadModal'));
            modal.hide();
            showNotification('Lead updated successfully!', 'success');
        } else {
            showNotification('Error updating lead!', 'error');
        }
    }

    // Delete lead
    deleteLead(leadId) {
        if (confirm('Are you sure you want to delete this lead?')) {
            if (this.deleteLead(leadId)) {
                showNotification('Lead deleted successfully!', 'success');
            } else {
                showNotification('Error deleting lead!', 'error');
            }
        }
    }

    // Export leads
    exportLeads() {
        const dataStr = JSON.stringify(this.leads, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'leads-export.json';
        link.click();
        
        URL.revokeObjectURL(url);
        showNotification('Leads exported successfully!', 'success');
    }

    // Import leads
    importLeads() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedLeads = JSON.parse(e.target.result);
                        this.leads = [...this.leads, ...importedLeads];
                        this.saveLeads();
                        this.updateLeadTable();
                        this.updateLeadStats();
                        showNotification('Leads imported successfully!', 'success');
                    } catch (error) {
                        showNotification('Error importing leads!', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // Setup event listeners
    setupEventListeners() {
        // Filter leads
        document.getElementById('leadStatusFilter')?.addEventListener('change', () => {
            this.filterLeadsTable();
        });

        document.getElementById('leadSourceFilter')?.addEventListener('change', () => {
            this.filterLeadsTable();
        });

        document.getElementById('leadSearchFilter')?.addEventListener('input', () => {
            this.filterLeadsTable();
        });
    }

    // Filter leads table
    filterLeadsTable() {
        const status = document.getElementById('leadStatusFilter').value;
        const source = document.getElementById('leadSourceFilter').value;
        const search = document.getElementById('leadSearchFilter').value;

        const filteredLeads = this.filterLeads({ status, source, search });
        this.updateLeadTableWithData(filteredLeads);
    }

    // Update table with specific data
    updateLeadTableWithData(leads) {
        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) return;

        let html = '';
        leads.forEach(lead => {
            const statusClass = this.getStatusClass(lead.status);
            const sourceIcon = this.getSourceIcon(lead.source);
            const serviceBadge = this.getServiceBadge(lead.service);

            html += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar me-2">
                                <i class="fas fa-user-circle fa-2x text-primary"></i>
                            </div>
                            <div>
                                <div class="fw-bold">${lead.name}</div>
                                <small class="text-muted">${lead.email}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="fw-bold">${lead.company}</div>
                        <small class="text-muted">${lead.phone}</small>
                    </td>
                    <td>
                        ${serviceBadge}
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">${lead.status.replace('_', ' ')}</span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <i class="fas ${sourceIcon} me-2"></i>
                            <span>${lead.source.replace('_', ' ')}</span>
                        </div>
                    </td>
                    <td>
                        <div class="fw-bold">${lead.budget}</div>
                        <small class="text-muted">${lead.timeline}</small>
                    </td>
                    <td>
                        ${new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary" onclick="leadManager.viewLead('${lead.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="leadManager.editLead('${lead.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="leadManager.deleteLead('${lead.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }
}

// Global lead manager instance
const leadManager = new LeadManagement();

// Global functions for button onclick handlers
function viewLead(leadId) {
    leadManager.viewLead(leadId);
}

function editLead(leadId) {
    leadManager.editLead(leadId);
}

function deleteLead(leadId) {
    leadManager.deleteLead(leadId);
}

function saveEditedLead() {
    leadManager.saveEditedLead();
}

function exportLeads() {
    leadManager.exportLeads();
}

function importLeads() {
    leadManager.importLeads();
} 