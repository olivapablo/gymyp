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
          <div class="card" id="history-card-${workout.id}" style="padding:0;overflow:hidden;border-radius:var(--radius-2xl);">
            <!-- Card Header -->
            <div style="padding:1.1rem 1.25rem 0.85rem;border-bottom:1px solid var(--color-border-subtle);display:flex;justify-content:space-between;align-items:flex-start;">
              <div style="flex:1;min-width:0;">
                <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--color-text-3);margin-bottom:0.25rem;">
                  ${dateStr}${timeStr ? ` · ${timeStr}` : ''}
                </div>
                <h3 style="font-size:1rem;font-weight:800;color:var(--color-text-1);letter-spacing:-0.01em;line-height:1.2;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${workout.name}</h3>
              </div>
              <button class="btn-delete-workout" data-id="${workout.id}" title="Eliminar entrenamiento"
                style="margin-left:0.75rem;flex-shrink:0;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-error);background:rgba(255,92,92,0.08);border:1px solid rgba(255,92,92,0.15);transition:all 0.2s ease;">
                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
              </button>
            </div>
            <!-- Stats row -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);padding:0.85rem 1.25rem;gap:0.5rem;">
              <div style="display:flex;flex-direction:column;gap:0.15rem;">
                <span style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-3);">Volumen</span>
                <span style="font-size:1.05rem;font-weight:800;color:var(--color-primary);letter-spacing:-0.01em;">${totalVolume >= 1000 ? (totalVolume/1000).toFixed(1)+'t' : totalVolume+'kg'}</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:0.15rem;border-left:1px solid var(--color-border-subtle);padding-left:0.75rem;">
                <span style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-3);">Series</span>
                <span style="font-size:1.05rem;font-weight:800;color:var(--color-text-1);">${totalSets}</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:0.15rem;border-left:1px solid var(--color-border-subtle);padding-left:0.75rem;">
                <span style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-3);">Ejercicios</span>
                <span style="font-size:1.05rem;font-weight:800;color:var(--color-text-1);">${exercisesCount}</span>
              </div>
            </div>
            <!-- Exercise list -->
            <div style="padding:0 1.25rem 1rem;display:flex;flex-direction:column;gap:0.3rem;">
              ${workout.exercises.slice(0, 4).map((ex, i) => `
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <span style="width:5px;height:5px;border-radius:50%;background:${i === 0 ? 'var(--color-primary)' : 'var(--color-surface-3)'};flex-shrink:0;"></span>
                  <span style="font-size:0.78rem;color:var(--color-text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ex.name}</span>
                </div>
              `).join('')}
              ${workout.exercises.length > 4 ? `
                <div style="font-size:0.72rem;color:var(--color-text-3);padding-left:1rem;font-style:italic;">+${workout.exercises.length - 4} más</div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Add individual delete handlers
      document.querySelectorAll('.btn-delete-workout').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const workoutId = btn.getAttribute('data-id');
          if (!workoutId) return;

          const ok = await window.FITTRACK.confirm(
            '¿Estás seguro de que deseas eliminar este entrenamiento del historial?',
            'Eliminar entrenamiento',
            'Eliminar',
            'Cancelar'
          );

          if (ok) {
            try {
              btn.disabled = true;
              await window.FITTRACK.deleteWorkout(workoutId);
              if (window.FITTRACK.toast) window.FITTRACK.toast('Entrenamiento eliminado');
              const cardEl = document.getElementById(`history-card-${workoutId}`);
              if (cardEl) {
                cardEl.style.transition = 'opacity 200ms ease, transform 200ms ease';
                cardEl.style.opacity = '0';
                cardEl.style.transform = 'scale(0.95)';
                setTimeout(() => {
                  cardEl.remove();
                  const remainingCards = document.querySelectorAll('#history-list .card-interactive');
                  if (remainingCards.length === 0) {
                    window.FITTRACK.screens.renderHistory(container);
                  }
                }, 200);
              } else {
                window.FITTRACK.screens.renderHistory(container);
              }
            } catch (err) {
              await window.FITTRACK.alert('Error al eliminar el entrenamiento: ' + err.message, 'Error');
              btn.disabled = false;
            }
          }
        });
      });
    }

    if (window.lucide) lucide.createIcons();

  } catch (error) {
    document.getElementById('history-list').innerHTML = `
      <div class="card bg-error-dim border-error text-error p-4">Error cargando historial: ${error.message}</div>
    `;
  }
};
