import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQ-rOuYT4HcwsH8hISOqsKYil-nOYINUI",
  authDomain: "realestate-app-736be.firebaseapp.com",
  projectId: "realestate-app-736be"
};

const allowedUsers = [
  "ohademri@gmail.com",
  "raberroee@gmail.com"
];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function createLoginOverlay() {
  if (document.getElementById("auth-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "auth-overlay";

  overlay.innerHTML = `
    <div class="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div class="auth-logo">🔐</div>
      <h1 id="auth-title">כניסה מאובטחת</h1>
      <p>יש להתחבר עם חשבון Google מורשה כדי לפתוח את טופס ביקור השמאי.</p>
      <button id="google-login-btn" type="button">התחברות עם Google</button>
      <div id="auth-error" aria-live="polite"></div>
    </div>
  `;

  const style = document.createElement("style");
  style.id = "auth-style";

  style.innerHTML = `
    #auth-overlay {
      position: fixed;
      inset: 0;
      background: #f4f2ed;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      direction: rtl;
      font-family: Heebo, Arial, sans-serif;
      padding: 20px;
    }

    .auth-card {
      background: #fff;
      padding: 36px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.12);
      text-align: center;
      max-width: 430px;
      width: 100%;
      border-top: 4px solid #c9a84c;
    }

    .auth-logo {
      font-size: 38px;
      margin-bottom: 8px;
    }

    .auth-card h1 {
      margin: 0 0 12px;
      color: #1e3456;
      font-size: 26px;
    }

    .auth-card p {
      margin: 0 0 24px;
      color: #555;
      line-height: 1.6;
      font-size: 15px;
    }

    #google-login-btn {
      background: #1e3456;
      color: white;
      border: none;
      padding: 14px 22px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 16px;
      width: 100%;
      font-family: Heebo, Arial, sans-serif;
      font-weight: 600;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }

    #google-login-btn:hover,
    #google-login-btn:focus {
      background: #152744;
      outline: none;
    }

    #auth-error {
      margin-top: 16px;
      color: #a63d2f;
      font-size: 14px;
      min-height: 22px;
    }

    #logout-btn {
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 9999;
      background: #1e3456;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 9px 12px;
      cursor: pointer;
      font-family: Heebo, Arial, sans-serif;
      font-size: 13px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.12);
      max-width: calc(100vw - 24px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }

    @media (max-width: 640px) {
      .auth-card {
        padding: 28px 20px;
      }

      .auth-card h1 {
        font-size: 23px;
      }

      #logout-btn {
        top: auto;
        bottom: calc(12px + env(safe-area-inset-bottom));
        left: 12px;
        font-size: 12px;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  document.getElementById("google-login-btn").addEventListener("click", async () => {
    const errorEl = document.getElementById("auth-error");
    errorEl.innerText = "";

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      errorEl.innerText = "ההתחברות נכשלה. בדוק שהדומיין מוגדר ב-Firebase ונסה שוב.";
      console.error("Google sign-in failed", err);
    }
  });
}

function showUnauthorized(email) {
  document.documentElement.classList.remove("auth-pending");
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f4f2ed;font-family:Heebo,Arial,sans-serif;direction:rtl;padding:20px;text-align:center;">
      <div style="background:white;padding:36px;border-radius:16px;max-width:520px;box-shadow:0 10px 40px rgba(0,0,0,0.12);border-top:4px solid #a63d2f;">
        <h1 style="color:#a63d2f;margin-top:0;">אין הרשאה</h1>
        <p style="line-height:1.7;">המשתמש ${email ? `<strong>${email}</strong>` : "הזה"} אינו מורשה להשתמש במערכת.</p>
        <button id="try-different-user" style="background:#1e3456;color:white;border:none;border-radius:10px;padding:12px 18px;cursor:pointer;font-family:Heebo,Arial,sans-serif;">נסה משתמש אחר</button>
      </div>
    </div>
  `;

  document.getElementById("try-different-user").addEventListener("click", async () => {
    await signOut(auth);
    location.reload();
  });
}

function addLogoutButton(user) {
  const existing = document.getElementById("logout-btn");
  if (existing) existing.remove();

  const btn = document.createElement("button");
  btn.id = "logout-btn";
  btn.type = "button";
  btn.innerText = `התנתק (${user.email})`;
  btn.title = "התנתקות";

  btn.addEventListener("click", async () => {
    await signOut(auth);
    location.reload();
  });

  document.body.appendChild(btn);
}

createLoginOverlay();

onAuthStateChanged(auth, async (user) => {
  const overlay = document.getElementById("auth-overlay");

  if (!user) {
    document.documentElement.classList.add("auth-pending");
    if (overlay) overlay.style.display = "flex";
    return;
  }

  const email = normalizeEmail(user.email);

  if (!allowedUsers.includes(email)) {
    await signOut(auth);
    showUnauthorized(email);
    return;
  }

  if (overlay) overlay.remove();
  document.documentElement.classList.remove("auth-pending");
  addLogoutButton(user);
});
