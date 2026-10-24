import { db } from './firebase.js';
import { 
  collection, query, orderBy, limit, getDocs, where 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const grid = document.getElementById('resultsGrid');

async function load() {
  try {
    const q = query(
      collection(db, "matches"),
      where("status", "in", ["win", "loss", "draw"]),
      orderBy("dateMillis", "desc"),
      limit(3)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) {
      grid.innerHTML = '<div class="results-empty">No matches yet.</div>';
      return;
    }
    
    grid.innerHTML = '';
    snap.forEach(doc => render(doc.data()));
    
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div class="results-empty">Error: ${e.message}</div>`;
  }
}

function render(m) {
  const card = document.createElement('div');
  card.className = `match-card ${m.status}`;
  
  const us = m.scoreUs ?? 0;
  const them = m.scoreThem ?? 0;
  const usWin = us > them;
  const themWin = them > us;
  
  const usCls = usWin ? 'winning' : (themWin ? 'losing' : '');
  const themCls = themWin ? 'winning' : (usWin ? 'losing' : '');
  
  // Home/Away — swap position kalau away
  const homeTeam = m.isHome ? 'EAGLES' : m.opponent;
  const awayTeam = m.isHome ? m.opponent : 'EAGLES';
  const homeScore = m.isHome ? us : them;
  const awayScore = m.isHome ? them : us;
  const homeCls = m.isHome ? usCls : themCls;
  const awayCls = m.isHome ? themCls : usCls;
  
  card.innerHTML = `
    <div class="match-head">
      <span>${m.competition || 'Friendly'}</span>
      <span class="match-badge ${m.status}">${m.status}</span>
    </div>
    <div class="match-score">
      <div class="team-block">
        <span class="team-label">${m.isHome ? 'Home' : 'Away'}</span>
        <span class="team-name">${esc(homeTeam)}</span>
      </div>
      <div class="score-numbers">
        <span class="${homeCls}">${homeScore}</span>
        <span class="sep">:</span>
        <span class="${awayCls}">${awayScore}</span>
      </div>
      <div class="team-block away">
        <span class="team-label">${m.isHome ? 'Away' : 'Home'}</span>
        <span class="team-name">${esc(awayTeam)}</span>
      </div>
    </div>
    ${m.manOfMatch ? `
      <div class="match-motm">
        <span class="star">★</span>
        <span>MOTM: <strong>${esc(m.manOfMatch)}</strong></span>
      </div>
    ` : ''}
  `;
  
  grid.appendChild(card);
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

load();