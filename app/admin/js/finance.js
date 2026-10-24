(function () {
  'use strict';

  const esc = (s) => s == null ? '' : String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ini = (n) => !n ? '?' : n.trim().split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase();
  const rm = (v) => 'RM ' + Number(v || 0).toLocaleString('ms-MY', { maximumFractionDigits: 0 });
  const monthName = (m) => ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogos','Sep','Okt','Nov','Dis'][(m-1)%12] || '—';

  const state = { month: 0, year: 0, fees: [], filter: 'all', updating: new Set() };

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      sessionStorage.removeItem('serc_session');
      window.location.href = '../login.html';
    });

    document.querySelectorAll('.dock-item[data-soon="1"]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); alert('Akan datang'); });
    });

    const now = new Date();
    state.month = now.getMonth() + 1;
    state.year = now.getFullYear();
    document.getElementById('period-label').textContent = `Bulan ${monthName(state.month)} ${state.year}`;

    document.getElementById('filter-tabs').addEventListener('click', e => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      document.querySelectorAll('.filter-chip').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      renderList();
    });

    loadAll();
  });

  async function loadAll() {
    try {
      const [summary, fees] = await Promise.all([
        window.SERCAPI.fees.getSummary(state.month, state.year),
        window.SERCAPI.fees.getFeesForPeriod(state.month, state.year),
      ]);
      state.fees = fees;
      renderSummary(summary);
      renderList();
    } catch (err) {
      console.error(err);
      document.getElementById('fee-list').innerHTML = `<div class="empty">Gagal muat data</div>`;
    }
  }

  function renderSummary(s) {
    document.getElementById('summary-grid').innerHTML = `
      <div class="summary-card"><div class="label">Total</div><div class="value">${s.total}</div></div>
      <div class="summary-card"><div class="label">Dah Bayar</div><div class="value good">${s.paid}</div></div>
      <div class="summary-card"><div class="label">Belum Bayar</div><div class="value bad">${s.unpaid}</div></div>
      <div class="summary-card"><div class="label">Waived</div><div class="value orange">${s.waived}</div></div>
    `;
  }

  function renderList() {
    const el = document.getElementById('fee-list');
    let rows = state.fees;
    if (state.filter !== 'all') rows = rows.filter(f => f.status === state.filter);

    if (!rows.length) {
      el.innerHTML = `<div class="empty">Tiada rekod untuk filter ini.</div>`;
      return;
    }

    el.innerHTML = rows.map(f => {
      const p = f.players || {};
      const busy = state.updating.has(f.id);
      const badgeCls = f.status === 'paid' ? 'badge-paid' : f.status === 'waived' ? 'badge-waived' : 'badge-unpaid';
      const color = f.status === 'paid' ? 'var(--good)' : f.status === 'waived' ? 'var(--warn)' : 'var(--bad)';
      const actions = f.status === 'unpaid' ? `
        <button class="btn-mini btn-paid" data-id="${f.id}" data-action="paid" ${busy ? 'disabled' : ''}>${busy ? '...' : 'Bayar'}</button>
        <button class="btn-mini btn-waive" data-id="${f.id}" data-action="waived" ${busy ? 'disabled' : ''}>${busy ? '...' : 'Waive'}</button>
      ` : '';
      return `
        <div class="fee-card">
          <div class="fee-avatar">${esc(ini(p.full_name))}</div>
          <div class="fee-body">
            <div class="fee-name">${esc(p.full_name || 'Unknown')}</div>
            <div class="fee-meta">
              <span>${esc(p.category || '—')}</span>
              <span class="badge ${badgeCls}">${f.status}</span>
            </div>
          </div>
          <div class="fee-amount" style="color:${color}">${rm(f.amount)}</div>
          <div class="fee-actions">${actions}</div>
        </div>
      `;
    }).join('');

    el.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => handleMark(btn.dataset.id, btn.dataset.action));
    });
  }

  async function handleMark(feeId, status) {
    if (state.updating.has(feeId)) return;
    state.updating.add(feeId);
    renderList();
    try {
      await window.SERCAPI.fees.markStatus(feeId, status);
      const fee = state.fees.find(f => f.id === feeId);
      if (fee) fee.status = status;
      const summary = await window.SERCAPI.fees.getSummary(state.month, state.year);
      renderSummary(summary);
    } catch (err) {
      console.error(err);
      alert('Gagal update. Cuba lagi.');
    } finally {
      state.updating.delete(feeId);
      renderList();
    }
  }
})();