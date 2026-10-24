import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================================
// GANTI DENGAN CONFIG FIREBASE AWAK
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyCB46lUZ9qbIT79GGTZ6AtgEX_md69_-no",
  authDomain: "serdang-eagles-rc.firebaseapp.com",
  projectId: "serdang-eagles-rc",
  storageBucket: "serdang-eagles-rc.firebasestorage.app",
  messagingSenderId: "36700334702",
  appId: "1:36700334702:web:a983a1858c948ea9a1147f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);