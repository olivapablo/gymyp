window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.screens = window.FITTRACK.screens || {};

window.FITTRACK.screens.renderProgress = async function(container) {
  container.innerHTML = `
    <div class="flex-col items-center py-8"><div class="spinner"></div></div>
  `;

  try {
    // Try to load workouts for real data
    let workouts = [];
    try { workouts = await window.FITTRACK.getWorkoutHistory(50); } catch(e) {}

    // Calculate monthly volume per week
    const now = new Date();
    const weeks = ['Sem 1','Sem 2','Sem 3','Sem 4'];
    const weeklyVols = [0,0,0,0];
    workouts.forEach(w => {
      let d = null;
      if (w.endTime?.toDate) d = w.endTime.toDate();
      if (!d) return;
      const diffDays = Math.floor((now - d) / 86400000);
      if (diffDays > 28) return;
      const weekIdx = Math.min(3, Math.floor(diffDays / 7));
      // weekIdx 0 = most recent, reverse for display
      const displayIdx = 3 - weekIdx;
      if (w.exercises) w.exercises.forEach(ex => {
        if (ex.sets) ex.sets.forEach(s => {
          if (s.completed) weeklyVols[displayIdx] += (parseFloat(s.kg)||0) * (parseInt(s.reps)||0);
        });
      });
    });

    const maxVol = Math.max(...weeklyVols, 1);

    // Total workouts this month
    const monthWorkouts = workouts.filter(w => {
      let d = null;
      if (w.endTime?.toDate) d = w.endTime.toDate();
      if (!d) return false;
      return (now - d) / 86400000 <= 30;
    }).length;

    // Total volume all time
    let totalVolume = 0;
    workouts.forEach(w => {
      if (w.exercises) w.exercises.forEach(ex => {
        if (ex.sets) ex.sets.forEach(s => {
          if (s.completed) totalVolume += (parseFloat(s.kg)||0) * (parseInt(s.reps)||0);
        });
      });
    });

    container.innerHTML = `
      <h1 class="text-3xl font-bold mb-6">Progreso</h1>

      <!-- Summary pills -->
      <div class="progress-summary-row mb-6">
        <div class="progress-pill">
          <span class="progress-pill-value">${workouts.length}</span>
          <span class="progress-pill-label">Entrenos totales</span>
        </div>
        <div class="progress-pill">
          <span class="progress-pill-value">${monthWorkouts}</span>
          <span class="progress-pill-label">Este mes</span>
        </div>
        <div class="progress-pill">
          <span class="progress-pill-value">${totalVolume > 0 ? (totalVolume >= 1000 ? (totalVolume/1000).toFixed(0)+'t' : totalVolume+'kg') : '—'}</span>
          <span class="progress-pill-label">Volumen total</span>
        </div>
      </div>

      <!-- Volume chart (bar) -->
      <div class="card mb-6">
        <div class="flex-row justify-between items-center mb-4">
          <h3 class="font-bold text-base">Volumen mensual</h3>
          <span class="badge">Últimas 4 semanas</span>
        </div>
        <div class="progress-bar-chart">
          ${weeklyVols.map((v, i) => `
            <div class="progress-bar-col">
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill" style="height:${v > 0 ? Math.max(8, Math.round((v/maxVol)*100)) : 4}%; background:${i === 3 ? 'var(--color-primary)' : 'var(--color-surface-3)'}; ${i === 3 ? 'box-shadow: 0 0 10px rgba(183,243,74,0.3);' : ''}"></div>
              </div>
              <span class="progress-bar-label">${weeks[i]}</span>
              ${v > 0 ? `<span class="progress-bar-val">${v >= 1000 ? (v/1000).toFixed(1)+'t' : v+'kg'}</span>` : '<span class="progress-bar-val">—</span>'}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Body measurements -->
      <div class="flex-row justify-between items-center mb-3">
        <h2 class="text-xl font-bold">Medidas Corporales</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-measure" style="padding:0.4rem 0.875rem;font-size:var(--font-size-sm);">
          <i data-lucide="plus" style="width:14px;height:14px;"></i> Registrar
        </button>
      </div>

      <div id="measures-container"></div>

      <!-- Consistency -->
      <div class="card mb-6">
        <div class="flex-row justify-between items-center mb-3">
          <h3 class="font-bold text-base">Consistencia (últimos 28 días)</h3>
        </div>
        <div class="consistency-grid" id="consistency-grid">
          ${Array.from({length:28}, (_,i) => {
            const d = new Date(now);
            d.setDate(now.getDate() - (27 - i));
            const trained = workouts.some(w => {
              let wd = null;
              if (w.endTime?.toDate) wd = w.endTime.toDate();
              if (!wd) return false;
              return wd.toDateString() === d.toDateString();
            });
            return `<div class="consistency-cell ${trained ? 'done' : ''}" title="${d.toLocaleDateString('es-ES')}"></div>`;
          }).join('')}
        </div>
        <div class="flex-row gap-4 mt-3" style="font-size:0.7rem;color:var(--color-text-3);">
          <span class="flex-row items-center gap-1"><span style="width:10px;height:10px;border-radius:2px;background:var(--color-primary);display:inline-block;"></span> Entrenado</span>
          <span class="flex-row items-center gap-1"><span style="width:10px;height:10px;border-radius:2px;background:var(--color-surface-2);display:inline-block;"></span> Sin entreno</span>
        </div>
      </div>
    `;

    let initialMeasuresHtml = renderMeasurementsHtml(null);

    try {
      let m = null;
      // Fetch profile to see if measurements exist in DB
      try {
        const profile = await window.FITTRACK.getProfile();
        if (profile && profile.measurements) {
          m = profile.measurements;
        }
      } catch (e) {
        console.warn('Could not load profile measurements', e);
      }

      // Fallback to localStorage if not in DB
      if (!m) {
        const savedRaw = localStorage.getItem('fittrack_latest_measures');
        if (savedRaw) {
          m = JSON.parse(savedRaw);
          // Auto-sync it to the cloud so they don't lose it!
          try {
            if (window.FITTRACK.updateProfile) {
              window.FITTRACK.updateProfile({ measurements: m });
            }
          } catch(err) {
            console.warn('Failed to auto-sync measurements', err);
          }
        }
      }

      if (m && (m.weight || m.fat || m.waist || m.hip || m.chest || m.arms || m.thighs)) {
        initialMeasuresHtml = renderMeasurementsHtml(m);
      }
    } catch(e) {}

    const measuresEl = document.getElementById('measures-container');
    if (measuresEl) measuresEl.innerHTML = initialMeasuresHtml;

    if (window.lucide) lucide.createIcons();

    // Add measure modal (simple)
    document.getElementById('btn-add-measure').addEventListener('click', () => {
      openMeasureModal();
    });

  } catch(error) {
    container.innerHTML = `
      <div class="card p-4" style="border-color:var(--color-error);">Error: ${error.message}</div>
    `;
  }
};

function openMeasureModal() {
  let existing = {};
  try {
    const raw = localStorage.getItem('fittrack_latest_measures');
    if (raw) existing = JSON.parse(raw);
  } catch(e) {}

  const overlay = document.createElement('div');
  overlay.className = 'exercise-modal-overlay';
  overlay.innerHTML = `
    <div class="exercise-modal" style="max-height: 90vh; overflow-y: auto;">
      <h2 class="exercise-modal-title">Registrar Medidas Corporales</h2>

      <div class="card p-3 mb-4" style="background: rgba(183, 243, 74, 0.05); border: 1px solid rgba(183, 243, 74, 0.2);">
        <h4 class="font-bold text-xs text-primary uppercase mb-2">Puntos clave de medición</h4>
        <ul class="text-xs text-color-2 flex-col gap-1 pl-4" style="list-style: disc;">
          <li><b>Cintura:</b> Mide en la parte más estrecha (por debajo de la última costilla) o al nivel del ombligo al terminar de exhalar.</li>
          <li><b>Cadera / Glúteos:</b> Rodea la parte más prominente de los glúteos.</li>
          <li><b>Pecho:</b> Coloca la cinta a la altura de los pezones (usa siempre la misma prenda).</li>
          <li><b>Brazos (bíceps):</b> Mide la zona de mayor circunferencia con el brazo contraído o relajado en un ángulo fijo.</li>
          <li><b>Muslos (cuádriceps):</b> Mide unos centímetros por debajo del pliegue del glúteo en la pierna derecha.</li>
        </ul>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem;">
        <div class="ex-form-group" style="margin-bottom:0">
          <label class="ex-field-label">Peso (KG)</label>
          <input type="number" step="0.1" class="ex-input" id="m-weight" value="${existing.weight || ''}" placeholder="Ej: 78.5">
        </div>
        <div class="ex-form-group" style="margin-bottom:0">
          <label class="ex-field-label">% Grasa Corp.</label>
          <input type="number" step="0.1" class="ex-input" id="m-fat" value="${existing.fat || ''}" placeholder="Ej: 18">
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem;">
        <div class="ex-form-group" style="margin-bottom:0">
          <label class="ex-field-label">Cintura (CM)</label>
          <input type="number" step="0.5" class="ex-input" id="m-waist" value="${existing.waist || ''}" placeholder="Ej: 82">
        </div>
        <div class="ex-form-group" style="margin-bottom:0">
          <label class="ex-field-label">Cadera / Glúteos (CM)</label>
          <input type="number" step="0.5" class="ex-input" id="m-hip" value="${existing.hip || ''}" placeholder="Ej: 95">
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem;">
        <div class="ex-form-group" style="margin-bottom:0">
          <label class="ex-field-label">Pecho (CM)</label>
          <input type="number" step="0.5" class="ex-input" id="m-chest" value="${existing.chest || ''}" placeholder="Ej: 100">
        </div>
        <div class="ex-form-group" style="margin-bottom:0">
          <label class="ex-field-label">Brazos / Bíceps (CM)</label>
          <input type="number" step="0.5" class="ex-input" id="m-arms" value="${existing.arms || ''}" placeholder="Ej: 36">
        </div>
      </div>

      <div class="ex-form-group" style="margin-bottom:1rem;">
        <label class="ex-field-label">Muslos / Cuádriceps (CM)</label>
        <input type="number" step="0.5" class="ex-input" id="m-thighs" value="${existing.thighs || ''}" placeholder="Ej: 58">
      </div>

      <div class="ex-modal-actions">
        <button class="ex-btn-cancel" id="m-cancel">Cancelar</button>
        <button class="ex-btn-save" id="m-save">Guardar Medidas</button>
      </div>
    </div>
  `;

  overlay.querySelector('#m-cancel').addEventListener('click', () => document.body.removeChild(overlay));
  overlay.addEventListener('click', e => { if (e.target === overlay) document.body.removeChild(overlay); });

  overlay.querySelector('#m-save').addEventListener('click', () => {
    const weight = overlay.querySelector('#m-weight').value;
    const fat = overlay.querySelector('#m-fat').value;
    const waist = overlay.querySelector('#m-waist').value;
    const hip = overlay.querySelector('#m-hip').value;
    const chest = overlay.querySelector('#m-chest').value;
    const arms = overlay.querySelector('#m-arms').value;
    const thighs = overlay.querySelector('#m-thighs').value;

    const measureData = { weight, fat, waist, hip, chest, arms, thighs, date: new Date().toISOString() };
    try {
      localStorage.setItem('fittrack_latest_measures', JSON.stringify(measureData));
      if (window.FITTRACK.updateProfile) {
        window.FITTRACK.updateProfile({ measurements: measureData });
      }
    } catch(e) {}

    // Show saved data in the measures container
    const container = document.getElementById('measures-container');
    if (container) {
      container.innerHTML = renderMeasurementsHtml(measureData);
      if (window.lucide) lucide.createIcons();
    }

    document.body.removeChild(overlay);
  });

  document.body.appendChild(overlay);
  if (window.lucide) lucide.createIcons();
}

function renderMeasurementsHtml(m) {
  if (!m || (!m.weight && !m.fat && !m.waist && !m.hip && !m.chest && !m.arms && !m.thighs)) {
    return `
      <div class="card flex-col items-center text-center py-8 mb-4">
        <i data-lucide="ruler" style="width:36px;height:36px;margin-bottom:0.75rem;color:var(--color-text-3);"></i>
        <p class="text-color-2 text-sm">Aún no tienes medidas registradas.<br>Empieza a trackear tu cuerpo.</p>
      </div>
    `;
  }

  const d = m.date ? new Date(m.date) : new Date();
  const dateFormatted = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  const metrics = [
    { key: 'weight', label: 'Peso', value: m.weight, unit: 'kg', icon: 'scale', color: 'lime' },
    { key: 'fat', label: '% Grasa', value: m.fat, unit: '%', icon: 'percent', color: 'cyan' },
    { key: 'waist', label: 'Cintura', value: m.waist, unit: 'cm', icon: 'ruler', color: 'amber' },
    { key: 'hip', label: 'Cadera / Glúteos', value: m.hip, unit: 'cm', icon: 'activity', color: 'pink' },
    { key: 'chest', label: 'Pecho', value: m.chest, unit: 'cm', icon: 'shield', color: 'blue' },
    { key: 'arms', label: 'Brazos', value: m.arms, unit: 'cm', icon: 'flame', color: 'purple' },
    { key: 'thighs', label: 'Muslos', value: m.thighs, unit: 'cm', icon: 'zap', color: 'emerald' },
  ].filter(item => item.value && String(item.value).trim() !== '');

  return `
    <div class="body-measure-grid mb-3">
      ${metrics.map(item => `
        <div class="body-measure-card measure-${item.color}">
          <div class="body-measure-header">
            <div class="body-measure-icon-wrap">
              <i data-lucide="${item.icon}"></i>
            </div>
            <span class="measure-label" title="${item.label}">${item.label}</span>
          </div>
          <div class="body-measure-body">
            <span class="measure-value">${item.value}</span>
            <span class="measure-unit">${item.unit}</span>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="measurements-footer-info mb-5">
      <i data-lucide="calendar" style="width:13px;height:13px;color:var(--color-text-3);"></i>
      <span>Último registro · ${dateFormatted}</span>
    </div>
  `;
}
