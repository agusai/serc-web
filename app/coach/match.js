// match list renderer

async function renderMatchList() {
  try {
    const matches = await window.SERCAPI.matches.list();
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = matches.map(m => `
      <tr>
        <td>${window.SERCUtils.escape(m.opponent || m.title || '—')}</td>
        <td>${window.SERCUtils.formatDate(m.date || m.match_date || '')}</td>
        <td>${window.SERCUtils.escape(m.venue || m.location || '—')}</td>
        <td>${window.SERCUtils.escape(m.outcome || m.status || 'Pending')}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('renderMatchList error', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderMatchList();
});
