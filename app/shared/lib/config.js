window.SERC_CONFIG = {
  appName: 'SERC',
  projectId: 'mtopqypcrmzihmfueujy',
  region: 'Singapore',
  roles: ['superadmin', 'management', 'coaching', 'headcoach', 'parent', 'player', 'guest'],
  categories: ['U14 Boys', 'U12 Boys', 'U10 Boys', 'U10 Girls', 'U8 Boys'],
  env: 'prod'
};

// Supabase settings — default to the project you provided. Can be overridden by setting
// window.SERC_SUPABASE before these scripts run or by editing this file locally.
window.SERC_SUPABASE = {
  url: 'https://mtopqypcrmzihmfueujy.supabase.co',
  key: 'public:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10b3BxeXBjcm16aWhtZnVldWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMDQ2OTMsImV4cCI6MjEwNzU4MDY5M30.oocXGBr6pBA7GS1KjOhWIPejHausQ3k9UgRxKQ0fgh4'
};

// Helper: build REST URL for a table and optional query string (select, filters)
window.SERC_SUPABASE_REST = {
  baseUrl() { return `${window.SERC_SUPABASE.url}/rest/v1`; },
  headers() {
    return {
      apikey: window.SERC_SUPABASE.key,
      Authorization: `Bearer ${window.SERC_SUPABASE.key}`
    };
  }
};
