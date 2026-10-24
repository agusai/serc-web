// js/supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const supabase = createClient(
  'https://mtopqypcrmzihmfueujy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10b3BxeXBjcm16aWhtZnVldWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMDQ2OTMsImV4cCI6MjEwNzU4MDY5M30.oocXGBr6pBA7GS1KjOhWIPejHausQ3k9UgRxKQ0fgh4'
);

// ── AUTH ──
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}

// ── USERS ──
export async function getUser(uid) {
  const { data, error } = await supabase
    .from('users').select('*').eq('id', uid).maybeSingle();
  if (error) throw error;
  return data;
}

// ── PLAYERS ──
export async function getPlayers(category) {
  let q = supabase
    .from('players')
    .select(`
      id, name, nickname, category, position, jersey_number,
      status, photo_url, captain_role, attendance_pct,
      player_stats(matches_played, tries, tackles, fitness_pct),
      player_metrics(coach_remark, skills_covered),
      player_profile(emergency_name, emergency_phone, emergency_relation, height, weight, injury_note)
    `)
    .order('jersey_number', { ascending: true })
    .limit(100);

  if (category && category !== 'All Teams') q = q.eq('category', category);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(flattenPlayer);
}

function flattenPlayer(p) {
  const stats = p.player_stats?.[0] || {};
  const metrics = p.player_metrics?.[0] || {};
  const profile = p.player_profile?.[0] || {};
  return {
    id: p.id,
    name: p.name,
    nickname: p.nickname,
    category: p.category,
    position: p.position,
    jerseyNumber: p.jersey_number,
    status: p.status,
    photoUrl: p.photo_url,
    captainRole: p.captain_role,
    attendancePercent: p.attendance_pct,
    matchesPlayed: stats.matches_played || 0,
    tries: stats.tries || 0,
    tackles: stats.tackles || 0,
    fitnessPercent: stats.fitness_pct || 0,
    coachRemark: metrics.coach_remark || '',
    skillsCovered: metrics.skills_covered || [],
    parentName: profile.emergency_name || '',
    parentPhone: profile.emergency_phone || '',
    parentRelationship: profile.emergency_relation || '',
    height: profile.height,
    weight: profile.weight,
    injuryNote: profile.injury_note
  };
}

// ── MATCHES ──
export async function getMatches(category) {
  let q = supabase
    .from('matches')
    .select(`
      id, category, opponent, date, time, venue, is_home,
      status, score_us, score_them, man_of_match,
      match_details(try_scorers, yellow_cards, red_cards, live_updates, match_report, areas_improve)
    `)
    .order('date', { ascending: false });

  if (category && category !== 'All Teams') q = q.eq('category', category);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(flattenMatch);
}

function flattenMatch(m) {
  const details = m.match_details?.[0] || {};
  const dateMs = m.date ? new Date(m.date).getTime() : 0;
  return {
    id: m.id,
    team: m.category,
    category: m.category,
    opponent: m.opponent,
    date: m.date,
    dateMillis: dateMs,
    dateLabel: formatDateLabel(m.date),
    time: m.time,
    venue: m.venue,
    isHome: m.is_home,
    status: m.status,
    scoreUs: m.score_us,
    scoreThem: m.score_them,
    manOfMatch: m.man_of_match,
    tryScorers: details.try_scorers,
    yellowCards: details.yellow_cards,
    redCards: details.red_cards,
    liveUpdates: details.live_updates || [],
    matchReport: details.match_report,
    areasToImprove: details.areas_improve
  };
}

// ── TRAININGS ──
export async function getTrainings(category) {
  let q = supabase
    .from('trainings')
    .select(`
      id, category, title, type, date, start_time, end_time,
      location, is_compulsory, created_by,
      training_details(attendance, fitness_ratings, syllabus_covered, coach_notes)
    `)
    .order('date', { ascending: false });

  if (category && category !== 'All Teams') q = q.eq('category', category);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(flattenTraining);
}

function flattenTraining(t) {
  const details = t.training_details?.[0] || {};
  const dateMs = t.date ? new Date(t.date).getTime() : 0;
  return {
    id: t.id,
    team: t.category,
    category: t.category,
    title: t.title,
    type: t.type,
    date: t.date,
    dateMillis: dateMs,
    dateLabel: formatDateLabel(t.date),
    startTime: t.start_time,
    endTime: t.end_time,
    time: t.start_time && t.end_time ? `${t.start_time} - ${t.end_time}` : (t.start_time || ''),
    location: t.location,
    venue: t.location,
    isCompulsory: t.is_compulsory,
    attendance: normalizeAttendance(details.attendance || {}),
    fitnessRatings: details.fitness_ratings || {},
    syllabusCovered: details.syllabus_covered || [],
    coachNotes: details.coach_notes
  };
}

// Attendance boleh jadi boolean atau string — normalize ke string
function normalizeAttendance(raw) {
  const out = {};
  Object.keys(raw).forEach(pid => {
    const v = raw[pid];
    if (typeof v === 'boolean') out[pid] = v ? 'present' : 'absent';
    else if (typeof v === 'string') out[pid] = v;
  });
  return out;
}

// ── CREATE / UPDATE ──
export async function createTraining(data) {
  const trainingId = (crypto.randomUUID && crypto.randomUUID()) ||
    `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const { error: tErr } = await supabase.from('trainings').insert({
    id: trainingId,
    category: data.category,
    title: data.title,
    type: data.type,
    date: data.date,
    start_time: data.startTime,
    end_time: data.endTime,
    location: data.location,
    is_compulsory: data.isCompulsory || false,
    created_by: data.createdBy || null
  });
  if (tErr) throw tErr;

  const { error: dErr } = await supabase.from('training_details').insert({
    training_id: trainingId,
    attendance: {},
    fitness_ratings: {},
    syllabus_covered: [],
    coach_notes: data.coachNotes || null
  });
  if (dErr) throw dErr;

  return trainingId;
}

export async function updateTrainingDetails(trainingId, patch) {
  // upsert — buat row kalau takde, update kalau ada
  const { error } = await supabase
    .from('training_details')
    .upsert({ training_id: trainingId, ...patch }, { onConflict: 'training_id' });
  if (error) throw error;
}

export async function updatePlayerMetrics(playerId, patch) {
  const { error } = await supabase
    .from('player_metrics')
    .upsert({ player_id: playerId, ...patch }, { onConflict: 'player_id' });
  if (error) throw error;
}

// ── UTIL ──
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                     'Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const s = String(dateStr).split('T')[0];
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()];
  return `${dow}, ${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}