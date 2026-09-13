window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.screens = window.FITTRACK.screens || {};

window.FITTRACK.screens.renderDashboard = async function(container) {
  container.innerHTML = `
    <div class="flex-col items-center justify-center mt-8 gap-4">
      <div class="spinner"></div>
      <p class="text-color-3 text-sm">Cargando resumen...</p>
    </div>
  `;

  try {
    const profile = await window.FITTRACK.getProfile();
    const firstName = (profile.displayName || 'Atleta').split(' ')[0];

    // Get real workout history
    let workouts = [];
    try { workouts = await window.FITTRACK.getWorkoutHistory(20); } catch(e) {}

    // Calculate weekly stats
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0,0,0,0);

    let weeklyVolume = 0;
    let weeklySets = 0;
    let weekWorkouts = 0;
    const weekDays = [false,false,false,false,false,false,false];

    workouts.forEach(w => {
      let date = null;
      if (w.endTime && w.endTime.toDate) date = w.endTime.toDate();
      else if (w.startTime && w.startTime.toDate) date = w.startTime.toDate();
      if (!date) return;

      const dayIndex = date.getDay();
      if (date >= weekStart) {
        weekWorkouts++;
        weekDays[dayIndex] = true;
        if (w.exercises) {
          w.exercises.forEach(ex => {
            if (ex.sets) ex.sets.forEach(s => {
              if (s.completed) {
                weeklySets++;
                weeklyVolume += (parseFloat(s.kg)||0) * (parseInt(s.reps)||0);
              }
            });
          });
        }
      }
    });

    const lastWorkout = workouts[0];
    let lastWorkoutText = 'Sin registros';
    if (lastWorkout) {
      let d = null;
      if (lastWorkout.endTime?.toDate) d = lastWorkout.endTime.toDate();
      else if (lastWorkout.startTime?.toDate) d = lastWorkout.startTime.toDate();
      if (d) {
        const diffMs = now - d;
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffDays === 0) lastWorkoutText = 'Hoy';
        else if (diffDays === 1) lastWorkoutText = 'Ayer';
        else lastWorkoutText = `Hace ${diffDays} días`;
      }
    }

    const dayNames = ['D','L','M','X','J','V','S'];

    container.innerHTML = `
      <!-- Greeting -->
      <div class="dash-greeting">
        <div class="dash-greeting-sub">Bienvenido de vuelta</div>
        <h1 class="dash-greeting-name">Hola, ${firstName} 👋</h1>
      </div>

      <!-- CTA Button -->
      <a href="#/workout" class="btn btn-primary btn-block dash-cta">
        <i data-lucide="zap" style="width:18px;height:18px"></i>
        Iniciar Entrenamiento
      </a>

      <!-- Weekly Streak -->
      <div class="card dash-streak-card mb-4">
        <div class="flex-row justify-between items-center mb-3">
          <span class="dash-section-label">Racha semanal</span>
          <span class="dash-streak-count" style="color:var(--color-primary); font-weight:700; font-size:0.85rem;">${weekWorkouts} entrenos esta semana</span>
        </div>
        <div class="streak-bar-container">
          ${dayNames.map((d, i) => `
            <div class="streak-day-wrap">
              <div class="streak-day ${weekDays[i] ? 'done' : ''} ${i === now.getDay() ? 'today' : ''}"></div>
              <span class="streak-day-label">${d}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Stats grid -->
      <div class="stats-grid mb-6">
        <div class="card dash-stat-card" onclick="window.location.hash='#/history'" style="cursor:pointer;">
          <div class="dash-stat-icon" style="background:rgba(183,243,74,0.1);">
            <i data-lucide="history" style="color:var(--color-primary);width:18px;height:18px;"></i>
          </div>
          <div class="dash-stat-value">${lastWorkoutText}</div>
          <div class="dash-stat-label">Último entreno</div>
        </div>

        <div class="card dash-stat-card" onclick="window.location.hash='#/progress'" style="cursor:pointer;">
          <div class="dash-stat-icon" style="background:rgba(255,200,87,0.12);">
            <i data-lucide="bar-chart-2" style="color:var(--color-warning);width:18px;height:18px;"></i>
          </div>
          <div class="dash-stat-value">${weeklyVolume > 0 ? (weeklyVolume >= 1000 ? (weeklyVolume/1000).toFixed(1)+'t' : weeklyVolume+'kg') : '—'}</div>
          <div class="dash-stat-label">Volumen semana</div>
        </div>

        <div class="card dash-stat-card" onclick="window.location.hash='#/history'" style="cursor:pointer;">
          <div class="dash-stat-icon" style="background:rgba(91,167,255,0.12);">
            <i data-lucide="layers" style="color:var(--color-info);width:18px;height:18px;"></i>
          </div>
          <div class="dash-stat-value">${weeklySets > 0 ? weeklySets : '—'}</div>
          <div class="dash-stat-label">Series totales</div>
        </div>

        <div class="card dash-stat-card" onclick="window.location.hash='#/routines'" style="cursor:pointer;">
          <div class="dash-stat-icon" style="background:rgba(74,222,128,0.12);">
            <i data-lucide="clipboard-list" style="color:var(--color-success);width:18px;height:18px;"></i>
          </div>
          <div class="dash-stat-value">${weekWorkouts}</div>
          <div class="dash-stat-label">Semana actual</div>
        </div>
      </div>

      <!-- Quick links -->
      <div class="dash-section-label mb-3">Accesos rápidos</div>
      <div class="flex-col gap-2 mb-4">
        <a href="#/routines" class="card card-interactive flex-row items-center justify-between" style="padding:1rem;">
          <div class="flex-row items-center gap-3">
            <div style="width:36px;height:36px;border-radius:10px;background:var(--color-surface-2);display:flex;align-items:center;justify-content:center;">
              <i data-lucide="clipboard-list" style="width:18px;height:18px;color:var(--color-text-2);"></i>
            </div>
            <span class="font-medium">Gestionar Rutinas</span>
          </div>
          <i data-lucide="chevron-right" class="text-color-3"></i>
        </a>

        <a href="#/progress" class="card card-interactive flex-row items-center justify-between" style="padding:1rem;">
          <div class="flex-row items-center gap-3">
            <div style="width:36px;height:36px;border-radius:10px;background:var(--color-surface-2);display:flex;align-items:center;justify-content:center;">
              <i data-lucide="trending-up" style="width:18px;height:18px;color:var(--color-text-2);"></i>
            </div>
            <span class="font-medium">Ver Progreso</span>
          </div>
          <i data-lucide="chevron-right" class="text-color-3"></i>
        </a>

        <a href="#/history" class="card card-interactive flex-row items-center justify-between" style="padding:1rem;">
          <div class="flex-row items-center gap-3">
            <div style="width:36px;height:36px;border-radius:10px;background:var(--color-surface-2);display:flex;align-items:center;justify-content:center;">
              <i data-lucide="clock" style="width:18px;height:18px;color:var(--color-text-2);"></i>
            </div>
            <span class="font-medium">Historial</span>
          </div>
          <i data-lucide="chevron-right" class="text-color-3"></i>
        </a>
      </div>

      <!-- Recent workouts -->
      ${workouts.length > 0 ? `
        <div class="dash-section-label mb-3">Últimos entrenamientos</div>
        <div class="flex-col gap-3 mb-6">
          ${workouts.slice(0,3).map(w => {
            let dateStr = '';
            if (w.endTime?.toDate) dateStr = w.endTime.toDate().toLocaleDateString('es-ES',{day:'numeric',month:'short'});
            return `
              <div class="card flex-row justify-between items-center" style="padding:0.875rem 1rem;">
                <div class="flex-col gap-1">
                  <span class="font-semibold" style="font-size:0.9rem;">${w.name || 'Entrenamiento'}</span>
                  <span class="text-xs" style="color:var(--color-text-3);">${dateStr}</span>
                </div>
                <span class="badge badge-primary">${w.exercises ? w.exercises.length : 0} ej.</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    `;

    if (window.lucide) lucide.createIcons();

  } catch (error) {
    container.innerHTML = `
      <div class="card p-4 mt-4" style="border-color:var(--color-error);">
        <div class="font-semibold mb-2" style="color:var(--color-error);">Error cargando el dashboard</div>
        <p class="text-sm text-color-2">${error.message}</p>
        <button class="btn btn-secondary mt-4 btn-block" onclick="window.location.reload()">Reintentar</button>
      </div>
    `;
  }
};
