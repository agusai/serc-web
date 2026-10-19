window.SERC_CONFIG = {
  appName: 'SERC',
  projectId: 'mtopqypcrmzihmfueujy',
  region: 'Singapore',
  roles: ['superadmin', 'management', 'coaching', 'headcoach', 'parent', 'player', 'guest'],
  categories: ['U14 Boys', 'U12 Boys', 'U10 Boys', 'U10 Girls', 'U8 Boys'],
  env: 'local'
};

window.SERC_SUPABASE = {
  url: 'https://mtopqypcrmzihmfueujy.supabase.co',
  key: 'demo-key',
  auth: {
    async signInWithPassword({ email, password }) {
      return { data: { user: { email } }, error: null };
    }
  },
  from(table) {
    return {
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null })
    };
  }
};
