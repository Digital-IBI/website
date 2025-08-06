// Campaign Configuration for Dynamic Landing Pages
// This file manages different ad campaign parameters and their content variations

const CampaignConfig = {
    // Campaign presets for different ad platforms
    campaignPresets: {
        'google-ads-seo': {
            defaultParams: {
                source: 'google',
                medium: 'cpc',
                campaign: 'seo-services',
                adgroup: 'seo-keywords'
            },
            contentVariations: {
                'local-seo': {
                    headline: 'Local SEO Services in {city}',
                    subheadline: 'Get found by customers searching for your business in {city}',
                    cta: 'Get Local SEO Audit',
                    keywords: ['local seo', 'google my business', 'local search']
                },
                'ecommerce-seo': {
                    headline: 'E-commerce SEO Services',
                    subheadline: 'Boost your online store rankings and increase sales',
                    cta: 'Get E-commerce SEO Quote',
                    keywords: ['ecommerce seo', 'shopify seo', 'woocommerce seo']
                },
                'technical-seo': {
                    headline: 'Technical SEO Services',
                    subheadline: 'Fix technical issues and improve your website performance',
                    cta: 'Get Technical SEO Audit',
                    keywords: ['technical seo', 'website speed', 'core web vitals']
                }
            }
        },
        'facebook-ads-app-development': {
            defaultParams: {
                source: 'facebook',
                medium: 'social',
                campaign: 'app-development',
                adgroup: 'mobile-apps'
            },
            contentVariations: {
                'ios-development': {
                    headline: 'iOS App Development Services',
                    subheadline: 'Build high-quality iPhone and iPad applications',
                    cta: 'Start iOS App Project',
                    keywords: ['ios development', 'iphone app', 'swift development']
                },
                'android-development': {
                    headline: 'Android App Development Services',
                    subheadline: 'Create powerful Android applications for your business',
                    cta: 'Start Android App Project',
                    keywords: ['android development', 'kotlin development', 'google play']
                },
                'cross-platform': {
                    headline: 'Cross-Platform App Development',
                    subheadline: 'Build once, deploy everywhere with React Native or Flutter',
                    cta: 'Get Cross-Platform Quote',
                    keywords: ['react native', 'flutter development', 'cross platform']
                }
            }
        },
        'linkedin-ads-b2b': {
            defaultParams: {
                source: 'linkedin',
                medium: 'social',
                campaign: 'b2b-marketing',
                adgroup: 'business-services'
            },
            contentVariations: {
                'enterprise-seo': {
                    headline: 'Enterprise SEO Services',
                    subheadline: 'Scale your SEO strategy for large organizations',
                    cta: 'Get Enterprise SEO Strategy',
                    keywords: ['enterprise seo', 'b2b seo', 'corporate seo']
                },
                'saas-marketing': {
                    headline: 'SaaS Marketing Services',
                    subheadline: 'Grow your SaaS business with targeted marketing strategies',
                    cta: 'Get SaaS Marketing Plan',
                    keywords: ['saas marketing', 'b2b marketing', 'lead generation']
                }
            }
        },
        'instagram-ads-social': {
            defaultParams: {
                source: 'instagram',
                medium: 'social',
                campaign: 'social-media',
                adgroup: 'instagram-marketing'
            },
            contentVariations: {
                'instagram-growth': {
                    headline: 'Instagram Growth Services',
                    subheadline: 'Grow your Instagram following and engagement',
                    cta: 'Get Instagram Strategy',
                    keywords: ['instagram growth', 'instagram marketing', 'social media']
                },
                'influencer-marketing': {
                    headline: 'Influencer Marketing Services',
                    subheadline: 'Partner with influencers to reach your target audience',
                    cta: 'Get Influencer Strategy',
                    keywords: ['influencer marketing', 'brand partnerships', 'social media']
                }
            }
        }
    },

    // Location-based content variations
    locationVariations: {
        'mumbai': {
            headline: '{service} Services in Mumbai',
            subheadline: 'Leading {service} company in Mumbai with 500+ successful projects',
            cta: 'Get Mumbai Quote',
            localKeywords: ['mumbai', 'maharashtra', 'bombay'],
            testimonials: 'Trusted by 200+ businesses in Mumbai'
        },
        'delhi': {
            headline: '{service} Services in Delhi NCR',
            subheadline: 'Premium {service} solutions for Delhi businesses',
            cta: 'Get Delhi Quote',
            localKeywords: ['delhi', 'ncr', 'gurgaon', 'noida'],
            testimonials: 'Serving Delhi NCR businesses for 5+ years'
        },
        'bangalore': {
            headline: '{service} Services in Bangalore',
            subheadline: 'Tech-savvy {service} solutions for Bangalore startups',
            cta: 'Get Bangalore Quote',
            localKeywords: ['bangalore', 'bengaluru', 'karnataka'],
            testimonials: 'Partnered with 150+ Bangalore startups'
        },
        'hyderabad': {
            headline: '{service} Services in Hyderabad',
            subheadline: 'Professional {service} services for Hyderabad companies',
            cta: 'Get Hyderabad Quote',
            localKeywords: ['hyderabad', 'telangana'],
            testimonials: 'Trusted by 100+ Hyderabad businesses'
        },
        'chennai': {
            headline: '{service} Services in Chennai',
            subheadline: 'Expert {service} solutions for Chennai enterprises',
            cta: 'Get Chennai Quote',
            localKeywords: ['chennai', 'tamil nadu'],
            testimonials: 'Serving Chennai market for 4+ years'
        }
    },

    // Industry-specific content variations
    industryVariations: {
        'healthcare': {
            headline: 'Healthcare {service} Services',
            subheadline: 'HIPAA-compliant {service} solutions for healthcare providers',
            cta: 'Get Healthcare Quote',
            keywords: ['healthcare', 'medical', 'hipaa', 'pharma'],
            specialFeatures: ['HIPAA Compliance', 'Medical SEO', 'Healthcare Marketing']
        },
        'ecommerce': {
            headline: 'E-commerce {service} Services',
            subheadline: 'Boost your online store with expert {service} solutions',
            cta: 'Get E-commerce Quote',
            keywords: ['ecommerce', 'online store', 'shopify', 'woocommerce'],
            specialFeatures: ['E-commerce SEO', 'Shopping Ads', 'Conversion Optimization']
        },
        'real-estate': {
            headline: 'Real Estate {service} Services',
            subheadline: 'Generate leads and sales for your real estate business',
            cta: 'Get Real Estate Quote',
            keywords: ['real estate', 'property', 'realty', 'housing'],
            specialFeatures: ['Local SEO', 'Property Listings', 'Lead Generation']
        },
        'education': {
            headline: 'Education {service} Services',
            subheadline: 'Digital marketing solutions for schools and training institutes',
            cta: 'Get Education Quote',
            keywords: ['education', 'schools', 'training', 'edtech'],
            specialFeatures: ['Student Recruitment', 'Course Marketing', 'Institution SEO']
        },
        'finance': {
            headline: 'Finance {service} Services',
            subheadline: 'Compliant digital marketing for financial services',
            cta: 'Get Finance Quote',
            keywords: ['finance', 'banking', 'insurance', 'investment'],
            specialFeatures: ['Compliance Marketing', 'Financial SEO', 'Lead Qualification']
        }
    },

    // Generate campaign URL with parameters
    generateCampaignUrl: function(baseUrl, campaign, variations = {}) {
        const url = new URL(baseUrl);
        const preset = this.campaignPresets[campaign];
        
        if (preset) {
            // Add default campaign parameters
            Object.assign(url.searchParams, preset.defaultParams);
            
            // Add custom variations
            Object.assign(url.searchParams, variations);
        }
        
        return url.toString();
    },

    // Get content variation based on parameters
    getContentVariation: function(campaign, variation, location = '', industry = '') {
        const preset = this.campaignPresets[campaign];
        if (!preset || !preset.contentVariations[variation]) {
            return null;
        }

        let content = { ...preset.contentVariations[variation] };
        
        // Apply location variations
        if (location && this.locationVariations[location.toLowerCase()]) {
            const locationContent = this.locationVariations[location.toLowerCase()];
            content.headline = locationContent.headline.replace('{service}', content.headline);
            content.subheadline = locationContent.subheadline.replace('{service}', content.subheadline);
            content.cta = locationContent.cta;
        }
        
        // Apply industry variations
        if (industry && this.industryVariations[industry.toLowerCase()]) {
            const industryContent = this.industryVariations[industry.toLowerCase()];
            content.headline = industryContent.headline.replace('{service}', content.headline);
            content.subheadline = industryContent.subheadline.replace('{service}', content.subheadline);
            content.cta = industryContent.cta;
        }
        
        return content;
    },

    // Generate example campaign URLs
    getExampleUrls: function() {
        return {
            'Google Ads SEO - Local': this.generateCampaignUrl(
                'https://yourdomain.com/lp/seo-services-landing.html',
                'google-ads-seo',
                {
                    keyword: 'local seo',
                    city: 'mumbai',
                    headline: 'Local SEO Services in Mumbai',
                    cta: 'Get Mumbai SEO Audit'
                }
            ),
            'Facebook Ads App Development': this.generateCampaignUrl(
                'https://yourdomain.com/lp/app-development-landing.html',
                'facebook-ads-app-development',
                {
                    keyword: 'ios development',
                    city: 'bangalore',
                    headline: 'iOS App Development in Bangalore',
                    cta: 'Start iOS Project'
                }
            ),
            'LinkedIn B2B Marketing': this.generateCampaignUrl(
                'https://yourdomain.com/lp/b2b-digital-marketing.html',
                'linkedin-ads-b2b',
                {
                    keyword: 'enterprise seo',
                    industry: 'healthcare',
                    headline: 'Healthcare Enterprise SEO Services',
                    cta: 'Get Healthcare SEO Strategy'
                }
            )
        };
    }
};

// Export for use in other scripts
window.CampaignConfig = CampaignConfig; 