// coach/js/home-sb.js
import { protectPage } from './auth-sb.js';
import { renderHeader, renderDock, loadUser } from './shared-sb.js';
import { getPlayers, getTrainings, getMatches } from '../../js/supabase.js';

const main = document.getElementById('appMain');

async function init() {
  const authUser = await protectPage();

  let user;
  try {
    user = await loadUser(authUser.id);
  } catch (e) {
    main.innerHTML = `<div class="empty">User record not found.</div>`;
    return;
  }

  const role = user.role || 'coaching';
  const category = user.category || '';
  const isAllTeams = role === 'headcoach' || category === 'All Teams';

  renderHeader(user, role);
  renderDock('home');

  await renderHome(user, category, isAllTeams);
}

async function renderHome(user, category, isAllTeams) {
  try {
    // Players
    const players = await getPlayers(isAllTeams ? 'All Teams' : category);
    const activePlayers = players.filter(p => p.status === 'active' || !p.status).length;
    const injuredPlayers = players.filter(p => p.status === 'injured');

    // Next training
    let nextTraining = null;
    try {
      const trainings = await getTrainings(isAllTeams ? 'All Teams' : category);
      const now = Date.now() - 24 * 60 * 60 * 1000; // allow today
      const future = trainings
        .filter(t => (t.dateMillis || 0) >= now)
        .sort((a, b) => (a.dateMillis || 0) - (b.dateMillis || 0));
      nextTraining = future[0] || null;
    } catch (e) { console.warn('training load fail', e); }

    // Next match
    let nextMatch = null;
    try {
      const matches = await getMatches(isAllTeams ? 'All Teams' : category);
      const upcoming = matches
        .filter(m => m.status === 'upcoming')
        .sort((a, b) => (a.dateMillis || 0) - (b.dateMillis || 0));
      nextMatch = upcoming[0] || null;
    } catch (e) { console.warn('match load fail', e); }

    main.innerHTML = `
      <div class="dash-section">
        <div class="dash-tag">OVERVIEW</div>
        <h2 class="dash-title">Good ${getTimeOfDay()}, Coach.</h2>
        
        <div class="kpi-grid">
          <div class="kpi">
            <div class="kpi-label">Active Players</div>
            <div class="kpi-val">${activePlayers}</div>
            <div class="kpi-sub">of ${players.length} total</div>
          </div>
          <div class="kpi ${injuredPlayers.length > 0 ? 'kpi-warn' : 'kpi-good'}">
            <div class="kpi-label">Injured</div>
            <div class="kpi-val">${injuredPlayers.length}</div>
            <div class="kpi-sub">${injuredPlayers.length > 0 ? 'needs attention' : 'all clear'}</div>
          </div>
          <div class="kpi ${nextTraining ? '' : 'kpi-warn'}">
            <div class="kpi-label">Next Training</div>
            <div class="kpi-val" style="font-size:1rem">${nextTraining ? escape(nextTraining.dateLabel) : '—'}</div>
            <div class="kpi-sub">${nextTraining ? escape(nextTraining.time || '') : 'not scheduled'}</div>
          </div>
          <div class="kpi ${nextMatch ? 'kpi-good' : ''}">
            <div class="kpi-label">Next Match</div>
            <div class="kpi-val" style="font-size:1rem">${nextMatch ? 'vs ' + escape(nextMatch.opponent) : '—'}</div>
            <div class="kpi-sub">${nextMatch ? escape(nextMatch.dateLabel) : 'no match yet'}</div>
          </div>
        </div>
      </div>

      ${injuredPlayers.length > 0 ? `
        <div class="dash-section">
          <div class="dash-tag">INJURY WATCH</div>
          ${injuredPlayers.map(p => `
            <div class="alert-row warn">
              <div class="alert-icon">⚠️</div>
              <div class="alert-body">
                <div class="alert-title">${escape(p.nickname || p.name)}</div>
                <div class="alert-sub">${escape(p.injuryNote || 'Injured — check notes')}</div>
              </div>
              <div class="alert-arrow">›</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="dash-section">
        <div class="dash-tag">QUICK ACCESS</div>
        <a href="squad.html" class="card" style="display:flex;align-items:center;gap:14px;text-decoration:none">
          <div class="alert-icon">👥</div>
          <div class="alert-body">
            <div class="alert-title">View Squad</div>
            <div class="alert-sub">${players.length} players · ${activePlayers} active</div>
          </div>
          <div class="alert-arrow">›</div>
        </a>
        <a href="training.html" class="card" style="display:flex;align-items:center;gap:14px;text-decoration:none">
          <div class="alert-icon">📅</div>
          <div class="alert-body">
            <div class="alert-title">Training Calendar</div>
            <div class="alert-sub">Mark attendance & rate fitness</div>
          </div>
          <div class="alert-arrow">›</div>
        </a>
        <a href="match.html" class="card" style="display:flex;align-items:center;gap:14px;text-decoration:none">
          <div class="alert-icon">🏉</div>
          <div class="alert-body">
            <div class="alert-title">Matches</div>
            <div class="alert-sub">Upcoming & past results</div>
          </div>
          <div class="alert-arrow">›</div>
        </a>
      </div>
    `;
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="empty">Error loading dashboard: ${escape(e.message)}</div>`;
  }
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function escape(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

init();