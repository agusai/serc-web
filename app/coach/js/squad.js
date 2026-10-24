import { protectPage } from './auth.js';
import { renderHeader, renderDock, loadUser } from './shared.js';
import { db } from '../../js/firebase.js';
import { collection, getDocs, query, where, doc, updateDoc }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const main = document.getElementById('appMain');

let ALL_PLAYERS = [];
let CURRENT_FILTER = 'all';
let CURRENT_SEARCH = '';
let CURRENT_TEAM = '';

async function init() {
  const authUser = await protectPage();
  const user = await loadUser(authUser.uid);
  const role = user.role || 'coaching';
  const team = user.team || '';
  const isAllTeams = role === 'headcoach' || team === 'All Teams';

  renderHeader(user, role);
  renderDock('squad');

  CURRENT_TEAM = team;

  // Load players
  const q = isAllTeams
    ? collection(db, 'players')
    : query(collection(db, 'players'), where('team', '==', team));

  const snap = await getDocs(q);
  ALL_PLAYERS = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Sort by jersey number
  ALL_PLAYERS.sort((a, b) => (a.jerseyNumber || 999) - (b.jerseyNumber || 999));

  renderSquad(isAllTeams);
}

function renderSquad(isAllTeams) {
  main.innerHTML = `
    <div class="dash-section">
      <div class="dash-tag">${isAllTeams ? 'ALL TEAMS' : CURRENT_TEAM.toUpperCase()}</div>
      <h2 class="dash-title">Squad</h2>
      
      <div class="squad-toolbar">
        <input type="text" class="squad-search" id="squadSearch" placeholder="Search name, position...">
        <div class="squad-filters" id="squadFilters">
          <button class="filter-chip active" data-filter="all">All (${ALL_PLAYERS.length})</button>
          <button class="filter-chip" data-filter="active">Active</button>
          <button class="filter-chip" data-filter="injured">Injured</button>
        </div>
      </div>
      
      <div class="squad-list" id="squadList"></div>
    </div>
  `;

  // Events
  document.getElementById('squadSearch').addEventListener('input', e => {
    CURRENT_SEARCH = e.target.value.toLowerCase();
    renderPlayers();
  });

  document.querySelectorAll('#squadFilters .filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#squadFilters .filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      CURRENT_FILTER = btn.dataset.filter;
      renderPlayers();
    });
  });

  renderPlayers();
}

function renderPlayers() {
  const list = document.getElementById('squadList');
  if (!list) return;

  let players = ALL_PLAYERS;

  if (CURRENT_FILTER === 'active') {
    players = players.filter(p => p.status === 'active' || !p.status);
  } else if (CURRENT_FILTER === 'injured') {
    players = players.filter(p => p.status === 'injured');
  }

  if (CURRENT_SEARCH) {
    players = players.filter(p => {
      const hay = `${p.name || ''} ${p.nickname || ''} ${p.position || ''}`.toLowerCase();
      return hay.includes(CURRENT_SEARCH);
    });
  }

  if (players.length === 0) {
    list.innerHTML = `<div class="empty">No players match your filter.</div>`;
    return;
  }

  list.innerHTML = players.map(p => playerCard(p)).join('');

  // Click handler
  list.querySelectorAll('.player-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.playerId;
      const player = ALL_PLAYERS.find(p => p.id === id);
      if (player) openPlayerSheet(player);
    });
  });
}

function playerCard(p) {
  const status = p.status || 'active';
  const statusClass = status === 'injured' ? 'status-injured' : status === 'inactive' ? 'status-inactive' : 'status-active';
  const statusLabel = status === 'injured' ? 'INJURED' : status === 'inactive' ? 'INACTIVE' : 'ACTIVE';
  
  // OVR — compute if not stored (simple: use fitnessPercent)
  const ovr = p.fitnessPercent || 0;
  const ovrColor = ovr >= 90 ? 'ovr-elite' : ovr >= 80 ? 'ovr-excellent' : ovr >= 70 ? 'ovr-good' : ovr >= 60 ? 'ovr-average' : 'ovr-need';

  const jersey = p.jerseyNumber ? `#${p.jerseyNumber}` : '—';
  const initial = (p.nickname || p.name || '?').charAt(0).toUpperCase();

  return `
    <div class="player-card" data-player-id="${p.id}">
      <div class="player-avatar">
  ${p.photoUrl 
    ? `<img src="${escape(p.photoUrl)}" alt="" 
            onerror="this.style.display='none';this.parentElement.textContent='${initial.replace(/'/g, "\\'")}'">` 
    : initial}
      </div>
      <div class="player-info">
        <div class="player-name">
          ${escape(p.nickname || p.name)}
          ${p.captainRole === 'captain' ? '<span class="captain-badge">C</span>' : ''}
          ${p.captainRole === 'vice_captain' ? '<span class="captain-badge vc">VC</span>' : ''}
        </div>
        <div class="player-meta">
          ${jersey} · ${escape(p.position || 'No position')}
        </div>
        <div class="player-status ${statusClass}">${statusLabel}</div>
      </div>
      <div class="player-ovr ${ovrColor}">
        <div class="ovr-val">${ovr}%</div>
        <div class="ovr-lbl">OVR</div>
      </div>
    </div>
  `;
}

function openPlayerSheet(player) {
  const overlay = document.createElement('div');
  overlay.className = 'player-sheet-overlay';

  const skills = player.skillsCovered || [];
  const syllabusPct = Math.round((skills.length / 6) * 100);
  const attendancePct = player.attendancePercent || 0;

  overlay.innerHTML = `
    <div class="player-sheet">
      <div class="sheet-handle"></div>
      
      <div class="player-sheet-head">
        <div class="player-sheet-avatar">
          ${player.photoUrl 
            ? `<img src="${escape(player.photoUrl)}" alt="" onerror="this.style.display='none';this.parentElement.textContent='${(player.nickname || player.name || '?').charAt(0).toUpperCase()}'">` 
            : (player.nickname || player.name || '?').charAt(0).toUpperCase()}
        </div>
        <div class="player-sheet-info">
          <div class="player-sheet-name">
            ${escape(player.nickname || player.name)}
            ${player.captainRole === 'captain' ? '<span class="captain-badge">C</span>' : ''}
            ${player.captainRole === 'vice_captain' ? '<span class="captain-badge vc">VC</span>' : ''}
          </div>
          <div class="player-sheet-meta">${escape(player.position || 'No position')} · #${player.jerseyNumber || '—'}</div>
          <div class="player-sheet-tags">
            <span class="status-tag ${player.status === 'injured' ? 'injured' : 'active'}">${(player.status || 'active').toUpperCase()}</span>
            ${player.height ? `<span class="info-tag">${player.height} cm</span>` : ''}
            ${player.weight ? `<span class="info-tag">${player.weight} kg</span>` : ''}
          </div>
        </div>
        <button class="sheet-close-btn" id="closePlayerSheet">✕</button>
      </div>
      
      <div class="emergency-card">
        <div class="emergency-icon">📞</div>
        <div>
          <div class="emergency-label">Emergency Contact</div>
          <div class="emergency-name">${escape(player.parentName || '—')} ${player.parentRelationship ? `(${escape(player.parentRelationship)})` : ''}</div>
          <div class="emergency-phone">${escape(player.parentPhone || '—')}</div>
        </div>
      </div>
      
      <div class="section-label">PLAYER METRICS</div>
      
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-label">Attendance</div>
          <div class="metric-value" style="color:${attendancePct >= 80 ? 'var(--good)' : attendancePct >= 60 ? 'var(--warn)' : 'var(--bad)'}">${attendancePct}%</div>
          <div class="metric-sub">Training sessions</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Syllabus</div>
          <div class="metric-value" style="color:${syllabusPct >= 80 ? 'var(--good)' : syllabusPct >= 60 ? 'var(--warn)' : 'var(--bad)'}">${syllabusPct}%</div>
          <div class="metric-sub">${skills.length} of 6 skills</div>
        </div>
      </div>
      
      <div class="coach-remark-box">
        <div class="coach-remark-label">COACH REMARK</div>
        <div class="coach-remark-text">${player.coachRemark ? escape(player.coachRemark) : '<em style="color:var(--gray)">Tiada ulasan lagi.</em>'}</div>
      </div>
      
      <button class="edit-metrics-btn" id="editMetricsBtn">✎ Edit Player Metrics</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.querySelector('#closePlayerSheet').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  overlay.querySelector('#editMetricsBtn').addEventListener('click', () => {
    close();
    setTimeout(() => openEditMetrics(player), 300);
  });
}

// ============================================
// EDIT METRICS SHEET
// ============================================
const SYLLABUS_SKILLS = [
  { key: 'passing',      label: 'Passing (Left & Right)' },
  { key: 'tackling',     label: 'Tackling (Low, Safe, Wrap)' },
  { key: 'ruck',         label: 'Ruck (Body Position, Cleanout)' },
  { key: 'support',      label: 'Support Play (Follow Ball)' },
  { key: 'ball_carrying',label: 'Ball Carrying (Low Body)' },
  { key: 'catching',     label: 'Catching (Soft Hands)' }
];

function openEditMetrics(player) {
  const overlay = document.createElement('div');
  overlay.className = 'player-sheet-overlay';

  let selected = new Set(player.skillsCovered || []);
  let remark = player.coachRemark || '';

  const render = () => {
    overlay.innerHTML = `
      <div class="player-sheet">
        <div class="sheet-handle"></div>
        
        <div class="player-sheet-head" style="margin-bottom:16px">
          <div class="player-sheet-info">
            <div class="player-sheet-name">Edit — ${escape(player.nickname || player.name)}</div>
            <div class="player-sheet-meta">${escape(player.position || '')} · #${player.jerseyNumber || '—'}</div>
          </div>
          <button class="sheet-close-btn" id="closeEdit">✕</button>
        </div>
        
        <div class="section-label">SYLLABUS SKILLS (6 General)</div>
        <p style="font-size:0.8rem;color:var(--gray);margin-bottom:12px">Tandakan skill yang telah dikuasai pemain.</p>
        
        <div class="skills-list">
          ${SYLLABUS_SKILLS.map(s => `
            <label class="skill-item ${selected.has(s.key) ? 'checked' : ''}" data-skill="${s.key}">
              <span class="skill-checkbox">${selected.has(s.key) ? '✓' : ''}</span>
              <span class="skill-label">${s.label}</span>
            </label>
          `).join('')}
        </div>
        
        <div class="section-label" style="margin-top:20px">COACH REMARK</div>
        <textarea class="remark-input" id="remarkInput" rows="4" 
                  placeholder="Masukkan ulasan jurulatih untuk pemain ini...">${escape(remark)}</textarea>
        
        <button class="save-btn" id="saveMetrics">✓ Save Metrics</button>
      </div>
    `;

    overlay.querySelector('#closeEdit').addEventListener('click', close);
    
    overlay.querySelectorAll('.skill-item').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        const k = el.dataset.skill;
        if (selected.has(k)) selected.delete(k); else selected.add(k);
        render();
      });
    });

    const remarkInput = overlay.querySelector('#remarkInput');
    remarkInput.addEventListener('input', e => remark = e.target.value);

    overlay.querySelector('#saveMetrics').addEventListener('click', async () => {
      const btn = overlay.querySelector('#saveMetrics');
      btn.disabled = true;
      btn.textContent = 'Saving...';

      try {
        await updateDoc(doc(db, 'players', player.id), {
          skillsCovered: Array.from(selected),
          coachRemark: remark.trim(),
          metricsUpdatedAt: new Date().toISOString()
        });

        // Update local state
        const idx = ALL_PLAYERS.findIndex(p => p.id === player.id);
        if (idx >= 0) {
          ALL_PLAYERS[idx].skillsCovered = Array.from(selected);
          ALL_PLAYERS[idx].coachRemark = remark.trim();
        }

        btn.textContent = 'Saved ✓';
        setTimeout(() => {
          close();
          renderPlayers();
        }, 600);
      } catch (e) {
        console.error(e);
        btn.textContent = 'Error — retry';
        btn.disabled = false;
      }
    });
  };

  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 300);
  };

  render();
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

function escape(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

init();