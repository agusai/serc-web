(function () {
  const rows = [
    { opponent: 'KL Hawks', date: '15 Oct 2026', venue: 'Serdang Field', outcome: 'Pending' },
    { opponent: 'PJ Rugby', date: '18 Oct 2026', venue: 'Petaling Jaya', outcome: 'Pending' },
    { opponent: 'Putrajaya', date: '20 Oct 2026', venue: 'Putrajaya Arena', outcome: 'Pending' }
  ];

  const tbody = document.getElementById('matchTableBody');
  if (tbody) {
    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.opponent}</td>
        <td>${row.date}</td>
        <td>${row.venue}</td>
        <td><span class="pill">${row.outcome}</span></td>
      </tr>
    `).join('');
  }
})();
