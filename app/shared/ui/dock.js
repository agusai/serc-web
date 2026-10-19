window.SERCUI = window.SERCUI || {};

window.SERCUI.renderDock = function (items = []) {
  const dock = document.createElement('nav');
  dock.className = 'dock';

  const defaultItems = [
    { label: 'Home', href: 'index.html' },
    { label: 'Squad', href: 'squad.html' },
    { label: 'Training', href: 'training.html' },
    { label: 'Match', href: 'match.html' }
  ];

  const entries = items.length ? items : defaultItems;
  dock.innerHTML = entries
    .map(
      (item) => `
        <a class="button button-dark" href="${item.href}">${item.label}</a>
      `
    )
    .join('');

  document.body.appendChild(dock);
};
