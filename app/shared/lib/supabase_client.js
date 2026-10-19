/* Lightweight Supabase REST helper for the static client
   Uses the anon/public key set in app/shared/lib/config.js and fetch to call the
   Supabase REST endpoints. This avoids adding a bundler or large client lib.

   Methods:
     list(table, select='*')
     getById(table, id, idCol='id')
     query(table, qs) -- pass a query string like 'select=*&category=eq.U14'
*/

window.SERC_SUPABASE_CLIENT = {
  async list(table, select = '*') {
    const url = `${window.SERC_SUPABASE_REST.baseUrl()}/${table}?select=${encodeURIComponent(select)}`;
    const res = await fetch(url, { headers: window.SERC_SUPABASE_REST.headers() });
    if (!res.ok) {
      const text = await res.text();
      console.error('Supabase list error', table, res.status, text);
      return [];
    }
    return res.json();
  },

  async getById(table, id, idCol = 'id', select = '*') {
    const qs = `select=${encodeURIComponent(select)}&${encodeURIComponent(idCol)}=eq.${encodeURIComponent(id)}`;
    const url = `${window.SERC_SUPABASE_REST.baseUrl()}/${table}?${qs}`;
    const res = await fetch(url, { headers: window.SERC_SUPABASE_REST.headers() });
    if (!res.ok) {
      const text = await res.text();
      console.error('Supabase getById error', table, id, res.status, text);
      return null;
    }
    const data = await res.json();
    return (data && data.length) ? data[0] : null;
  },

  // generic query: pass a prepared query string fragment (without leading ?)
  async queryRaw(table, query) {
    const url = `${window.SERC_SUPABASE_REST.baseUrl()}/${table}?${query}`;
    const res = await fetch(url, { headers: window.SERC_SUPABASE_REST.headers() });
    if (!res.ok) {
      const text = await res.text();
      console.error('Supabase queryRaw error', table, query, res.status, text);
      return [];
    }
    return res.json();
  }
};
