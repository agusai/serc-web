import { protectPage } from './auth.js';
import { renderHeader, renderDock, loadUser } from './shared.js';
import { db } from '../../js/firebase.js';
import {
  collection, getDocs, query, where,
  doc, updateDoc, addDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================================
// STATE
// ============================================
let CURRENT_USER = null;
let CURRENT_TEAM = '';
let ALL_SESSIONS = [];    // from trainings collection
let ALL_MATCHES = [];     // from matches collection
let ALL_PLAYERS = [];     // from players collection
let CURRENT_YEAR = new Date().getFullYear();
let CURRENT_MONTH = new Date().getMonth(); // 0-11
let SELECTED_DATE = null; // "YYYY-MM-DD"

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ============================================
// INIT
// ============================================
async function init() {
  const authUser = await protectPage();
  CURRENT_USER = await loadUser(authUser.uid);
  
  const role = CURRENT_USER.role || 'coaching';
  const team = CURRENT_USER.team || '';
  const isHeadCoach = role === 'headcoach' || team === 'All Teams';
  CURRENT_TEAM = isHeadCoach ? 'All Teams' : team;

  renderHeader(CURRENT_USER, role);
  renderDock('training');

  await loadData();
  SELECTED_DATE = toDateStr(new Date());
  renderCalendar();
}

// ============================================
// LOAD DATA
// ============================================
async function loadData() {
  try {
    // Trainings
    const tQ = CURRENT_TEAM === 'All Teams'
      ? collection(db, 'trainings')
      : query(collection(db, 'trainings'), where('team', '==', CURRENT_TEAM));
    const tSnap = await getDocs(tQ);
    ALL_SESSIONS = tSnap.docs.map(d => ({ id: d.id, source: 'training', ...d.data() }));

    // Matches
    const mQ = CURRENT_TEAM === 'All Teams'
      ? collection(db, 'matches')
      : query(collection(db, 'matches'), where('team', '==', CURRENT_TEAM));
    const mSnap = await getDocs(mQ);
    ALL_MATCHES = mSnap.docs.map(d => ({ id: d.id, source: 'match', type: 'match', ...d.data() }));

    // Players
    const pQ = CURRENT_TEAM === 'All Teams'
      ? collection(db, 'players')
      : query(collection(db, 'players'), where('team', '==', CURRENT_TEAM));
    const pSnap = await getDocs(pQ);
    ALL_PLAYERS = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    ALL_PLAYERS.sort((a, b) => (a.jerseyNumber || 999) - (b.jerseyNumber || 999));
  } catch (e) {
    console.error('Load error:', e);
  }
}

// ============================================
// RENDER CALENDAR
// ============================================
function renderCalendar() {
  const main = document.getElementById('appMain');
  if (!main) return;

  const monthLabel = `${MONTHS[CURRENT_MONTH]} ${CURRENT_YEAR}`;
  const daysInMonth = buildCalendarDays(CURRENT_YEAR, CURRENT_MONTH);

  main.innerHTML = `
    <div class="month-nav">
      <button class="month-nav-btn" id="prevMonth">‹</button>
      <div class="month-label">${monthLabel}</div>
      <button class="month-nav-btn" id="nextMonth">›</button>
    </div>
    <button class="add-btn" id="addSessionBtn" style="width:100%;justify-content:center;margin-bottom:16px">
      + Add Session
    </button>
    
    <div class="calendar">
      <div class="calendar-days">
        ${DAYS.map(d => `<div class="calendar-day-label">${d}</div>`).join('')}
      </div>
      <div class="calendar-grid">
        ${daysInMonth.map(d => renderDay(d)).join('')}
      </div>
    </div>
    
    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:#2DB87A"></div>Training</div>
      <div class="legend-item"><div class="legend-dot" style="background:#4A8AE8"></div>Gym</div>
      <div class="legend-item"><div class="legend-dot" style="background:#E0A830"></div>Team</div>
      <div class="legend-item"><div class="legend-dot" style="background:#E05040"></div>Match</div>
    </div>
    
    <div class="session-list-head">
      <div class="session-list-date" id="selectedDateLabel">${formatDateLabel(SELECTED_DATE)}</div>
      <div class="session-list-count" id="sessionCount">0 sessions</div>
    </div>
    <div id="sessionList"></div>
  `;

  // Events
  document.getElementById('prevMonth').addEventListener('click', () => {
    CURRENT_MONTH--;
    if (CURRENT_MONTH < 0) { CURRENT_MONTH = 11; CURRENT_YEAR--; }
    renderCalendar();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    CURRENT_MONTH++;
    if (CURRENT_MONTH > 11) { CURRENT_MONTH = 0; CURRENT_YEAR++; }
    renderCalendar();
  });
  document.getElementById('addSessionBtn').addEventListener('click', openAddSession);
  
  // Day click
  document.querySelectorAll('.cal-day[data-date]').forEach(el => {
    el.addEventListener('click', () => {
      SELECTED_DATE = el.dataset.date;
      document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
      el.classList.add('selected');
      renderSessionList();
    });
  });

  renderSessionList();
}

function buildCalendarDays(y, m) {
  const first = new Date(y, m, 1);
  const totalDays = new Date(y, m + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // Mon=0

  const days = [];
  for (let i = 0; i < offset; i++) days.push({ empty: true });
  for (let d = 1; d <= totalDays; d++) {
    days.push({ day: d, date: `${y}-${pad(m+1)}-${pad(d)}` });
  }
  return days;
}

function renderDay(d) {
  if (d.empty) return `<div class="cal-day empty"></div>`;
  const isSelected = d.date === SELECTED_DATE;
  const todayStr = toDateStr(new Date());
  const isToday = d.date === todayStr;

  const sessions = getSessionsForDate(d.date);
  const dots = sessions.slice(0, 3).map(s => {
    const c = getTypeColor(s.type);
    return `<div class="cal-day-dot" style="background:${c}"></div>`;
  }).join('');

  return `
    <div class="cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" data-date="${d.date}">
      <div class="cal-day-num">${d.day}</div>
      ${sessions.length > 0 ? `<div class="cal-day-dots">${dots}</div>` : ''}
    </div>
  `;
}

// ============================================
// SESSIONS FOR DATE
// ============================================
function getSessionsForDate(dateStr) {
  const list = [];
  
  ALL_SESSIONS.forEach(s => {
    const d = millisToDateStr(s.dateMillis);
    if (d === dateStr) list.push(s);
  });
  
  ALL_MATCHES.forEach(m => {
    const d = millisToDateStr(m.dateMillis);
    if (d === dateStr) list.push(m);
  });

  return list.sort((a, b) => (a.dateMillis || 0) - (b.dateMillis || 0));
}

function getTypeColor(type) {
  switch((type || '').toLowerCase()) {
    case 'gym': return '#4A8AE8';
    case 'team': return '#E0A830';
    case 'match': return '#E05040';
    default: return '#2DB87A';
  }
}

// ============================================
// RENDER SESSION LIST
// ============================================
function renderSessionList() {
  const container = document.getElementById('sessionList');
  const dateLabel = document.getElementById('selectedDateLabel');
  const countEl = document.getElementById('sessionCount');
  if (!container) return;

  dateLabel.textContent = formatDateLabel(SELECTED_DATE);
  
  const sessions = getSessionsForDate(SELECTED_DATE);
  countEl.textContent = `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`;

  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-sessions">
        <div class="empty-sessions-emoji">📅</div>
        No sessions on this date.
      </div>
    `;
    return;
  }

  container.innerHTML = sessions.map(s => {
    const typeClass = `type-${(s.type || 'training').toLowerCase()}`;
    const typeLabel = (s.type || 'training').toUpperCase();
    const time = s.time || s.startTime || '';
    const loc = s.location || s.venue || '';
    const title = s.title || (s.source === 'match' ? `vs ${s.opponent}` : `${typeLabel} Session`);
    const compulsory = s.isCompulsory ? `<span class="session-badge compulsory">Wajib</span>` : '';
    
    return `
      <div class="session-card ${typeClass}" data-session-id="${s.id}" data-source="${s.source}">
        <div class="session-card-body">
          <div class="session-title">${escape(title)}</div>
          <div class="session-meta">${escape(time)}${loc ? ' · ' + escape(loc) : ''}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
          <span class="session-badge ${typeClass}">${typeLabel}</span>
          ${compulsory}
        </div>
      </div>
    `;
  }).join('');

  // Click handler
  container.querySelectorAll('.session-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.sessionId;
      const source = card.dataset.source;
      const session = source === 'match'
        ? ALL_MATCHES.find(m => m.id === id)
        : ALL_SESSIONS.find(t => t.id === id);
      if (session) openSessionDetail(session, source);
    });
  });
}

// ============================================
// SESSION DETAIL SHEET
// ============================================
function openSessionDetail(session, source) {
  const sheet = document.getElementById('sessionSheet');
  const content = document.getElementById('sessionSheetContent');
  
  const present = session.attendance ? Object.values(session.attendance).filter(Boolean).length : 0;
  const total = session.attendance ? Object.keys(session.attendance).length : ALL_PLAYERS.length;
  const fitnessCount = session.fitnessRatings ? Object.keys(session.fitnessRatings).length : 0;
  const syllabusCount = session.syllabusCovered ? session.syllabusCovered.length : 0;
  const isMatch = source === 'match';

  content.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-head">
      <div class="sheet-title">${escape(session.title || 'Session')}</div>
      <button class="sheet-close" id="closeSessionSheet">✕</button>
    </div>
    
    <div class="sheet-info-row">
      <span class="sheet-info-label">Date</span>
      <span class="sheet-info-value">${escape(session.dateLabel || SELECTED_DATE)}</span>
    </div>
    <div class="sheet-info-row">
      <span class="sheet-info-label">Time</span>
      <span class="sheet-info-value">${escape(session.time || '—')}</span>
    </div>
    <div class="sheet-info-row">
      <span class="sheet-info-label">Location</span>
      <span class="sheet-info-value">${escape(session.location || session.venue || '—')}</span>
    </div>
    <div class="sheet-info-row">
      <span class="sheet-info-label">Type</span>
      <span class="sheet-info-value">${escape((session.type || 'training').toUpperCase())}</span>
    </div>
    ${session.isCompulsory ? `
      <div class="sheet-info-row">
        <span class="sheet-info-label">Status</span>
        <span class="sheet-info-value" style="color:var(--bad)">WAJIB</span>
      </div>
    ` : ''}
    
    ${!isMatch ? `
      <div class="sheet-actions">
        <button class="sheet-action" id="actionAttendance">
          <div class="sheet-action-icon attendance">✓</div>
          <div class="sheet-action-body">
            <div class="sheet-action-title">Mark Attendance</div>
            <div class="sheet-action-sub">${present}/${total} confirmed</div>
          </div>
        </button>
        <button class="sheet-action" id="actionFitness">
          <div class="sheet-action-icon fitness">⚡</div>
          <div class="sheet-action-body">
            <div class="sheet-action-title">Rate Fitness</div>
            <div class="sheet-action-sub">${fitnessCount} rated · Stamina, Strength, Speed</div>
          </div>
        </button>
        <button class="sheet-action" id="actionSyllabus">
          <div class="sheet-action-icon syllabus">📚</div>
          <div class="sheet-action-body">
            <div class="sheet-action-title">Mark Syllabus</div>
            <div class="sheet-action-sub">${syllabusCount} skills covered</div>
          </div>
        </button>
      </div>
    ` : `
      <div class="sheet-actions">
        <button class="sheet-action" id="actionMatchDetail">
          <div class="sheet-action-icon attendance">🏉</div>
          <div class="sheet-action-body">
            <div class="sheet-action-title">View Match</div>
            <div class="sheet-action-sub">Open in Match tab</div>
          </div>
        </button>
      </div>
    `}
  `;

  // Events
  document.getElementById('closeSessionSheet').addEventListener('click', () => closeSheet(sheet));
  sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(sheet); });

  const attendanceBtn = document.getElementById('actionAttendance');
  const fitnessBtn = document.getElementById('actionFitness');
  const syllabusBtn = document.getElementById('actionSyllabus');

  if (attendanceBtn) {
    attendanceBtn.addEventListener('click', () => {
      closeSheet(sheet);
      openAttendance(session);
    });
  }
  if (fitnessBtn) {
    fitnessBtn.addEventListener('click', () => {
      closeSheet(sheet);
      openFitness(session);
    });
  }
  if (syllabusBtn) {
    syllabusBtn.addEventListener('click', () => {
      closeSheet(sheet);
      openSyllabus(session);
    });
  }

  openSheet(sheet);
}

// ============================================
// ATTENDANCE SHEET
// ============================================
function openAttendance(session) {
  const sheet = document.getElementById('attendanceSheet');
  const content = document.getElementById('attendanceSheetContent');
  
  // Status map — default present
  const statusMap = {};
  ALL_PLAYERS.forEach(p => {
    statusMap[p.id] = session.attendance?.[p.id] === false ? 'absent'
                    : session.attendance?.[p.id] === true ? 'present'
                    : 'present';
  });
  // Support 3-status if stored as string
  if (session.attendance) {
    Object.keys(session.attendance).forEach(pid => {
      const v = session.attendance[pid];
      if (typeof v === 'string') statusMap[pid] = v;
    });
  }

  const render = () => {
    const present = Object.values(statusMap).filter(v => v === 'present').length;
    const late = Object.values(statusMap).filter(v => v === 'late').length;
    const absent = Object.values(statusMap).filter(v => v === 'absent').length;

    content.innerHTML = `
      <div class="sheet-handle"></div>
      <div class="sheet-head">
        <div class="sheet-title">Mark Attendance</div>
        <button class="sheet-close" id="closeAttSheet">✕</button>
      </div>
      
      <div class="summary-strip">
        <div class="summary-stat"><div class="summary-val" style="color:var(--good)">${present}</div><div class="summary-lbl">Present</div></div>
        <div class="summary-stat"><div class="summary-val" style="color:var(--warn)">${late}</div><div class="summary-lbl">Late</div></div>
        <div class="summary-stat"><div class="summary-val" style="color:var(--bad)">${absent}</div><div class="summary-lbl">Absent</div></div>
        <div class="summary-stat"><div class="summary-val" style="color:var(--gray)">${ALL_PLAYERS.length}</div><div class="summary-lbl">Total</div></div>
      </div>
      
      <div class="bulk-row">
        <button class="bulk-btn good" data-bulk="present">All Present</button>
        <button class="bulk-btn warn" data-bulk="late">All Late</button>
        <button class="bulk-btn bad" data-bulk="absent">All Absent</button>
      </div>
      
      <div class="checklist">
        ${ALL_PLAYERS.map(p => {
          const st = statusMap[p.id];
          return `
            <div class="check-item status-${st}" data-player-id="${p.id}">
              <div class="check-avatar">${(p.jerseyNumber ? '#' + p.jerseyNumber : (p.nickname || p.name || '?').charAt(0)).toString().toUpperCase()}</div>
              <div class="check-info">
                <div class="check-name">${escape(p.nickname || p.name)}</div>
                <div class="check-pos">${escape(p.position || 'Player')}</div>
              </div>
              <div class="check-status ${st}">${st}</div>
            </div>
          `;
        }).join('')}
      </div>
      
      <button class="sheet-save-btn" id="saveAttendance">Save Attendance</button>
    `;

    // Close
    document.getElementById('closeAttSheet').addEventListener('click', () => closeSheet(sheet));

    // Bulk buttons
    content.querySelectorAll('[data-bulk]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.bulk;
        ALL_PLAYERS.forEach(p => statusMap[p.id] = val);
        render();
      });
    });

    // Tap to cycle: absent → present → late → absent
    content.querySelectorAll('.check-item').forEach(el => {
      el.addEventListener('click', () => {
        const pid = el.dataset.playerId;
        const cur = statusMap[pid];
        statusMap[pid] = cur === 'absent' ? 'present' : cur === 'present' ? 'late' : 'absent';
        render();
      });
    });

    // Save
    document.getElementById('saveAttendance').addEventListener('click', async () => {
      const saveBtn = document.getElementById('saveAttendance');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      
      try {
        // Support both boolean (legacy) and string (new)
        const boolMap = {};
        Object.keys(statusMap).forEach(pid => {
          boolMap[pid] = statusMap[pid] === 'present' || statusMap[pid] === 'late';
        });
        
        await updateDoc(doc(db, 'trainings', session.id), {
          attendance: boolMap,
          attendanceDetail: statusMap,  // detailed status
          updatedAt: Timestamp.now()
        });
        
        // Update local state
        session.attendance = boolMap;
        saveBtn.textContent = 'Saved ✓';
        setTimeout(() => closeSheet(sheet), 800);
      } catch (e) {
        console.error(e);
        saveBtn.textContent = 'Error — retry';
        saveBtn.disabled = false;
      }
    });
  };

  render();
  openSheet(sheet);
}

// ============================================
// FITNESS SHEET
// ============================================
function openFitness(session) {
  const sheet = document.getElementById('fitnessSheet');
  const content = document.getElementById('fitnessSheetContent');
  
  const ratings = session.fitnessRatings || {};
  const current = {};
  ALL_PLAYERS.forEach(p => {
    const r = ratings[p.id] || {};
    current[p.id] = {
      stamina: r.stamina ?? 5,
      strength: r.strength ?? 5,
      speed: r.speed ?? 5
    };
  });

  const render = () => {
    content.innerHTML = `
      <div class="sheet-handle"></div>
      <div class="sheet-head">
        <div class="sheet-title">Rate Fitness</div>
        <button class="sheet-close" id="closeFitSheet">✕</button>
      </div>
      <p style="color:var(--gray);font-size:0.85rem;margin-bottom:16px">Rate each player's fitness (1–10) for this session.</p>
      
      ${ALL_PLAYERS.map(p => {
        const r = current[p.id];
        return `
          <div class="fitness-item">
            <div class="fitness-head">
              <div class="check-avatar">${(p.jerseyNumber ? '#' + p.jerseyNumber : (p.nickname || p.name || '?').charAt(0)).toString().toUpperCase()}</div>
              <div class="check-info">
                <div class="check-name">${escape(p.nickname || p.name)}</div>
                <div class="check-pos">${escape(p.position || 'Player')}</div>
              </div>
            </div>
            <div class="fitness-sliders">
              ${sliderRow(p.id, 'stamina', 'Stamina', r.stamina)}
              ${sliderRow(p.id, 'strength', 'Strength', r.strength)}
              ${sliderRow(p.id, 'speed', 'Speed', r.speed)}
            </div>
          </div>
        `;
      }).join('')}
      
      <button class="sheet-save-btn" id="saveFitness">Save Fitness Ratings</button>
    `;

    document.getElementById('closeFitSheet').addEventListener('click', () => closeSheet(sheet));

    // Sliders
    content.querySelectorAll('input[type="range"]').forEach(input => {
      input.addEventListener('input', e => {
        const pid = input.dataset.playerId;
        const field = input.dataset.field;
        current[pid][field] = parseInt(e.target.value);
        // Update display
        const disp = document.querySelector(`[data-display="${pid}-${field}"]`);
        if (disp) disp.textContent = e.target.value;
        const fill = document.querySelector(`[data-fill="${pid}-${field}"]`);
        if (fill) fill.style.width = (e.target.value / 10 * 100) + '%';
      });
    });

    // Save
    document.getElementById('saveFitness').addEventListener('click', async () => {
      const btn = document.getElementById('saveFitness');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      
      try {
        await updateDoc(doc(db, 'trainings', session.id), {
          fitnessRatings: current,
          updatedAt: Timestamp.now()
        });
        session.fitnessRatings = current;
        btn.textContent = 'Saved ✓';
        setTimeout(() => closeSheet(sheet), 800);
      } catch (e) {
        console.error(e);
        btn.textContent = 'Error — retry';
        btn.disabled = false;
      }
    });
  };

  render();
  openSheet(sheet);
}

function sliderRow(playerId, field, label, value) {
  return `
    <div class="slider-row">
      <div class="slider-label">${label}</div>
      <div class="slider-track">
        <div class="slider-fill" data-fill="${playerId}-${field}" style="width:${value*10}%"></div>
        <input type="range" class="slider-input" min="1" max="10" value="${value}" 
               data-player-id="${playerId}" data-field="${field}">
      </div>
      <div class="slider-val" data-display="${playerId}-${field}">${value}</div>
    </div>
  `;
}

// ============================================
// SYLLABUS SHEET
// ============================================
const SYLLABUS_SKILLS = [
  { key: 'passing',   label: 'Passing' },
  { key: 'tackling',  label: 'Tackling' },
  { key: 'ruck',      label: 'Ruck' },
  { key: 'support',   label: 'Support' },
  { key: 'carrying',  label: 'Ball Carrying' },
  { key: 'catching',  label: 'Catching' }
];

function openSyllabus(session) {
  const sheet = document.getElementById('syllabusSheet');
  const content = document.getElementById('syllabusSheetContent');
  
  const covered = new Set(session.syllabusCovered || []);

  const render = () => {
    content.innerHTML = `
      <div class="sheet-handle"></div>
      <div class="sheet-head">
        <div class="sheet-title">Mark Syllabus</div>
        <button class="sheet-close" id="closeSylSheet">✕</button>
      </div>
      <p style="color:var(--gray);font-size:0.85rem;margin-bottom:16px">Tick skills covered in this session.</p>
      
      <div class="checklist">
        ${SYLLABUS_SKILLS.map(s => `
          <div class="check-item ${covered.has(s.key) ? 'status-present' : ''}" data-skill="${s.key}">
            <div class="check-info">
              <div class="check-name">${s.label}</div>
            </div>
            <div class="check-status ${covered.has(s.key) ? 'present' : 'absent'}">
              ${covered.has(s.key) ? '✓' : '○'}
            </div>
          </div>
        `).join('')}
      </div>
      
      <button class="sheet-save-btn" id="saveSyllabus">Save Syllabus</button>
    `;

    document.getElementById('closeSylSheet').addEventListener('click', () => closeSheet(sheet));

    content.querySelectorAll('.check-item').forEach(el => {
      el.addEventListener('click', () => {
        const k = el.dataset.skill;
        if (covered.has(k)) covered.delete(k); else covered.add(k);
        render();
      });
    });

    document.getElementById('saveSyllabus').addEventListener('click', async () => {
      const btn = document.getElementById('saveSyllabus');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      
      try {
        await updateDoc(doc(db, 'trainings', session.id), {
          syllabusCovered: Array.from(covered),
          updatedAt: Timestamp.now()
        });
        session.syllabusCovered = Array.from(covered);
        btn.textContent = 'Saved ✓';
        setTimeout(() => closeSheet(sheet), 800);
      } catch (e) {
        console.error(e);
        btn.textContent = 'Error — retry';
        btn.disabled = false;
      }
    });
  };

  render();
  openSheet(sheet);
}

// ============================================
// ADD SESSION
// ============================================
function openAddSession() {
  const sheet = document.getElementById('sessionSheet');
  const content = document.getElementById('sessionSheetContent');

  // Default date — selected date
  const [sy, sm, sd] = SELECTED_DATE.split('-').map(Number);
  
  // Form state
  const form = {
    type: 'training',
    title: '',
    date: SELECTED_DATE,
    startTime: '08:00',
    endTime: '10:00',
    location: '',
    focusAreas: [],
    isCompulsory: false,
    coachNotes: ''
  };

  const SESSION_TYPES = [
    { key: 'training', label: 'Training', color: '#2DB87A' },
    { key: 'gym',      label: 'Gym',      color: '#4A8AE8' },
    { key: 'team',     label: 'Team',     color: '#E0A830' },
    { key: 'match',    label: 'Match',    color: '#E05040' }
  ];

  const FOCUS_SUGGESTIONS = [
    'Fitness', 'Skills', 'Set Piece', 'Defence', 'Attack',
    'Game Simulation', 'Lineout', 'Scrum', 'Ruck', 'Passing', 'Tackling'
  ];

  const VENUE_SUGGESTIONS = [
    'Padang SK Sri Serdang',
    'Stadium Mini UPM',
    'Gymnasium SERC'
  ];

  const render = () => {
    content.innerHTML = `
      <div class="sheet-handle"></div>
      <div class="sheet-head">
        <div class="sheet-title">Add Session</div>
        <button class="sheet-close" id="closeAddSheet">✕</button>
      </div>
      
      <!-- Type -->
      <label class="form-label">SESSION TYPE</label>
      <div class="type-pills">
        ${SESSION_TYPES.map(t => `
          <button class="type-pill ${form.type === t.key ? 'active' : ''}" 
                  data-type="${t.key}" 
                  style="${form.type === t.key ? 'background:' + t.color + ';color:#0D0D0D' : ''}">
            ${t.label}
          </button>
        `).join('')}
      </div>
      
      <!-- Title -->
      <label class="form-label">TITLE</label>
      <input type="text" class="form-input" id="fldTitle" 
             placeholder="e.g. Sunday Training" value="${escape(form.title)}">
      
      <!-- Date -->
      <label class="form-label">DATE</label>
      <input type="date" class="form-input" id="fldDate" value="${form.date}">
      
      <!-- Time -->
      <div class="form-row-2">
        <div>
          <label class="form-label">START</label>
          <input type="time" class="form-input" id="fldStart" value="${form.startTime}">
        </div>
        <div>
          <label class="form-label">END</label>
          <input type="time" class="form-input" id="fldEnd" value="${form.endTime}">
        </div>
      </div>
      
      <!-- Location -->
      <label class="form-label">LOCATION</label>
      <input type="text" class="form-input" id="fldLocation" 
             placeholder="e.g. Padang SK Sri Serdang" value="${escape(form.location)}">
      <div class="venue-chips">
        ${VENUE_SUGGESTIONS.map(v => `
          <button class="chip-sm" data-venue="${escape(v)}">${escape(v)}</button>
        `).join('')}
      </div>
      
      <!-- Focus Areas -->
      <label class="form-label">FOCUS AREAS</label>
      <div class="focus-chips">
        ${FOCUS_SUGGESTIONS.map(f => `
          <button class="chip-sm ${form.focusAreas.includes(f) ? 'active' : ''}" data-focus="${f}">
            ${f}
          </button>
        `).join('')}
      </div>
      
      <!-- Compulsory -->
      <div class="form-toggle-row">
        <div>
          <div class="form-toggle-label">Compulsory Session</div>
          <div class="form-toggle-sub">Players wajib hadir</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="fldCompulsory" ${form.isCompulsory ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
      
      <!-- Notes -->
      <label class="form-label">COACH NOTES (optional)</label>
      <textarea class="form-input" id="fldNotes" rows="3" 
                placeholder="Notes for the team...">${escape(form.coachNotes)}</textarea>
      
      <button class="sheet-save-btn" id="saveAddSession">Save Session</button>
    `;

    // Events
    document.getElementById('closeAddSheet').addEventListener('click', () => closeSheet(sheet));
    
    content.querySelectorAll('.type-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        form.type = btn.dataset.type;
        render();
      });
    });
    
    content.querySelectorAll('[data-venue]').forEach(btn => {
      btn.addEventListener('click', () => {
        form.location = btn.dataset.venue;
        document.getElementById('fldLocation').value = form.location;
      });
    });
    
    content.querySelectorAll('[data-focus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const f = btn.dataset.focus;
        if (form.focusAreas.includes(f)) {
          form.focusAreas = form.focusAreas.filter(x => x !== f);
        } else {
          form.focusAreas.push(f);
        }
        render();
      });
    });

    // Save on field change (before clicking save)
    document.getElementById('fldTitle').addEventListener('input', e => form.title = e.target.value);
    document.getElementById('fldDate').addEventListener('change', e => form.date = e.target.value);
    document.getElementById('fldStart').addEventListener('change', e => form.startTime = e.target.value);
    document.getElementById('fldEnd').addEventListener('change', e => form.endTime = e.target.value);
    document.getElementById('fldLocation').addEventListener('input', e => form.location = e.target.value);
    document.getElementById('fldCompulsory').addEventListener('change', e => form.isCompulsory = e.target.checked);
    document.getElementById('fldNotes').addEventListener('input', e => form.coachNotes = e.target.value);

    // Save button
    document.getElementById('saveAddSession').addEventListener('click', async () => {
      const btn = document.getElementById('saveAddSession');
      
      if (!form.title.trim()) {
        btn.textContent = 'Title required';
        setTimeout(() => btn.textContent = 'Save Session', 1500);
        return;
      }
      if (!form.date) {
        btn.textContent = 'Date required';
        setTimeout(() => btn.textContent = 'Save Session', 1500);
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Saving...';

      try {
        // Parse date to millis
        const [y, m, d] = form.date.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const millis = dt.getTime();
        
        // Format date label
        const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()];
        const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];
        const dateLabel = `${dow}, ${d} ${mon} ${y}`;

        const payload = {
          team: CURRENT_TEAM,
          title: form.title.trim(),
          type: form.type,
          dateMillis: millis,
          dateLabel: dateLabel,
          time: `${form.startTime} - ${form.endTime}`,
          startTime: form.startTime,
          endTime: form.endTime,
          location: form.location.trim(),
          venue: form.location.trim(),
          focusArea: form.focusAreas,
          isCompulsory: form.isCompulsory,
          coachNotes: form.coachNotes.trim(),
          attendance: {},
          fitnessRatings: {},
          syllabusCovered: [],
          createdBy: CURRENT_USER.id || '',
          createdAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'trainings'), payload);

        // Add to local state
        ALL_SESSIONS.push({ id: docRef.id, source: 'training', ...payload });

        btn.textContent = 'Saved ✓';
        setTimeout(() => {
          closeSheet(sheet);
          // Re-render calendar so dots appear
          renderCalendar();
        }, 700);
      } catch (e) {
        console.error('Save error:', e);
        btn.textContent = 'Error: ' + (e.message || 'Failed');
        btn.disabled = false;
      }
    });
  };

  render();
  openSheet(sheet);
}

// ============================================
// HELPERS
// ============================================
function openSheet(el) {
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeSheet(el) {
  el.classList.remove('active');
  document.body.style.overflow = '';
}
function pad(n) { return String(n).padStart(2, '0'); }
function toDateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function millisToDateStr(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()];
  return `${dow}, ${d} ${MONTHS[m-1].slice(0,3)} ${y}`;
}
function escape(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

init();