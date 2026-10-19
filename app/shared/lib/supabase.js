window.SERC_SUPABASE = window.SERC_SUPABASE || {};
window.SERC_SUPABASE.client = window.SERC_SUPABASE.client || {
  from: function () {
    return {
      select: function () { return Promise.resolve({ data: [], error: null }); },
      insert: function () { return Promise.resolve({ data: [], error: null }); },
      update: function () { return Promise.resolve({ data: [], error: null }); },
      delete: function () { return Promise.resolve({ data: [], error: null }); }
    };
  }
};
