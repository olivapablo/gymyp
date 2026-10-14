window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.screens = window.FITTRACK.screens || {};

window.FITTRACK.screens.renderNotifications = async function(container) {
  const notifs = window.FITTRACK.getNotifications();
  const pushPermission = 'Notification' in window ? Notification.permission : 'unsupported';

  container.innerHTML = `
    <div class="flex-row justify-between items-center mb-6">
      <div class="flex-row items-center gap-3">
        <button class="btn-icon text-color-2" onclick="window.history.back()">
          <i data-lucide="arrow-left"></i>
        </button>
        <h1 class="text-2xl font-bold">Notificaciones</h1>
      </div>
      ${notifs.length > 0 ? `
        <button id="btn-clear-notifs" class="btn btn-ghost text-xs text-color-3">Limpiar todo</button>
      ` : ''}
    </div>

    <!-- Push Notification Permission Banner -->
    ${pushPermission !== 'granted' && pushPermission !== 'unsupported' ? `
      <div class="card p-4 mb-6" style="background: var(--color-primary-dim); border-color: var(--color-primary);">
        <div class="flex-row items-center gap-3 mb-2">
          <i data-lucide="bell-ring" class="text-primary" style="width:24px;height:24px;"></i>
          <span class="font-bold text-color-1">Notificaciones Push Desactivadas</span>
        </div>
        <p class="text-color-2 text-xs mb-3">Activa las notificaciones en tu dispositivo para recibir alertas cuando tu pareja te envíe rutinas o cuando sea hora de entrenar.</p>
        <button id="btn-enable-push" class="btn btn-primary btn-sm">Activar Notificaciones Push</button>
      </div>
    ` : ''}

    <!-- Send test push button -->
    <div class="mb-6 flex-row justify-between items-center card p-3">
      <div class="flex-col">
        <span class="font-semibold text-sm text-color-1">Probar Notificaciones</span>
        <span class="text-xs text-color-3">Envía una alerta de prueba a tu pantalla</span>
      </div>
      <button id="btn-test-notif" class="btn btn-secondary btn-sm">
        <i data-lucide="bell" style="width:14px;height:14px;"></i> Enviar Prueba
      </button>
    </div>

    <!-- Notifications List -->
    <div id="notifications-list" class="flex-col gap-3">
      ${notifs.length === 0 ? `
        <div class="card flex-col items-center text-center py-12">
          <i data-lucide="bell-off" class="text-color-3 mb-3" style="width: 48px; height: 48px;"></i>
          <h3 class="text-lg font-semibold mb-1">No tienes notificaciones</h3>
          <p class="text-color-3 text-sm">Las novedades y avisos aparecerán aquí.</p>
        </div>
      ` : notifs.map(n => `
        <div class="card p-4 flex-row items-start gap-3 ${n.unread ? 'border-primary' : ''}" style="${n.unread ? 'background: var(--color-surface-2);' : ''}">
          <div style="width:36px; height:36px; border-radius:50%; background: ${n.unread ? 'var(--color-primary-dim)' : 'var(--color-surface-3)'}; color: ${n.unread ? 'var(--color-primary)' : 'var(--color-text-2)'}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <i data-lucide="${n.icon || 'bell'}" style="width:18px;height:18px;"></i>
          </div>
          <div class="flex-col flex-1 gap-1">
            <div class="flex-row justify-between items-center">
              <span class="font-bold text-sm text-color-1">${n.title}</span>
              <span class="text-xs text-color-3">${new Date(n.time).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })}</span>
            </div>
            <p class="text-sm text-color-2">${n.body}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Mark all as read when screen opens
  window.FITTRACK.markAllNotificationsAsRead();

  // Clear all button
  const btnClear = document.getElementById('btn-clear-notifs');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      window.FITTRACK.clearAllNotifications();
      window.FITTRACK.screens.renderNotifications(container);
    });
  }

  // Enable push button
  const btnEnable = document.getElementById('btn-enable-push');
  if (btnEnable) {
    btnEnable.addEventListener('click', async () => {
      const granted = await window.FITTRACK.requestPushPermission();
      if (granted) {
        window.FITTRACK.screens.renderNotifications(container);
      }
    });
  }

  // Test push button
  const btnTest = document.getElementById('btn-test-notif');
  if (btnTest) {
    btnTest.addEventListener('click', () => {
      window.FITTRACK.addNotification(
        '💪 ¡Hora de entrenar!',
        'No rompas tu racha. Tienes una rutina esperándote hoy.',
        'dumbbell'
      );
      window.FITTRACK.screens.renderNotifications(container);
    });
  }
};
