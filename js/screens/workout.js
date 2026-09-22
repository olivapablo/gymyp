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
let restTotalSeconds = 90;
let restRemainingSeconds = 0;
let saveTimeout = null;
let isStartingWorkout = false;
let previousExerciseLogs = {};

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

  let overlay = null;
  try {
    const active = await window.FITTRACK.getActiveWorkout();
    if (active) {
      activeWorkoutState = active;
      await window.FITTRACK.alert("Ya tienes un entrenamiento en curso. Termínalo antes de empezar otro.", "Entrenamiento en curso");
      window.location.hash = '#/workout/active';
      return;
    }

    const routine = await window.FITTRACK.getRoutine(routineId);
    
    // Show countdown overlay
    overlay = document.createElement('div');
    overlay.id = 'countdown-overlay';
    const R = 95;
    const CIRCUMFERENCE = 2 * Math.PI * R;
    overlay.innerHTML = `
      <div class="countdown-badge">
        <span class="countdown-badge-dot"></span>
        <span>FITTRACK • PREPARACIÓN</span>
      </div>
      <div class="countdown-ring-wrap">
        <svg viewBox="0 0 220 220" width="220" height="220">
          <circle class="countdown-ring-bg" cx="110" cy="110" r="${R}"/>
          <circle class="countdown-ring-fill" id="countdown-ring" cx="110" cy="110" r="${R}"
            style="stroke-dasharray:${CIRCUMFERENCE}; stroke-dashoffset:0;"/>
        </svg>
        <div id="countdown-number">5</div>
      </div>
      <div id="countdown-text">Empieza en breve...</div>
    `;
    document.body.appendChild(overlay);

    // Start network request in parallel
    let workoutId;
    const startPromise = window.FITTRACK.startWorkout(routine).then(id => workoutId = id);

    const totalSeconds = 5;
    for (let i = totalSeconds; i > 0; i--) {
      const numEl = document.getElementById('countdown-number');
      const ring = document.getElementById('countdown-ring');
      if (numEl) {
        numEl.textContent = i;
        numEl.style.transform = 'scale(1.15)';
        setTimeout(() => { if (numEl) numEl.style.transform = 'scale(1)'; }, 150);
      }
      if (window.FITTRACK.audio) {
        window.FITTRACK.audio.playCountdownTick(i === 1 ? 880 : 587.33);
      }
      if (ring) {
        const progress = (totalSeconds - i) / totalSeconds;
        ring.style.strokeDashoffset = CIRCUMFERENCE * progress;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Show ¡YA! message
    const numEl = document.getElementById('countdown-number');
    const textEl = document.getElementById('countdown-text');
    const ring = document.getElementById('countdown-ring');
    if (window.FITTRACK.audio) {
      window.FITTRACK.audio.playStartGoSound();
    }
    if (numEl) {
      numEl.textContent = '¡YA!';
      numEl.style.fontSize = '4.2rem';
      numEl.style.color = '#B7F34A';
      numEl.style.textShadow = '0 0 45px rgba(183, 243, 74, 0.9)';
      numEl.style.transform = 'scale(1.1)';
    }
    if (ring) {
      ring.style.strokeDashoffset = '0';
      ring.style.stroke = '#B7F34A';
    }
    if (textEl) {
      textEl.textContent = '¡A DARLE CON TODO!';
      textEl.style.color = '#B7F34A';
      textEl.style.fontWeight = '800';
    }
    
    await new Promise(r => setTimeout(r, 750)); // Show YA for a moment
    
    await startPromise; // Ensure it finishes
    
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
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }
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

    // Load previous exercise logs for weight/reps memory
    if (window.FITTRACK.getLastExerciseLogs) {
      try {
        previousExerciseLogs = await window.FITTRACK.getLastExerciseLogs();
      } catch (e) {
        console.warn('Could not fetch previous exercise logs:', e);
      }
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
        <div class="px-4 mb-6">
          <!-- Top Row: Back Button & Day Badge -->
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
          </div>

          <!-- Title & Subtitle Row -->
          <div class="mt-1">
            <h1 class="text-2xl font-black text-color-1 leading-snug uppercase tracking-tight" style="word-break: break-word;">
              ${cleanTitle}
            </h1>
            ${muscleSubtitle ? `<p class="text-xs text-color-2 mt-1 font-medium tracking-wide leading-relaxed">${muscleSubtitle}</p>` : ''}
          </div>
        </div>

        <!-- Single Exercise Card Container -->
        <div id="exercise-card-container" class="px-4">
        </div>
      </div>
    `;

    renderCurrentExercise();
    startWorkoutTimer();
    
    if (window.lucide) lucide.createIcons();

    // Bind Header Events
    document.getElementById('btn-back-workout').addEventListener('click', () => { window.location.hash = '#/'; });

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
  const exKey = (ex.name || '').trim().toLowerCase();
  const prevLogs = (previousExerciseLogs && previousExerciseLogs[exKey]) || [];
  
  // Ensure sets
  const targetSetsCount = parseInt(ex.targetSets) || 3;
  if (!ex.sets) ex.sets = [];
  while (ex.sets.length < targetSetsCount) {
    ex.sets.push({ kg: '', reps: '', completed: false });
  }

  const hasPrev = currentExIndex > 0;
  const hasNext = currentExIndex < activeWorkoutState.exercises.length - 1;

  container.innerHTML = `
    <div class="card bg-surface px-5 py-6 rounded-3xl shadow-2xl relative overflow-hidden border border-color-border">
      
      <!-- Progress indicator -->
      <div class="flex-row justify-center items-center gap-1 mb-4">
        ${activeWorkoutState.exercises.map((_, i) => `
          <div style="
            width: ${i === currentExIndex ? '20px' : '6px'};
            height: 6px;
            border-radius: 3px;
            background: ${i === currentExIndex ? 'var(--color-primary)' : (i < currentExIndex ? 'rgba(183,243,74,0.35)' : 'var(--color-surface-3)')};
            transition: all 0.3s ease;
          "></div>
        `).join('')}
      </div>

      <!-- Card Header: Nav + Title -->
      <div class="flex-row justify-between items-center mb-3">
        <button class="exercise-nav-btn" id="btn-prev-ex" ${!hasPrev ? 'style="opacity:0.2; pointer-events:none;"' : ''}>
          <i data-lucide="chevron-left" style="width:24px;height:24px;"></i>
        </button>
        
        <div class="text-center flex-1 px-2">
          <div class="text-xs font-bold text-color-3 uppercase tracking-widest mb-1">${currentExIndex + 1} de ${activeWorkoutState.exercises.length}</div>
          <h2 class="text-xl font-black text-color-1 leading-tight tracking-tight uppercase">${ex.name}</h2>
          <p class="text-sm font-semibold text-primary mt-1 opacity-90">Objetivo: <span class="font-bold">${ex.targetSets || 3} × ${ex.targetReps || '8-12'}</span></p>
        </div>
        
        <button class="exercise-nav-btn" id="btn-next-ex" ${!hasNext ? 'style="opacity:0.2; pointer-events:none;"' : ''}>
          <i data-lucide="chevron-right" style="width:24px;height:24px;"></i>
        </button>
      </div>

      <!-- Exercise Observations / Notes (Premium compact card) -->
      ${ex.notes && ex.notes.trim() ? `
        <div class="exercise-observation-card mb-3">
          <svg class="obs-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span class="obs-body">${ex.notes.trim()}</span>
        </div>
      ` : ''}

      <!-- Central Circular Timer Dial Widget -->
      <div class="workout-dial-container">
        <div class="workout-dial-widget" id="workout-dial-widget" title="Temporizador">
          <svg viewBox="0 0 170 170">
            <circle class="dial-track-bg" cx="85" cy="85" r="75"></circle>
            <circle class="dial-progress-fill" id="dial-progress-ring" cx="85" cy="85" r="75"></circle>
          </svg>
          <div class="dial-inner-disk">
            <div class="dial-time" id="dial-time-display">${restRemainingSeconds > 0 ? formatTime(restRemainingSeconds) : formatTime(workoutDurationSeconds)}</div>
            <div class="dial-label" id="dial-label-display">${restRemainingSeconds > 0 ? 'DESCANSO' : 'ENTRENANDO'}</div>
          </div>
        </div>
        
        <!-- Quick rest actions when resting -->
        <div class="dial-rest-actions ${restRemainingSeconds > 0 ? '' : 'd-none'}" id="dial-rest-actions">
          <button type="button" class="dial-action-btn" id="btn-dial-minus15">−15s</button>
          <button type="button" class="dial-action-btn skip" id="btn-dial-skip">Saltar</button>
          <button type="button" class="dial-action-btn" id="btn-dial-plus15">+15s</button>
        </div>
      </div>

      <!-- Labels Header: # | REPS | KG -->
      <div class="sets-header-row">
        <div class="sets-header-col-num">#</div>
        <div class="sets-header-col-reps">REPS</div>
        <div class="sets-header-col-kg">KG</div>
        <div class="sets-header-col-check"></div>
      </div>

      <!-- Sets List -->
      <div class="sets-container mb-4">
        ${ex.sets.map((set, setIndex) => {
          const prevSet = prevLogs[setIndex] || prevLogs[prevLogs.length - 1];
          const prevReps = prevSet ? prevSet.reps : (ex.targetReps ? String(ex.targetReps).split('-')[0] : '8');
          const prevKg = prevSet ? prevSet.kg : (ex.weight ? String(ex.weight) : '');

          return `
            <div class="set-row-luxury ${set.completed ? 'completed' : ''}" data-set="${setIndex}">
              <div class="set-badge cursor-pointer" data-set="${setIndex}" title="Serie ${setIndex + 1}">
                ${setIndex + 1}
              </div>
              <div class="set-inputs-wrap">
                <input type="number" inputmode="decimal" class="set-input-num" value="${set.reps !== undefined && set.reps !== null ? set.reps : ''}" placeholder="${prevReps || '8'}" data-set="${setIndex}" data-field="reps">
                <div class="set-divider"></div>
                <input type="number" inputmode="decimal" class="set-input-num" value="${set.kg !== undefined && set.kg !== null ? set.kg : ''}" placeholder="${prevKg || 'Kg'}" data-set="${setIndex}" data-field="kg">
              </div>
              <div class="set-check-btn ${set.completed ? 'completed' : 'pending'}" data-set="${setIndex}" title="${set.completed ? 'Completada' : 'Marcar como completada'}">
                ${set.completed 
                  ? `<svg class="set-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` 
                  : `<div class="set-check-ring"></div>`
                }
              </div>
            </div>
          `;
        }).join('')}
        
        <!-- Add set button — pill shaped -->
        <div class="flex-row justify-center">
          <button type="button" class="btn-add-set-luxury" id="btn-add-set-mockup">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Agregar serie</span>
          </button>
        </div>
      </div>

      <!-- Main Actions -->
      <div class="workout-action-buttons">
        <button class="btn btn-primary btn-block py-4 rounded-2xl text-lg shadow-glow" id="btn-guardar-serie">
          <i data-lucide="check-circle" style="margin-right:8px;width:22px;height:22px;"></i>
          ${ex.sets.every(s => s.completed) ? 'Siguiente ejercicio' : 'Guardar serie'}
        </button>

        <button class="btn-finish-workout-luxury" id="btn-finish-workout-final">
          <i data-lucide="flag" style="width:16px;height:16px;"></i>
          Finalizar entrenamiento
        </button>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  bindCurrentExerciseEvents();
  updateDialDisplay();
}

function bindCurrentExerciseEvents() {
  const ex = activeWorkoutState.exercises[currentExIndex];
  const exKey = (ex.name || '').trim().toLowerCase();
  const prevLogs = (previousExerciseLogs && previousExerciseLogs[exKey]) || [];

  // Nav
  const btnPrev = document.getElementById('btn-prev-ex');
  if(btnPrev) btnPrev.addEventListener('click', () => { currentExIndex--; renderCurrentExercise(); });
  
  const btnNext = document.getElementById('btn-next-ex');
  if(btnNext) btnNext.addEventListener('click', () => { currentExIndex++; renderCurrentExercise(); });

  // Inputs
  document.querySelectorAll('.set-input-num').forEach(input => {
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

  // Badge click & Check button toggle
  const toggleSetComplete = (setIdx) => {
    const isNowCompleted = !ex.sets[setIdx].completed;
    ex.sets[setIdx].completed = isNowCompleted;

    // Auto-fill from placeholder/previous if user didn't type anything before completing
    if (isNowCompleted) {
      const prevSet = prevLogs[setIdx] || prevLogs[prevLogs.length - 1];
      if ((ex.sets[setIdx].kg === '' || ex.sets[setIdx].kg === undefined || ex.sets[setIdx].kg === null) && prevSet && prevSet.kg) {
        ex.sets[setIdx].kg = prevSet.kg;
      }
      if ((ex.sets[setIdx].reps === '' || ex.sets[setIdx].reps === undefined || ex.sets[setIdx].reps === null) && prevSet && prevSet.reps) {
        ex.sets[setIdx].reps = prevSet.reps;
      }
    }

    saveWorkoutStateDebounced();
    renderCurrentExercise();
    
    if (isNowCompleted) {
      const restTime = parseInt(ex.rest) || 90;
      startRestTimer(restTime);
    }
  };

  document.querySelectorAll('.set-badge').forEach(badge => {
    badge.addEventListener('click', (e) => {
      const setIdx = parseInt(e.currentTarget.dataset.set);
      toggleSetComplete(setIdx);
    });
  });

  document.querySelectorAll('.set-check-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const setIdx = parseInt(e.currentTarget.dataset.set);
      toggleSetComplete(setIdx);
    });
  });

  // Dial rest quick action events
  const btnMinus15 = document.getElementById('btn-dial-minus15');
  if (btnMinus15) btnMinus15.addEventListener('click', () => {
    restRemainingSeconds = Math.max(0, restRemainingSeconds - 15);
    updateDialDisplay();
  });

  const btnPlus15 = document.getElementById('btn-dial-plus15');
  if (btnPlus15) btnPlus15.addEventListener('click', () => {
    restRemainingSeconds += 15;
    restTotalSeconds = Math.max(restTotalSeconds, restRemainingSeconds);
    updateDialDisplay();
  });

  const btnSkip = document.getElementById('btn-dial-skip');
  if (btnSkip) btnSkip.addEventListener('click', skipRest);

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
      toggleSetComplete(setIdx);
    } else {
      if (currentExIndex < activeWorkoutState.exercises.length - 1) {
        currentExIndex++;
        renderCurrentExercise();
      } else {
        window.FITTRACK.toast('¡Todos los ejercicios completados!');
      }
    }
  });

  // Finish Workout — guarded against double-tap
  const btnFinish = document.getElementById('btn-finish-workout-final');
  if(btnFinish) {
    let finishing = false;
    btnFinish.addEventListener('click', async () => {
      if (finishing) return;
      finishing = true;
      btnFinish.disabled = true;

      try {
        const ok = await window.FITTRACK.confirm('¿Terminaste tu entrenamiento?', 'Finalizar Sesión', 'Finalizar', 'Continuar');
        if (ok) {
          if (workoutTimerInterval) clearInterval(workoutTimerInterval);
          try {
            const finalState = JSON.parse(JSON.stringify(activeWorkoutState));
            const durationSecs = workoutDurationSeconds;
            await window.FITTRACK.finishWorkout(activeWorkoutState.id, activeWorkoutState);
            activeWorkoutState = null;
            showWorkoutSummaryModal(finalState, durationSecs);
          } catch (err) {
            window.FITTRACK.alert("Error al finalizar: " + err.message, "Error");
          }
        }
      } finally {
        finishing = false;
        if (btnFinish && btnFinish.isConnected) btnFinish.disabled = false;
      }
    });
  }
}

function showWorkoutSummaryModal(workoutData, durationSeconds) {
  if (window.FITTRACK.audio) {
    window.FITTRACK.audio.playFinishWorkoutSound();
  }
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 300]);
  }

  let totalVolume = 0;
  let totalSets = 0;
  let completedSets = 0;
  const exercisesList = workoutData.exercises || [];

  exercisesList.forEach(ex => {
    if (ex.sets) {
      ex.sets.forEach(set => {
        totalSets++;
        if (set.completed) {
          completedSets++;
          const w = parseFloat(set.kg) || 0;
          const r = parseInt(set.reps) || 0;
          totalVolume += w * r;
        }
      });
    }
  });

  const modal = document.createElement('div');
  modal.className = 'workout-summary-overlay';
  modal.innerHTML = `
    <canvas id="summary-confetti-canvas" class="summary-confetti-canvas"></canvas>
    
    <div class="workout-summary-card">
      <div class="summary-hero-wrapper">
        <div class="summary-trophy-glow"></div>
        <div class="summary-trophy-badge">
          <i data-lucide="trophy" class="summary-trophy-icon"></i>
        </div>
        <div class="summary-achievement-tag">
          <i data-lucide="sparkles" style="width:13px;height:13px;"></i> SESIÓN COMPLETADA
        </div>
      </div>
      
      <h2 class="summary-headline">¡Entrenamiento Finalizado!</h2>
      <div class="summary-routine-badge">
        <i data-lucide="dumbbell" style="width:13px;height:13px;"></i>
        <span>${workoutData.name || 'Gran sesión completada'}</span>
      </div>
      
      <div class="summary-stats-grid">
        <div class="summary-stat-box stat-time">
          <div class="summary-stat-header">
            <i data-lucide="timer" class="stat-icon"></i>
            <span class="summary-stat-label">TIEMPO</span>
          </div>
          <span class="summary-stat-val text-lime">${formatTime(durationSeconds)}</span>
        </div>

        <div class="summary-stat-box stat-volume">
          <div class="summary-stat-header">
            <i data-lucide="zap" class="stat-icon"></i>
            <span class="summary-stat-label">VOLUMEN</span>
          </div>
          <span class="summary-stat-val text-cyan">${totalVolume >= 1000 ? (totalVolume/1000).toFixed(1) + ' t' : Math.round(totalVolume) + ' kg'}</span>
        </div>

        <div class="summary-stat-box stat-sets">
          <div class="summary-stat-header">
            <i data-lucide="check-circle-2" class="stat-icon"></i>
            <span class="summary-stat-label">SERIES</span>
          </div>
          <span class="summary-stat-val text-pink">${completedSets}<span class="stat-total">/${totalSets}</span></span>
        </div>

        <div class="summary-stat-box stat-exercises">
          <div class="summary-stat-header">
            <i data-lucide="layers" class="stat-icon"></i>
            <span class="summary-stat-label">EJERCICIOS</span>
          </div>
          <span class="summary-stat-val text-amber">${exercisesList.length}</span>
        </div>
      </div>
      
      <div class="summary-exercises-section">
        <div class="summary-section-title">
          <span>DESGLOSE DE EJERCICIOS</span>
          <span class="summary-ex-counter">${exercisesList.length} total</span>
        </div>
        <div class="summary-exercises-list custom-scroll">
          ${exercisesList.map((ex, idx) => {
            const cSets = (ex.sets || []).filter(s => s.completed).length;
            const tSets = (ex.sets || []).length;
            const isDone = cSets > 0;
            return `
              <div class="summary-ex-row ${isDone ? 'completed' : ''}">
                <div class="summary-ex-left">
                  <span class="summary-ex-num">${String(idx + 1).padStart(2, '0')}</span>
                  <span class="summary-ex-name" title="${ex.name}">${ex.name}</span>
                </div>
                <div class="summary-ex-badge ${isDone ? 'badge-success' : 'badge-muted'}">
                  ${isDone ? `<i data-lucide="check" style="width:11px;height:11px;"></i> ${cSets}/${tSets} series` : `0/${tSets} series`}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <div class="summary-actions-container">
        <button class="btn-summary-primary" id="btn-summary-history">
          <i data-lucide="history" style="width:18px;height:18px;"></i>
          <span>Ver en Historial</span>
        </button>
        <button class="btn-summary-secondary" id="btn-summary-home">
          <i data-lucide="home" style="width:16px;height:16px;"></i>
          <span>Ir al Inicio</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) lucide.createIcons();

  // Launch celebration confetti
  try {
    launchSummaryConfetti();
  } catch (err) {
    console.warn("Confetti error", err);
  }

  document.getElementById('btn-summary-history').addEventListener('click', () => {
    modal.remove();
    window.location.hash = '#/history';
  });

  document.getElementById('btn-summary-home').addEventListener('click', () => {
    modal.remove();
    window.location.hash = '#/';
  });
}

function launchSummaryConfetti() {
  const canvas = document.getElementById('summary-confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#B7F34A', '#FACC15', '#38BDF8', '#F472B6', '#FFFFFF', '#A3E635'];
  const particles = [];
  const particleCount = 75;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 80,
      y: window.innerHeight * 0.45,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() * -12) - 4,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle'
    });
  }

  let animationFrame;
  const startTime = Date.now();

  function renderConfetti() {
    const elapsed = Date.now() - startTime;
    if (elapsed > 3500) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      return;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // air drag
      p.rotation += p.rotSpeed;
      if (elapsed > 2000) {
        p.opacity = Math.max(0, 1 - (elapsed - 2000) / 1500);
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    animationFrame = requestAnimationFrame(renderConfetti);
  }

  renderConfetti();
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
// Timer & Rest Logic (In-Dial Widget)
// ------------------------------------

function updateDialDisplay() {
  const timeEl = document.getElementById('dial-time-display');
  const labelEl = document.getElementById('dial-label-display');
  const ringEl = document.getElementById('dial-progress-ring');
  const widgetEl = document.getElementById('workout-dial-widget');
  const restActions = document.getElementById('dial-rest-actions');
  const DIAL_CIRC = 2 * Math.PI * 75; // 471.24

  if (!timeEl || !labelEl || !ringEl) return;

  if (restRemainingSeconds > 0) {
    timeEl.textContent = formatTime(restRemainingSeconds);
    labelEl.textContent = 'DESCANSO';
    if (restActions) restActions.classList.remove('d-none');

    const progress = restTotalSeconds > 0 ? (restRemainingSeconds / restTotalSeconds) : 0;
    ringEl.style.strokeDashoffset = (DIAL_CIRC * (1 - progress)).toString();

    // Dynamic Color Progression as rest decreases
    let color = '#B7F34A'; // Green (default)
    let glowColor = 'rgba(183, 243, 74, 0.55)';
    if (progress <= 0.2) {
      color = '#FF5C5C'; // Red / Coral in final 20%
      glowColor = 'rgba(255, 92, 92, 0.65)';
    } else if (progress <= 0.5) {
      color = '#FFC857'; // Amber / Yellow
      glowColor = 'rgba(255, 200, 87, 0.6)';
    }

    ringEl.style.stroke = color;
    labelEl.style.color = color;
    if (widgetEl) {
      widgetEl.style.setProperty('--dial-active-color', color);
      widgetEl.style.setProperty('--dial-glow-color', glowColor);
      widgetEl.style.setProperty('--dial-label-color', color);
    }
  } else {
    timeEl.textContent = formatTime(workoutDurationSeconds);
    labelEl.textContent = 'ENTRENANDO';
    if (restActions) restActions.classList.add('d-none');

    // Standard active cycle progress
    const cycleSeconds = 60;
    const cycleProgress = (workoutDurationSeconds % cycleSeconds) / cycleSeconds;
    ringEl.style.strokeDashoffset = (DIAL_CIRC * (1 - cycleProgress)).toString();
    ringEl.style.stroke = 'var(--color-primary)';
    labelEl.style.color = 'var(--color-text-3)';
    if (widgetEl) {
      widgetEl.style.setProperty('--dial-active-color', 'var(--color-primary)');
      widgetEl.style.setProperty('--dial-glow-color', 'rgba(183, 243, 74, 0.4)');
      widgetEl.style.setProperty('--dial-label-color', 'rgba(255, 255, 255, 0.55)');
    }
  }
}

function startWorkoutTimer() {
  if (workoutTimerInterval) clearInterval(workoutTimerInterval);
  
  workoutTimerInterval = setInterval(() => {
    workoutDurationSeconds++;
    
    if (restRemainingSeconds > 0) {
      if (restRemainingSeconds > 1 && restRemainingSeconds <= 5) {
        if (window.FITTRACK.audio) window.FITTRACK.audio.playRestWarningTick(restRemainingSeconds);
      }
      restRemainingSeconds--;
      if (restRemainingSeconds <= 0) {
        restRemainingSeconds = 0;
        if (window.FITTRACK.audio) window.FITTRACK.audio.playRestFinishedSound();
        if (window.FITTRACK.toast) window.FITTRACK.toast("¡Descanso completado! Siguiente serie");
        if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
      }
    }
    
    updateDialDisplay();
  }, 1000);
}

function startRestTimer(seconds) {
  restTotalSeconds = seconds || 90;
  restRemainingSeconds = restTotalSeconds;
  updateDialDisplay();
}

function skipRest() {
  restRemainingSeconds = 0;
  if (window.FITTRACK.audio) window.FITTRACK.audio.playBoxingBell();
  updateDialDisplay();
  if (window.FITTRACK.toast) window.FITTRACK.toast("Descanso saltado");
}

window.addEventListener('hashchange', () => {
  if (window.location.hash !== '#/workout/active') {
    if (workoutTimerInterval) clearInterval(workoutTimerInterval);
    workoutTimerInterval = null;
    restRemainingSeconds = 0;
  }
});
