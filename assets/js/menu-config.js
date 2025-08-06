/**
 * Modular Menu Configuration for Digital IBI Technologies
 * This file contains the menu structure and functions to render menus consistently across all pages
 */

const MenuConfig = {
    // Main menu structure
    mainMenu: {
        home: {
            title: "Home",
            url: "index.html",
            hasSubmenu: false
        },
        domains: {
            title: "Domains",
            url: "#",
            hasSubmenu: true,
            submenu: [
                {
                    title: "Ecommerce Solutions",
                    url: "domains/ecommerce-solutions.html",
                    description: "Digital solutions for online stores"
                },
                {
                    title: "FMCG Solutions",
                    url: "domains/fmcg-solutions.html",
                    description: "Consumer goods digital transformation"
                },
                {
                    title: "Electricals Solutions",
                    url: "domains/electricals-solutions.html",
                    description: "Electrical industry solutions"
                },
                {
                    title: "Logistics Solutions",
                    url: "domains/logistics-solutions.html",
                    description: "Supply chain and logistics solutions"
                },
                {
                    title: "Startups Solutions",
                    url: "domains/startups-solutions.html",
                    description: "Startup growth and development"
                },
                {
                    title: "MSME Solutions",
                    url: "domains/msme-solutions.html",
                    description: "Small and medium business solutions"
                }
            ]
        },
        services: {
            title: "Services",
            url: "#",
            hasSubmenu: true,
            submenu: [
                {
                    title: "Custom Software Development",
                    url: "services/custom-software-development.html",
                    description: "Tailored software solutions"
                },
                {
                    title: "App Development",
                    url: "services/app-development.html",
                    description: "Mobile and web applications"
                },
                {
                    title: "SEO Services",
                    url: "services/seo-services.html",
                    description: "Search engine optimization"
                },
                {
                    title: "SEM Services",
                    url: "services/sem-services.html",
                    description: "Search engine marketing"
                },
                {
                    title: "WhatsApp Marketing",
                    url: "services/whatsapp-marketing.html",
                    description: "WhatsApp business solutions"
                },
                {
                    title: "Social Media Management",
                    url: "services/social-media-management.html",
                    description: "Social media marketing"
                },
                {
                    title: "Digital Growth Consultancy",
                    url: "services/digital-growth-consultancy.html",
                    description: "Growth strategy consulting"
                },
                {
                    title: "B2B Digital Marketing",
                    url: "services/b2b-digital-marketing.html",
                    description: "B2B marketing solutions"
                },
                {
                    title: "Ecommerce SEO",
                    url: "services/ecommerce-seo.html",
                    description: "Ecommerce search optimization"
                },
                {
                    title: "Ecommerce CRO",
                    url: "services/ecommerce-cro.html",
                    description: "Conversion rate optimization"
                },
                {
                    title: "Email Marketing Services",
                    url: "services/email-marketing-services.html",
                    description: "Email marketing campaigns"
                },
                {
                    title: "Startup Growth Services",
                    url: "services/startup-growth-services.html",
                    description: "Startup development services"
                },
                {
                    title: "MSME Growth Strategy",
                    url: "services/msme-growth-strategy.html",
                    description: "MSME growth consulting"
                }
            ]
        },
        products: {
            title: "Products",
            url: "#",
            hasSubmenu: true,
            submenu: [
                {
                    title: "AI Asset Tracking",
                    url: "products/ai-asset-tracking.html",
                    description: "Intelligent asset management"
                },
                {
                    title: "AI Loyalty Tech",
                    url: "products/ai-loyalty-tech.html",
                    description: "Customer loyalty platform"
                },
                {
                    title: "Custom Search Engine",
                    url: "products/custom-search-engine.html",
                    description: "Lightweight search solution"
                },
                {
                    title: "WhatsApp Marketing App",
                    url: "products/whatsapp-marketing-app.html",
                    description: "WhatsApp marketing platform"
                },
                {
                    title: "AI Sales LMS",
                    url: "products/ai-sales-lms.html",
                    description: "Sales training platform"
                }
            ]
        },
        about: {
            title: "About",
            url: "about.html",
            hasSubmenu: false
        },
        caseStudies: {
            title: "Case Studies",
            url: "projects.html",
            hasSubmenu: false
        },
        contact: {
            title: "Contact",
            url: "contact.html",
            hasSubmenu: false
        }
    },

    // Function to render the main navigation menu
    getPrefix: function(){
        const path = window.location.pathname;
        return (path.includes('/services/') || path.includes('/products/') || path.includes('/domains/')) ? '../' : '';
    },

    renderMainMenu: function() {
        // Try to find menu container in both header types
        let menuContainer = document.querySelector('.header-main-nav-box');
        if (!menuContainer) return;

        let menuHTML = '<ul>';
        
        // Add each menu item
        Object.keys(this.mainMenu).forEach(key => {
            const item = this.mainMenu[key];
            
            if (item.hasSubmenu) {
                menuHTML += `
                    <li>
                        <a href="${item.hasSubmenu ? '#' : this.getPrefix() + item.url}">${item.title}</a>
                        <ul class="sub-menu">
                `;
                
                item.submenu.forEach(subItem => {
                    menuHTML += `
                        <li><a href="${this.getPrefix()}${subItem.url}">${subItem.title}</a></li>
                    `;
                });
                
                menuHTML += '</ul></li>';
            } else {
                menuHTML += `
                    <li>
                        <a href="${item.hasSubmenu ? '#' : this.getPrefix() + item.url}">${item.title}</a>
                    </li>
                `;
            }
        });
        
        menuHTML += '</ul>';
        menuContainer.innerHTML = menuHTML;
        // Disable default navigation on parent menu items
        menuContainer.querySelectorAll('a[href="#"]').forEach(l => l.addEventListener('click', e => e.preventDefault()));
        
        // Initialize dropdown functionality if Bootstrap is available
        if (typeof bootstrap !== 'undefined') {
            const dropdowns = menuContainer.querySelectorAll('.dropdown-toggle');
            dropdowns.forEach(dropdown => {
                new bootstrap.Dropdown(dropdown);
            });
        }
    },

    // Function to render mobile menu
    renderMobileMenu: function() {
        const mobileMenuContainer = document.querySelector('.offcanvas_main_menu');
        if (!mobileMenuContainer) return;

        let mobileMenuHTML = '';
        
        // Add each menu item for mobile
        Object.keys(this.mainMenu).forEach(key => {
            const item = this.mainMenu[key];
            
            if (item.hasSubmenu) {
                mobileMenuHTML += `
                    <li>
                        <a href="${item.hasSubmenu ? '#' : this.getPrefix() + item.url}">${item.title}</a>
                        <span class="menu-expand"><i class="fa fa-angle-down"></i></span>
                        <ul class="sub-menu">
                `;
                
                item.submenu.forEach(subItem => {
                    mobileMenuHTML += `
                        <li><a href="${this.getPrefix()}${subItem.url}">${subItem.title}</a></li>
                    `;
                });
                
                mobileMenuHTML += '</ul></li>';
            } else {
                mobileMenuHTML += `
                    <li>
                        <a href="${item.hasSubmenu ? '#' : this.getPrefix() + item.url}">${item.title}</a>
                    </li>
                `;
            }
        });
        
        mobileMenuContainer.innerHTML = mobileMenuHTML;
    },

    // Footer configuration
    footerConfig: {
        company: {
            name: "Digital IBI Technologies",
            description: "Leading digital transformation company offering comprehensive digital solutions for businesses.",
            logo: "assets/images/logo-white.png",
            phone: "+1 (234) 567-890",
            email: "info@digitalibi.com",
            address: "India | USA | Ireland | Singapore"
        },
        socialLinks: [
            { platform: "facebook-f", url: "#" },
            { platform: "twitter", url: "#" },
            { platform: "linkedin-in", url: "#" },
            { platform: "instagram", url: "#" }
        ],
        quickLinks: [
            { title: "Home", url: "index.html" },
            { title: "About", url: "about.html" },
            { title: "Services", url: "custom-software-development.html" },
            { title: "Contact", url: "contact.html" }
        ],
        services: [
            { title: "Custom Software Development", url: "custom-software-development.html" },
            { title: "App Development", url: "app-development.html" },
            { title: "SEO Services", url: "seo-services.html" },
            { title: "WhatsApp Marketing", url: "whatsapp-marketing.html" }
        ]
    },

    // Function to render footer menu
    renderFooterMenu: function() {
        const footerMenuContainer = document.querySelector('.footer-widget ul');
        if (!footerMenuContainer) return;

        let footerMenuHTML = '';
        
        // Add main menu items to footer
        Object.keys(this.mainMenu).forEach(key => {
            const item = this.mainMenu[key];
            if (key !== 'home') { // Skip home in footer
                footerMenuHTML += `<li><a href="${item.hasSubmenu ? '#' : this.getPrefix() + item.url}">${item.title}</a></li>`;
            }
        });
        
        footerMenuContainer.innerHTML = footerMenuHTML;
    },

    // Function to render complete footer
    renderFooter: function() {
        const footerContainer = document.querySelector('.infetech-footer-area .container');
        if (!footerContainer) {
            console.log('Footer container not found');
            return;
        }

        const prefix = this.getPrefix();
        const config = this.footerConfig;

        let footerHTML = `
            <div class="row">
                <div class="col-lg-4 col-md-6">
                    <div class="footer-about">
                        <div class="logo">
                            <a href="${prefix}index.html"><img src="${prefix}${config.company.logo}" alt="logo"></a>
                        </div>
                        <p>${config.company.description}</p>
                        <div class="social-box">
                            <ul>
        `;

        // Add social links
        config.socialLinks.forEach(social => {
            footerHTML += `<li><a href="${social.url}"><i class="fab fa-${social.platform}"></i></a></li>`;
        });

        footerHTML += `
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-6">
                    <div class="footer-link">
                        <h4 class="title">Quick Links</h4>
                        <ul>
        `;

        // Add quick links
        config.quickLinks.forEach(link => {
            footerHTML += `<li><a href="${prefix}${link.url}">${link.title}</a></li>`;
        });

        footerHTML += `
                        </ul>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="footer-link">
                        <h4 class="title">Services</h4>
                        <ul>
        `;

        // Add services
        config.services.forEach(service => {
            footerHTML += `<li><a href="${prefix}${service.url}">${service.title}</a></li>`;
        });

        footerHTML += `
                        </ul>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="footer-info">
                        <h4 class="title">Contact</h4>
                        <ul>
                            <li><i class="fas fa-phone"></i><span>${config.company.phone}</span></li>
                            <li><i class="fas fa-envelope"></i><span>${config.company.email}</span></li>
                            <li><i class="fas fa-map-marker"></i><span>${config.company.address}</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        footerContainer.innerHTML = footerHTML;
    },

    // Function to render footer copyright
    renderFooterCopyright: function() {
        const copyrightContainer = document.querySelector('.footer-copyright');
        if (!copyrightContainer) {
            console.log('Copyright container not found');
            return;
        }

        const config = this.footerConfig;
        const currentYear = new Date().getFullYear();

        let copyrightHTML = `
            <p>© All Copyright ${currentYear} by <a href="mailto:${config.company.email}">${config.company.name}</a></p>
        `;

        copyrightContainer.innerHTML = copyrightHTML;
    },

    // Function to initialize all menus
    init: function() {
        console.log('MenuConfig.init() called');
        this.renderMainMenu();
        this.renderMobileMenu();
        this.renderFooterMenu();
        this.renderFooter();
        this.renderFooterCopyright();
        
        // Add active class to current page
        this.setActiveMenuItem();
    },

    // Function to set active menu item based on current page
    setActiveMenuItem: function() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Find the menu item that matches the current page
        Object.keys(this.mainMenu).forEach(key => {
            const item = this.mainMenu[key];
            
            if (item.url === currentPage) {
                // Add active class to main menu item
                const menuLink = document.querySelector(`.header-main-nav-box a[href$="${item.url}"]`);
                if (menuLink) {
                    menuLink.parentElement.classList.add('active');
                }
            } else if (item.hasSubmenu) {
                // Check submenu items
                item.submenu.forEach(subItem => {
                    if (subItem.url === currentPage) {
                        // Add active class to parent dropdown
                        const dropdownLink = document.querySelector(`.header-main-nav-box a[href$="${item.url}"]`);
                        if (dropdownLink) {
                            dropdownLink.parentElement.classList.add('active');
                        }
                    }
                });
            }
        });
    },

    // Function to add new menu items dynamically
    addMenuItem: function(category, item) {
        if (this.mainMenu[category] && this.mainMenu[category].hasSubmenu) {
            this.mainMenu[category].submenu.push(item);
        }
    },

    // Function to update menu structure
    updateMenu: function(newMenuStructure) {
        this.mainMenu = { ...this.mainMenu, ...newMenuStructure };
        this.init();
    }
};

// Initialize menu when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    MenuConfig.init();
});

// Also try to initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading
} else {
    // DOM is already loaded
    MenuConfig.init();
}

// Make MenuConfig available globally
window.MenuConfig = MenuConfig; 