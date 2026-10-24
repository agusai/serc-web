// login-sb.js
import { signIn } from './supabase.js';

const form = document.getElementById('loginForm');
const errEl = document.getElementById('loginError');
const btn = document.getElementById('loginBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    await signIn(email, password);
    window.location.href = 'coach/index.html';
  } catch (err) {
    errEl.textContent = err.message || 'Login failed';
    btn.disabled = false;
    btn.textContent = 'Log In';
  }
});