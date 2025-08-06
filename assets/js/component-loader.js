// Component Loader for Reusable HTML Components
// This allows us to include components like the consultation CTA section dynamically

class ComponentLoader {
    constructor() {
        this.components = {};
    }

    // Load a component from a file and insert it into the DOM
    async loadComponent(componentName, targetSelector, position = 'beforeend') {
        try {
            // Check if component is already cached
            if (this.components[componentName]) {
                this.insertComponent(this.components[componentName], targetSelector, position);
                return;
            }

            // Load component from file
            const response = await fetch(`assets/components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}`);
            }

            const html = await response.text();
            
            // Cache the component
            this.components[componentName] = html;
            
            // Insert the component
            this.insertComponent(html, targetSelector, position);
            
            console.log(`Component loaded: ${componentName}`);
            
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
        }
    }

    // Insert component HTML into the DOM
    insertComponent(html, targetSelector, position) {
        const target = document.querySelector(targetSelector);
        if (!target) {
            console.error(`Target element not found: ${targetSelector}`);
            return;
        }

        // Create a temporary container to parse the HTML
        const temp = document.createElement('div');
        temp.innerHTML = html.trim();

        // Insert the component
        switch (position) {
            case 'beforebegin':
                target.insertAdjacentHTML('beforebegin', html);
                break;
            case 'afterbegin':
                target.insertAdjacentHTML('afterbegin', html);
                break;
            case 'beforeend':
                target.insertAdjacentHTML('beforeend', html);
                break;
            case 'afterend':
                target.insertAdjacentHTML('afterend', html);
                break;
            default:
                target.insertAdjacentHTML('beforeend', html);
        }
    }

    // Load consultation CTA section before footer
    loadConsultationCTA() {
        this.loadComponent('consultation-cta', 'footer.infetech-footer-area', 'beforebegin');
    }

    // Load multiple components
    async loadComponents(components) {
        for (const component of components) {
            await this.loadComponent(component.name, component.target, component.position);
        }
    }
}

// Initialize component loader
const componentLoader = new ComponentLoader();

// Auto-load consultation CTA when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load consultation CTA section before footer
    componentLoader.loadConsultationCTA();
});

// Export for manual use
window.ComponentLoader = ComponentLoader;
window.componentLoader = componentLoader; 