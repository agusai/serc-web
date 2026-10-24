// coach/js/shared-sb.js
import { setupLogout } from './auth-sb.js';
import { getUser } from '../../js/supabase.js';

// ============ DOCK ITEMS ============
const COACH_DOCK = [
  { id: 'home',     label: 'Home',     href: 'index.html',    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>' },
  { id: 'squad',    label: 'Squad',    href: 'squad.html',    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { id: 'training', label: 'Train',    href: 'training.html', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' },
  { id: 'match',    label: 'Match',    href: 'match.html',    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 0 0 20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1"/></svg>' }
];

// ============ RENDER HEADER ============
export function renderHeader(user, role) {
  const header = document.getElementById('appHeader');
  if (!header) return;

  const name = user.name || user.displayName || 'Coach';
  const team = user.team || user.category || '';

  header.innerHTML = `
    <img src="../../images/logo.png" alt="SERC" class="app-logo">
    <div class="app-title">
      <div class="app-title-main">${name}</div>
      <div class="app-title-sub">${role === 'headcoach' ? 'Head Coach' : 'Coach'}${team ? ' · ' + team : ''}</div>
    </div>
    <button class="icon-btn" id="logoutBtn" aria-label="Logout">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
      </svg>
    </button>
  `;
  setupLogout();
}

// ============ RENDER DOCK ============
export function renderDock(active) {
  const dock = document.getElementById('dock');
  if (!dock) return;

  dock.innerHTML = COACH_DOCK.map(item => `
    <a href="${item.href}" class="dock-item ${item.id === active ? 'active' : ''}">
      ${item.icon}
      <span class="dock-item-label">${item.label}</span>
    </a>
  `).join('');
}

// ============ LOAD USER ============
export async function loadUser(uid) {
  const user = await getUser(uid);
  if (!user) throw new Error('User not found');
  user.team = user.category; // alias untuk backward-compat
  return user;
}