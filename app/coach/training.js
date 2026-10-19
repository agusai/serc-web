// training list renderer

async function renderTrainingList() {
  try {
    const trainings = await window.SERCAPI.trainings.list();
    const grid = document.querySelector('.kpi-grid');
    if (!grid) return;

    grid.innerHTML = trainings.slice(0,4).map(t => `
      <article class="card"><h3>${window.SERCUtils.escape(t.title || t.name || 'Session')}</h3><p class="muted">${window.SERCUtils.formatDate(t.date || t.start_time || '')} ${t.time || ''}</p></article>
    `).join('');
  } catch (err) {
    console.error('renderTrainingList error', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderTrainingList();
});
