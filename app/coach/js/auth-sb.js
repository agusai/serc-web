// coach/js/auth-sb.js
import { supabase, onAuthChange, signOut as sbSignOut } from '../../js/supabase.js';

export const auth = supabase.auth;

export function protectPage() {
  return new Promise((resolve) => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        resolve(session.user);
        return;
      }
      onAuthChange((user) => {
        if (!user) {
          window.location.href = '../login.html';
          return;
        }
        resolve(user);
      });
    });
  });
}

export function setupLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    await sbSignOut();
    window.location.href = '../login.html';
  });
}