window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.screens = window.FITTRACK.screens || {};

// Timer formatting helper
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Global active workout state
let activeWorkoutState = null;
let workoutTimerInterval = null;
let workoutDurationSeconds = 0;

window.FITTRACK.screens.renderWorkoutSelector = async function(container) {
  container.innerHTML = `
    <h1 class="text-3xl font-bold mb-6">Entrenar</h1>
    <div id="active-workout-banner" class="d-none mb-6"></div>
    <h3 class="text-lg font-semibold mb-4">Empezar desde rutina</h3>
    <div id="routines-selection" class="flex-col gap-3">
      <div class="spinner"></div>
    </div>
  `;

  try {
    const activeWorkout = await window.FITTRACK.getActiveWorkout();
    if (activeWorkout) {
      const banner = document.getElementById('active-workout-banner');
      banner.classList.remove('d-none');
      banner.innerHTML = `
        <div class="card bg-primary-dim border-primary p-4">
          <div class="flex-row justify-between items-center">
            <div>
              <h4 class="font-bold text-primary mb-1">Entrenamiento en curso</h4>
              <p class="text-sm text-color-1">${activeWorkout.name}</p>
            </div>
            <button class="btn btn-primary" onclick="window.location.hash='#/workout/active'">Continuar</button>
          </div>
        </div>
      `;
    }

    const routines = await window.FITTRACK.getRoutines();
    const selectionEl = document.getElementById('routines-selection');
    
    if (routines.length === 0) {
      selectionEl.innerHTML = `<p class="text-color-3 text-sm">No tienes rutinas. Ve a "Rutinas" para crear una.</p>`;
    } else {
      selectionEl.innerHTML = routines.map(r => `
        <div class="card card-interactive flex-row justify-between items-center" onclick="window.FITTRACK.screens.startRoutineWorkout('${r.id}')">
          <div>
            <h4 class="font-semibold text-lg">${r.name}</h4>
            <p class="text-color-2 text-sm">${r.exercises ? r.exercises.length : 0} ejercicios</p>
          </div>
          <i data-lucide="play-circle" class="text-primary" style="width: 24px; height: 24px;"></i>
        </div>
      `).join('');
    }
    if (window.lucide) lucide.createIcons();
  } catch(e) {
    document.getElementById('routines-selection').innerHTML = `<p class="text-error">Error cargando rutinas.</p>`;
  }
};

window.FITTRACK.screens.startRoutineWorkout = async function(routineId) {
  try {
    // Check if there is already an active workout
    const active = await window.FITTRACK.getActiveWorkout();
    if (active) {
      alert("Ya tienes un entrenamiento en curso. Termínalo antes de empezar otro.");
      window.location.hash = '#/workout/active';
      return;
    }

    // Get routine and start
    const routine = await window.FITTRACK.getRoutine(routineId);
    const workoutId = await window.FITTRACK.startWorkout(routine);
    
    window.location.hash = '#/workout/active';
  } catch (error) {
    alert("Error al iniciar: " + error.message);
  }
};

window.FITTRACK.screens.renderActiveWorkout = async function(container) {
  container.innerHTML = `
    <div class="flex-col items-center py-12"><div class="spinner"></div><p class="mt-4 text-color-2">Cargando entrenamiento...</p></div>
  `;

  try {
    activeWorkoutState = await window.FITTRACK.getActiveWorkout();
    
    if (!activeWorkoutState) {
      window.location.hash = '#/workout';
      return;
    }

    // Calculate duration based on startTime timestamp if it exists, otherwise 0
    if (activeWorkoutState.startTime && activeWorkoutState.startTime.seconds) {
      const startMs = activeWorkoutState.startTime.seconds * 1000;
      workoutDurationSeconds = Math.floor((Date.now() - startMs) / 1000);
      if(workoutDurationSeconds < 0) workoutDurationSeconds = 0;
    } else {
      workoutDurationSeconds = 0;
    }

    const renderUI = () => {
      container.innerHTML = `
        <div class="active-workout-header mb-6 sticky top-0 bg-bg z-10 pt-2 pb-4 border-b border-color-border">
          <div class="flex-row justify-between items-center mb-2">
            <h1 class="text-2xl font-bold truncate">${activeWorkoutState.name}</h1>
            <div id="workout-timer" class="font-mono text-primary font-bold text-xl">${formatTime(workoutDurationSeconds)}</div>
          </div>
          <button id="btn-finish-workout" class="btn btn-primary btn-block">Finalizar Entrenamiento</button>
        </div>

        <div id="exercises-container" class="flex-col gap-8 pb-20">
          ${activeWorkoutState.exercises.map((ex, exIndex) => renderExerciseBlock(ex, exIndex)).join('')}
        </div>
      `;
      
      if (window.lucide) lucide.createIcons();
      bindWorkoutEvents();
      startTimer();
    };

    renderUI();

  } catch (e) {
    container.innerHTML = `<div class="card bg-error-dim border-error text-error">Error cargando sesión.</div>`;
  }
};

function renderExerciseBlock(ex, exIndex) {
  // Ensure we have at least as many sets as the target
  const targetSetsCount = parseInt(ex.targetSets) || 3;
  if (!ex.sets) ex.sets = [];
  while (ex.sets.length < targetSetsCount) {
    ex.sets.push({ kg: '', reps: '', rir: ex.targetRir !== undefined ? ex.targetRir : '', completed: false });
  }

  const setsHtml = ex.sets.map((set, setIndex) => `
    <div class="flex-row items-center gap-3 mb-3 set-row py-2 px-3 rounded-lg transition-all ${set.completed ? 'bg-success-dim opacity-70 border border-success' : 'bg-surface-2'}">
      <div class="w-6 text-center font-bold text-color-2">${setIndex + 1}</div>
      <div class="flex-1">
        <input type="number" class="input-control text-center set-input w-full py-2 px-1 text-lg font-semibold bg-bg rounded" placeholder="-" 
          value="${set.kg || ''}" data-ex="${exIndex}" data-set="${setIndex}" data-field="kg" ${set.completed ? 'disabled' : ''}>
      </div>
      <div class="flex-1">
        <input type="number" class="input-control text-center set-input w-full py-2 px-1 text-lg font-semibold bg-bg rounded" placeholder="-" 
          value="${set.reps || ''}" data-ex="${exIndex}" data-set="${setIndex}" data-field="reps" ${set.completed ? 'disabled' : ''}>
      </div>
      <div class="flex-1">
        <input type="number" class="input-control text-center set-input w-full py-2 px-1 text-lg font-semibold bg-bg rounded" placeholder="${ex.targetRir !== undefined && ex.targetRir !== '' ? ex.targetRir : 'RIR'}" 
          value="${set.rir !== undefined ? set.rir : ''}" data-ex="${exIndex}" data-set="${setIndex}" data-field="rir" ${set.completed ? 'disabled' : ''}>
      </div>
      <button class="btn-check-set flex items-center justify-center rounded-full shadow-sm transition-all ${set.completed ? 'bg-success text-bg' : 'bg-surface text-color-2 border border-color-border'}" 
        style="width: 36px; height: 36px;" data-ex="${exIndex}" data-set="${setIndex}">
        <i data-lucide="check" style="width: 20px; height: 20px;"></i>
      </button>
    </div>
  `).join('');

  return `
    <div class="exercise-block card mb-6 p-5 border-l-4 border-primary shadow-sm bg-surface">
      <div class="flex-row justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-bold text-color-1 mb-1 leading-tight">${ex.name}</h3>
          <p class="text-sm font-medium text-primary">Objetivo: ${ex.targetSets || 3}x${ex.targetReps || '8-12'}${ex.targetRir !== undefined && ex.targetRir !== '' ? ` | RIR: ${ex.targetRir}` : ''}</p>
        </div>
      </div>
      
      <div class="flex-row items-center gap-3 mb-2 px-3">
        <div class="w-6 text-center text-xs font-bold text-color-3 uppercase tracking-wider">Set</div>
        <div class="flex-1 text-center text-xs font-bold text-color-3 uppercase tracking-wider">KG</div>
        <div class="flex-1 text-center text-xs font-bold text-color-3 uppercase tracking-wider">Reps</div>
        <div class="flex-1 text-center text-xs font-bold text-color-3 uppercase tracking-wider">RIR</div>
        <div style="width: 36px;"></div>
      </div>
      
      <div class="sets-container mb-3">
        ${setsHtml}
      </div>
      
      <button class="btn btn-outline btn-sm w-full text-center btn-add-set border-dashed border-color-border hover:border-primary text-color-2" data-ex="${exIndex}">
        <i data-lucide="plus" style="width: 16px; height: 16px; margin-right: 4px; display: inline-block; vertical-align: middle;"></i> Añadir Serie
      </button>
    </div>
  `;
}

function startTimer() {
  if (workoutTimerInterval) clearInterval(workoutTimerInterval);
  const timerEl = document.getElementById('workout-timer');
  workoutTimerInterval = setInterval(() => {
    workoutDurationSeconds++;
    if(timerEl) timerEl.textContent = formatTime(workoutDurationSeconds);
  }, 1000);
}

function bindWorkoutEvents() {
  // Input changes (auto-save locally)
  document.querySelectorAll('.set-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const exIdx = parseInt(e.target.dataset.ex);
      const setIdx = parseInt(e.target.dataset.set);
      const field = e.target.dataset.field;
      
      activeWorkoutState.exercises[exIdx].sets[setIdx][field] = e.target.value;
      saveWorkoutStateDebounced();
    });
  });

  // Check buttons
  document.querySelectorAll('.btn-check-set').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const button = e.currentTarget;
      const exIdx = parseInt(button.dataset.ex);
      const setIdx = parseInt(button.dataset.set);
      
      const set = activeWorkoutState.exercises[exIdx].sets[setIdx];
      set.completed = !set.completed;
      
      const row = button.closest('.set-row');
      if (row) {
        if (set.completed) {
          row.classList.add('bg-success-dim', 'opacity-70', 'border', 'border-success');
          row.classList.remove('bg-surface-2');
          button.classList.add('bg-success', 'text-bg');
          button.classList.remove('bg-surface', 'text-color-2', 'border', 'border-color-border');
          row.querySelectorAll('.set-input').forEach(i => i.disabled = true);
        } else {
          row.classList.remove('bg-success-dim', 'opacity-70', 'border', 'border-success');
          row.classList.add('bg-surface-2');
          button.classList.remove('bg-success', 'text-bg');
          button.classList.add('bg-surface', 'text-color-2', 'border', 'border-color-border');
          row.querySelectorAll('.set-input').forEach(i => i.disabled = false);
        }
      }
      
      saveWorkoutStateDebounced();
    });
  });

  // Add set buttons
  document.querySelectorAll('.btn-add-set').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const exIdx = parseInt(e.currentTarget.dataset.ex);
      activeWorkoutState.exercises[exIdx].sets.push({ kg: '', reps: '', completed: false });
      window.FITTRACK.screens.renderActiveWorkout(document.getElementById('main-content'));
    });
  });

  // Finish button
  document.getElementById('btn-finish-workout').addEventListener('click', async () => {
    if (confirm('¿Terminaste tu entrenamiento?')) {
      if (workoutTimerInterval) clearInterval(workoutTimerInterval);
      
      try {
        await window.FITTRACK.finishWorkout(activeWorkoutState.id, activeWorkoutState);
        activeWorkoutState = null;
        window.location.hash = '#/history';
      } catch (err) {
        alert("Error al finalizar: " + err.message);
      }
    }
  });
}

let saveTimeout = null;
function saveWorkoutStateDebounced() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    if (activeWorkoutState) {
      try {
        await window.FITTRACK.updateWorkout(activeWorkoutState.id, { exercises: activeWorkoutState.exercises });
      } catch (e) {
        console.error("Failed to auto-save workout", e);
      }
    }
  }, 1000);
}

// Cleanup timer when navigating away (handled in router potentially, but we'll manage safely)
window.addEventListener('hashchange', () => {
  if (window.location.hash !== '#/workout/active' && workoutTimerInterval) {
    clearInterval(workoutTimerInterval);
    workoutTimerInterval = null;
  }
});
