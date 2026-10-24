import { db } from './firebase.js';
import { collection, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// COACHES (static, tak payah Firebase)
const COACHES = [
  ["Yasser Ibrahim", "Head Coach / Coach U12 Boys"],
  ["Agus Abdullah", "Coach U14 Boys"],
  ["Muhammad Akmal Mansor", "Coach U10 Boys"],
  ["Nur Azarina Mohd", "Coach U10 Girls Touch"],
  ["Hud Jafni Md Yassin", "Coach U8 Boys"],
  ["Habib Ibrahim", "Speed & Sprint Coach"],
  ["Natasha Elina Roslan", "Safety & Emergency Advisor"]
];

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

// ===== COACHES =====
const coachList = document.getElementById('coachesList');
COACHES.forEach(([name, role]) => {
  const el = document.createElement('div');
  el.className = 'person-card';
  el.innerHTML = `
    <div class="person-avatar">${esc(name[0])}</div>
    <div>
      <div class="person-name">${esc(name)}</div>
      <div class="person-role">${esc(role)}</div>
    </div>
  `;
  coachList.appendChild(el);
});

// ===== LOAD MATCHES =====
async function loadMatches() {
  try {
    const q = query(
      collection(db, "matches"),
      orderBy("dateMillis", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return all;
  } catch (e) {
    console.error(e);
    return [];
  }
}

function renderNextMatch(m) {
  const box = document.getElementById('nextMatchBox');
  if (!m) {
    box.innerHTML = '<div class="loading">No upcoming match scheduled.</div>';
    return;
  }
  box.innerHTML = `
    <div class="next-card">
      <div class="next-head">
        <div class="next-lbl">NEXT MATCH</div>
        <div class="next-badges">
          <span class="chip">${m.isHome ? 'HOME' : 'AWAY'}</span>
          <span class="chip chip-dim">${esc(m.team || '')}</span>
        </div>
      </div>
      <div class="next-title">vs ${esc(m.opponent)}</div>
      <div class="next-meta">
        <div class="next-meta-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <span>${esc(m.dateLabel || '')}</span>
        </div>
        <div class="next-meta-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${esc(m.venue || '')}</span>
        </div>
      </div>
    </div>
  `;
}

function renderResult(m) {
  const us = m.scoreUs ?? 0;
  const them = m.scoreThem ?? 0;
  const usWin = us > them;
  const themWin = them > us;

  const homeTeam = m.isHome ? 'EAGLES' : m.opponent;
  const awayTeam = m.isHome ? m.opponent : 'EAGLES';
  const homeScore = m.isHome ? us : them;
  const awayScore = m.isHome ? them : us;
  const homeCls = m.isHome ? (usWin?'win':themWin?'lose':'') : (themWin?'win':usWin?'lose':'');
  const awayCls = m.isHome ? (themWin?'win':usWin?'lose':'') : (usWin?'win':themWin?'lose':'');

  const card = document.createElement('div');
  card.className = `result-card ${m.status}`;
  card.innerHTML = `
    <div class="result-head">
      <div class="result-team">${esc(m.competition || m.team || 'Friendly')}</div>
      <div class="result-badge ${m.status}">${m.status}</div>
    </div>
    <div class="result-score">
      <div class="result-side">
        <div class="result-side-lbl">Home</div>
        <div class="result-side-name">${esc(homeTeam)}</div>
      </div>
      <div class="result-nums">
        <span class="${homeCls}">${homeScore}</span>
        <span class="sep">:</span>
        <span class="${awayCls}">${awayScore}</span>
      </div>
      <div class="result-side away">
        <div class="result-side-lbl">Away</div>
        <div class="result-side-name">${esc(awayTeam)}</div>
      </div>
    </div>
    ${m.manOfMatch ? `<div class="result-motm"><span class="star">★</span><span>MOTM: <strong>${esc(m.manOfMatch)}</strong></span></div>` : ''}
  `;
  return card;
}

// ===== INIT =====
(async function init() {
  const matches = await loadMatches();

  const past = matches.filter(m => ['win','loss','draw'].includes(m.status));
  const upcoming = matches.filter(m => m.status === 'upcoming')
                          .sort((a,b) => (a.dateMillis||0) - (b.dateMillis||0));

  // Next match
  renderNextMatch(upcoming[0]);

  // Results list (3 terbaru)
  const list = document.getElementById('resultsList');
  list.className = 'results-list';
  if (past.length === 0) {
    list.innerHTML = '<div class="loading">No matches yet.</div>';
  } else {
    list.innerHTML = '';
    past.slice(0, 3).forEach(m => list.appendChild(renderResult(m)));
  }

  // Stats
  const wins = past.filter(m => m.status === 'win').length;
  const rate = past.length ? Math.round(wins * 100 / past.length) : 0;
  document.querySelector('#statWins .stat-val').textContent = wins;
  document.querySelector('#statRate .stat-val').textContent = rate + '%';
})();