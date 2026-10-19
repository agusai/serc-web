document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const email = (formData.get('email') || '').toString().trim();
    const password = (formData.get('password') || '').toString();
    const role = (formData.get('role') || 'coach').toString();

    if (!email || !password) {
      if (window.SERCToast) {
        window.SERCToast.show('Please enter your email and password.');
      }
      return;
    }

    const credentials = { email, password, role };
    sessionStorage.setItem('serc_session', JSON.stringify(credentials));

    const routes = {
      coach: './coach/index.html',
      management: './management/index.html',
      superadmin: './superadmin/index.html',
      parent: './parent/index.html',
      player: './player/index.html'
    };

    const target = routes[role] || './coach/index.html';
    window.location.href = target;
  });
});
