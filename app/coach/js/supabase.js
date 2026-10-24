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
    .from('users')
    .select('*')
    .eq('id', uid)
    .maybeSingle();
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

  if (category && category !== 'All Teams') {
    q = q.eq('category', category);
  }

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

// ── UPDATE ──
export async function updatePlayerMetrics(playerId, patch) {
  const { error } = await supabase
    .from('player_metrics')
    .update(patch)
    .eq('player_id', playerId);
  if (error) throw error;
}