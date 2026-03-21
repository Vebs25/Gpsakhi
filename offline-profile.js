// ══════════════════════════════════════════════════════════════
// GP Sakhi — Offline Profile Manager
// हा file प्रत्येक tool page मध्ये <script src="offline-profile.js"></script>
// असे include करा (config.js नंतर, Firebase module आधी)
// ══════════════════════════════════════════════════════════════

const GP_PROFILE_KEY = 'gpSakhi_profile';
const GP_USER_KEY    = 'gpSakhi_user';

window.GPOffline = {

  // ── Profile localStorage मध्ये save करा ──
  saveProfile(data) {
    try {
      const payload = {
        ...data,
        _savedAt: new Date().toISOString()
      };
      localStorage.setItem(GP_PROFILE_KEY, JSON.stringify(payload));
      console.log('[GPOffline] Profile locally saved ✅');
    } catch (e) {
      console.warn('[GPOffline] localStorage save failed:', e);
    }
  },

  // ── localStorage मधून profile वाचा ──
  loadProfile() {
    try {
      const raw = localStorage.getItem(GP_PROFILE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[GPOffline] localStorage read failed:', e);
      return null;
    }
  },

  // ── User info save (नाव, photo) ──
  saveUser(user) {
    try {
      localStorage.setItem(GP_USER_KEY, JSON.stringify({
        uid:         user.uid,
        displayName: user.displayName,
        photoURL:    user.photoURL,
        email:       user.email
      }));
    } catch (e) {}
  },

  // ── Saved user वाचा ──
  loadUser() {
    try {
      const raw = localStorage.getItem(GP_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },

  // ── Logout वेळी user info clear करा (profile ठेवा) ──
  clearUser() {
    localStorage.removeItem(GP_USER_KEY);
  },

  // ── Profile clear (optional — settings मधून) ──
  clearProfile() {
    localStorage.removeItem(GP_PROFILE_KEY);
  },

  // ── Online आहे का check करा ──
  isOnline() {
    return navigator.onLine;
  }
};

// ══ Online/Offline status indicator ══
// Page मध्ये id="offline-banner" असेल तर दाखवतो
function updateOnlineStatus() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  if (navigator.onLine) {
    banner.style.display = 'none';
  } else {
    banner.style.display = 'flex';
  }
}

window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
document.addEventListener('DOMContentLoaded', updateOnlineStatus);
