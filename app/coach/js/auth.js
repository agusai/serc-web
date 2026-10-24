import { getAuth, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export const auth = getAuth();

export function protectPage() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = '../login.html';
        return;
      }
      resolve(user);
    });
  });
}

export function setupLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = '../login.html';
  });
}