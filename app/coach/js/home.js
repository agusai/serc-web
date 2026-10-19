(function () {
  const cards = [
    { name: 'Hafiz Naim', metric: 'OVR 86', team: 'U14 Boys' },
    { name: 'Aiman Zul', metric: 'OVR 84', team: 'U14 Boys' },
    { name: 'Rafi Azri', metric: 'OVR 82', team: 'U12 Boys' },
    { name: 'Iqbal Karim', metric: 'OVR 80', team: 'U10 Boys' },
    { name: 'Syafiq Danial', metric: 'OVR 79', team: 'U10 Girls' }
  ];

  const list = document.getElementById('topPlayersList');
  if (list) {
    list.innerHTML = cards.map((player) => `
      <div class="list-item">
        <div class="row-between">
          <strong>${player.name}</strong>
          <span class="pill">${player.metric}</span>
        </div>
        <p class="muted">${player.team}</p>
      </div>
    `).join('');
  }

  const nextMatchTitle = document.getElementById('nextMatchTitle');
  const nextMatchMeta = document.getElementById('nextMatchMeta');
  if (nextMatchTitle) nextMatchTitle.textContent = 'SERC U14 vs KL Hawks';
  if (nextMatchMeta) nextMatchMeta.textContent = 'Sat · 15:00 · Serdang Field';
})();
