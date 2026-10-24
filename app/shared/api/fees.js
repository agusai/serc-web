// app/shared/api/fees.js
// Supabase-backed fees API — guna window.SERC_SUPABASE_CLIENT (REST helper)
// Schema assumed (ikut LIBO_HANDOVER.md):
// fees: id, player_id, month(int), year(int), amount(numeric),
//       status(text: unpaid|paid|waived), paid_at(timestamptz), created_at
// players: id, full_name, category, photo_url

(function () {
  const CLIENT = () => window.SERC_SUPABASE_CLIENT;

  window.SERCAPI = window.SERCAPI || {};
  window.SERCAPI.fees = window.SERCAPI.fees || {};

  /** Semua fees untuk bulan/tahun tertentu, join player info */
  window.SERCAPI.fees.getFeesForPeriod = async (month, year) => {
    const qs = `select=id,player_id,month,year,amount,status,paid_at,created_at,players(id,full_name,category,photo_url)&month=eq.${month}&year=eq.${year}&order=status.asc,player_id.asc`;
    return await CLIENT().queryRaw('fees', qs);
  };

  /** Ringkasan untuk KPI Finance */
  window.SERCAPI.fees.getSummary = async (month, year) => {
    const rows = await window.SERCAPI.fees.getFeesForPeriod(month, year);
    const sum = (arr) => arr.reduce((s, r) => s + Number(r.amount || 0), 0);

    return {
      total: rows.length,
      paid: rows.filter((r) => r.status === 'paid').length,
      unpaid: rows.filter((r) => r.status === 'unpaid').length,
      waived: rows.filter((r) => r.status === 'waived').length,
      collected: sum(rows.filter((r) => r.status === 'paid')),
      outstanding: sum(rows.filter((r) => r.status === 'unpaid')),
    };
  };

  /** Fees belum bayar bulan semasa — untuk Dashboard "Action Required" */
  window.SERCAPI.fees.getUnpaidCurrentMonth = async (limit = 10) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const qs = `select=id,player_id,month,year,amount,status,players(id,full_name,category)&month=eq.${month}&year=eq.${year}&status=eq.unpaid&order=player_id.asc&limit=${limit}`;
    return await CLIENT().queryRaw('fees', qs);
  };

  /** Mark fee sebagai paid / waived / unpaid */
  window.SERCAPI.fees.markStatus = async (feeId, status) => {
    if (!['paid', 'waived', 'unpaid'].includes(status)) {
      throw new Error('Invalid status');
    }

    const payload = {
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
    };

    const url = `${window.SERC_SUPABASE_REST.baseUrl()}/fees?id=eq.${encodeURIComponent(feeId)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...window.SERC_SUPABASE_REST.headers(),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('markFeeStatus error', res.status, text);
      throw new Error('Failed to update fee status');
    }

    const data = await res.json();
    return data[0] || null;
  };

  /** Total players count — untuk KPI Dashboard */
  window.SERCAPI.fees.getTotalPlayersCount = async () => {
    const url = `${window.SERC_SUPABASE_REST.baseUrl()}/players?select=id`;
    const res = await fetch(url, { headers: window.SERC_SUPABASE_REST.headers() });
    if (!res.ok) return 0;
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  };
})();