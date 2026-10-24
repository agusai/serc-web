import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

// ============================================
// ROLE → DESTINATION
// ============================================
function getRedirectUrl(role, team) {
  switch (role) {
    case 'superadmin':
    case 'management':
      return 'management/index.html';
    case 'headcoach':
    case 'coaching':
      return 'coach/index.html';
    case 'livecoach':
      return 'coach/index.html';
    case 'player':
    case 'players':
    case 'parents':
    case 'parent':
      return 'player/index.html';
    default:
      // fallback untuk guest atau role tak dikenali
      return '../index.html';
  }
}

// ============================================
// LOGIN PAGE
// ============================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  const emailInput = document.getElementById('email');
  const pwInput = document.getElementById('password');
  const btn = document.getElementById('loginBtn');
  const errBox = document.getElementById('loginError');

  // Kalau dah login, redirect ikut role
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        window.location.href = getRedirectUrl(data.role, data.team);
      }
    } catch (e) {
      console.warn('Redirect check failed:', e);
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        emailInput.value.trim(),
        pwInput.value
      );

      // Ambil role dari Firestore
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists()) {
        errBox.textContent = 'User record not found.';
        btn.disabled = false;
        btn.textContent = 'Log In';
        return;
      }

      const data = snap.data();
      const url = getRedirectUrl(data.role, data.team);
      window.location.href = url;

    } catch (err) {
      const msgs = {
        'auth/invalid-email':        'Invalid email.',
        'auth/user-not-found':       'User not found.',
        'auth/wrong-password':       'Wrong password.',
        'auth/invalid-credential':   'Email or password is incorrect.',
        'auth/too-many-requests':    'Too many attempts. Try again later.'
      };
      errBox.textContent = msgs[err.code] || err.message;
      btn.disabled = false;
      btn.textContent = 'Log In';
    }
  });
}

// ============================================
// LOGOUT
// ============================================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = '../login.html';
  });
}

export { auth };