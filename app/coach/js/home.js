import { protectPage } from './auth.js';
import { renderHeader, renderDock, loadUser } from './shared.js';
import { db } from '../../js/firebase.js';
import { collection, getDocs, query, where, orderBy, limit }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const main = document.getElementById('appMain');

async function init() {
  const authUser = await protectPage();

  let user;
  try {
    user = await loadUser(authUser.uid);
  } catch (e) {
    main.innerHTML = `<div class="empty">User record not found.</div>`;
    return;
  }

  const role = user.role || 'coaching';
  const team = user.team || 'U14 Boys';
  const isAllTeams = role === 'headcoach' || team === 'All Teams';

  renderHeader(user, role);
  renderDock('home');

  // Load data
  await renderHome(user, team, isAllTeams);
}

async function renderHome(user, team, isAllTeams) {
  try {
    // Players for team
    const playersQ = isAllTeams
      ? collection(db, 'players')
      : query(collection(db, 'players'), where('team', '==', team));
    const playersSnap = await getDocs(playersQ);
    const players = playersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const activePlayers = players.filter(p => p.status === 'active').length;
    const injuredPlayers = players.filter(p => p.status === 'injured');

    // Next training
    const trainingQ = isAllTeams
      ? query(collection(db, 'trainings'), orderBy('dateMillis', 'asc'), limit(20))
      : query(collection(db, 'trainings'), where('team', '==', team), orderBy('dateMillis', 'asc'), limit(20));
    let nextTraining = null;
    try {
      const trainingSnap = await getDocs(trainingQ);
      const now = Date.now();
      nextTraining = trainingSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .find(t => (t.dateMillis || 0) > now) || null;
    } catch (e) { console.warn('training load fail', e); }

    // Next match
    const matchQ = isAllTeams
      ? query(collection(db, 'matches'), where('status', '==', 'upcoming'), orderBy('dateMillis', 'asc'), limit(5))
      : query(collection(db, 'matches'), where('team', '==', team), where('status', '==', 'upcoming'), orderBy('dateMillis', 'asc'), limit(5));
    let nextMatch = null;
    try {
      const matchSnap = await getDocs(matchQ);
      nextMatch = matchSnap.docs[0] ? { id: matchSnap.docs[0].id, ...matchSnap.docs[0].data() } : null;
    } catch (e) { console.warn('match load fail', e); }

    // Render
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
            <div class="kpi-val" style="font-size:1rem">${nextTraining ? nextTraining.dateLabel : '—'}</div>
            <div class="kpi-sub">${nextTraining ? nextTraining.time : 'not scheduled'}</div>
          </div>
          <div class="kpi ${nextMatch ? 'kpi-good' : ''}">
            <div class="kpi-label">Next Match</div>
            <div class="kpi-val" style="font-size:1rem">${nextMatch ? 'vs ' + nextMatch.opponent : '—'}</div>
            <div class="kpi-sub">${nextMatch ? nextMatch.dateLabel : 'no match yet'}</div>
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