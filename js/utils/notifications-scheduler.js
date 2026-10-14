window.FITTRACK = window.FITTRACK || {};

/**
 * FITTRACK — Notifications Scheduler
 * Local workout reminder via the Web Notification API.
 * Checks every 30 seconds if it's time to fire the reminder.
 */
(function () {
  const KEY_ENABLED = 'fittrack_notif_enabled';
  const KEY_HOUR   = 'fittrack_notif_hour';
  const KEY_MIN    = 'fittrack_notif_minute';

  let checkInterval = null;
  let lastFiredDate = null;  // prevent double-firing on same day

  // ── Permission ────────────────────────────────────────────────
  async function requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }

  // ── State helpers ─────────────────────────────────────────────
  function isEnabled() {
    return localStorage.getItem(KEY_ENABLED) === '1';
  }

  function getScheduledTime() {
    return {
      hour:   parseInt(localStorage.getItem(KEY_HOUR)  ?? '8', 10),
      minute: parseInt(localStorage.getItem(KEY_MIN)   ?? '0', 10)
    };
  }

  // ── Save / disable schedule ───────────────────────────────────
  async function saveSchedule(hour, minute) {
    const granted = await requestPermission();
    if (!granted) return false;
    localStorage.setItem(KEY_ENABLED, '1');
    localStorage.setItem(KEY_HOUR,    String(hour));
    localStorage.setItem(KEY_MIN,     String(minute));
    startChecking();
    return true;
  }

  function disableSchedule() {
    localStorage.setItem(KEY_ENABLED, '0');
    if (checkInterval) { clearInterval(checkInterval); checkInterval = null; }
  }

  // ── Fire notification ─────────────────────────────────────────
  function fireNotification() {
    if (Notification.permission !== 'granted') return;
    try {
      new Notification('FITTRACK 💪', {
        body:    '¡Es hora de entrenar! No dejes pasar hoy.',
        icon:    './assets/icon.svg',
        badge:   './assets/icons/icon-192.png',
        tag:     'fittrack-daily-reminder',
        renotify: true,
        vibrate: [100, 50, 100]
      });
    } catch (e) {
      console.warn('[NotifScheduler] Could not fire notification:', e);
    }
  }

  // ── Check loop ────────────────────────────────────────────────
  function checkAndFire() {
    if (!isEnabled()) return;
    const { hour, minute } = getScheduledTime();
    const now   = new Date();
    const today = now.toDateString();
    if (
      now.getHours()   === hour   &&
      now.getMinutes() === minute &&
      lastFiredDate    !== today
    ) {
      lastFiredDate = today;
      fireNotification();
    }
  }

  function startChecking() {
    if (checkInterval) clearInterval(checkInterval);
    if (!isEnabled()) return;
    checkInterval = setInterval(checkAndFire, 30_000); // every 30 s
    checkAndFire(); // check immediately on start
  }

  // Auto-start if previously configured
  if (isEnabled()) {
    setTimeout(startChecking, 3000); // after app has finished initialising
  }

  // ── Public API ────────────────────────────────────────────────
  window.FITTRACK.notifScheduler = {
    requestPermission,
    saveSchedule,
    disableSchedule,
    isEnabled,
    getScheduledTime,
    startChecking
  };
})();
