(function () {
  const rows = [
    { player: 'Hafiz Naim', category: 'U14 Boys', position: 'Fly-half', metrics: '86 OVR', status: 'Ready' },
    { player: 'Aiman Zul', category: 'U14 Boys', position: 'Centre', metrics: '84 OVR', status: 'Ready' },
    { player: 'Rafi Azri', category: 'U12 Boys', position: 'Prop', metrics: '82 OVR', status: 'Watchlist' },
    { player: 'Iqbal Karim', category: 'U10 Boys', position: 'Hooker', metrics: '80 OVR', status: 'Ready' },
    { player: 'Syafiq Danial', category: 'U10 Girls', position: 'Winger', metrics: '79 OVR', status: 'New' }
  ];

  const tbody = document.getElementById('squadTableBody');
  if (tbody) {
    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td><strong>${row.player}</strong></td>
        <td>${row.category}</td>
        <td>${row.position}</td>
        <td>${row.metrics}</td>
        <td><span class="pill">${row.status}</span></td>
      </tr>
    `).join('');
  }
})();
