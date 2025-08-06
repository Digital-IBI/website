// IP Geolocation Engine
// Handles IP address detection, geolocation lookup, and location-based personalization

class IPGeolocation {
    constructor() {
        this.userIP = null;
        this.userLocation = null;
        this.cache = {};
        this.isInitialized = false;
        this.debugMode = window.DYNAMIC_DEBUG || false;
        
        // Sample IP database (you'll replace this with your actual database)
        this.ipDatabase = this.initializeIPDatabase();
    }

    // Initialize IP database with sample data (replace with your actual database)
    initializeIPDatabase() {
        return [
            // Mumbai IP ranges
            { start: '103.21.244.0', end: '103.21.247.255', city: 'Mumbai', state: 'Maharashtra', country: 'India', isp: 'business' },
            { start: '103.22.200.0', end: '103.22.203.255', city: 'Mumbai', state: 'Maharashtra', country: 'India', isp: 'business' },
            { start: '103.23.100.0', end: '103.23.103.255', city: 'Mumbai', state: 'Maharashtra', country: 'India', isp: 'residential' },
            
            // Delhi IP ranges
            { start: '103.24.100.0', end: '103.24.103.255', city: 'Delhi', state: 'Delhi', country: 'India', isp: 'business' },
            { start: '103.25.200.0', end: '103.25.203.255', city: 'Delhi', state: 'Delhi', country: 'India', isp: 'residential' },
            { start: '103.26.100.0', end: '103.26.103.255', city: 'Delhi', state: 'Delhi', country: 'India', isp: 'business' },
            
            // Bangalore IP ranges
            { start: '103.27.100.0', end: '103.27.103.255', city: 'Bangalore', state: 'Karnataka', country: 'India', isp: 'business' },
            { start: '103.28.200.0', end: '103.28.203.255', city: 'Bangalore', state: 'Karnataka', country: 'India', isp: 'residential' },
            { start: '103.29.100.0', end: '103.29.103.255', city: 'Bangalore', state: 'Karnataka', country: 'India', isp: 'business' },
            
            // Hyderabad IP ranges
            { start: '103.30.100.0', end: '103.30.103.255', city: 'Hyderabad', state: 'Telangana', country: 'India', isp: 'business' },
            { start: '103.31.200.0', end: '103.31.203.255', city: 'Hyderabad', state: 'Telangana', country: 'India', isp: 'residential' },
            
            // Chennai IP ranges
            { start: '103.32.100.0', end: '103.32.103.255', city: 'Chennai', state: 'Tamil Nadu', country: 'India', isp: 'business' },
            { start: '103.33.200.0', end: '103.33.203.255', city: 'Chennai', state: 'Tamil Nadu', country: 'India', isp: 'residential' },
            
            // Pune IP ranges
            { start: '103.34.100.0', end: '103.34.103.255', city: 'Pune', state: 'Maharashtra', country: 'India', isp: 'business' },
            { start: '103.35.200.0', end: '103.35.203.255', city: 'Pune', state: 'Maharashtra', country: 'India', isp: 'residential' },
            
            // Kolkata IP ranges
            { start: '103.36.100.0', end: '103.36.103.255', city: 'Kolkata', state: 'West Bengal', country: 'India', isp: 'business' },
            { start: '103.37.200.0', end: '103.37.203.255', city: 'Kolkata', state: 'West Bengal', country: 'India', isp: 'residential' },
            
            // Ahmedabad IP ranges
            { start: '103.38.100.0', end: '103.38.103.255', city: 'Ahmedabad', state: 'Gujarat', country: 'India', isp: 'business' },
            { start: '103.39.200.0', end: '103.39.203.255', city: 'Ahmedabad', state: 'Gujarat', country: 'India', isp: 'residential' },
            
            // International IP ranges (sample)
            { start: '8.8.8.0', end: '8.8.8.255', city: 'Mountain View', state: 'California', country: 'United States', isp: 'business' },
            { start: '1.1.1.0', end: '1.1.1.255', city: 'Sydney', state: 'New South Wales', country: 'Australia', isp: 'business' },
            { start: '208.67.222.0', end: '208.67.222.255', city: 'London', state: 'England', country: 'United Kingdom', isp: 'business' }
        ];
    }

    // Convert IP address to number for comparison
    ipToNumber(ip) {
        const parts = ip.split('.');
        return (parseInt(parts[0]) << 24) + (parseInt(parts[1]) << 16) + (parseInt(parts[2]) << 8) + parseInt(parts[3]);
    }

    // Binary search to find IP in database
    findIPLocation(ip) {
        const ipNum = this.ipToNumber(ip);
        
        let left = 0;
        let right = this.ipDatabase.length - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const range = this.ipDatabase[mid];
            const startNum = this.ipToNumber(range.start);
            const endNum = this.ipToNumber(range.end);
            
            if (ipNum >= startNum && ipNum <= endNum) {
                return range;
            } else if (ipNum < startNum) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        
        return null;
    }

    // Get user's IP address using external service
    async getUserIP() {
        try {
            // Try multiple IP detection services for reliability
            const services = [
                'https://api.ipify.org?format=json',
                'https://api.myip.com',
                'https://ipapi.co/json/'
            ];
            
            for (const service of services) {
                try {
                    const response = await fetch(service, { timeout: 3000 });
                    if (response.ok) {
                        const data = await response.json();
                        return data.ip || data.query || data.ipAddress;
                    }
                } catch (error) {
                    console.warn(`IP detection service failed: ${service}`, error);
                    continue;
                }
            }
            
            // Fallback: return a default IP for testing
            return '103.21.244.1'; // Mumbai IP for testing
        } catch (error) {
            console.error('Failed to get user IP:', error);
            return '103.21.244.1'; // Default Mumbai IP
        }
    }

    // Get location from IP address
    async getLocationFromIP(ip) {
        // Check cache first
        if (this.cache[ip]) {
            return this.cache[ip];
        }
        
        // Try local database first
        let location = this.findIPLocation(ip);
        
        if (!location) {
            // Fallback to external API
            try {
                const response = await fetch(`https://ipapi.co/${ip}/json/`);
                if (response.ok) {
                    const data = await response.json();
                    location = {
                        city: data.city,
                        state: data.region,
                        country: data.country_name,
                        isp: 'unknown'
                    };
                }
            } catch (error) {
                console.warn('External IP lookup failed:', error);
            }
        }
        
        // Cache the result
        if (location) {
            this.cache[ip] = location;
        }
        
        return location;
    }

    // Initialize the geolocation system
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Get user's IP address
            this.userIP = await this.getUserIP();
            
            // Get location from IP
            this.userLocation = await this.getLocationFromIP(this.userIP);
            
            // Update debug panel
            this.updateDebugPanel();
            
            // Trigger location-based events
            this.triggerLocationEvents();
            
            this.isInitialized = true;
            
            if (this.debugMode) {
                console.log('IP Geolocation initialized:', {
                    ip: this.userIP,
                    location: this.userLocation
                });
            }
            
        } catch (error) {
            console.error('Failed to initialize IP geolocation:', error);
        }
    }

    // Update debug panel with location information
    updateDebugPanel() {
        const elements = {
            'user-ip': this.userIP || 'Unknown',
            'user-location': this.userLocation ? 
                `${this.userLocation.city}, ${this.userLocation.state}, ${this.userLocation.country}` : 
                'Unknown'
        };
        
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    }

    // Trigger events for location-based personalization
    triggerLocationEvents() {
        if (this.userLocation) {
            // Dispatch custom event with location data
            const event = new CustomEvent('locationDetected', {
                detail: {
                    ip: this.userIP,
                    location: this.userLocation,
                    timestamp: Date.now()
                }
            });
            
            document.dispatchEvent(event);
        }
    }

    // Get current user location
    getCurrentLocation() {
        return this.userLocation;
    }

    // Get current user IP
    getCurrentIP() {
        return this.userIP;
    }

    // Check if user is from specific city
    isFromCity(city) {
        return this.userLocation && this.userLocation.city.toLowerCase() === city.toLowerCase();
    }

    // Check if user is from specific state
    isFromState(state) {
        return this.userLocation && this.userLocation.state.toLowerCase() === state.toLowerCase();
    }

    // Check if user is from India
    isFromIndia() {
        return this.userLocation && this.userLocation.country === 'India';
    }

    // Check if user is from business ISP
    isBusinessUser() {
        return this.userLocation && this.userLocation.isp === 'business';
    }

    // Get location-based content variations
    getLocationContent() {
        if (!this.userLocation) return null;
        
        const city = this.userLocation.city;
        const state = this.userLocation.state;
        const country = this.userLocation.country;
        
        // Define content variations for different locations
        const contentVariations = {
            'Mumbai': {
                headline: 'Leading SEO Services in Mumbai',
                description: 'Trusted by 200+ Mumbai businesses for 5+ years. Get found by customers searching for your business in Mumbai.',
                cta: 'Get Mumbai SEO Audit',
                testimonial: 'Trusted by 200+ businesses in Mumbai'
            },
            'Delhi': {
                headline: 'Premium SEO Services in Delhi NCR',
                description: 'Serving Delhi NCR businesses for 5+ years. Boost your rankings in the competitive Delhi market.',
                cta: 'Get Delhi SEO Audit',
                testimonial: 'Serving Delhi NCR businesses for 5+ years'
            },
            'Bangalore': {
                headline: 'Tech-Savvy SEO Services in Bangalore',
                description: 'Partnered with 150+ Bangalore startups and tech companies. Grow your business in India\'s tech capital.',
                cta: 'Get Bangalore SEO Audit',
                testimonial: 'Partnered with 150+ Bangalore startups'
            },
            'Hyderabad': {
                headline: 'Professional SEO Services in Hyderabad',
                description: 'Trusted by 100+ Hyderabad companies. Expert SEO solutions for the growing Hyderabad market.',
                cta: 'Get Hyderabad SEO Audit',
                testimonial: 'Trusted by 100+ Hyderabad businesses'
            },
            'Chennai': {
                headline: 'Expert SEO Services in Chennai',
                description: 'Serving Chennai market for 4+ years. Comprehensive SEO solutions for Chennai businesses.',
                cta: 'Get Chennai SEO Audit',
                testimonial: 'Serving Chennai market for 4+ years'
            },
            'Pune': {
                headline: 'Reliable SEO Services in Pune',
                description: 'Supporting Pune businesses with proven SEO strategies. Get ahead in the competitive Pune market.',
                cta: 'Get Pune SEO Audit',
                testimonial: 'Supporting Pune businesses'
            },
            'Kolkata': {
                headline: 'Trusted SEO Services in Kolkata',
                description: 'Helping Kolkata businesses grow online. Expert SEO solutions for the vibrant Kolkata market.',
                cta: 'Get Kolkata SEO Audit',
                testimonial: 'Helping Kolkata businesses grow'
            },
            'Ahmedabad': {
                headline: 'Professional SEO Services in Ahmedabad',
                description: 'Empowering Ahmedabad businesses with digital growth. Comprehensive SEO for the Gujarat market.',
                cta: 'Get Ahmedabad SEO Audit',
                testimonial: 'Empowering Ahmedabad businesses'
            }
        };
        
        // Return content for specific city or default
        return contentVariations[city] || {
            headline: 'Expert SEO Services',
            description: 'Boost your website\'s search engine rankings and drive sustainable organic traffic.',
            cta: 'Get Free SEO Audit',
            testimonial: 'Trusted by businesses across India'
        };
    }

    // Load external IP database (for future use with your actual database)
    async loadExternalDatabase() {
        try {
            // This would load your actual IP database
            // const response = await fetch('path/to/your/ip-database.json');
            // this.ipDatabase = await response.json();
            console.log('External IP database loading not implemented yet');
        } catch (error) {
            console.error('Failed to load external IP database:', error);
        }
    }
}

// Initialize global instance
window.IPGeolocation = new IPGeolocation();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.IPGeolocation) {
        window.IPGeolocation.init();
    }
}); 