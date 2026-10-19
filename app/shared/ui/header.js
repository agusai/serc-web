window.SERCUI = window.SERCUI || {};

window.SERCUI.renderHeader = function (title, options = {}) {
  const output = `
    <header class="nav-header">
      <div class="brand-wrap">
        <div class="logo-mark">L</div>
        <div>
          <div class="brand-name">SERC</div>
          <small>${window.SERC_CONFIG.appName}</small>
        </div>
      </div>
      <nav class="topnav">
        <a href="index.html">Home</a>
        <a href="squad.html">Squad</a>
        <a href="training.html">Training</a>
        <a href="match.html">Match</a>
        <button class="button button-secondary" type="button" id="logoutButton">Logout</button>
      </nav>
    </header>
  `;

  const el = document.getElementById(options.target || 'appHeader');
  if (el) {
    el.innerHTML = output;
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('serc_session');
        window.location.href = '../login.html';
      });
    }
  }
};
