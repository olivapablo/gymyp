window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.screens = window.FITTRACK.screens || {};

window.FITTRACK.screens.renderProfile = async function(container) {
  container.innerHTML = `
    <div class="flex-col items-center py-12"><div class="spinner"></div></div>
  `;

  try {
    const profile = await window.FITTRACK.getProfile();

    // Stats
    let workouts = [];
    try { workouts = await window.FITTRACK.getWorkoutHistory(100); } catch(e) {}
    let routines = [];
    try { routines = await window.FITTRACK.getRoutines(); } catch(e) {}

    const now = new Date();
    const monthWorkouts = workouts.filter(w => {
      let d = null;
      if (w.endTime?.toDate) d = w.endTime.toDate();
      if (!d) return false;
      return (now - d)/86400000 <= 30;
    }).length;

    let totalVolume = 0;
    workouts.forEach(w => {
      if (w.exercises) w.exercises.forEach(ex => {
        if (ex.sets) ex.sets.forEach(s => {
          if (s.completed) totalVolume += (parseFloat(s.kg)||0) * (parseInt(s.reps)||0);
        });
      });
    });

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

    container.innerHTML = `
      <h1 class="text-3xl font-bold mb-6">Perfil</h1>

      <!-- User card -->
      <div class="card mb-6 profile-user-card">
        <div class="profile-avatar">
          ${profile.photoURL
            ? `<img src="${profile.photoURL}" alt="Foto de perfil" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
            : `<i data-lucide="user" style="width:32px;height:32px;color:var(--color-text-2);"></i>`
          }
        </div>
        <div class="flex-col gap-1">
          <h2 style="font-size:1.2rem;font-weight:700;line-height:1.2;">${profile.displayName || 'Usuario'}</h2>
          <p style="font-size:0.8rem;color:var(--color-text-2);">${profile.email || ''}</p>
        </div>
      </div>

      <!-- Personal stats -->
      <div class="stats-grid mb-6">
        <div class="card dash-stat-card">
          <div class="dash-stat-icon" style="background:rgba(183,243,74,0.1);">
            <i data-lucide="dumbbell" style="color:var(--color-primary);width:18px;height:18px;"></i>
          </div>
          <div class="dash-stat-value">${workouts.length}</div>
          <div class="dash-stat-label">Entrenos totales</div>
        </div>

        <div class="card dash-stat-card">
          <div class="dash-stat-icon" style="background:rgba(255,200,87,0.12);">
            <i data-lucide="calendar-check" style="color:var(--color-warning);width:18px;height:18px;"></i>
          </div>
          <div class="dash-stat-value">${monthWorkouts}</div>
          <div class="dash-stat-label">Este mes</div>
        </div>

        <div class="card dash-stat-card">
          <div class="dash-stat-icon" style="background:rgba(91,167,255,0.12);">
            <i data-lucide="clipboard-list" style="color:var(--color-info);width:18px;height:18px;"></i>
          </div>
          <div class="dash-stat-value">${routines.length}</div>
          <div class="dash-stat-label">Rutinas</div>
        </div>

        <div class="card dash-stat-card">
          <div class="dash-stat-icon" style="background:rgba(74,222,128,0.12);">
            <i data-lucide="bar-chart-2" style="color:var(--color-success);width:18px;height:18px;"></i>
          </div>
          <div class="dash-stat-value">${totalVolume >= 1000 ? (totalVolume/1000).toFixed(1)+'t' : (totalVolume > 0 ? totalVolume+'kg' : '—')}</div>
          <div class="dash-stat-label">Volumen total</div>
        </div>
      </div>

      <!-- Settings -->
      <h3 class="text-base font-bold mb-3" style="color:var(--color-text-2);text-transform:uppercase;letter-spacing:0.08em;font-size:0.7rem;">Ajustes</h3>
      <div class="card p-0 mb-6" style="overflow:hidden;">

        <!-- Theme toggle -->
        <div class="profile-setting-row" id="row-theme">
          <div class="flex-row items-center gap-3">
            <div class="profile-setting-icon">
              <i data-lucide="${currentTheme === 'dark' ? 'moon' : 'sun'}" style="width:18px;height:18px;color:var(--color-text-2);"></i>
            </div>
            <div>
              <div class="font-medium" style="font-size:0.9rem;">Modo ${currentTheme === 'dark' ? 'Oscuro' : 'Claro'}</div>
              <div style="font-size:0.72rem;color:var(--color-text-3);">Tema activo</div>
            </div>
          </div>
          <!-- Toggle switch -->
          <div class="profile-toggle ${currentTheme === 'dark' ? 'active' : ''}" id="theme-toggle">
            <div class="profile-toggle-knob"></div>
          </div>
        </div>

        <div class="profile-setting-divider"></div>

        <!-- Notifications -->
        <div class="profile-setting-row" onclick="window.location.hash='#/notifications'" style="cursor:pointer;">
          <div class="flex-row items-center gap-3">
            <div class="profile-setting-icon">
              <i data-lucide="bell" style="width:18px;height:18px;color:var(--color-primary);"></i>
            </div>
            <div>
              <div class="font-medium" style="font-size:0.9rem;">Notificaciones</div>
              <div style="font-size:0.72rem;color:var(--color-text-3);">Avisos y recordatorios</div>
            </div>
          </div>
          <i data-lucide="chevron-right" style="width:16px;height:16px;color:var(--color-text-3);"></i>
        </div>

        <div class="profile-setting-divider"></div>

        <!-- Install PWA -->
        <div class="profile-setting-row">
          <div class="flex-row items-center gap-3">
            <div class="profile-setting-icon">
              <i data-lucide="smartphone" style="width:18px;height:18px;color:var(--color-text-2);"></i>
            </div>
            <div>
              <div class="font-medium" style="font-size:0.9rem;">Instalar App</div>
              <div style="font-size:0.72rem;color:var(--color-text-3);">Añadir a pantalla de inicio</div>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-profile-install-pwa" style="font-size:0.75rem;padding:0.35rem 0.75rem;">
            Instalar
          </button>
        </div>
      </div>

      <!-- Logout -->
      <button id="btn-logout" class="btn btn-block mb-3" style="background:var(--grad-btn-realism);color:var(--color-error);border:1px solid rgba(255,92,92,0.25);padding:0.875rem;border-radius:var(--radius-xl);box-shadow:var(--shadow-realism-btn);">
        <i data-lucide="log-out"></i>
        Cerrar Sesión
      </button>

      <p class="text-center text-xs mt-6 mb-2" style="color:var(--color-text-3);">FITTRACK v1.0.0 · Hecho con 💚</p>
    `;

    if (window.lucide) lucide.createIcons();

    // PWA Install
    const btnInstall = document.getElementById('btn-profile-install-pwa');
    if (btnInstall) {
      btnInstall.addEventListener('click', () => {
        if (window.FITTRACK.pwa && window.FITTRACK.pwa.promptInstall) {
          window.FITTRACK.pwa.promptInstall();
        } else {
          window.FITTRACK.alert('Para instalar FITTRACK en tu pantalla de inicio, toca el menú de tu navegador y elige "Añadir a pantalla de inicio" o "Instalar app".', 'Instalar App');
        }
      });
    }

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      window.FITTRACK.toggleTheme();
      // Re-render to reflect new theme
      window.FITTRACK.screens.renderProfile(container);
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', async () => {
      const ok = await window.FITTRACK.confirm('¿Estás seguro de que deseas cerrar sesión?', 'Cerrar Sesión', 'Cerrar Sesión', 'Cancelar');
      if (ok) {
        await window.FITTRACK.signOut();
      }
    });

  } catch (error) {
    container.innerHTML = `<div class="card p-4" style="border-color:var(--color-error);">Error: ${error.message}</div>`;
  }
};
