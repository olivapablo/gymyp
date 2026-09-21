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

// Globals for single-exercise view and rest
let currentExIndex = 0;
let restTimerInterval = null;
let restRemainingSeconds = 0;
let saveTimeout = null;
let isStartingWorkout = false;

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
        <div class="card card-interactive flex-row justify-between items-center" onclick="window.FITTRACK.screens.startRoutineWorkout('${r.id}', this)">
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

window.FITTRACK.screens.startRoutineWorkout = async function(routineId, clickedEl) {
  if (isStartingWorkout) return;
  isStartingWorkout = true;

  if (clickedEl) {
    clickedEl.style.opacity = '0.7';
    clickedEl.style.pointerEvents = 'none';
  }

  try {
    const active = await window.FITTRACK.getActiveWorkout();
    if (active) {
      activeWorkoutState = active;
      await window.FITTRACK.alert("Ya tienes un entrenamiento en curso. Termínalo antes de empezar otro.", "Entrenamiento en curso");
      window.location.hash = '#/workout/active';
      return;
    }

    const routine = await window.FITTRACK.getRoutine(routineId);
    const workoutId = await window.FITTRACK.startWorkout(routine);
    
    // Set memory state immediately for instantaneous loading
    activeWorkoutState = {
      id: workoutId,
      routineId: routine.id,
      name: routine.name || 'Entrenamiento',
      startTime: { seconds: Math.floor(Date.now() / 1000) },
      status: 'in_progress',
      exercises: (routine.exercises || []).map((ex, idx) => ({
        id: ex.id || `ex_${idx}_${Date.now()}`,
        type: ex.type || 'fuerza',
        name: ex.name || 'Ejercicio',
        targetSets: ex.sets || ex.targetSets || '3',
        targetReps: ex.reps || ex.targetReps || '8-12',
        targetRir: ex.rir !== undefined && ex.rir !== null ? String(ex.rir) : '',
        notes: ex.notes || ex.observation || ex.observaciones || '',
        muscle: ex.muscle || '',
        weight: ex.weight || '',
        rest: ex.rest || '',
        sets: []
      }))
    };

    window.location.hash = '#/workout/active';
  } catch (error) {
    await window.FITTRACK.alert("Error al iniciar: " + error.message, "Error");
  } finally {
    isStartingWorkout = false;
  }
};

window.FITTRACK.screens.renderActiveWorkout = async function(container) {
  if (!activeWorkoutState) {
    container.innerHTML = `
      <div class="flex-col items-center py-12"><div class="spinner"></div><p class="mt-4 text-color-2">Cargando entrenamiento...</p></div>
    `;
    activeWorkoutState = await window.FITTRACK.getActiveWorkout();
  }

  try {
    if (!activeWorkoutState) {
      window.location.hash = '#/workout';
      return;
    }

    if (activeWorkoutState.startTime && activeWorkoutState.startTime.seconds) {
      const startMs = activeWorkoutState.startTime.seconds * 1000;
      workoutDurationSeconds = Math.floor((Date.now() - startMs) / 1000);
      if(workoutDurationSeconds < 0) workoutDurationSeconds = 0;
    } else {
      workoutDurationSeconds = 0;
    }

    currentExIndex = 0;

    const dayNum = extractDayFromRoutineName(activeWorkoutState.name);
    const cleanTitle = stripDayFromRoutineName(activeWorkoutState.name);

    // Extract muscles dynamically if available
    const musclesList = [...new Set((activeWorkoutState.exercises || []).map(ex => ex.muscle).filter(Boolean))];
    const muscleSubtitle = musclesList.length > 0 ? musclesList.join(' • ') : '';

    container.innerHTML = `
      <div id="workout-ui-root" class="pb-24 pt-2">
        <!-- Clean Professional Header Structure -->
        <div class="px-4 mb-5">
          <!-- Top Row: Back Button, Day Badge & Timer -->
          <div class="flex-row justify-between items-center mb-3">
            <div class="flex-row items-center gap-2">
              <button id="btn-back-workout" class="btn-icon bg-surface-2 text-color-1 rounded-full flex items-center justify-center" style="width:38px;height:38px;">
                <i data-lucide="arrow-left" style="width:20px;height:20px;"></i>
              </button>
              ${dayNum ? `
                <span class="badge badge-primary font-bold text-xs uppercase tracking-wider px-3 py-1">
                  DÍA ${dayNum}
                </span>
              ` : ''}
            </div>
            
            <div class="timer-pill cursor-pointer flex-shrink-0" id="workout-timer-container">
              <i data-lucide="timer" style="width:20px;height:20px;" id="timer-icon"></i>
              <span id="workout-timer">${formatTime(workoutDurationSeconds)}</span>
            </div>
          </div>

          <!-- Title & Subtitle Row -->
          <div class="mt-2">
            <h1 class="text-2xl font-black text-color-1 leading-snug uppercase tracking-tight" style="word-break: break-word;">
              ${cleanTitle}
            </h1>
            ${muscleSubtitle ? `<p class="text-xs text-color-2 mt-1 font-medium tracking-wide">${muscleSubtitle}</p>` : ''}
          </div>
        </div>

        <!-- Single Exercise Card Container -->
        <div id="exercise-card-container" class="px-4">
        </div>
        
        <!-- Rest Controls Bottom Sheet (Initially hidden with d-none) -->
        <div id="rest-controls" class="fixed bottom-0 left-0 right-0 p-6 bg-surface border-t border-color-border transform translate-y-full transition-transform duration-300 z-50 rounded-t-3xl d-none">
          <div class="flex-col items-center">
            <h3 class="text-color-2 text-xs font-bold uppercase tracking-wider mb-3">Tiempo de descanso</h3>
            <div class="text-5xl font-mono font-bold text-primary mb-6" id="rest-timer-display">01:30</div>
            <div class="flex-row gap-4 w-full mb-4">
              <button class="btn btn-secondary flex-1 py-3 text-lg" id="btn-rest-minus">-30s</button>
              <button class="btn btn-secondary flex-1 py-3 text-lg" id="btn-rest-plus">+30s</button>
            </div>
            <button class="btn btn-primary btn-block py-3 text-lg" id="btn-rest-skip">Saltar Descanso</button>
          </div>
        </div>
        <div id="rest-overlay" class="fixed inset-0 bg-black bg-opacity-60 z-40 d-none backdrop-blur-sm transition-opacity" style="opacity:0;"></div>
      </div>
    `;

    renderCurrentExercise();
    startWorkoutTimer();
    
    if (window.lucide) lucide.createIcons();

    // Bind Header Events
    document.getElementById('btn-back-workout').addEventListener('click', () => { window.location.hash = '#/'; });
    
    // Rest Modal Events
    document.getElementById('workout-timer-container').addEventListener('click', () => {
      if(restRemainingSeconds > 0) openRestControls();
      else window.FITTRACK.toast('Inicia un descanso completando una serie');
    });
    
    document.getElementById('rest-overlay').addEventListener('click', closeRestControls);
    document.getElementById('btn-rest-skip').addEventListener('click', skipRest);
    document.getElementById('btn-rest-plus').addEventListener('click', () => { restRemainingSeconds += 30; updateRestDisplay(); });
    document.getElementById('btn-rest-minus').addEventListener('click', () => { restRemainingSeconds = Math.max(0, restRemainingSeconds - 30); updateRestDisplay(); });

  } catch (e) {
    container.innerHTML = `<div class="card bg-error-dim border-error text-error m-4">Error cargando sesión: ${e.message}</div>`;
  }
};

// Utils for header parsing
function extractDayFromRoutineName(name) {
  if (!name) return '';
  const match = name.match(/d[íi]*a\s*(\d+)/i) || name.match(/día\s*(\d+)/i);
  return match ? match[1] : '';
}

function stripDayFromRoutineName(name) {
  if (!name) return '';
  let cleaned = name.replace(/^\s*d[íi]*a\s*\d+\s*[:\-–—]?\s*/i, '').trim();
  return cleaned || name;
}

function renderCurrentExercise() {
  const container = document.getElementById('exercise-card-container');
  if (!container || !activeWorkoutState || !activeWorkoutState.exercises.length) return;
  
  const ex = activeWorkoutState.exercises[currentExIndex];
  
  // Ensure sets
  const targetSetsCount = parseInt(ex.targetSets) || 3;
  if (!ex.sets) ex.sets = [];
  while (ex.sets.length < targetSetsCount) {
    ex.sets.push({ kg: '', reps: '', completed: false });
  }

  const hasPrev = currentExIndex > 0;
  const hasNext = currentExIndex < activeWorkoutState.exercises.length - 1;

  // Format sets: 1 | Reps | Kg
  let setsHtml = ex.sets.map((set, setIndex) => `
    <div class="set-row flex-row items-center gap-3 p-2 rounded-xl bg-surface-2 border border-color-border mb-2">
      <div class="set-circle cursor-pointer ${set.completed ? 'completed' : ''}" data-set="${setIndex}" title="Serie ${setIndex + 1}">
        ${set.completed ? '<i data-lucide="check" style="width:16px;height:16px;"></i>' : (setIndex + 1)}
      </div>
      <div class="flex-1">
        <input type="number" inputmode="decimal" class="set-input-mockup w-full text-center" value="${set.reps || ''}" placeholder="Reps" data-set="${setIndex}" data-field="reps">
      </div>
      <div class="flex-1">
        <input type="number" inputmode="decimal" class="set-input-mockup w-full text-center" value="${set.kg || ''}" placeholder="Kg" data-set="${setIndex}" data-field="kg">
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="card bg-surface px-5 py-6 rounded-3xl shadow-2xl relative overflow-hidden border border-color-border">
      
      <!-- Card Header: Nav + Title -->
      <div class="flex-row justify-between items-center mb-4">
        <button class="exercise-nav-btn" id="btn-prev-ex" ${!hasPrev ? 'style="opacity:0.2; pointer-events:none;"' : ''}>
          <i data-lucide="chevron-left" style="width:24px;height:24px;"></i>
        </button>
        
        <div class="text-center flex-1 px-2">
          <h2 class="text-xl font-black text-color-1 leading-tight tracking-tight uppercase">${ex.name}</h2>
          <p class="text-sm font-semibold text-primary mt-1 opacity-90">Objetivo: <span class="font-bold">${ex.targetSets || 3} × ${ex.targetReps || '8-12'}</span></p>
        </div>
        
        <button class="exercise-nav-btn" id="btn-next-ex" ${!hasNext ? 'style="opacity:0.2; pointer-events:none;"' : ''}>
          <i data-lucide="chevron-right" style="width:24px;height:24px;"></i>
        </button>
      </div>

      <!-- Exercise Observations / Notes (Clean compact card) -->
      ${ex.notes && ex.notes.trim() ? `
        <div class="exercise-observation-card mb-4">
          <div class="observation-header">
            <i data-lucide="file-text"></i>
            <span>Observación</span>
          </div>
          <div class="observation-body">${ex.notes.trim()}</div>
        </div>
      ` : ''}

      <!-- Labels Header: # | Reps | Kg -->
      <div class="sets-header-row flex-row items-center gap-3 mb-2 px-1">
        <div style="width:36px; text-align:center;" class="text-xs font-bold text-color-3 uppercase tracking-wider">#</div>
        <div class="flex-1 text-center text-xs font-bold text-color-3 uppercase tracking-wider">Reps</div>
        <div class="flex-1 text-center text-xs font-bold text-color-3 uppercase tracking-wider">Kg</div>
      </div>

      <!-- Sets List -->
      <div class="sets-container mb-4">
        ${setsHtml}
        
        <!-- Add set button -->
        <button type="button" class="btn-add-set-row flex-row items-center justify-center gap-2 mt-3 w-full p-3 rounded-2xl border border-dashed border-color-border cursor-pointer bg-surface-2 transition-all hover:bg-surface-3" id="btn-add-set-mockup">
          <i data-lucide="plus" style="width:16px;height:16px;color:var(--color-primary);"></i>
          <span class="font-semibold text-sm text-primary">Agregar serie</span>
        </button>
      </div>

      <!-- Main Actions -->
      <button class="btn btn-primary btn-block py-4 rounded-2xl text-lg shadow-glow" id="btn-guardar-serie">
        <i data-lucide="check-circle" style="margin-right:8px;width:22px;height:22px;"></i> Guardar serie
      </button>
      
      ${hasNext ? '' : `
        <button class="btn btn-secondary btn-block mt-4 py-4 rounded-2xl text-lg" id="btn-finish-workout-final">
          Finalizar Entrenamiento
        </button>
      `}
    </div>
  `;
  
  if (window.lucide) lucide.createIcons();
  bindCurrentExerciseEvents();
}


function bindCurrentExerciseEvents() {
  const ex = activeWorkoutState.exercises[currentExIndex];

  // Nav
  const btnPrev = document.getElementById('btn-prev-ex');
  if(btnPrev) btnPrev.addEventListener('click', () => { currentExIndex--; renderCurrentExercise(); });
  
  const btnNext = document.getElementById('btn-next-ex');
  if(btnNext) btnNext.addEventListener('click', () => { currentExIndex++; renderCurrentExercise(); });

  // Inputs
  document.querySelectorAll('.set-input-mockup').forEach(input => {
    const handleInput = (e) => {
      const setIdx = parseInt(e.target.dataset.set);
      const field = e.target.dataset.field;
      if (ex.sets[setIdx]) {
        ex.sets[setIdx][field] = e.target.value;
        saveWorkoutStateDebounced();
      }
    };
    input.addEventListener('input', handleInput);
    input.addEventListener('change', handleInput);
  });

  // Circle toggle
  document.querySelectorAll('.set-circle').forEach(circle => {
    circle.addEventListener('click', (e) => {
      const setIdx = parseInt(e.currentTarget.dataset.set);
      ex.sets[setIdx].completed = !ex.sets[setIdx].completed;
      saveWorkoutStateDebounced();
      renderCurrentExercise();
    });
  });

  // Add set
  const btnAdd = document.getElementById('btn-add-set-mockup');
  if(btnAdd) btnAdd.addEventListener('click', () => {
    ex.sets.push({ kg: '', reps: '', completed: false });
    saveWorkoutStateDebounced();
    renderCurrentExercise();
  });

  // Guardar serie
  const btnGuardar = document.getElementById('btn-guardar-serie');
  if(btnGuardar) btnGuardar.addEventListener('click', () => {
    const setIdx = ex.sets.findIndex(s => !s.completed);
    if (setIdx !== -1) {
      ex.sets[setIdx].completed = true;
      saveWorkoutStateDebounced();
      renderCurrentExercise();
      
      const restTime = parseInt(ex.rest) || 90;
      startRestTimer(restTime);
    } else {
      if (currentExIndex < activeWorkoutState.exercises.length - 1) {
        currentExIndex++;
        renderCurrentExercise();
      } else {
        window.FITTRACK.toast('¡Todos los ejercicios completados!');
      }
    }
  });

  // Finish Workout
  const btnFinish = document.getElementById('btn-finish-workout-final');
  if(btnFinish) btnFinish.addEventListener('click', async () => {
     const ok = await window.FITTRACK.confirm('¿Terminaste tu entrenamiento?', 'Finalizar Sesión', 'Finalizar', 'Continuar');
     if (ok) {
       if (workoutTimerInterval) clearInterval(workoutTimerInterval);
       if (restTimerInterval) clearInterval(restTimerInterval);
       try {
         await window.FITTRACK.finishWorkout(activeWorkoutState.id, activeWorkoutState);
         activeWorkoutState = null;
         window.location.hash = '#/history';
       } catch (err) {
         window.FITTRACK.alert("Error al finalizar: " + err.message, "Error");
       }
     }
  });
}

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

// ------------------------------------
// Timer & Rest Logic
// ------------------------------------

function startWorkoutTimer() {
  if (workoutTimerInterval) clearInterval(workoutTimerInterval);
  const timerEl = document.getElementById('workout-timer');
  const timerContainer = document.getElementById('workout-timer-container');
  const timerIcon = document.getElementById('timer-icon');
  
  workoutTimerInterval = setInterval(() => {
    workoutDurationSeconds++;
    
    if (restRemainingSeconds > 0) {
      timerEl.textContent = formatTime(restRemainingSeconds);
      timerContainer.style.borderColor = 'var(--color-warning)';
      timerContainer.style.color = 'var(--color-warning)';
      timerContainer.style.boxShadow = '0 0 16px rgba(255, 200, 87, 0.2)';
      if (timerIcon && timerIcon.getAttribute('data-lucide') !== 'bell') {
        timerIcon.setAttribute('data-lucide', 'bell');
        if (window.lucide) lucide.createIcons();
      }
    } else {
      timerEl.textContent = formatTime(workoutDurationSeconds);
      timerContainer.style.borderColor = 'var(--color-primary)';
      timerContainer.style.color = 'var(--color-primary)';
      timerContainer.style.boxShadow = '0 0 16px rgba(183, 243, 74, 0.1)';
      if (timerIcon && timerIcon.getAttribute('data-lucide') !== 'timer') {
        timerIcon.setAttribute('data-lucide', 'timer');
        if (window.lucide) lucide.createIcons();
      }
    }
  }, 1000);
}

function startRestTimer(seconds) {
  restRemainingSeconds = seconds;
  openRestControls();
  if(restTimerInterval) clearInterval(restTimerInterval);
  
  updateRestDisplay();
  
  restTimerInterval = setInterval(() => {
    restRemainingSeconds--;
    if(restRemainingSeconds <= 0) {
      clearInterval(restTimerInterval);
      restRemainingSeconds = 0;
      closeRestControls();
      if(window.FITTRACK.toast) window.FITTRACK.toast("¡Descanso terminado!");
      if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } else {
      updateRestDisplay();
    }
  }, 1000);
}

function updateRestDisplay() {
  const display = document.getElementById('rest-timer-display');
  if (display) display.textContent = formatTime(restRemainingSeconds);
}

function openRestControls() {
  const controls = document.getElementById('rest-controls');
  const overlay = document.getElementById('rest-overlay');
  if(controls && overlay) {
    overlay.classList.remove('d-none');
    setTimeout(() => {
      controls.classList.remove('translate-y-full');
      overlay.style.opacity = '1';
    }, 10);
  }
}

function closeRestControls() {
  const controls = document.getElementById('rest-controls');
  const overlay = document.getElementById('rest-overlay');
  if(controls && overlay) {
    controls.classList.add('translate-y-full');
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.add('d-none');
    }, 300);
  }
}

function skipRest() {
  if(restTimerInterval) clearInterval(restTimerInterval);
  restRemainingSeconds = 0;
  closeRestControls();
}

window.addEventListener('hashchange', () => {
  if (window.location.hash !== '#/workout/active') {
    if (workoutTimerInterval) clearInterval(workoutTimerInterval);
    if (restTimerInterval) clearInterval(restTimerInterval);
    workoutTimerInterval = null;
    restTimerInterval = null;
  }
});
