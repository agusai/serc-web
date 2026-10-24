// coach/js/match-sb.js
import { protectPage } from './auth-sb.js';
import { renderHeader, renderDock, loadUser } from './shared-sb.js';
import { getMatches } from '../../js/supabase.js';

let CURRENT_USER = null;
let CURRENT_TEAM = '';
let ALL_MATCHES = [];
let FILTER = 'upcoming';

async function init() {
  const authUser = await protectPage();
  CURRENT_USER = await loadUser(authUser.id);

  const role = CURRENT_USER.role || 'coaching';
  const category = CURRENT_USER.category || '';
  const isHeadCoach = role === 'headcoach' || category === 'All Teams';
  CURRENT_TEAM = isHeadCoach ? 'All Teams' : category;

  renderHeader(CURRENT_USER, role);
  renderDock('match');

  await loadData();
  render();
}

async function loadData() {
  try {
    ALL_MATCHES = await getMatches(CURRENT_TEAM);
    ALL_MATCHES.sort((a, b) => (b.dateMillis || 0) - (a.dateMillis || 0));
  } catch (e) {
    console.error('Load error:', e);
  }
}

function render() {
  const main = document.getElementById('appMain');
  if (!main) return;

  const live = ALL_MATCHES.filter(m => m.status === 'live');
  const upcoming = ALL_MATCHES.filter(m => m.status === 'upcoming')
                               .sort((a, b) => (a.dateMillis || 0) - (b.dateMillis || 0));
  const past = ALL_MATCHES.filter(m => ['win','loss','draw'].includes(m.status));

  main.innerHTML = `
    ${live.length > 0 ? live.map(m => `
      <div class="live-banner" data-match-id="${m.id}">
        <div class="live-dot"></div>
        <div class="live-text">LIVE · vs ${escape(m.opponent)} · ${m.scoreUs} - ${m.scoreThem}</div>
        <div class="live-arrow">›</div>
      </div>
    `).join('') : ''}
    
    <div class="segment-row">
      <button class="segment-btn ${FILTER === 'upcoming' ? 'active' : ''}" data-filter="upcoming">
        Upcoming (${upcoming.length})
      </button>
      <button class="segment-btn ${FILTER === 'past' ? 'active' : ''}" data-filter="past">
        Past (${past.length})
      </button>
    </div>
    
    <div class="match-list" id="matchList"></div>
  `;

  document.querySelectorAll('.segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      FILTER = btn.dataset.filter;
      render();
    });
  });

  document.querySelectorAll('.live-banner').forEach(el => {
    el.addEventListener('click', () => {
      const m = ALL_MATCHES.find(x => x.id === el.dataset.matchId);
      if (m) openDetail(m);
    });
  });

  const list = document.getElementById('matchList');
  const items = FILTER === 'upcoming' ? upcoming : past;

  if (items.length === 0) {
    list.innerHTML = `
      <div class="match-empty">
        <div class="match-empty-emoji">🏉</div>
        ${FILTER === 'upcoming' ? 'No upcoming matches.' : 'No past matches yet.'}
      </div>
    `;
    return;
  }

  list.innerHTML = items.map(m => renderCard(m)).join('');

  list.querySelectorAll('.match-card').forEach(card => {
    card.addEventListener('click', () => {
      const m = ALL_MATCHES.find(x => x.id === card.dataset.matchId);
      if (m) openDetail(m);
    });
  });
}

function renderCard(m) {
  const isPast = ['win','loss','draw'].includes(m.status);
  const isLive = m.status === 'live';
  const us = m.scoreUs ?? 0;
  const them = m.scoreThem ?? 0;
  const usWin = us > them;
  const themWin = them > us;

  const homeTeam = m.isHome ? 'EAGLES' : m.opponent;
  const awayTeam = m.isHome ? m.opponent : 'EAGLES';
  const homeScore = m.isHome ? us : them;
  const awayScore = m.isHome ? them : us;
  const homeCls = m.isHome ? (usWin ? 'win' : themWin ? 'lose' : '') : (themWin ? 'win' : usWin ? 'lose' : '');
  const awayCls = m.isHome ? (themWin ? 'win' : usWin ? 'lose' : '') : (usWin ? 'win' : themWin ? 'lose' : '');

  return `
    <div class="match-card status-${m.status}" data-match-id="${m.id}">
      <div class="match-card-head">
        <span class="match-status-badge ${m.status}">${m.status.toUpperCase()}</span>
        <span class="match-venue-badge">${m.isHome ? 'HOME' : 'AWAY'} · ${escape(m.category || '')}</span>
      </div>
      
      ${isPast || isLive ? `
        <div class="match-teams">
          <div class="match-team">
            <div class="match-team-label">${m.isHome ? 'Home' : 'Away'}</div>
            <div class="match-team-name">${escape(homeTeam)}</div>
          </div>
          <div class="match-score">
            <span class="${homeCls}">${homeScore}</span>
            <span class="sep">:</span>
            <span class="${awayCls}">${awayScore}</span>
          </div>
          <div class="match-team away">
            <div class="match-team-label">${m.isHome ? 'Away' : 'Home'}</div>
            <div class="match-team-name">${escape(awayTeam)}</div>
          </div>
        </div>
      ` : `
        <div class="match-title">vs ${escape(m.opponent)}</div>
      `}
      
      <div class="match-meta">
        <div class="match-meta-item">📅 ${escape(m.dateLabel || 'TBD')}</div>
        ${m.time ? `<div class="match-meta-item">⏰ ${escape(m.time)}</div>` : ''}
        ${m.venue ? `<div class="match-meta-item">📍 ${escape(m.venue)}</div>` : ''}
      </div>
    </div>
  `;
}

function openDetail(m) {
  const sheet = document.getElementById('matchSheet');
  const content = document.getElementById('matchSheetContent');

  const isPast = ['win','loss','draw'].includes(m.status);
  const isLive = m.status === 'live';
  const us = m.scoreUs ?? 0;
  const them = m.scoreThem ?? 0;

  const tryScorers = (m.tryScorers || '').split(',').map(s => s.trim()).filter(Boolean);
  const yellow = (m.yellowCards || '').split(',').map(s => s.trim()).filter(Boolean);
  const red = (m.redCards || '').split(',').map(s => s.trim()).filter(Boolean);

  content.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-head">
      <div class="sheet-title">vs ${escape(m.opponent)}</div>
      <button class="sheet-close" id="closeMatchSheet">✕</button>
    </div>
    
    ${isPast || isLive ? `
      <div style="text-align:center;padding:20px 0">
        <div style="font-family:var(--font-h);font-size:3rem;line-height:1;color:var(--white);letter-spacing:-0.02em">
          ${us} <span style="color:var(--gray);font-size:1.5rem">:</span> ${them}
        </div>
        <div style="margin-top:8px;font-size:0.7rem;letter-spacing:0.15em;color:var(--gray);text-transform:uppercase">
          ${m.status.toUpperCase()} · ${m.dateLabel || ''}
        </div>
      </div>
    ` : ''}
    
    <div class="sheet-info-row">
      <span class="sheet-info-label">Date</span>
      <span class="sheet-info-value">${escape(m.dateLabel || '—')}</span>
    </div>
    <div class="sheet-info-row">
      <span class="sheet-info-label">Time</span>
      <span class="sheet-info-value">${escape(m.time || '—')}</span>
    </div>
    <div class="sheet-info-row">
      <span class="sheet-info-label">Venue</span>
      <span class="sheet-info-value">${escape(m.venue || '—')}</span>
    </div>
    <div class="sheet-info-row">
      <span class="sheet-info-label">Category</span>
      <span class="sheet-info-value">${escape(m.category || '—')}</span>
    </div>
    <div class="sheet-info-row">
      <span class="sheet-info-label">Home / Away</span>
      <span class="sheet-info-value">${m.isHome ? 'HOME' : 'AWAY'}</span>
    </div>
    ${m.manOfMatch ? `
      <div class="sheet-info-row">
        <span class="sheet-info-label">Man of Match</span>
        <span class="sheet-info-value" style="color:var(--gold)">★ ${escape(m.manOfMatch)}</span>
      </div>
    ` : ''}
    
    ${tryScorers.length > 0 ? `
      <div class="detail-section">
        <div class="detail-section-title">Try Scorers</div>
        <div class="detail-list">
          ${tryScorers.map(s => `<div class="detail-list-item">🏉 ${escape(s)}</div>`).join('')}
        </div>
      </div>
    ` : ''}
    
    ${yellow.length > 0 ? `
      <div class="detail-section">
        <div class="detail-section-title">Yellow Cards</div>
        <div class="detail-list">
          ${yellow.map(s => `<div class="detail-list-item">🟨 ${escape(s)}</div>`).join('')}
        </div>
      </div>
    ` : ''}
    
    ${red.length > 0 ? `
      <div class="detail-section">
        <div class="detail-section-title">Red Cards</div>
        <div class="detail-list">
          ${red.map(s => `<div class="detail-list-item">🟥 ${escape(s)}</div>`).join('')}
        </div>
      </div>
    ` : ''}
    
    ${m.matchReport ? `
      <div class="detail-section">
        <div class="detail-section-title">Match Report</div>
        <div class="detail-list">
          <div class="detail-list-item" style="line-height:1.6">${escape(m.matchReport)}</div>
        </div>
      </div>
    ` : ''}
    
    ${m.areasToImprove ? `
      <div class="detail-section">
        <div class="detail-section-title">Areas to Improve</div>
        <div class="detail-list">
          <div class="detail-list-item" style="line-height:1.6">${escape(m.areasToImprove)}</div>
        </div>
      </div>
    ` : ''}
    
    ${m.liveUpdates && m.liveUpdates.length > 0 ? `
      <div class="detail-section">
        <div class="detail-section-title">Live Updates</div>
        <div class="detail-list">
          ${m.liveUpdates.slice().reverse().map(u => `<div class="detail-list-item">● ${escape(u)}</div>`).join('')}
        </div>
      </div>
    ` : ''}
    
    ${m.status === 'upcoming' ? `
      <div class="detail-section">
        <div class="detail-section-title">Actions</div>
        <button class="sheet-save-btn" id="startLiveBtn" style="background:var(--bad);color:white">
          🏉 Start Live Scoring (open mobile app)
        </button>
      </div>
    ` : ''}
  `;

  document.getElementById('closeMatchSheet').addEventListener('click', () => closeSheet(sheet));
  sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(sheet); });

  const liveBtn = document.getElementById('startLiveBtn');
  if (liveBtn) {
    liveBtn.addEventListener('click', () => {
      alert('Live scoring hanya available dalam mobile app. Buka Coach App → Match → Go Live.');
    });
  }

  openSheet(sheet);
}

function openSheet(el) {
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeSheet(el) {
  el.classList.remove('active');
  document.body.style.overflow = '';
}
function escape(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

init();