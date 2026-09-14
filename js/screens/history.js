window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.screens = window.FITTRACK.screens || {};

window.FITTRACK.screens.renderHistory = async function(container) {
  container.innerHTML = `
    <div class="flex-row justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Historial</h1>
      <button id="btn-clear-history" class="btn btn-sm" style="background: rgba(255, 92, 92, 0.15); color: var(--color-error); border: 1px solid rgba(255, 92, 92, 0.4); padding: 0.4rem 0.8rem; font-size: 0.8rem; display: flex; align-items: center; gap: 4px; border-radius: var(--radius-md);">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Borrar historial
      </button>
    </div>
    <div id="history-list" class="flex-col gap-4">
      <div class="flex-col items-center py-8"><div class="spinner"></div></div>
    </div>
  `;

  try {
    const history = await window.FITTRACK.getWorkoutHistory(50);
    const listEl = document.getElementById('history-list');
    const btnClear = document.getElementById('btn-clear-history');

    if (btnClear) {
      btnClear.addEventListener('click', async () => {
        const ok = await window.FITTRACK.confirm(
          '¿Estás seguro de que deseas borrar todo el historial de entrenamientos? Esta acción no se puede deshacer.',
          'Borrar historial',
          'Borrar todo',
          'Cancelar'
        );
        if (ok) {
          try {
            btnClear.disabled = true;
            await window.FITTRACK.clearWorkoutHistory();
            window.FITTRACK.screens.renderHistory(container);
          } catch (err) {
            await window.FITTRACK.alert('Error al borrar el historial: ' + err.message, 'Error');
            btnClear.disabled = false;
          }
        }
      });
    }

    if (history.length === 0) {
      listEl.innerHTML = `
        <div class="card flex-col items-center text-center py-12">
          <i data-lucide="clock" class="text-color-3 mb-4" style="width: 48px; height: 48px;"></i>
          <h3 class="text-xl font-semibold mb-2">Aún no hay historial</h3>
          <p class="text-color-2">Tus entrenamientos finalizados aparecerán aquí.</p>
        </div>
      `;
    } else {
      listEl.innerHTML = history.map(workout => {
        // Formatear la fecha y hora si existen
        let dateStr = 'Fecha desconocida';
        let timeStr = '';
        if (workout.endTime && workout.endTime.toDate) {
          const d = workout.endTime.toDate();
          dateStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
          timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
        
        let totalVolume = 0;
        let totalSets = 0;
        let exercisesCount = 0;
        
        if(workout.exercises) {
          exercisesCount = workout.exercises.length;
          workout.exercises.forEach(ex => {
            if (ex.sets) {
              ex.sets.forEach(set => {
                if (set.completed) {
                  totalSets++;
                  const w = parseFloat(set.kg) || 0;
                  const r = parseInt(set.reps) || 0;
                  totalVolume += w * r;
                }
              });
            }
          });
        }

        return `
          <div class="card card-interactive">
            <div class="flex-row justify-between items-start mb-2">
              <h3 class="text-lg font-bold">${workout.name}</h3>
              <span class="text-sm text-color-3">${dateStr}</span>
            </div>
            
            <div class="grid-actions" style="grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">
              <div class="flex-col">
                <span class="text-xs uppercase text-color-3">Volumen</span>
                <span class="font-medium text-primary">${totalVolume} kg</span>
              </div>
              <div class="flex-col">
                <span class="text-xs uppercase text-color-3">Series</span>
                <span class="font-medium">${totalSets}</span>
              </div>
              <div class="flex-col">
                <span class="text-xs uppercase text-color-3">Ejercicios</span>
                <span class="font-medium">${exercisesCount}</span>
              </div>
            </div>
            
            <div class="divider mt-0 mb-3" style="opacity: 0.5;"></div>
            
            <div class="flex-col gap-2">
              ${workout.exercises.slice(0, 3).map(ex => `<div class="text-sm text-color-2 truncate">• ${ex.name}</div>`).join('')}
              ${workout.exercises.length > 3 ? `<div class="text-xs text-color-3 italic">y ${workout.exercises.length - 3} más...</div>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) lucide.createIcons();

  } catch (error) {
    document.getElementById('history-list').innerHTML = `
      <div class="card bg-error-dim border-error text-error p-4">Error cargando historial: ${error.message}</div>
    `;
  }
};
