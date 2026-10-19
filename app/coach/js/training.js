(function () {
  const cards = [
    { label: 'Players', value: '68' },
    { label: 'Attendance', value: '92%' },
    { label: 'Next session', value: 'Tue 17:30' },
    { label: 'Matches', value: '10' }
  ];

  const grid = document.getElementById('trainingCards');
  if (grid) {
    grid.innerHTML = cards.map((card) => `
      <article class="kpi-card ${card.label.toLowerCase().replace(/\s+/g, '-')}">
        <div class="label">${card.label}</div>
        <strong>${card.value}</strong>
      </article>
    `).join('');
  }
})();
