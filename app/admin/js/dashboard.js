// app/admin/js/dashboard.js
(function () {
  'use strict';

  // ---------- Helpers ----------
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
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  };
  const monthLabel = (month) => {
    const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
    return months[(month - 1) % 12] || '—';
  };

  // ---------- Render Header ----------
  function renderHeader() {
    const el = document.getElementById('header-user');
    if (!el) return;

    // Untuk sekarang kita tak buat auth check penuh —
    // Guna placeholder sehingga login flow management siap.
    // Nanti boleh integrate dengan session.
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

  // ---------- Dock "Coming Soon" ----------
  function bindDock() {
    document.querySelectorAll('.dock-item[data-soon="1"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Akan datang');
      });
    });
  }

  // ---------- Load KPIs ----------
  async function loadKPIs() {
    const el = document.getElementById('kpi-grid');
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    try {
      const [totalPlayers, summary, nextEvent] = await Promise.all([
        window.SERCAPI.fees.getTotalPlayersCount(),
        window.SERCAPI.fees.getSummary(month, year),
        window.SERCAPI.events.getNextEvent(),
      ]);

      const overdueCount = summary.unpaid;

      el.innerHTML = `
        <div class="kpi-card">
          <span class="kpi-label">Total Players</span>
          <span class="kpi-value">${totalPlayers}</span>
          <span class="kpi-sub">Aktif berdaftar</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Overdue Fees</span>
          <span class="kpi-value ${overdueCount > 0 ? 'bad' : 'good'}">${overdueCount}</span>
          <span class="kpi-sub ${overdueCount > 0 ? 'bad' : ''}">${monthLabel(month)} ${year}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Next Event</span>
          <span class="kpi-value orange" style="font-size:20px;line-height:1.2">
            ${nextEvent ? escapeHtml(nextEvent.title) : '—'}
          </span>
          <span class="kpi-sub">${nextEvent ? formatDate(nextEvent.event_date) : 'Tiada event'}</span>
        </div>
      `;
    } catch (err) {
      console.error('[dashboard KPIs]', err);
      el.innerHTML = `<div class="empty"><strong>Gagal muat KPI</strong></div>`;
    }
  }

  // ---------- Load Action Required ----------
  async function loadActions() {
    const el = document.getElementById('action-list');
    try {
      const unpaid = await window.SERCAPI.fees.getUnpaidCurrentMonth(6);

      if (!unpaid.length) {
        el.innerHTML = `<div class="empty"><strong>Semua clear ✓</strong>Tiada tindakan diperlukan.</div>`;
        return;
      }

      el.innerHTML = unpaid.map((f) => {
        const p = f.players || {};
        return `
          <div class="action-item">
            <div class="avatar">${escapeHtml(initials(p.full_name))}</div>
            <div class="action-body">
              <div class="action-name">${escapeHtml(p.full_name || 'Unknown')}</div>
              <div class="action-meta">${escapeHtml(p.category || '—')} · Belum bayar ${monthLabel(f.month)} ${f.year}</div>
            </div>
            <div class="action-amt">${formatMYR(f.amount)}</div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('[dashboard actions]', err);
      el.innerHTML = `<div class="empty"><strong>Gagal muat tindakan</strong></div>`;
    }
  }

  // ---------- Load Next Event ----------
  async function loadNextEvent() {
    const el = document.getElementById('next-event-section');
    try {
      const ev = await window.SERCAPI.events.getNextEvent();

      if (!ev) {
        el.innerHTML = `<div class="empty"><strong>Tiada event akan datang</strong>Tambah event baru di page Events.</div>`;
        return;
      }

      const d = new Date(ev.event_date + 'T00:00:00');
      const day = d.getDate();
      const mon = d.toLocaleDateString('ms-MY', { month: 'short' }).toUpperCase();

      el.innerHTML = `
        <div class="next-event">
          <div class="next-event-date">
            <div class="next-event-day">${day}</div>
            <div class="next-event-mon">${mon}</div>
          </div>
          <div class="next-event-body">
            <div class="next-event-title">${escapeHtml(ev.title)}</div>
            <div class="next-event-meta">
              ${ev.location ? escapeHtml(ev.location) + ' · ' : ''}${ev.event_time ? ev.event_time.slice(0, 5) : ''}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('[dashboard event]', err);
      el.innerHTML = `<div class="empty"><strong>Gagal muat event</strong></div>`;
    }
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    bindDock();
    loadKPIs();
    loadActions();
    loadNextEvent();
  });
})();