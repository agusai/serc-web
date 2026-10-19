// coach page dynamic renderer: fetch data and replace static placeholders

async function renderCoachDashboard() {
  try {
    const players = await window.SERCAPI.players.list();
    const trainings = await window.SERCAPI.trainings.list();
    const matches = await window.SERCAPI.matches.list();

    // KPIs
    const playersCountEl = document.querySelector('.kpi-card.players strong');
    const nextSessionEl = document.querySelector('.kpi-card.next-session strong');
    const matchesEl = document.querySelector('.kpi-card.matches strong');
    const attendanceEl = document.querySelector('.kpi-card.attendance strong');

    if (playersCountEl) playersCountEl.textContent = players.length;
    if (nextSessionEl) nextSessionEl.textContent = trainings && trainings.length ? window.SERCUtils.formatDate(trainings[0].date) : '—';
    if (matchesEl) matchesEl.textContent = matches.length;

    // Attendance is not directly available; show placeholder or compute if training_details available
    if (attendanceEl) attendanceEl.textContent = '—';

    // Top 5 players (if player_metrics or a numeric 'ovr' present)
    const cardListEl = document.querySelector('.card-list');
    if (cardListEl) {
      // Fetch player_metrics if available and merge
      const metrics = await window.SERC_SUPABASE_CLIENT.list('player_metrics').catch(() => []);
      const playersWithMetrics = players.map(p => {
        const m = metrics.find(x => String(x.player_id) === String(p.id));
        return { ...p, ovr: m ? (m.ovr || m.ovr_score || 0) : 0 };
      });
      playersWithMetrics.sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
      const top = playersWithMetrics.slice(0, 5);
      cardListEl.innerHTML = top.map(t => `<div class="list-item row-between"><span>${window.SERCUtils.escape(t.name || t.full_name || t.player_name || '—')}</span><span>${t.ovr ? t.ovr.toFixed ? t.ovr.toFixed(1) : t.ovr : '—'}</span></div>`).join('');
    }
  } catch (err) {
    console.error('renderCoachDashboard error', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCoachDashboard();
});
