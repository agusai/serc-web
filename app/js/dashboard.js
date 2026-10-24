import { auth } from './auth.js';
import { db } from '../../js/firebase.js';
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const main = document.getElementById('appMain');
const dock = document.getElementById('dock');
const greeting = document.getElementById('userGreeting');
const roleEl = document.getElementById('userRole');

// ============================================
// DOCK MENU — ikut role
// ============================================
const DOCK_ITEMS = {
  home:     { label: 'Home',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>' },
  matches:  { label: 'Matches',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 0 0 20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1"/></svg>' },
  players:  { label: 'Players',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  attendance: { label: 'Attend', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  fees:     { label: 'Fees',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  events:   { label: 'Events',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' },
  profile:  { label: 'Profile',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' }
};

const ROLE_MENU = {
  superadmin:  ['home', 'matches', 'players', 'attendance', 'fees', 'events', 'profile'],
  management:  ['home', 'matches', 'players', 'attendance', 'fees', 'events', 'profile'],
  admin:       ['home', 'matches', 'players', 'attendance', 'fees', 'events', 'profile'],
  headcoach:   ['home', 'matches', 'players', 'attendance', 'events', 'profile'],
  coaching:    ['home', 'matches', 'players', 'attendance', 'events', 'profile'],
  livecoach:   ['home', 'matches', 'attendance', 'profile'],
  player:      ['home', 'matches', 'attendance', 'events', 'profile'],
  parents:     ['home', 'matches', 'fees', 'events', 'profile'],
  guest:       ['home', 'matches']
};

// ============================================
// MAIN
// ============================================
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  // Load user data
  const userSnap = await getDoc(doc(db, 'users', user.uid));
  if (!userSnap.exists()) {
    main.innerHTML = `<div class="card">User record not found.</div>`;
    return;
  }
  const userData = userSnap.data();
  const role = userData.role || 'guest';

  greeting.textContent = userData.name || userData.displayName || 'Welcome';
  roleEl.textContent = role;

  // Build dock
  const menu = ROLE_MENU[role] || ROLE_MENU.guest;
  renderDock(menu);

  // Load default page
  renderPage('home', userData, role);
});

// ============================================
// RENDER DOCK
// ============================================
function renderDock(items) {
  dock.innerHTML = '';
  items.forEach((key, idx) => {
    const item = DOCK_ITEMS[key];
    if (!item) return;

    const btn = document.createElement('button');
    btn.className = 'dock-item' + (idx === 0 ? ' active' : '');
    btn.dataset.page = key;
    btn.innerHTML = `${item.icon}<span class="dock-item-label">${item.label}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPage(key);
    });
    dock.appendChild(btn);
  });
}

// ============================================
// RENDER PAGE
// ============================================
async function renderPage(key) {
  main.innerHTML = `<div class="loading-state"><div class="spinner"></div><div>Loading...</div></div>`;

  switch (key) {
    case 'home':       return renderHome();
    case 'matches':    return renderPlaceholder('Matches', 'Match list will go here.');
    case 'players':    return renderPlaceholder('Players', 'Player roster will go here.');
    case 'attendance': return renderPlaceholder('Attendance', 'Attendance records will go here.');
    case 'fees':       return renderPlaceholder('Fees', 'Fee management will go here.');
    case 'events':     return renderPlaceholder('Events', 'Club events will go here.');
    case 'profile':    return renderPlaceholder('Profile', 'Your profile settings will go here.');
    default:           return renderPlaceholder('Coming Soon', 'This section is under construction.');
  }
}

function renderPlaceholder(title, sub) {
  main.innerHTML = `
    <div class="dash-section">
      <div class="dash-tag">SECTION</div>
      <h2 class="dash-title">${title}</h2>
      <div class="card" style="text-align:center;padding:48px 20px;color:var(--gray)">
        ${sub}
      </div>
    </div>
  `;
}

async function renderHome() {
  // Contoh: total matches, players
  try {
    const matchesSnap = await getDocs(collection(db, 'matches'));
    const playersSnap = await getDocs(collection(db, 'players'));

    main.innerHTML = `
      <div class="dash-section">
        <div class="dash-tag">OVERVIEW</div>
        <h2 class="dash-title">Dashboard</h2>
        <div class="dash-grid">
          <div class="stat-tile">
            <div class="stat-tile-val">${matchesSnap.size}</div>
            <div class="stat-tile-lbl">Matches</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-val">${playersSnap.size}</div>
            <div class="stat-tile-lbl">Players</div>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    renderPlaceholder('Dashboard', e.message);
  }
}