/**
 * GTM Configuration for Dynamic Landing Pages
 * This file contains all GTM setup instructions and configurations
 */

// ============================================================================
// GTM CONTAINER SETUP
// ============================================================================

/*
1. Create GTM Container:
   - Go to tagmanager.google.com
   - Create new container
   - Container Name: "Infetech Landing Pages"
   - Container ID: GTM-XXXXXXX (replace with your actual ID)

2. Add GTM Container Code to all landing pages:
   - Copy the GTM container code from the HTML files
   - Replace GTM-XXXXXXX with your actual container ID
*/

// ============================================================================
// GTM TRIGGERS SETUP
// ============================================================================

/*
TRIGGER 1: Landing Page View
- Type: Page View
- Fires on: All Pages
- Name: "Landing Page View"

TRIGGER 2: Form Field Focus
- Type: Click
- Fires on: All Elements
- Click Classes: input, select, textarea
- Name: "Form Field Focus"

TRIGGER 3: Form Submission
- Type: Form Submit
- Fires on: All Forms
- Name: "Form Submission"

TRIGGER 4: CTA Button Click
- Type: Click
- Fires on: All Elements
- Click Classes: main-btn, btn-green, register-submit, discover-btn
- Name: "CTA Button Click"

TRIGGER 5: Scroll Depth 25%
- Type: Scroll Depth
- Fires on: All Pages
- Scroll Depth: 25%
- Name: "Scroll Depth 25%"

TRIGGER 6: Scroll Depth 50%
- Type: Scroll Depth
- Fires on: All Pages
- Scroll Depth: 50%
- Name: "Scroll Depth 50%"

TRIGGER 7: Scroll Depth 75%
- Type: Scroll Depth
- Fires on: All Pages
- Scroll Depth: 75%
- Name: "Scroll Depth 75%"

TRIGGER 8: Scroll Depth 90%
- Type: Scroll Depth
- Fires on: All Pages
- Scroll Depth: 90%
- Name: "Scroll Depth 90%"
*/

// ============================================================================
// GTM VARIABLES SETUP
// ============================================================================

/*
VARIABLE 1: Page Name
- Type: Data Layer Variable
- Data Layer Variable Name: page_name
- Name: "Page Name"

VARIABLE 2: Keyword
- Type: Data Layer Variable
- Data Layer Variable Name: keyword
- Name: "Keyword"

VARIABLE 3: Ad Source
- Type: Data Layer Variable
- Data Layer Variable Name: ad_source
- Name: "Ad Source"

VARIABLE 4: Campaign
- Type: Data Layer Variable
- Data Layer Variable Name: campaign
- Name: "Campaign"

VARIABLE 5: Creative ID
- Type: Data Layer Variable
- Data Layer Variable Name: creative_id
- Name: "Creative ID"

VARIABLE 6: Form ID
- Type: Data Layer Variable
- Data Layer Variable Name: form_id
- Name: "Form ID"

VARIABLE 7: CTA Text
- Type: Data Layer Variable
- Data Layer Variable Name: cta_text
- Name: "CTA Text"

VARIABLE 8: Lead Value
- Type: Data Layer Variable
- Data Layer Variable Name: lead_value
- Name: "Lead Value"

VARIABLE 9: Scroll Percent
- Type: Data Layer Variable
- Data Layer Variable Name: scroll_percent
- Name: "Scroll Percent"

VARIABLE 10: URL Parameters
- Type: Custom JavaScript
- Name: "URL Parameters"
- Code: (see URL parameter function in HTML)
*/

// ============================================================================
// GTM TAGS SETUP
// ============================================================================

/*
TAG 1: Google Analytics 4 Configuration
- Tag Type: GA4 Configuration
- Measurement ID: G-XXXXXXXX (your GA4 property ID)
- Trigger: All Pages
- Name: "GA4 Configuration"

TAG 2: Landing Page View Event
- Tag Type: GA4 Event
- Event Name: landing_page_view
- Parameters:
  - page_name: {{Page Name}}
  - keyword: {{Keyword}}
  - ad_source: {{Ad Source}}
  - campaign: {{Campaign}}
  - creative_id: {{Creative ID}}
- Trigger: Landing Page View
- Name: "Landing Page View Event"

TAG 3: Form Field Focus Event
- Tag Type: GA4 Event
- Event Name: form_field_focus
- Parameters:
  - page_name: {{Page Name}}
  - field_name: {{Click Element - Name}}
  - field_type: {{Click Element - Type}}
  - keyword: {{Keyword}}
  - ad_source: {{Ad Source}}
- Trigger: Form Field Focus
- Name: "Form Field Focus Event"

TAG 4: Form Submission Event
- Tag Type: GA4 Event
- Event Name: form_submit
- Parameters:
  - page_name: {{Page Name}}
  - form_id: {{Form ID}}
  - keyword: {{Keyword}}
  - ad_source: {{Ad Source}}
  - campaign: {{Campaign}}
  - creative_id: {{Creative ID}}
- Trigger: Form Submission
- Name: "Form Submission Event"

TAG 5: CTA Click Event
- Tag Type: GA4 Event
- Event Name: cta_click
- Parameters:
  - page_name: {{Page Name}}
  - cta_text: {{CTA Text}}
  - keyword: {{Keyword}}
  - ad_source: {{Ad Source}}
  - campaign: {{Campaign}}
- Trigger: CTA Button Click
- Name: "CTA Click Event"

TAG 6: Scroll Depth Event
- Tag Type: GA4 Event
- Event Name: scroll_depth
- Parameters:
  - page_name: {{Page Name}}
  - scroll_percent: {{Scroll Percent}}
  - keyword: {{Keyword}}
  - ad_source: {{Ad Source}}
- Trigger: Scroll Depth 25%, 50%, 75%, 90%
- Name: "Scroll Depth Event"

TAG 7: Lead Generated Event
- Tag Type: GA4 Event
- Event Name: lead_generated
- Parameters:
  - page_name: {{Page Name}}
  - lead_value: {{Lead Value}}
  - keyword: {{Keyword}}
  - ad_source: {{Ad Source}}
  - campaign: {{Campaign}}
  - creative_id: {{Creative ID}}
- Trigger: Form Submission
- Name: "Lead Generated Event"
*/

// ============================================================================
// GOOGLE ANALYTICS 4 GOALS SETUP
// ============================================================================

/*
GOAL 1: Lead Generation
- Event: form_submit
- Value: 1
- Name: "Lead Generation"

GOAL 2: Consultation Request
- Event: cta_click
- Parameter: cta_text contains "consultation" or "contact"
- Value: 1
- Name: "Consultation Request"

GOAL 3: Free Trial Signup
- Event: form_submit
- Parameter: form_id contains "trial" or "register"
- Value: 1
- Name: "Free Trial Signup"

GOAL 4: High-Value Lead
- Event: lead_generated
- Parameter: lead_value >= 100
- Value: {{Lead Value}}
- Name: "High-Value Lead"
*/

// ============================================================================
// CUSTOM REPORTS SETUP
// ============================================================================

/*
REPORT 1: Landing Page Performance
- Dimensions: page_name, ad_source, campaign
- Metrics: sessions, bounce_rate, conversion_rate, goal_completions
- Name: "Landing Page Performance"

REPORT 2: Ad Creative Performance
- Dimensions: creative_id, ad_source, keyword
- Metrics: sessions, conversion_rate, lead_value
- Name: "Ad Creative Performance"

REPORT 3: Keyword Performance
- Dimensions: keyword, page_name, ad_source
- Metrics: sessions, conversion_rate, cost_per_conversion
- Name: "Keyword Performance"

REPORT 4: Lead Quality Analysis
- Dimensions: page_name, ad_source, campaign
- Metrics: lead_value, conversion_rate, avg_session_duration
- Name: "Lead Quality Analysis"

REPORT 5: User Journey Analysis
- Dimensions: page_name, scroll_percent, form_field_focus
- Metrics: sessions, conversion_rate
- Name: "User Journey Analysis"
*/

// ============================================================================
// PAGE NAME MAPPING
// ============================================================================

/*
LANDING PAGE NAMES:
- SEOLP: SEO Landing Page
- SEMLP: SEM Landing Page
- DMLP: Digital Marketing Landing Page
- WPLP: WordPress Development Landing Page
- SMMLP: Social Media Marketing Landing Page
- ADLP: App Development Landing Page
- CSDLP: Custom Software Development Landing Page
- AATLP: AI Asset Tracking Landing Page
- AILP: AI Loyalty Tech Landing Page
- WMLP: WhatsApp Marketing Landing Page
- CSELP: Custom Search Engine Landing Page
- GENERICLP: Generic Landing Page
*/

// ============================================================================
// URL PARAMETER EXAMPLES
// ============================================================================

/*
EXAMPLE URLS WITH PARAMETERS:

1. SEO Landing Page:
   https://yoursite.com/seo-landing?keyword=seo+services&source=google&campaign=winter_sale&creative_id=seo_ad_1

2. WordPress Landing Page:
   https://yoursite.com/wordpress-landing?keyword=wordpress+development&source=facebook&campaign=wp_promo&creative_id=fb_wp_ad

3. App Development Landing Page:
   https://yoursite.com/app-development?keyword=custom+app&source=instagram&campaign=app_launch&creative_id=ig_app_ad

4. Digital Marketing Landing Page:
   https://yoursite.com/digital-marketing?keyword=digital+marketing&source=google&campaign=dm_campaign&creative_id=google_dm_ad
*/

// ============================================================================
// TESTING CHECKLIST
// ============================================================================

/*
TESTING STEPS:

1. GTM Preview Mode:
   - Enable GTM preview mode
   - Test each landing page with different URL parameters
   - Verify all events are firing correctly

2. Data Layer Testing:
   - Check browser console for dataLayer.push events
   - Verify all parameters are being captured
   - Test with different page types

3. GA4 Real-Time Reports:
   - Check real-time events in GA4
   - Verify custom parameters are showing
   - Test conversion tracking

4. Form Submission Testing:
   - Test form submissions with different parameters
   - Verify lead generation events
   - Check lead value calculations

5. CTA Click Testing:
   - Test all CTA buttons
   - Verify click events are firing
   - Check parameter passing

6. Scroll Depth Testing:
   - Test scroll depth tracking
   - Verify events at 25%, 50%, 75%, 90%
   - Check parameter consistency
*/

console.log('GTM Configuration loaded successfully'); 