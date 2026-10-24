// app/admin/js/finance.js
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const escapeHtml = (str) => {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  };
  const initials = (name) => {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  };
  const formatMYR = (amount) => {
    const n = Number(amount || 0);
    return 'RM ' + n.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };
  const monthLabel = (month) => {
    const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
    return months[(month - 1) % 12] || '—';
  };

  const state = {
    month: 0,
    year: 0,
    fees: [],
    filter: 'all',
    updating: new Set(),
  };

  // ---------- Header ----------
  function renderHeader() {
    const el = document.getElementById('header-user');
    if (!el) return;

    // Placeholder — nanti integrate dengan auth sebenar
    const user = { name: 'Admin SERC', role: 'management' };

    el.innerHTML = `
      <div class="header-user-info">
        <span class="header-user-name">${escapeHtml(user.name)}</span>
        <span class="header-user-role">${escapeHtml(user.role)}</span>
      </div>
      <button class="header-logout" id="logout-btn" title="Logout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      sessionStorage.removeItem('serc_session');
      window.location.href = '../login.html';
    });
  }

  // ---------- Dock coming soon ----------
  function bindDock() {
    document.querySelectorAll('.dock-item[data-soon="1"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Akan datang');
      });
    });
  }

  // ---------- Load ----------
  async function loadAll() {
    const [summary, fees] = await Promise.all([
      window.SERCAPI.fees.getSummary(state.month, state.year),
      window.SERCAPI.fees.getFeesForPeriod(state.month, state.year),
    ]);

    state.fees = fees;
    renderSummary(summary);
    renderList();
  }

  // ---------- Summary ----------
  function renderSummary(s) {
    const el = document.getElementById('summary-grid');
    el.innerHTML = `
      <div class="summary-card"><div class="label">Total</div><div class="value">${s.total}</div></div>
      <div class="summary-card"><div class="label">Dah Bayar</div><div class="value good">${s.paid}</div></div>
      <div class="summary-card"><div class="label">Belum Bayar</div><div class="value bad">${s.unpaid}</div></div>
      <div class="summary-card"><div class="label">Waived</div><div class="value orange">${s.waived}</div></div>
      <div class="summary-card"><div class="label">Kutipan</div><div class="value good">${formatMYR(s.collected)}</div></div>
      <div class="summary-card"><div class="label">Tertunggak</div><div class="value bad">${formatMYR(s.outstanding)}</div></div>
    `;
  }

  // ---------- Filter ----------
  function bindFilterTabs() {
    document.getElementById('filter-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab');
      if (!btn) return;
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      renderList();
    });
  }

  // ---------- List ----------
  function renderList() {
    const el = document.getElementById('fee-list');

    let rows = state.fees;
    if (state.filter !== 'all') rows = rows.filter((f) => f.status === state.filter);

    if (!rows.length) {
      el.innerHTML = `<div class="empty"><strong>Tiada rekod</strong>Tiada fees untuk filter ini.</div>`;
      return;
    }

    el.innerHTML = rows.map((f) => {
      const p = f.players || {};
      const isUpdating = state.updating.has(f.id);
      const badgeClass = f.status === 'paid' ? 'badge-paid'
                       : f.status === 'waived' ? 'badge-waived'
                       : 'badge-unpaid';

      const actionButtons = f.status === 'unpaid' ? `
        <button class="btn-mini btn-paid" data-action="paid" data-id="${f.id}" ${isUpdating ? 'disabled' : ''}>
          ${isUpdating ? '...' : 'Bayar'}
        </button>
        <button class="btn-mini btn-waive" data-action="waived" data-id="${f.id}" ${isUpdating ? 'disabled' : ''}>
          ${isUpdating ? '...' : 'Waive'}
        </button>
      ` : '';

      return `
        <div class="fee-item">
          <div class="fee-avatar">${escapeHtml(initials(p.full_name))}</div>
          <div class="fee-body">
            <div class="fee-name">${escapeHtml(p.full_name || 'Unknown')}</div>
            <div class="fee-meta">
              <span>${escapeHtml(p.category || '—')}</span>
              <span class="badge ${badgeClass}">${f.status}</span>
            </div>
          </div>
          <div class="fee-amount" style="color:${f.status === 'paid' ? 'var(--good)' : f.status === 'waived' ? 'var(--warn)' : 'var(--bad)'}">
            ${formatMYR(f.amount)}
          </div>
          <div class="fee-actions">${actionButtons}</div>
        </div>
      `;
    }).join('');

    el.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => handleMark(btn.dataset.id, btn.dataset.action));
    });
  }

  // ---------- Mark ----------
  async function handleMark(feeId, status) {
    if (state.updating.has(feeId)) return;

    state.updating.add(feeId);
    renderList();

    try {
      await window.SERCAPI.fees.markStatus(feeId, status);
      const fee = state.fees.find((f) => f.id === feeId);
      if (fee) fee.status = status;
      alert(status === 'paid' ? 'Ditanda sebagai Paid' : 'Ditanda sebagai Waived');
      const summary = await window.SERCAPI.fees.getSummary(state.month, state.year);
      renderSummary(summary);
    } catch (err) {
      console.error('[mark]', err);
      alert('Gagal update. Cuba lagi.');
    } finally {
      state.updating.delete(feeId);
      renderList();
    }
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    bindDock();
    bindFilterTabs();

    const now = new Date();
    state.month = now.getMonth() + 1;
    state.year = now.getFullYear();

    document.getElementById('period-label').textContent =
      `Bulan ${monthLabel(state.month)} ${state.year}`;

    loadAll().catch((err) => {
      console.error('[finance init]', err);
      alert('Gagal muat data');
    });
  });
})();