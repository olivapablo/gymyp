window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.notifications = window.FITTRACK.notifications || {};

const NOTIF_KEY = 'fittrack_user_notifications';

// Default initial notifications if empty
const DEFAULT_NOTIFS = [
  {
    id: 'n1',
    title: '¡Bienvenido a FITTRACK!',
    body: 'Configura tus rutinas y empieza a registrar tus entrenamientos hoy.',
    time: new Date().toISOString(),
    unread: true,
    type: 'system',
    icon: 'dumbbell'
  },
  {
    id: 'n2',
    title: 'Recordatorio de entrenamiento',
    body: 'Recuerda hidratarte y mantener la constancia en tus series.',
    time: new Date(Date.now() - 3600000 * 4).toISOString(),
    unread: true,
    type: 'reminder',
    icon: 'bell'
  }
];

// Get all notifications
window.FITTRACK.getNotifications = function() {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (!raw) {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(DEFAULT_NOTIFS));
      return DEFAULT_NOTIFS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_NOTIFS;
  }
};

// Add a notification
window.FITTRACK.addNotification = function(title, body, icon = 'bell', type = 'info') {
  const notifs = window.FITTRACK.getNotifications();
  const newNotif = {
    id: 'n_' + Date.now(),
    title,
    body,
    time: new Date().toISOString(),
    unread: true,
    type,
    icon
  };
  notifs.unshift(newNotif);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
  window.FITTRACK.updateNotificationBadge();
  
  // Try sending browser push if permitted
  window.FITTRACK.sendBrowserNotification(title, body);
  return newNotif;
};

// Mark as read
window.FITTRACK.markNotificationAsRead = function(id) {
  const notifs = window.FITTRACK.getNotifications();
  const target = notifs.find(n => n.id === id);
  if (target) {
    target.unread = false;
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
    window.FITTRACK.updateNotificationBadge();
  }
};

// Mark all as read
window.FITTRACK.markAllNotificationsAsRead = function() {
  const notifs = window.FITTRACK.getNotifications();
  notifs.forEach(n => n.unread = false);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
  window.FITTRACK.updateNotificationBadge();
};

// Clear all
window.FITTRACK.clearAllNotifications = function() {
  localStorage.setItem(NOTIF_KEY, JSON.stringify([]));
  window.FITTRACK.updateNotificationBadge();
};

// Update header badge dot
window.FITTRACK.updateNotificationBadge = function() {
  const dot = document.getElementById('notif-badge-dot');
  if (!dot) return;
  const notifs = window.FITTRACK.getNotifications();
  const hasUnread = notifs.some(n => n.unread);
  if (hasUnread) {
    dot.classList.remove('d-none');
  } else {
    dot.classList.add('d-none');
  }
};

// Request Browser Push Notification Permission
window.FITTRACK.requestPushPermission = async function() {
  if (!('Notification' in window)) {
    window.FITTRACK.alert('Tu navegador no soporta Notificaciones Push.', 'Incompatible');
    return false;
  }
  
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    window.FITTRACK.sendBrowserNotification('¡Notificaciones Activadas!', 'Recibirás recordatorios y avisos de rutinas en tu dispositivo.');
    return true;
  } else if (permission === 'denied') {
    window.FITTRACK.alert('Las notificaciones están bloqueadas en los permisos de tu navegador.', 'Bloqueadas');
    return false;
  }
  return false;
};

// Trigger browser native push notification
window.FITTRACK.sendBrowserNotification = function(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            body: body,
            icon: './assets/icons/icon-192.png',
            vibrate: [100, 50, 100]
          });
        });
      } else {
        new Notification(title, {
          body: body,
          icon: './assets/icons/icon-192.png'
        });
      }
    } catch (e) {
      console.warn('Browser notification error:', e);
    }
  }
};
