// squad dynamic renderer

async function renderSquad() {
  try {
    const players = await window.SERCAPI.players.list();
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = players.map(p => `
      <tr>
        <td>${window.SERCUtils.escape(p.name || p.full_name || p.player_name || '—')}</td>
        <td>${window.SERCUtils.escape(p.category || p.team || '—')}</td>
        <td>${window.SERCUtils.escape(p.position || '—')}</td>
        <td>${p.ovr ? (typeof p.ovr === 'number' ? p.ovr.toFixed(1) : p.ovr) : '—'}</td>
        <td><span class="status-dot"></span>${p.status || 'Active'}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('renderSquad error', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderSquad();
});
