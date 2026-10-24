// app/shared/api/events.js
// Supabase-backed events API — guna window.SERC_SUPABASE_CLIENT
// Schema assumed: id, title, description, event_date(date),
//                 event_time(time), location, type, created_at

(function () {
  const CLIENT = () => window.SERC_SUPABASE_CLIENT;

  window.SERCAPI = window.SERCAPI || {};
  window.SERCAPI.events = window.SERCAPI.events || {};

  /** Event akan datang (single) */
  window.SERCAPI.events.getNextEvent = async () => {
    const today = new Date().toISOString().split('T')[0];
    const qs = `select=*&event_date=gte.${today}&order=event_date.asc,event_time.asc&limit=1`;
    const rows = await CLIENT().queryRaw('events', qs);
    return rows.length ? rows[0] : null;
  };

  /** Senarai event akan datang */
  window.SERCAPI.events.getUpcoming = async (limit = 5) => {
    const today = new Date().toISOString().split('T')[0];
    const qs = `select=*&event_date=gte.${today}&order=event_date.asc,event_time.asc&limit=${limit}`;
    return await CLIENT().queryRaw('events', qs);
  };

  /** Semua event — untuk management listing */
  window.SERCAPI.events.list = async () => {
    const qs = `select=*&order=event_date.desc,event_time.desc`;
    return await CLIENT().queryRaw('events', qs);
  };

  /** Create event */
  window.SERCAPI.events.create = async (payload) => {
    const url = `${window.SERC_SUPABASE_REST.baseUrl()}/events`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...window.SERC_SUPABASE_REST.headers(),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create event');
    const data = await res.json();
    return data[0];
  };

  /** Update event */
  window.SERCAPI.events.update = async (id, payload) => {
    const url = `${window.SERC_SUPABASE_REST.baseUrl()}/events?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...window.SERC_SUPABASE_REST.headers(),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update event');
    const data = await res.json();
    return data[0];
  };

  /** Delete event */
  window.SERCAPI.events.delete = async (id) => {
    const url = `${window.SERC_SUPABASE_REST.baseUrl()}/events?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: window.SERC_SUPABASE_REST.headers(),
    });
    if (!res.ok) throw new Error('Failed to delete event');
    return true;
  };
})();